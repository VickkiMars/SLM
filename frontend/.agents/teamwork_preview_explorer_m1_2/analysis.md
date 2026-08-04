# Technical Analysis & JavaScript Architecture: SLM Single-Page Web Frontend

## Executive Summary
This document provides a comprehensive technical analysis and architectural blueprint for the SLM Single-Page Web Frontend API integration. SLM is an AI-powered translation service connecting to a Node.js Express backend at `http://localhost:8000`. The frontend must handle JWT Bearer authentication, text and file upload submissions, Server-Sent Events (SSE) job status streaming with custom headers, and parsing of model outputs containing full translations and word-by-word phonetic breakdowns.

---

## 1. Backend API Specification & Contract Analysis

The backend (`server.js`) exposes four HTTP routes and communicates with Redis and OpenAI (`fikra-pro-120b`).

### 1.1 Authentication Header Handling
- **Header Key**: Accepts both standard `Authorization` (RFC 7235) and British-English `Authorisation`.
- **Value Format**: `Bearer <jwt_token>` (or raw token). Standard client implementation: `Authorization: Bearer <token>`.
- **JWT Secret & Algorithm**: Validated using `SUPABASE_JWT_SECRET` with `HS256` and audience `authenticated`.
- **Decoded User Structure**: `{ user_id: string, user_email: string, user_name: string }`.

### 1.2 User Details: `GET /api/user/getdetails`
- **Headers**: `Authorization: Bearer <token>`
- **Response (200 OK)**:
  ```json
  {
    "user_id": "usr_12345",
    "user_name": "Jane Doe",
    "user_email": "jane@example.com"
  }
  ```
- **Error Responses**:
  - `401 Unauthorized`: `{ "error": "MISSING_TOKEN" | "INVALID_TOKEN", "detail": "..." }`
  - `400 Bad Request`: `{ "error": "USER_DETAILS_ERROR", "detail": "..." }`

### 1.3 Text Translation Queue: `POST /api/text/translate`
- **Headers**: `Authorization: Bearer <token>`, `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "original_language": "English",
    "target_language": "Swahili",
    "content": "Text content to be translated"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "message": "Job queued successfully.",
    "job_id": "3b2909ac-18d4-4a2a-b620-1b79f0fb4567",
    "success": true
  }
  ```
- **Validation Rules**: `content` field is strictly required.

### 1.4 File Upload Translation Queue: `POST /api/upload/translate`
- **Headers**: `Authorization: Bearer <token>` (Note: Do NOT set `Content-Type` manually when using `FormData`).
- **Request Body**: `multipart/form-data` with fields:
  - `file`: Binary file object (required)
  - `original_language`: string (e.g., "English")
  - `target_language`: string (e.g., "Swahili")
  - `original_iso639-1_code`: string (e.g., "en", "sw", "fr", "eng")
- **Backend File Processing Logic**:
  - **Images** (`mimetype.startsWith("image/")`): Server sends image blob to OCR.Space API (`https://api.ocr.space/parse/image`) with `language = original_iso639-1_code || 'eng'`. Extracted text becomes document content.
  - **Text Files** (`text/plain`, `application/json`, etc.): Server decodes file buffer directly as UTF-8 string.
- **Response (200 OK)**: Same as text translation (`job_id` returned).

### 1.5 Job Status SSE Stream: `GET /api/status/:job_id`
- **Headers Required**: `Authorization: Bearer <token>`
- **Response Headers**:
  - `Content-Type: text/event-stream`
  - `Cache-Control: no-cache`
  - `Connection: keep-alive`
- **Backend Polling Behavior**:
  - Queries Redis key `result:${job_id}` every 2000 ms (2 seconds).
  - Emits SSE formatted messages: `data: <JSON_STRING>\n\n`.
- **Status State Machine**:
  1. `{"status": "processing"}`: Returned repeatedly while translation is running in background worker.
  2. `{"status": "complete", "user_id": "...", "output": "...", "created_at": 1722780000}`: Returned when worker completes job. Output is a JSON string matching schema in `data/prompt.txt`. Connection closes immediately after.
  3. `{"status": "failed", "user_id": "...", "error": "WORKER_ERROR", "detail": "...", "created_at": ...}`: Returned if worker crashes or fails. Connection closes.
  4. `{"status": "error", "error": "FORBIDDEN" | "STATUS_CHECK_ERROR", "detail": "..."}`: Returned if authorization fails or invalid job ID. Connection closes.

---

## 2. Model Output Parsing (`data/prompt.txt` Schema)

When `status === "complete"`, the backend returns `output`. In `server.js`, `output` is set from `openaiClient.chat.completions.create` response content, formatted per `data/prompt.txt`:

```json
{
  "source_language": "English",
  "target_language": "Swahili",
  "full_translation": "Habari gani ulimwengu",
  "error": "",
  "words": [
    {
      "source_word": "Hello",
      "translated_word": "Habari",
      "pronunciation": "ha-BAH-ree"
    },
    {
      "source_word": "world",
      "translated_word": "ulimwengu",
      "pronunciation": "oo-lee-m-WEN-goo"
    }
  ]
}
```

### Parsing Strategy:
Because `output` may arrive as a raw stringified JSON or pre-parsed object, the frontend parser must execute:
```javascript
let parsedOutput;
if (typeof data.output === 'string') {
  parsedOutput = JSON.parse(data.output);
} else {
  parsedOutput = data.output;
}
```
If `parsedOutput.error` is populated, treat as translation failure; otherwise extract `full_translation` and `words` array.

---

## 3. Custom SSE Reader Strategy (`fetch` + `ReadableStream`)

### Problem Statement
The browser standard `EventSource` API (`new EventSource(url)`) **does not support custom HTTP headers**. Hitting `GET /api/status/:job_id` via `EventSource` will omit the `Authorization` header, triggering a `401 MISSING_TOKEN` error from `server.js`.

### Solution Architecture
Use `fetch()` with `ReadableStream` reader and `TextDecoder`, managed by an `AbortController`.

```javascript
async function subscribeJobStatus(jobId, token, onMessage, onError, signal) {
  try {
    const response = await fetch(`http://localhost:8000/api/status/${jobId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      signal
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(errJson.detail || `Server returned status ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const chunks = buffer.split('\n\n');
      buffer = chunks.pop(); // Retain incomplete trailing fragment

      for (const chunk of chunks) {
        const line = chunk.trim();
        if (line.startsWith('data:')) {
          const jsonStr = line.slice(5).trim();
          if (jsonStr) {
            const data = JSON.parse(jsonStr);
            onMessage(data);
          }
        }
      }
    }
  } catch (err) {
    if (err.name !== 'AbortError') {
      onError(err);
    }
  }
}
```

---

## 4. Frontend JavaScript Architecture & State Management

### 4.1 Modular Structure
The SPA logic in `index.html` is organized into clean, single-responsibility modules:

1. **`AppStore` (State Management)**
   - Holds centralized application state in a reactive store pattern.
   - Persists `token` in `localStorage` under key `slm_auth_token`.
   - Triggers UI state re-renders upon state mutation.

```javascript
const Store = {
  state: {
    token: localStorage.getItem('slm_auth_token') || '',
    user: null, // { user_id, user_name, user_email }
    activeTab: 'text', // 'text' | 'file'
    textForm: { originalLanguage: 'English', targetLanguage: 'Swahili', content: '' },
    fileForm: { file: null, originalLanguage: 'English', targetLanguage: 'Swahili', originalIso: 'en' },
    job: {
      id: null,
      status: 'idle', // 'idle' | 'queuing' | 'processing' | 'complete' | 'failed' | 'error'
      progressText: '',
      result: null,
      error: null,
      abortController: null
    },
    ui: { authDrawerOpen: false, activeWord: null }
  },
  listeners: [],
  subscribe(fn) { this.listeners.push(fn); },
  setState(updater) {
    if (typeof updater === 'function') {
      this.state = updater(this.state);
    } else {
      this.state = { ...this.state, ...updater };
    }
    this.listeners.forEach(fn => fn(this.state));
  }
};
```

2. **`ApiClient` (Network Layer)**
   - Encapsulates all backend HTTP calls and stream handling.
   - Intercepts `401 Unauthorized` responses to set `state.ui.authDrawerOpen = true` and alert user.

3. **`UIController` (DOM & Event Handlers)**
   - Renders active tab views (Text Translate vs File Upload).
   - Manages Unobtrusive Auth Drawer toggle, token input saving, and user status pill.
   - Manages interactive phonetic word breakdown grid/table and detail modals.

---

## 5. Error Handling Matrix & Resilience Strategies

| Scenario | HTTP / SSE Code | Root Cause | UI Behavior & Actionable Guidance |
|---|---|---|---|
| **Missing Auth Token** | HTTP 401 `MISSING_TOKEN` | Token absent in localStorage | Open Auth Drawer, highlight token field: *"Authorization token required to translate."* |
| **Invalid/Expired Token** | HTTP 401 `INVALID_TOKEN` | Secret mismatch or expired JWT | Open Auth Drawer, show alert badge: *"Token invalid or expired. Enter a valid Supabase JWT."* |
| **Empty Content Submission** | HTTP 400 `MISSING_CONTENT` | User submitted blank text | Inline error below text area: *"Please enter text to translate."* |
| **No File Selected** | HTTP 400 `MISSING_FILE` | Upload submitted without file | Inline error on dropzone: *"Select a file (.txt, .md, .png, .jpg) before submitting."* |
| **OCR Extraction Error** | HTTP 400 `UPLOAD_ERROR` | OCR service failed on image | Error alert panel: *"Could not extract text from image. Ensure image contains legible text."* |
| **Worker Processing Error** | SSE `status: "failed"` | Worker model execution error | Error card: *"Translation engine encountered an error: [detail]. Please try again."* |
| **Forbidden Job Access** | SSE `status: "error"` | Job owned by another user_id | Error banner: *"Access denied: You do not have permission to view job [job_id]."* |
| **Network / Server Down** | `FetchError` / `TypeError` | Node server offline at localhost:8000 | Toast alert: *"Server offline. Ensure backend is running at http://localhost:8000."* |

---

## 6. Verification Plan & Test Matrix

To independently verify the implementation:
1. **Auth Verification**: Save token in Auth Drawer -> Trigger `GET /api/user/getdetails` -> Verify user info displayed in header.
2. **Text Translation Verification**: Enter text -> Submit `POST /api/text/translate` -> Stream status via fetch reader -> Verify full translation and `words` table.
3. **File Upload Verification**: Select `.txt` or `.png` -> Submit `POST /api/upload/translate` -> Verify SSE stream completes and renders output.
4. **Error Handling Verification**: Clear token -> Submit translation -> Verify Auth Drawer opens automatically.

