/**
 * SLM Transliteration & Translation Parser
 * Parses AI raw output in format: romanized_language | english meaning
 * (or source_word | romanized_language | english meaning)
 * and maps tokens to original source content.
 */

const { formatPinyin } = require('./chineseMapper');

/**
 * CJK compound word segmentation helper using simple longest-prefix matching heuristics
 */
function segmentCjkText(text) {
  const tokens = [];
  let i = 0;
  const len = text.length;

  while (i < len) {
    const char = text[i];

    // Newlines (\n or \r\n)
    if (char === '\n' || char === '\r') {
      if (char === '\r' && text[i + 1] === '\n') i++;
      tokens.push({ source_word: '\n', is_newline: true });
      i++;
      continue;
    }

    // Spaces & tabs
    if (char === ' ' || char === '\t') {
      let spaceStr = '';
      while (i < len && (text[i] === ' ' || text[i] === '\t')) {
        spaceStr += text[i];
        i++;
      }
      tokens.push({ source_word: spaceStr, is_space: true });
      continue;
    }

    // Punctuation marks (western & CJK)
    if (/[.,/;':"<>?!@#$%^&*()_+\-=\[\]{}|\\`~«»„“”—–…¡¿，。！？；：、“”（）《》【】…—～・]/u.test(char)) {
      tokens.push({ source_word: char, is_punct: true });
      i++;
      continue;
    }

    // CJK character sequence (Chinese/Japanese/Korean)
    if (/[\u4e00-\u9fa5\u3040-\u30ff\uac00-\ud7af]/u.test(char)) {
      // Group compound characters up to 4 chars if no spaces/punct
      let cjkStr = '';
      let count = 0;
      while (i < len && /[\u4e00-\u9fa5\u3040-\u30ff\uac00-\ud7af]/u.test(text[i]) && count < 2) {
        cjkStr += text[i];
        i++;
        count++;
      }
      tokens.push({ source_word: cjkStr, is_word: true });
      continue;
    }

    // Non-CJK word
    let wordStr = '';
    while (
      i < len &&
      !/[\s\n\r.,/;':"<>?!@#$%^&*()_+\-=\[\]{}|\\`~«»„“”—–…¡¿，。！？；：、“”（）《》【】…—～・]/u.test(text[i]) &&
      !/[\u4e00-\u9fa5\u3040-\u30ff\uac00-\ud7af]/u.test(text[i])
    ) {
      wordStr += text[i];
      i++;
    }

    if (wordStr) {
      tokens.push({ source_word: wordStr, is_word: true });
    }
  }

  return tokens;
}

/**
 * Tokenizes source content into structural units (words, spaces, newlines, punctuation)
 */
function tokenizeSourceContent(content) {
  if (!content || typeof content !== 'string') return [];
  return segmentCjkText(content);
}

/**
 * Parses raw text lines from AI output.
 * Format: romanized_language | english meaning
 * or: source_word | romanized_language | english meaning
 */
function parseAiOutputLines(rawAiText) {
  if (!rawAiText || typeof rawAiText !== 'string') return [];

  // Strip markdown codeblocks if present
  let clean = rawAiText.replace(/^```[a-z]*\n?/im, '').replace(/```$/im, '').trim();

  const lines = clean.split(/\r?\n/);
  const parsedPairs = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Ignore raw json lines if AI accidentally returned brackets
    if (trimmed.startsWith('{') || trimmed.startsWith('}') || trimmed.startsWith('[') || trimmed.startsWith(']')) {
      continue;
    }

    const parts = trimmed.split('|').map(p => p.trim());
    if (parts.length >= 3) {
      // source_word | romanized | english
      parsedPairs.push({
        source_word: parts[0],
        romanized: parts[1],
        english: parts[2]
      });
    } else if (parts.length === 2) {
      // romanized | english
      parsedPairs.push({
        romanized: parts[0],
        english: parts[1]
      });
    } else if (parts.length === 1 && parts[0]) {
      // Single token fallback
      parsedPairs.push({
        romanized: parts[0],
        english: parts[0]
      });
    }
  }

  return parsedPairs;
}

/**
 * Main parser routine: Maps parsed AI output lines to tokenized source text.
 */
function buildOutputResult(rawAiText, sourceContent, originalLanguage = 'Auto') {
  const sourceTokens = tokenizeSourceContent(sourceContent);
  const aiPairs = parseAiOutputLines(rawAiText);

  let aiIndex = 0;
  const wordTokens = [];

  for (const token of sourceTokens) {
    if (token.is_newline || token.is_space || token.is_punct) {
      wordTokens.push({
        source_word: token.source_word,
        translated_word: '',
        pronunciation: '',
        is_space: Boolean(token.is_space),
        is_newline: Boolean(token.is_newline),
        is_punct: Boolean(token.is_punct)
      });
      continue;
    }

    // Look for matching pair from AI output
    let pair = aiPairs[aiIndex] || null;
    let pronunciation = pair?.romanized || token.source_word;
    let translated = pair?.english || pair?.romanized || token.source_word;

    // Alignment check if pair specifies source_word explicitly
    if (pair?.source_word && pair.source_word !== token.source_word) {
      const matchIdx = aiPairs.findIndex((p, idx) => idx >= aiIndex && p.source_word === token.source_word);
      if (matchIdx !== -1) {
        pair = aiPairs[matchIdx];
        pronunciation = pair.romanized;
        translated = pair.english;
      }
    }

    wordTokens.push({
      source_word: token.source_word,
      translated_word: translated,
      pronunciation: pronunciation,
      is_space: false,
      is_newline: false,
      is_punct: false
    });

    aiIndex++;
  }

  // Build full translation sentence from word meanings
  const translatedWords = wordTokens
    .filter(w => !w.is_space && !w.is_newline && !w.is_punct && w.translated_word)
    .map(w => w.translated_word);

  let fullTranslation = translatedWords.join(' ');
  if (fullTranslation.length > 0) {
    fullTranslation = fullTranslation.charAt(0).toUpperCase() + fullTranslation.slice(1);
    if (!/[.!?]$/.test(fullTranslation)) {
      fullTranslation += '.';
    }
  }

  return {
    full_translation: fullTranslation || sourceContent,
    words: wordTokens
  };
}

module.exports = {
  tokenizeSourceContent,
  parseAiOutputLines,
  buildOutputResult
};
