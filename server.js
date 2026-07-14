require('dotenv').config();
const express = require('express');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const { Redis } = require('@upstash/redis');
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

// ====== Clients & Config ======
const r = new Redis({
  url: 'https://leading-gull-111037.upstash.io',
  token: process.env.REDIS_TOKEN || '',
});

const openaiClient = new OpenAI({
  baseURL: 'https://api.fikraapi.co.ke/v1',
  apiKey: process.env.FIKRA_APIKEY || '',
});

const promptPath = path.join(__dirname, 'data', 'prompt.txt');
const translationPrompt = fs.existsSync(promptPath) ? fs.readFileSync(promptPath, 'utf8') : '';

// ====== Helper functions ======
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
    const authHeader = req.headers.authorisation;
    if (!authHeader) return res.status(401).json({ detail: "Not Authorised" });
    
    const user = verifyToken(authHeader);
    if (!user) return res.status(401).json({ detail: "Invalid credentials" });
    if (!req.file) return res.status(400).json({ detail: "No file uploaded" });

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
        throw new Error("OCR extraction failed");
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

    await r.lpush("translation_queue", JSON.stringify(job));
    return res.json({ message: "Upload queue for processing", job_id: id, success: true });
  } catch (err) {
    console.error(err);
    return res.status(400).json({ detail: err.message || "failed" });
  }
});

app.post('/api/text/translate', async (req, res) => {
  try {
    const authHeader = req.headers.authorisation;
    if (!authHeader) return res.status(401).json({ detail: "Not Authorised" });

    const user = verifyToken(authHeader);
    if (!user) return res.status(401).json({ detail: "Invalid credentials" });

    const { original_language, target_language, content } = req.body;
    const id = crypto.randomUUID();
    const job = {
      job_id: id,
      user_id: user.user_id,
      document: { content, original_language, target_language },
      status: 'pending'
    };

    await r.lpush("translation_queue", JSON.stringify(job));
    return res.json({ message: "Upload queue for processing", job_id: id, success: "True" });
  } catch (err) {
    console.error(err);
    return res.status(400).json({ detail: "failed" });
  }
});

app.get('/api/status/:job_id', async (req, res) => {
  try {
    const authHeader = req.headers.authorisation;
    if (!authHeader) return res.status(401).json({ detail: "Not Authorised" });

    const user = verifyToken(authHeader);
    if (!user) return res.status(401).json({ detail: "Invalid credentials" });

    const { job_id } = req.params;
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const intervalId = setInterval(async () => {
      try {
        const key = `result:${job_id}`;
        const data = await r.get(key);
        if (!data) {
          res.write(`data: ${JSON.stringify({ status: "processing" })}\n\n`);
        } else {
          const blob = typeof data === 'string' ? JSON.parse(data) : data;
          if (blob.user_id === user.user_id) {
            res.write(`data: ${JSON.stringify(blob)}\n\n`);
            await r.expire(key, 2);
            clearInterval(intervalId);
            res.end();
          } else {
            res.write(`data: ${JSON.stringify({ status: "Not authorized!" })}\n\n`);
            clearInterval(intervalId);
            res.end();
          }
        }
      } catch (err) {
        console.error(err);
        res.write(`data: ${JSON.stringify({ status: "error", message: err.message })}\n\n`);
        clearInterval(intervalId);
        res.end();
      }
    }, 2000);

    req.on('close', () => {
      clearInterval(intervalId);
    });
  } catch (err) {
    console.error(err);
    return res.status(400).json({ detail: "failed" });
  }
});

app.get('/api/user/getdetails', async (req, res) => {
  try {
    const authHeader = req.headers.authorisation;
    if (!authHeader) return res.status(401).json({ detail: "Not Authorised" });

    const user = verifyToken(authHeader);
    if (!user) return res.status(401).json({ detail: "Invalid credentials" });

    return res.json({
      user_id: user.user_id,
      user_name: user.user_name,
      user_email: user.user_email
    });
  } catch (err) {
    console.error(err);
    return res.status(400).json({ detail: "failed" });
  }
});

// ====== Background Worker Loop ======
async function workerLoop() {
  console.log("Background translation queue worker started.");
  while (true) {
    try {
      const rawJob = await r.rpop("translation_queue");
      if (!rawJob) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        continue;
      }
      const job = typeof rawJob === 'string' ? JSON.parse(rawJob) : rawJob;
      console.log(`Processing translation job ${job.job_id}`);
      const modelOutput = await translateText(job.document);
      await r.set(`result:${job.job_id}`, JSON.stringify({
        user_id: job.user_id,
        output: modelOutput,
        status: "complete",
        created_at: Date.now() / 1000
      }));
      console.log(`Job ${job.job_id} complete and result saved.`);
    } catch (err) {
      console.error("Worker error:", err.message);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
}

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
  workerLoop();
});
