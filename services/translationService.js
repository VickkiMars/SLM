const { OpenAI } = require('openai');
const promptService = require('./promptService');
const japaneseMapper = require('./japaneseMapper');
const chineseMapper = require('./chineseMapper');
const { transliterateKorean, transliterateArabic, transliterateHebrew } = require('./transliterationHelper');

// Language ISO codes helper
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

/**
 * Initialize OpenAI Client dynamically based on environment variables
 */
function getOpenAIClient() {
  const apiKey = (process.env.OPENAI_API_KEY || process.env.FIKRA_API_KEY || process.env.FIKRA_APIKEY || '').trim();
  if (!apiKey || apiKey === 'placeholder') {
    return null;
  }

  const options = { apiKey, maxRetries: 1 };
  const baseURL = (process.env.OPENAI_BASE_URL || process.env.FIKRA_BASE_URL || '').trim();
  if (baseURL) {
    options.baseURL = baseURL;
  }

  return new OpenAI(options);
}

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

/**
 * Primary OpenAI Translation Engine with Structured Output Schema
 */
async function translateWithOpenAI({ content, original_language = 'Auto', target_language = 'English', custom_vocab }) {
  console.log('[SLM STEP 2/4] Initializing OpenAI translation engine...');
  const openai = getOpenAIClient();
  if (!openai) {
    console.warn('[SLM STEP 2/4] No valid OPENAI_API_KEY found in environment. Falling back to local tokenization mapper.');
    return null;
  }

  const model = (process.env.OPENAI_MODEL_NAME || process.env.OPENAI_MODEL || 'gpt-4o-mini').trim();
  console.log(`[SLM STEP 2/4] Selected LLM Model: "${model}"`);

  const messages = promptService.buildTranslationMessages({
    content,
    original_language,
    target_language,
    custom_vocab
  });

  const startTime = Date.now();
  console.log(`[SLM STEP 2/4] Sending completion request to OpenAI API (${model})...`);

  try {
    const completion = await openai.chat.completions.create({
      model,
      messages,
      response_format: { type: 'json_object' }
    });

    const duration = Date.now() - startTime;
    console.log(`[SLM STEP 2/4] Received OpenAI response in ${duration}ms`);

    const rawResponse = completion.choices[0]?.message?.content || '';
    if (!rawResponse) {
      throw new Error('OpenAI returned empty completion content.');
    }

    const parsed = JSON.parse(rawResponse);
    console.log(`[SLM STEP 2/4] OpenAI output parsed successfully (${parsed.words?.length || 0} tokens received)`);
    return {
      full_translation: parsed.full_translation || '',
      words: Array.isArray(parsed.words) ? parsed.words : []
    };
  } catch (err) {
    console.error('[SLM STEP 2/4] OpenAI Translation Error:', err.message);
    return null;
  }
}

/**
 * Fallback Local Mapper when OpenAI key is absent or API is unreachable
 */
async function fallbackLocalMapper({ content, original_language = 'Auto', target_language = 'English' }) {
  console.log(`[SLM Fallback] Running local offline tokenizer mapper for "${original_language}"`);
  const targetCode = getIsoCode(target_language, 'en');

  const containsJapaneseKana = (text) => /[\u3040-\u309f\u30a0-\u30ff]/.test(text);
  const containsChineseChars = (text) => /[\u4e00-\u9fa5]/.test(text);
  const containsKoreanHangul = (text) => /[\uac00-\ud7af]/.test(text);
  const containsArabicScript = (text) => /[\u0600-\u06FF]/.test(text);
  const containsHebrewScript = (text) => /[\u0590-\u05FF]/.test(text);

  const isJapanese = original_language === 'Japanese' || containsJapaneseKana(content);
  const isChinese = !isJapanese && (original_language === 'Chinese' || original_language === 'Mandarin' || containsChineseChars(content));
  const isKorean = original_language === 'Korean' || containsKoreanHangul(content);
  const isArabic = original_language === 'Arabic' || containsArabicScript(content);
  const isHebrew = original_language === 'Hebrew' || containsHebrewScript(content);

  let words = [];
  let fullTranslation = `[Offline mode] Translation of "${content.slice(0, 30)}..."`;

  if (isJapanese) {
    try {
      words = await japaneseMapper.mapJapaneseText(content, async (w) => w);
    } catch {
      words = [];
    }
  } else if (isChinese) {
    try {
      words = await chineseMapper.mapChineseText(content);
    } catch {
      words = [];
    }
  } else {
    const tokens = [];
    let i = 0;
    const len = content.length;

    while (i < len) {
      const char = content[i];

      if (char === '\n' || char === '\r') {
        if (char === '\r' && content[i + 1] === '\n') i++;
        tokens.push({ source_word: '\n', is_newline: true });
        i++;
        continue;
      }

      if (char === ' ' || char === '\t') {
        let ws = '';
        while (i < len && (content[i] === ' ' || content[i] === '\t')) {
          ws += content[i];
          i++;
        }
        tokens.push({ source_word: ws, is_space: true });
        continue;
      }

      if (/[.,/;':"<>?!@#$%^&*()_+\-=\[\]{}|\\`~«»„“”—–…¡¿]/i.test(char)) {
        tokens.push({ source_word: char, is_punct: true });
        i++;
        continue;
      }

      let wordStr = '';
      while (i < len && !/[\s\n\r.,/;':"<>?!@#$%^&*()_+\-=\[\]{}|\\`~«»„“”—–…¡¿]/.test(content[i])) {
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
          translated_word: wordStr,
          pronunciation: pron
        });
      }
    }
    words = tokens;
  }

  console.log(`[SLM Fallback] Local tokenizer generated ${words.length} tokens.`);
  return {
    full_translation: fullTranslation,
    words
  };
}

const PUNCT_CHAR_REGEX = /^[.,/;':"<>?!@#$%^&*()_+\-=\[\]{}|\\`~«»„“”—–…¡¿\u2000-\u206F\u3000-\u303F]+$/;

/**
 * Programmatically determine token flags (is_space, is_newline, is_punct)
 * eliminating the need for AI to output these 3 booleans.
 */
function enrichWordFlags(w) {
  if (!w || typeof w !== 'object') return w;
  const src = typeof w.source_word === 'string' ? w.source_word : '';

  const is_newline = src.includes('\n') || src.includes('\r');
  const is_space = !is_newline && /^\s+$/.test(src);
  const is_punct = !is_newline && !is_space && (
    PUNCT_CHAR_REGEX.test(src) ||
    (!/\p{L}|\p{N}/u.test(src) && src.trim().length > 0)
  );

  return {
    source_word: src,
    translated_word: w.translated_word || '',
    pronunciation: w.pronunciation || '',
    is_space: Boolean(is_space),
    is_newline: Boolean(is_newline),
    is_punct: Boolean(is_punct)
  };
}

/**
 * Main Translation Orchestrator using OpenAI with Local Fallback
 */
async function translateAndMap({ content, original_language = 'Auto', target_language = 'English', custom_vocab }) {
  const startTime = Date.now();
  console.log('\n=================== [SLM TRANSLATION START] ===================');
  console.log('[SLM STEP 1/4] Input Request Details:');
  console.log(`  - Content Length: ${content?.length || 0} characters`);
  console.log(`  - Original Language: ${original_language}`);
  console.log(`  - Target Language: ${target_language}`);
  console.log(`  - Custom Vocab Present: ${Boolean(custom_vocab && custom_vocab.trim())}`);
  console.log(`  - Sample Text: "${content?.slice(0, 60).replace(/\n/g, ' ')}..."`);

  if (!content || !content.trim()) {
    console.error('[SLM ERROR] Content is required for translation.');
    throw new Error('Content is required for translation.');
  }

  const customMap = parseCustomVocab(custom_vocab);
  if (Object.keys(customMap).length > 0) {
    console.log(`[SLM STEP 1/4] Parsed ${Object.keys(customMap).length} custom vocabulary rules.`);
  }

  // 1. Attempt OpenAI Structured Translation Engine
  let result = await translateWithOpenAI({ content, original_language, target_language, custom_vocab });

  // 2. Fallback to local tokenization mapper if OpenAI API fails or is unconfigured
  if (!result) {
    console.log('[SLM STEP 2/4] OpenAI unavailable or failed — using local script tokenizers.');
    result = await fallbackLocalMapper({ content, original_language, target_language });
  }

  // 3. Post-process Custom Vocabulary Overrides
  if (Object.keys(customMap).length > 0 && Array.isArray(result.words)) {
    let overrideCount = 0;
    result.words = result.words.map(w => {
      if (!w.source_word) return w;
      const override = customMap[w.source_word] || customMap[w.source_word.toLowerCase()];
      if (override) {
        overrideCount++;
        return {
          ...w,
          translated_word: override.translated_word || w.translated_word,
          pronunciation: override.pronunciation || w.pronunciation
        };
      }
      return w;
    });
    console.log(`[SLM STEP 3/4] Applied custom vocabulary overrides to ${overrideCount} tokens.`);
  }

  // 4. Programmatically compute token flags (is_space, is_newline, is_punct)
  if (Array.isArray(result.words)) {
    result.words = result.words.map(enrichWordFlags);
    console.log(`[SLM STEP 4/4] Programmatically enriched flags (is_space/is_newline/is_punct) for ${result.words.length} tokens.`);
  }

  const totalDuration = Date.now() - startTime;
  console.log(`[SLM TRANSLATION COMPLETE] Finished in ${totalDuration}ms`);
  console.log(`  - Full Translation: "${result.full_translation?.slice(0, 80).replace(/\n/g, ' ')}..."`);
  console.log(`  - Total Tokens Returned: ${result.words?.length || 0}`);
  console.log('=================== [SLM TRANSLATION END] ===================\n');

  return result;
}

module.exports = {
  translateAndMap,
  getOpenAIClient
};
