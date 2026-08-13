const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

function getHeaders(token, extra = {}) {
  const headers = { ...extra };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function translateText({ content, original_language, target_language }, token) {
  const res = await fetch(`${API_BASE}/api/text/translate`, {
    method: 'POST',
    headers: getHeaders(token, { 'Content-Type': 'application/json' }),
    body: JSON.stringify({
      content,
      original_language: original_language || undefined,
      target_language
    })
  });
  const data = await res.json();
  if (!res.ok) throw data;
  return data;
}

export async function translateFile(file, originalLanguage, targetLanguage, token) {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('original_language', originalLanguage);
  fd.append('target_language', targetLanguage);
  
  const isoMap = { English:'eng', French:'fre', Spanish:'spa', Arabic:'ara', Swahili:'swa', Mandarin:'chi', Portuguese:'por', German:'ger', Hindi:'hin', Yoruba:'yor', Amharic:'amh', Hausa:'hau', Igbo:'ibo', Zulu:'zul' };
  fd.append('original_iso639-1_code', isoMap[originalLanguage] || 'eng');

  const res = await fetch(`${API_BASE}/api/upload/translate`, {
    method: 'POST',
    headers: getHeaders(token),
    body: fd
  });
  const data = await res.json();
  if (!res.ok) throw data;
  return data;
}

export function subscribeJobStatus(jobId, token, { onUpdate, onComplete, onError }) {
  const controller = new AbortController();

  fetch(`${API_BASE}/api/status/${jobId}`, {
    headers: getHeaders(token),
    signal: controller.signal
  }).then(async (response) => {
    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: 'Status check failed' }));
      onError(err);
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buf = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const parts = buf.split('\n\n');
      buf = parts.pop();
      for (const part of parts) {
        const line = part.trim();
        if (!line.startsWith('data:')) continue;
        try {
          const blob = JSON.parse(line.slice(5).trim());
          if (blob.status === 'complete') {
            controller.abort();
            onComplete(blob);
            return;
          } else if (blob.status === 'failed' || blob.status === 'error') {
            controller.abort();
            onError(blob);
            return;
          } else if (onUpdate) {
            onUpdate(blob);
          }
        } catch (e) {
          // ignore malformed lines
        }
      }
    }
  }).catch((err) => {
    if (err.name !== 'AbortError') {
      onError({ detail: 'Connection interrupted waiting for translation result.' });
    }
  });

  return () => controller.abort();
}

export async function fetchHistory({ query = '', language = '', tag = '', bookmarked = false } = {}, token) {
  const q = encodeURIComponent(query);
  const lang = encodeURIComponent(language);
  const bm = bookmarked ? 'true' : 'false';

  const res = await fetch(`${API_BASE}/api/history?query=${q}&language=${lang}&bookmarked=${bm}`, {
    headers: getHeaders(token)
  });
  const data = await res.json();
  if (!res.ok) throw data;
  return data;
}

export async function fetchSessionById(sessionId, token) {
  const res = await fetch(`${API_BASE}/api/history/${sessionId}`, {
    headers: getHeaders(token)
  });
  const data = await res.json();
  if (!res.ok) throw data;
  return data.session;
}

export async function updateSession(sessionId, updates, token) {
  const res = await fetch(`${API_BASE}/api/history/${sessionId}`, {
    method: 'PATCH',
    headers: getHeaders(token, { 'Content-Type': 'application/json' }),
    body: JSON.stringify(updates)
  });
  const data = await res.json();
  if (!res.ok) throw data;
  return data.session;
}

export async function deleteSession(sessionId, token) {
  const res = await fetch(`${API_BASE}/api/history/${sessionId}`, {
    method: 'DELETE',
    headers: getHeaders(token)
  });
  const data = await res.json();
  if (!res.ok) throw data;
  return data;
}
