# SLM — Sound & Language Mapper

An AI-powered language mapper & interactive reading view application designed to translate text and document images word-by-word with pronunciation and character cluster lookup.

---

## Features

- **Mobile First Optimization**: Responsive UI optimized for mobile touch targets, flex layouts, mobile bottom navigation, and clean viewport bounds.
- **Hidden Scrollbars**: Global visual scrollbar removal across all viewports (`scrollbar-width: none`, `-webkit-scrollbar { display: none }`) while maintaining full overflow scrollability.
- **Interactive Reading View**: Character clusters feature hover lift & underline effect, with a vertical popover tooltip on click displaying:
  1. Symbol / Word
  2. Romanized version / Pronunciation
  3. Meaning / Translation
- **Vercel Deployable**: Pre-configured for seamless serverless deployment on Vercel (`api/index.js` + `public/index.html`).

---

## Project Structure

```
slm/
├── api/
│   └── index.js         # Vercel Serverless Function Express API handler
├── public/
│   └── index.html       # Production frontend HTML (Vercel static root)
├── frontend/
│   └── index.html       # Development frontend HTML
├── data/
│   └── prompt.txt       # AI System prompt for translation model
├── server.js            # Standalone Node.js Express server (Local / VM / Docker)
├── package.json         # Project dependencies and start scripts
├── vercel.json          # Vercel deployment route and build settings
└── .env.example         # Environment variables template
```

---

## Vercel Deployment Instructions

### Method 1: Deploy via Vercel CLI

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy from project root**:
   ```bash
   vercel
   ```

4. **Set Environment Variables**:
   ```bash
   vercel env add SUPABASE_JWT_SECRET
   vercel env add FIKRA_APIKEY
   vercel env add OCR_KEY
   ```

5. **Deploy to Production**:
   ```bash
   vercel --prod
   ```

---

### Method 2: Deploy via Vercel GitHub Integration (Recommended)

1. **Push to GitHub**:
   Ensure your code is pushed to your GitHub repository:
   ```bash
   git add .
   git commit -m "refactor for Vercel deployment"
   git push origin main
   ```

2. **Import into Vercel**:
   - Go to [vercel.com/new](https://vercel.com/new).
   - Import the **SLM** GitHub repository.

3. **Configure Environment Variables**:
   In the Vercel project deployment setup screen, add the following under **Environment Variables**:

   | Key | Value | Description |
   | --- | --- | --- |
   | `SUPABASE_JWT_SECRET` | `your_secret` | JWT Secret used to verify client auth tokens |
   | `FIKRA_APIKEY` | `your_key` | Fikra API Key for LLM translation (`fikra-pro-120b`) |
   | `FIKRA_BASE_URL` | `https://api.fikraapi.co.ke/v1` | Fikra API base endpoint |
   | `OCR_KEY` | `your_ocr_key` | OCR.space API Key for image text extraction |

4. **Click Deploy**:
   Vercel will detect `vercel.json`, build `@vercel/node` for `api/index.js`, host `public/index.html` at root `/`, and output a production URL.

---

## Running Locally

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Create Environment File**:
   Copy `.env.example` to `.env` and fill in your keys:
   ```bash
   cp .env.example .env
   ```

3. **Start the Local Server**:
   ```bash
   npm start
   ```
   Open your browser to `http://localhost:8000`.

---

## Configuration Settings Summary (`vercel.json`)

```json
{
  "version": 2,
  "builds": [
    { "src": "api/index.js", "use": "@vercel/node" },
    { "src": "public/**/*", "use": "@vercel/static" }
  ],
  "routes": [
    { "src": "/api/(.*)", "dest": "/api/index.js" },
    { "src": "/(.*)", "dest": "/public/$1" }
  ]
}
```
