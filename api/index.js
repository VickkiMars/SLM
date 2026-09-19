require('dotenv').config();
const express = require('express');
const multer = require('multer');
const { OpenAI } = require('openai');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const dbService = require('../services/dbService');
const historyService = require('../services/historyService');
const translationService = require('../services/translationService');
const { chunkContent } = require('../services/chunkHelper');

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

global.translationQueue = global.translationQueue || [];
global.resultStore = global.resultStore || new Map();

function storeResult(jobId, data) {
  global.resultStore.set(jobId, data);
  // Auto-evict result after 10 minutes to prevent memory leaks
  setTimeout(() => {
    global.resultStore.delete(jobId);
  }, 10 * 60 * 1000);
}

const promptPath = path.join(process.cwd(), 'data', 'prompt.txt');
const translationPrompt = fs.existsSync(promptPath) ? fs.readFileSync(promptPath, 'utf8') : '';

// ====== User Helper ======
function getReqUser(req) {
  return {
    user_id: 'default_user',
    user_email: 'user@slm.app',
    user_name: 'SLM User'
  };
}

async function translateText(document) {
  const payload = typeof document === 'string' ? { content: document } : document;
  const result = await translationService.translateAndMap(payload);
  return JSON.stringify(result);
}

async function processJob(job) {
  try {
    console.log(`Processing translation job ${job.job_id}`);
    const modelOutput = await translateText(job.document);

    let parsed = null;
    try {
      parsed = JSON.parse(modelOutput);
    } catch (pErr) {
      parsed = { full_translation: modelOutput, words: [] };
    }

    const fullTranslation = parsed.full_translation || '';
    const words = Array.isArray(parsed.words) ? parsed.words : [];

    const outputStr = JSON.stringify({
      full_translation: fullTranslation,
      words
    });

    storeResult(job.job_id, {
      user_id: job.user_id,
      output: outputStr,
      status: 'complete',
      created_at: Date.now() / 1000
    });

    // Auto-archive session into reading history
    try {
      await historyService.saveSession({
        user_id: job.user_id,
        source_text: job.document.content,
        original_language: job.document.original_language || 'Auto',
        target_language: job.document.target_language || 'English',
        full_translation: fullTranslation,
        token_metadata: { full_translation: fullTranslation, words },
        tags: [job.document.original_language || 'Reading'].filter(Boolean)
      });
    } catch (saveErr) {
      console.error('[processJob] Auto-archive history error:', saveErr.message);
    }
  } catch (err) {
    console.error("Worker error:", err.message);
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

    const { original_language, target_language, custom_vocab, 'original_iso639-1_code': originalIso } = req.body;
    const fileType = req.file.mimetype;

    let content = "";
    if (fileType.startsWith("image/")) {
      return res.status(400).json({
        error: 'IMAGE_OCR_DISABLED',
        detail: 'Image OCR processing is disabled. Please upload a plain text (.txt) file or paste your text directly.'
      });
    } else {
      content = req.file.buffer.toString('utf8');
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

    return res.json({ message: "Job queued successfully.", job_id: id, success: true });
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

    return res.json({ message: "Job queued successfully.", job_id: id, success: true });
  } catch (err) {
    console.error(err);
    return res.status(400).json({ error: 'TEXT_TRANSLATE_ERROR', detail: err.message || 'An unexpected error occurred.' });
  }
});

app.get('/api/status/:job_id', async (req, res) => {
  try {
    const user = getReqUser(req);
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
          res.write(`data: ${JSON.stringify({ status: "processing" })}\n\n`);
          if (count > 150) { // Timeout after ~2 minutes
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

app.get('/api/user/getdetails', async (req, res) => {
  try {
    const user = getReqUser(req);
    return res.json({
      user_id: user.user_id,
      user_name: user.user_name,
      user_email: user.user_email
    });
  } catch (err) {
    console.error(err);
    return res.status(400).json({ error: 'USER_DETAILS_ERROR', detail: err.message || 'An unexpected error occurred.' });
  }
});

// ====== Reading History API Routes ======
app.get('/api/history', async (req, res) => {
  try {
    const user = getReqUser(req);
    const { page, limit, query, language, tag, bookmarked } = req.query;
    const history = await historyService.getUserHistory(user.user_id, {
      page: page || 1,
      limit: limit || 20,
      query: query || '',
      language: language || '',
      tag: tag || '',
      bookmarkedOnly: bookmarked === 'true'
    });

    return res.json({ success: true, ...history });
  } catch (err) {
    console.error('[GET /api/history] Error:', err);
    return res.status(500).json({ error: 'HISTORY_FETCH_ERROR', detail: err.message || 'Failed to fetch reading history.' });
  }
});

app.get('/api/history/:session_id', async (req, res) => {
  try {
    const user = getReqUser(req);
    const session = await historyService.getSessionById(user.user_id, req.params.session_id);
    if (!session) {
      return res.status(404).json({ error: 'SESSION_NOT_FOUND', detail: 'Reading session not found.' });
    }

    return res.json({ success: true, session });
  } catch (err) {
    console.error('[GET /api/history/:session_id] Error:', err);
    return res.status(500).json({ error: 'SESSION_FETCH_ERROR', detail: err.message || 'Failed to fetch reading session.' });
  }
});

app.post('/api/history', async (req, res) => {
  try {
    const user = getReqUser(req);
    const { title, source_text, original_language, target_language, full_translation, token_metadata, tags, is_bookmarked } = req.body;
    if (!source_text) {
      return res.status(400).json({ error: 'MISSING_SOURCE_TEXT', detail: 'The "source_text" field is required.' });
    }

    const session = await historyService.saveSession({
      user_id: user.user_id,
      title,
      source_text,
      original_language,
      target_language,
      full_translation,
      token_metadata,
      tags,
      is_bookmarked
    });

    return res.json({ success: true, session });
  } catch (err) {
    console.error('[POST /api/history] Error:', err);
    return res.status(500).json({ error: 'SESSION_SAVE_ERROR', detail: err.message || 'Failed to save reading session.' });
  }
});

app.patch('/api/history/:session_id', async (req, res) => {
  try {
    const user = getReqUser(req);
    const updates = req.body;
    const session = await historyService.updateSession(user.user_id, req.params.session_id, updates);
    if (!session) {
      return res.status(404).json({ error: 'SESSION_NOT_FOUND', detail: 'Reading session not found or not owned by user.' });
    }

    return res.json({ success: true, session });
  } catch (err) {
    console.error('[PATCH /api/history/:session_id] Error:', err);
    return res.status(500).json({ error: 'SESSION_UPDATE_ERROR', detail: err.message || 'Failed to update reading session.' });
  }
});

app.delete('/api/history/:session_id', async (req, res) => {
  try {
    const user = getReqUser(req);
    const success = await historyService.deleteSession(user.user_id, req.params.session_id);
    if (!success) {
      return res.status(404).json({ error: 'SESSION_NOT_FOUND', detail: 'Reading session not found or not owned by user.' });
    }

    return res.json({ success: true, message: 'Session deleted successfully.' });
  } catch (err) {
    console.error('[DELETE /api/history/:session_id] Error:', err);
    return res.status(500).json({ error: 'SESSION_DELETE_ERROR', detail: err.message || 'Failed to delete reading session.' });
  }
});

module.exports = app;
