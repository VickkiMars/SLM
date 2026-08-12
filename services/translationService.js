const gtranslate = require('@vitalets/google-translate-api');
const chineseMapper = require('./chineseMapper');
const japaneseMapper = require('./japaneseMapper');
const { transliterateKorean, transliterateArabic, transliterateHebrew } = require('./transliterationHelper');

// ISO 639-1 language code mapping helper for 8 Major Languages
const LANG_CODES = {
  English: 'en',
  French: 'fr',
  Spanish: 'es',
  Chinese: 'zh-CN',
  Mandarin: 'zh-CN',
  Japanese: 'ja',
  Korean: 'ko',
  Arabic: 'ar',
  Hebrew: 'he',
  German: 'de'
};

function getIsoCode(langName, defaultCode = 'en') {
  if (!langName || langName === 'Auto') return undefined;
  return LANG_CODES[langName] || defaultCode;
}

// Detection helpers
const containsChineseChars = (text) => /[\u4e00-\u9fa5]/.test(text);
const containsJapaneseKana = (text) => /[\u3040-\u309f\u30a0-\u30ff]/.test(text);
const containsKoreanHangul = (text) => /[\uac00-\ud7af]/.test(text);
const containsArabicScript = (text) => /[\u0600-\u06FF]/.test(text);
const containsHebrewScript = (text) => /[\u0590-\u05FF]/.test(text);

/**
 * Parse custom vocabulary string formatted as: word::meaning::pronunciation (one per line)
 */
function parseCustomVocab(customVocabStr) {
  if (!customVocabStr || typeof customVocabStr !== 'string') return {};
  const map = {};
  const lines = customVocabStr.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const parts = trimmed.split('::');
    if (parts.length >= 2) {
      const word = parts[0].trim();
      const meaning = parts[1].trim();
      const pron = parts[2] ? parts[2].trim() : '';
      if (word) {
        map[word] = { translated_word: meaning, pronunciation: pron };
        map[word.toLowerCase()] = { translated_word: meaning, pronunciation: pron };
      }
    }
  }
  return map;
}

const fetch = require('node-fetch');

async function robustTranslate(text, targetCode = 'en', sourceCode = 'ja') {
  if (!text || !text.trim()) return '';

  const src = (sourceCode && sourceCode !== 'Auto') ? sourceCode : 'ja';

  // 1. Unthrottled GTX client API with browser User-Agent
  try {
    const url = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=' + src + '&tl=' + targetCode + '&dt=t&q=' + encodeURIComponent(text);
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    const data = await response.json();
    if (data && data[0] && Array.isArray(data[0])) {
      const translated = data[0].map(x => x[0]).filter(Boolean).join('');
      if (translated) return translated;
    }
  } catch (gtxErr) {
    console.warn('[translationService] GTX primary API warning:', gtxErr.message);
  }

  // 2. MyMemory Translation API Fallback
  try {
    const myMemoryUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${src}|${targetCode}`;
    const mmRes = await fetch(myMemoryUrl);
    const mmData = await mmRes.json();
    if (mmData && mmData.responseData && mmData.responseData.translatedText) {
      const trText = mmData.responseData.translatedText;
      if (trText && trText !== text) return trText;
    }
  } catch (mmErr) {
    console.warn('[translationService] MyMemory API warning:', mmErr.message);
  }

  // 3. Secondary fallback via vitalets
  const translateFn = typeof gtranslate === 'function' ? gtranslate : gtranslate.translate || gtranslate.default;
  try {
    const res = await translateFn(text, { to: targetCode });
    if (res && res.text) return res.text;
  } catch (err) {
    console.error('[translationService] Secondary API error:', err.message);
  }

  return text;
}

/**
 * Main Translation & Character Mapping Orchestrator
 */
async function translateAndMap({ content, original_language = 'Auto', target_language = 'English', custom_vocab }) {
  if (!content || !content.trim()) {
    throw new Error('Content is required for translation.');
  }

  const targetCode = getIsoCode(target_language, 'en');
  const sourceCode = getIsoCode(original_language, 'ja');
  const customMap = parseCustomVocab(custom_vocab);

  // 1. Full Sentence Translation via Robust Multi-API Provider
  const fullTranslation = await robustTranslate(content, targetCode, sourceCode);

  // 2. Character & Word Mapping Strategy for 8 Major Languages
  let words = [];

  const isJapanese = original_language === 'Japanese' || containsJapaneseKana(content);
  const isChinese = !isJapanese && (original_language === 'Chinese' || original_language === 'Mandarin' || containsChineseChars(content));
  const isKorean = original_language === 'Korean' || containsKoreanHangul(content);
  const isArabic = original_language === 'Arabic' || containsArabicScript(content);
  const isHebrew = original_language === 'Hebrew' || containsHebrewScript(content);

  if (isJapanese) {
    try {
      words = await japaneseMapper.mapJapaneseText(content, (word) => robustTranslate(word, targetCode));
    } catch (jErr) {
      console.error('[translationService] Japanese mapping error:', jErr.message);
    }
  } else if (isChinese) {
    try {
      words = await chineseMapper.mapChineseText(content);
    } catch (cErr) {
      console.error('[translationService] Chinese mapping error:', cErr.message);
    }
  } else {
    // Word & Punctuation tokenization preserving exact formatting, newlines, spaces, and punctuation
    const tokens = [];
    let i = 0;
    const len = content.length;

    while (i < len) {
      const char = content[i];

      // 1. Linebreaks
      if (char === '\n' || char === '\r') {
        if (char === '\r' && content[i + 1] === '\n') i++;
        tokens.push({ source_word: '\n', is_newline: true });
        i++;
        continue;
      }

      // 2. Whitespace (spaces and tabs)
      if (char === ' ' || char === '\t') {
        let ws = '';
        while (i < len && (content[i] === ' ' || content[i] === '\t')) {
          ws += content[i];
          i++;
        }
        tokens.push({ source_word: ws, is_space: true });
        continue;
      }

      // 3. Punctuation
      if (/[.,/;':"<>?!@#$%^&*()_+\-=\[\]{}|\\`~«»„“”—–…¡¿]/i.test(char)) {
        tokens.push({ source_word: char, is_punct: true });
        i++;
        continue;
      }

      // 4. Word Token
      let wordStr = '';
      while (
        i < len &&
        !/[\s\n\r.,/;':"<>?!@#$%^&*()_+\-=\[\]{}|\\`~«»„“”—–…¡¿]/.test(content[i])
      ) {
        wordStr += content[i];
        i++;
      }

      if (wordStr) {
        let pron = '';
        if (isKorean) pron = transliterateKorean(wordStr);
        else if (isArabic) pron = transliterateArabic(wordStr);
        else if (isHebrew) pron = transliterateHebrew(wordStr);

        tokens.push({
          source_word: wordStr,
          translated_word: fullTranslation ? '(See full text)' : '',
          pronunciation: pron
        });
      }
    }
    words = tokens;
  }

  // 3. Apply Custom Vocabulary Overrides
  if (Object.keys(customMap).length > 0) {
    words = words.map(w => {
      const override = customMap[w.source_word] || customMap[w.source_word.toLowerCase()];
      if (override) {
        return {
          source_word: w.source_word,
          translated_word: override.translated_word || w.translated_word,
          pronunciation: override.pronunciation || w.pronunciation
        };
      }
      return w;
    });
  }

  return {
    full_translation: fullTranslation,
    words
  };
}

module.exports = {
  translateAndMap
};

