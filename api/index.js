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

// Favicon handler to prevent 404 noise
app.get('/favicon.ico', (req, res) => res.status(204).end());

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }
});

// In-memory job store — results evict after 10 minutes
global.translationQueue = global.translationQueue || [];
global.resultStore = global.resultStore || new Map();

function storeResult(jobId, data) {
  console.log(`[SLM JobStore] Storing result for job ${jobId} (Status: ${data.status})`);
  global.resultStore.set(jobId, data);
  setTimeout(() => {
    console.log(`[SLM JobStore] Evicting expired job ${jobId} from memory store`);
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
  const startTime = Date.now();
  try {
    console.log(`[SLM Worker] Starting translation job ${job.job_id}...`);
    const result = await runTranslation(job.document);

    const fullTranslation = result.full_translation || '';
    const words = Array.isArray(result.words) ? result.words : [];

    storeResult(job.job_id, {
      user_id: job.user_id,
      output: JSON.stringify({ full_translation: fullTranslation, words }),
      status: 'complete',
      created_at: Date.now() / 1000
    });
    console.log(`[SLM Worker] Job ${job.job_id} completed successfully in ${Date.now() - startTime}ms`);
  } catch (err) {
    console.error(`[SLM Worker Error] Job ${job.job_id} failed:`, err.message);
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
    console.log('[SLM API] POST /api/upload/translate request received');
    const user = getReqUser(req);
    if (!req.file) {
      console.warn('[SLM API] Upload rejected: No file provided.');
      return res.status(400).json({ error: 'MISSING_FILE', detail: 'No file was uploaded.' });
    }

    const { original_language, target_language, custom_vocab } = req.body;
    const fileType = req.file.mimetype;
    console.log(`[SLM API] Uploaded file: ${req.file.originalname} (${req.file.size} bytes, mimetype: ${fileType})`);

    if (fileType.startsWith('image/')) {
      console.warn('[SLM API] Upload rejected: Image OCR disabled.');
      return res.status(400).json({
        error: 'IMAGE_OCR_DISABLED',
        detail: 'Image OCR processing is disabled. Please upload a plain text (.txt) file or paste your text directly.'
      });
    }

    const content = req.file.buffer.toString('utf8');
    const id = crypto.randomUUID();
    console.log(`[SLM API] Generated job ID: ${id} for uploaded file ${req.file.originalname}`);

    const job = {
      job_id: id,
      user_id: user.user_id,
      document: { content, original_language, target_language, custom_vocab },
      status: 'pending'
    };

    global.translationQueue.push(job);
    await processJob(job);

    const storedBlob = global.resultStore.get(id);
    if (storedBlob && storedBlob.status === 'failed') {
      console.error(`[SLM API] Job ${id} returned failed status.`);
      return res.status(500).json({
        error: storedBlob.error || 'TRANSLATION_FAILED',
        detail: storedBlob.detail || 'Translation failed.'
      });
    }

    console.log(`[SLM API] Sending HTTP 200 response for upload job ${id}`);
    return res.json({
      message: 'Job processed successfully.',
      job_id: id,
      success: true,
      result: storedBlob || null
    });
  } catch (err) {
    console.error('[SLM API Error] /api/upload/translate:', err);
    return res.status(500).json({ error: 'UPLOAD_ERROR', detail: err.message || 'An unexpected error occurred.' });
  }
});

app.post('/api/text/translate', async (req, res) => {
  try {
    const user = getReqUser(req);
    const { original_language, target_language, content, custom_vocab } = req.body;
    console.log(`[SLM API] POST /api/text/translate request received (Content len: ${content?.length || 0})`);

    if (!content || !content.trim()) {
      console.warn('[SLM API] Rejected request: Empty content');
      return res.status(400).json({ error: 'EMPTY_CONTENT', detail: 'Please provide non-empty foreign text.' });
    }

    const id = crypto.randomUUID();
    console.log(`[SLM API] Generated job ID: ${id}`);
    const job = {
      job_id: id,
      user_id: user.user_id,
      document: { content, original_language, target_language, custom_vocab },
      status: 'pending'
    };

    global.translationQueue.push(job);
    console.log(`[SLM API] Awaiting job ${id} inline execution...`);
    await processJob(job);

    const storedBlob = global.resultStore.get(id);
    if (storedBlob && storedBlob.status === 'failed') {
      console.error(`[SLM API] Job ${id} returned failed status`);
      return res.status(500).json({
        error: storedBlob.error || 'TRANSLATION_FAILED',
        detail: storedBlob.detail || 'Translation failed.'
      });
    }

    console.log(`[SLM API] Sending HTTP 200 response for text translation job ${id}`);
    return res.json({
      message: 'Job processed successfully.',
      job_id: id,
      success: true,
      result: storedBlob || null
    });
  } catch (err) {
    console.error('[SLM API Error] /api/text/translate:', err);
    return res.status(500).json({ error: 'TEXT_TRANSLATE_ERROR', detail: err.message || 'An unexpected error occurred.' });
  }
});

app.get('/api/status/:job_id', async (req, res) => {
  try {
    const { job_id } = req.params;
    console.log(`[SLM API SSE] Client requested status stream for job ${job_id}`);
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
            console.log(`[SLM API SSE] Status stream timeout for job ${job_id}`);
            clearInterval(intervalId);
            res.end();
          }
        } else {
          const currentOutputStr = typeof blob.output === 'string' ? blob.output : JSON.stringify(blob.output);

          if (currentOutputStr !== lastOutputSent || blob.status === 'complete' || blob.status === 'failed') {
            console.log(`[SLM API SSE] Emitting SSE payload for job ${job_id} (Status: ${blob.status})`);
            res.write(`data: ${JSON.stringify(blob)}\n\n`);
            lastOutputSent = currentOutputStr;
          }

          if (blob.status === 'complete' || blob.status === 'failed' || blob.status === 'error') {
            console.log(`[SLM API SSE] Closing status stream for job ${job_id}`);
            clearInterval(intervalId);
            res.end();
          }
        }
      } catch (err) {
        console.error(`[SLM API SSE Error] Job ${job_id}:`, err);
        res.write(`data: ${JSON.stringify({ status: 'error', error: 'STATUS_CHECK_ERROR', detail: err.message })}\n\n`);
        clearInterval(intervalId);
        res.end();
      }
    }, 800);

    req.on('close', () => {
      console.log(`[SLM API SSE] Client connection closed for job ${job_id}`);
      clearInterval(intervalId);
    });
  } catch (err) {
    console.error('[SLM API Error] GET /api/status/:job_id:', err);
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
