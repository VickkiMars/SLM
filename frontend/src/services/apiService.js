const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

export async function translateText({ content, original_language, target_language, custom_vocab }) {
  const res = await fetch(`${API_BASE}/api/text/translate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content,
      original_language: original_language || undefined,
      target_language,
      custom_vocab
    })
  });
  const data = await res.json();
  if (!res.ok) throw data;
  return data;
}

export async function translateFile(file, originalLanguage, targetLanguage, customVocab) {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('original_language', originalLanguage);
  fd.append('target_language', targetLanguage);
  if (customVocab) fd.append('custom_vocab', customVocab);

  const isoMap = {
    English: 'eng', French: 'fre', Spanish: 'spa', Arabic: 'ara', Swahili: 'swa',
    Mandarin: 'chi', Portuguese: 'por', German: 'ger', Hindi: 'hin',
    Yoruba: 'yor', Amharic: 'amh', Hausa: 'hau', Igbo: 'ibo', Zulu: 'zul'
  };
  fd.append('original_iso639-1_code', isoMap[originalLanguage] || 'eng');

  const res = await fetch(`${API_BASE}/api/upload/translate`, {
    method: 'POST',
    body: fd
  });
  const data = await res.json();
  if (!res.ok) throw data;
  return data;
}

export function subscribeJobStatus(jobId, callbacks = {}) {
  const { onUpdate, onComplete, onError } = callbacks;
  const controller = new AbortController();

  fetch(`${API_BASE}/api/status/${jobId}`, {
    signal: controller.signal
  }).then(async (response) => {
    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: 'Status check failed' }));
      if (onError) onError(err);
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
            if (onComplete) onComplete(blob);
            return;
          } else if (blob.status === 'failed' || blob.status === 'error') {
            controller.abort();
            if (onError) onError(blob);
            return;
          } else if (onUpdate) {
            onUpdate(blob);
          }
        } catch (e) {
          // ignore malformed SSE lines
        }
      }
    }
  }).catch((err) => {
    if (err.name !== 'AbortError' && onError) {
      onError({ detail: 'Connection interrupted waiting for translation result.' });
    }
  });

  return () => controller.abort();
}
