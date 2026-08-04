require('dotenv').config();
const express = require('express');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const { OpenAI } = require('openai');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const port = process.env.PORT || 8000;

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

const upload = multer({ storage: multer.memoryStorage() });

// ====== In-memory store (replaces Redis) ======
// translationQueue: FIFO array of pending job objects.
const translationQueue = [];

// resultStore: Map<job_id, result_object>.
// Results are auto-deleted after 24 hours to bound memory growth.
const resultStore = new Map();

function storeResult(jobId, value) {
  resultStore.set(jobId, value);
  // Auto-expire after 24 hours (86 400 000 ms)
  setTimeout(() => resultStore.delete(jobId), 86_400_000);
}

const openaiClient = new OpenAI({
  baseURL: 'https://api.fikraapi.co.ke/v1',
  apiKey: process.env.FIKRA_APIKEY || '',
});

const promptPath = path.join(__dirname, 'data', 'prompt.txt');
const translationPrompt = fs.existsSync(promptPath) ? fs.readFileSync(promptPath, 'utf8') : '';

// ====== Helper functions ======

/**
 * Reads the Authorization header, accepting both the standard spelling
 * ("Authorization", RFC 7235) and the British-English variant
 * ("Authorisation") so that standard HTTP clients work out of the box.
 */
function getAuthHeader(req) {
  return req.headers['authorization'] || req.headers['authorisation'];
}

function verifyToken(token) {
  try {
    const tokenStr = token.startsWith('Bearer ') ? token.slice(7) : token;
    const payload = jwt.verify(tokenStr, process.env.SUPABASE_JWT_SECRET, {
      algorithms: ['HS256'],
      audience: 'authenticated'
    });
    return {
      user_id: payload.sub,
      user_email: payload.email,
      user_name: payload.name || payload.user_metadata?.name
    };
  } catch (err) {
    console.error("JWT Verify Error:", err.message);
    return null;
  }
}

async function translateText(document) {
  const contentStr = typeof document === 'string' ? document : JSON.stringify(document);
  const response = await openaiClient.chat.completions.create({
    model: 'fikra-pro-120b',
    messages: [
      { role: 'system', content: translationPrompt },
      { role: 'user', content: contentStr }
    ]
  });
  return response.choices[0].message.content;
}

// ====== Routes ======
app.post('/api/upload/translate', upload.single('file'), async (req, res) => {
  try {
    const authHeader = getAuthHeader(req);
    if (!authHeader) return res.status(401).json({ error: 'MISSING_TOKEN', detail: 'Authorization header is required.' });

    const user = verifyToken(authHeader);
    if (!user) return res.status(401).json({ error: 'INVALID_TOKEN', detail: 'The provided token is invalid or has expired.' });
    if (!req.file) return res.status(400).json({ error: 'MISSING_FILE', detail: 'No file was uploaded. Include a file under the "file" form field.' });

    const { original_language, target_language, 'original_iso639-1_code': originalIso } = req.body;
    const fileType = req.file.mimetype;
    const fileName = req.file.originalname;

    let content = "";
    if (fileType.startsWith("image/")) {
      const formData = new FormData();
      const blob = new Blob([req.file.buffer], { type: fileType });
      formData.append('file', blob, fileName);
      formData.append('apikey', process.env.OCR_KEY || '');
      formData.append('language', originalIso || 'eng');

      const ocrRes = await fetch('https://api.ocr.space/parse/image', {
        method: 'POST',
        body: formData
      });
      const ocrJson = await ocrRes.json();
      if (ocrJson.ParsedResults && ocrJson.ParsedResults[0]) {
        content = ocrJson.ParsedResults[0].ParsedText;
      } else {
        throw new Error("OCR_EXTRACTION_FAILED: The OCR service could not extract text from the uploaded image.");
      }
    } else {
      content = req.file.buffer.toString('utf8');
    }

    const id = crypto.randomUUID();
    const job = {
      job_id: id,
      user_id: user.user_id,
      document: { content, original_language, target_language },
      status: 'pending'
    };

    translationQueue.push(job);
    return res.json({ message: "Job queued successfully.", job_id: id, success: true });
  } catch (err) {
    console.error(err);
    return res.status(400).json({ error: 'UPLOAD_ERROR', detail: err.message || 'An unexpected error occurred while processing the upload.' });
  }
});

app.post('/api/text/translate', async (req, res) => {
  try {
    const authHeader = getAuthHeader(req);
    if (!authHeader) return res.status(401).json({ error: 'MISSING_TOKEN', detail: 'Authorization header is required.' });

    const user = verifyToken(authHeader);
    if (!user) return res.status(401).json({ error: 'INVALID_TOKEN', detail: 'The provided token is invalid or has expired.' });

    const { original_language, target_language, content } = req.body;
    if (!content) return res.status(400).json({ error: 'MISSING_CONTENT', detail: 'The "content" field is required in the request body.' });

    const id = crypto.randomUUID();
    const job = {
      job_id: id,
      user_id: user.user_id,
      document: { content, original_language, target_language },
      status: 'pending'
    };

    translationQueue.push(job);
    return res.json({ message: "Job queued successfully.", job_id: id, success: true });
  } catch (err) {
    console.error(err);
    return res.status(400).json({ error: 'TEXT_TRANSLATE_ERROR', detail: err.message || 'An unexpected error occurred while queuing the translation.' });
  }
});

app.get('/api/status/:job_id', async (req, res) => {
  try {
    const authHeader = getAuthHeader(req);
    if (!authHeader) return res.status(401).json({ error: 'MISSING_TOKEN', detail: 'Authorization header is required.' });

    const user = verifyToken(authHeader);
    if (!user) return res.status(401).json({ error: 'INVALID_TOKEN', detail: 'The provided token is invalid or has expired.' });

    const { job_id } = req.params;
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const intervalId = setInterval(() => {
      try {
        const blob = resultStore.get(job_id);
        if (!blob) {
          res.write(`data: ${JSON.stringify({ status: "processing" })}\n\n`);
        } else if (blob.user_id === user.user_id) {
          res.write(`data: ${JSON.stringify(blob)}\n\n`);
          // Result remains in the store until its 24-hour auto-expiry.
          clearInterval(intervalId);
          res.end();
        } else {
          res.write(`data: ${JSON.stringify({ status: 'error', error: 'FORBIDDEN', detail: 'You are not authorized to access this job.' })}\n\n`);
          clearInterval(intervalId);
          res.end();
        }
      } catch (err) {
        console.error(err);
        res.write(`data: ${JSON.stringify({ status: 'error', error: 'STATUS_CHECK_ERROR', detail: err.message })}\n\n`);
        clearInterval(intervalId);
        res.end();
      }
    }, 2000);

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
    const authHeader = getAuthHeader(req);
    if (!authHeader) return res.status(401).json({ error: 'MISSING_TOKEN', detail: 'Authorization header is required.' });

    const user = verifyToken(authHeader);
    if (!user) return res.status(401).json({ error: 'INVALID_TOKEN', detail: 'The provided token is invalid or has expired.' });

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

// ====== Background Worker Loop ======
async function workerLoop() {
  console.log("Background translation queue worker started.");
  while (true) {
    let job = null;
    try {
      job = translationQueue.shift();
      if (!job) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        continue;
      }
      console.log(`Processing translation job ${job.job_id}`);
      const modelOutput = await translateText(job.document);
      storeResult(job.job_id, {
        user_id: job.user_id,
        output: modelOutput,
        status: 'complete',
        created_at: Date.now() / 1000
      });
      console.log(`Job ${job.job_id} complete and result saved.`);
    } catch (err) {
      console.error("Worker error:", err.message);
      // Write the failure state to the store so SSE clients receive an error
      // event instead of polling indefinitely for a result that will never come.
      if (job && job.job_id) {
        storeResult(job.job_id, {
          user_id: job.user_id,
          status: 'failed',
          error: 'WORKER_ERROR',
          detail: err.message || 'The translation worker encountered an unexpected error.',
          created_at: Date.now() / 1000
        });
      }
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
}

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
  workerLoop();
});
