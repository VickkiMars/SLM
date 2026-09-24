require('dotenv').config();
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const translationService = require('../services/translationService');

const app = express();

app.use(express.json());
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }
});

// In-memory job store — results evict after 10 minutes
global.translationQueue = global.translationQueue || [];
global.resultStore = global.resultStore || new Map();

function storeResult(jobId, data) {
  global.resultStore.set(jobId, data);
  setTimeout(() => {
    global.resultStore.delete(jobId);
  }, 10 * 60 * 1000);
}

// ====== Internal helpers ======

function getReqUser(req) {
  return {
    user_id: 'default_user',
    user_email: 'user@slm.app',
    user_name: 'SLM User'
  };
}

async function runTranslation(document) {
  const payload = typeof document === 'string' ? { content: document } : document;
  const result = await translationService.translateAndMap(payload);
  return result;
}

async function processJob(job) {
  try {
    console.log(`[SLM] Processing translation job ${job.job_id}`);
    const result = await runTranslation(job.document);

    const fullTranslation = result.full_translation || '';
    const words = Array.isArray(result.words) ? result.words : [];

    storeResult(job.job_id, {
      user_id: job.user_id,
      output: JSON.stringify({ full_translation: fullTranslation, words }),
      status: 'complete',
      created_at: Date.now() / 1000
    });
  } catch (err) {
    console.error('[SLM] Worker error:', err.message);
    storeResult(job.job_id, {
      user_id: job.user_id,
      status: 'failed',
      error: 'WORKER_ERROR',
      detail: err.message || 'The translation worker encountered an unexpected error.',
      created_at: Date.now() / 1000
    });
  }
}

// ====== Routes ======

app.post('/api/upload/translate', upload.single('file'), async (req, res) => {
  try {
    const user = getReqUser(req);
    if (!req.file) return res.status(400).json({ error: 'MISSING_FILE', detail: 'No file was uploaded.' });

    const { original_language, target_language, custom_vocab } = req.body;
    const fileType = req.file.mimetype;

    if (fileType.startsWith('image/')) {
      return res.status(400).json({
        error: 'IMAGE_OCR_DISABLED',
        detail: 'Image OCR processing is disabled. Please upload a plain text (.txt) file or paste your text directly.'
      });
    }

    const content = req.file.buffer.toString('utf8');
    const id = crypto.randomUUID();
    const job = {
      job_id: id,
      user_id: user.user_id,
      document: { content, original_language, target_language, custom_vocab },
      status: 'pending'
    };

    global.translationQueue.push(job);
    processJob(job);

    return res.json({ message: 'Job queued successfully.', job_id: id, success: true });
  } catch (err) {
    console.error(err);
    return res.status(400).json({ error: 'UPLOAD_ERROR', detail: err.message || 'An unexpected error occurred.' });
  }
});

app.post('/api/text/translate', async (req, res) => {
  try {
    const user = getReqUser(req);
    const { original_language, target_language, content, custom_vocab } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'EMPTY_CONTENT', detail: 'Please provide non-empty foreign text.' });
    }

    const id = crypto.randomUUID();
    const job = {
      job_id: id,
      user_id: user.user_id,
      document: { content, original_language, target_language, custom_vocab },
      status: 'pending'
    };

    global.translationQueue.push(job);
    processJob(job);

    return res.json({ message: 'Job queued successfully.', job_id: id, success: true });
  } catch (err) {
    console.error(err);
    return res.status(400).json({ error: 'TEXT_TRANSLATE_ERROR', detail: err.message || 'An unexpected error occurred.' });
  }
});

app.get('/api/status/:job_id', async (req, res) => {
  try {
    const { job_id } = req.params;
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    let count = 0;
    let lastOutputSent = null;

    const intervalId = setInterval(() => {
      count++;
      try {
        const blob = global.resultStore.get(job_id);
        if (!blob) {
          res.write(`data: ${JSON.stringify({ status: 'processing' })}\n\n`);
          if (count > 150) { // ~2 minute timeout
            clearInterval(intervalId);
            res.end();
          }
        } else {
          const currentOutputStr = typeof blob.output === 'string' ? blob.output : JSON.stringify(blob.output);

          if (currentOutputStr !== lastOutputSent || blob.status === 'complete' || blob.status === 'failed') {
            res.write(`data: ${JSON.stringify(blob)}\n\n`);
            lastOutputSent = currentOutputStr;
          }

          if (blob.status === 'complete' || blob.status === 'failed' || blob.status === 'error') {
            clearInterval(intervalId);
            res.end();
          }
        }
      } catch (err) {
        console.error(err);
        res.write(`data: ${JSON.stringify({ status: 'error', error: 'STATUS_CHECK_ERROR', detail: err.message })}\n\n`);
        clearInterval(intervalId);
        res.end();
      }
    }, 800);

    req.on('close', () => {
      clearInterval(intervalId);
    });
  } catch (err) {
    console.error(err);
    return res.status(400).json({ error: 'STATUS_ERROR', detail: err.message || 'An unexpected error occurred.' });
  }
});

app.get('/api/user/getdetails', (req, res) => {
  const user = getReqUser(req);
  return res.json({
    user_id: user.user_id,
    user_name: user.user_name,
    user_email: user.user_email
  });
});

module.exports = app;
