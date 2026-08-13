let cedictInstance = null;

async function getCedict() {
  if (cedictInstance) return cedictInstance;
  try {
    const cedictModule = await import('cc-cedict');
    cedictInstance = cedictModule.default || cedictModule;
  } catch (err) {
    // Fallback import if ESM path needs direct dist resolve
    const cedictModule = await import('file://' + require.resolve('cc-cedict/dist/index.js'));
    cedictInstance = cedictModule.default || cedictModule;
  }
  return cedictInstance;
}

/**
 * Converts numbered Pinyin (e.g. "ming2 yue4") to Pinyin with tone marks ("míng yuè").
 */
function formatPinyin(pinyinStr) {
  if (!pinyinStr) return '';
  const toneMap = {
    a: ['a', 'ā', 'á', 'ǎ', 'à', 'a'],
    e: ['e', 'ē', 'é', 'ě', 'è', 'e'],
    i: ['i', 'ī', 'í', 'ǐ', 'ì', 'i'],
    o: ['o', 'ō', 'ó', 'ǒ', 'ò', 'o'],
    u: ['u', 'ū', 'ú', 'ǔ', 'ù', 'u'],
    v: ['ü', 'ǖ', 'ǘ', 'ǚ', 'ǜ', 'ü'],
    ü: ['ü', 'ǖ', 'ǘ', 'ǚ', 'ǜ', 'ü'],
    u8: ['ü', 'ǖ', 'ǘ', 'ǚ', 'ǜ', 'ü']
  };

  return pinyinStr.split(' ').map(syllable => {
    const match = syllable.match(/^([a-zuiüv8]+)([1-5])$/i);
    if (!match) return syllable;
    let [, base, toneNum] = match;
    const t = parseInt(toneNum, 10);
    if (t === 5) return base;

    if (base.includes('a')) base = base.replace('a', toneMap.a[t]);
    else if (base.includes('e')) base = base.replace('e', toneMap.e[t]);
    else if (base.includes('ou')) base = base.replace('o', toneMap.o[t]);
    else if (base.includes('o')) base = base.replace('o', toneMap.o[t]);
    else if (base.includes('i')) base = base.replace('i', toneMap.i[t]);
    else if (base.includes('u')) base = base.replace('u', toneMap.u[t]);
    else if (base.includes('v')) base = base.replace('v', toneMap.v[t]);
    else if (base.includes('ü')) base = base.replace('ü', toneMap.v[t]);
    return base;
  }).join(' ');
}

/**
 * Look up a single Chinese word or character in CC-CEDICT.
 */
async function lookupChineseWord(word) {
  const cedict = await getCedict();
  const res = cedict.getBySimplified(word) || cedict.getByTraditional(word);
  if (!res) return null;

  const pinyinKeys = Object.keys(res);
  if (!pinyinKeys.length) return null;

  const firstEntryList = res[pinyinKeys[0]];
  if (!firstEntryList || !firstEntryList.length) return null;

  const entry = firstEntryList[0];
  const englishDefs = Array.isArray(entry.english) ? entry.english.join('; ') : (entry.english || '');

  return {
    source_word: word,
    pronunciation: formatPinyin(entry.pinyin),
    translated_word: englishDefs
  };
}

/**
 * Segment Chinese text using longest-prefix-matching against CC-CEDICT.
 */
async function mapChineseText(text) {
  const cedict = await getCedict();
  const tokens = [];
  let i = 0;
  const maxWordLen = 4; // Maximum Chinese compound word length

  while (i < text.length) {
    const char = text[i];

    // Preserve linebreaks
    if (char === '\n' || char === '\r') {
      if (char === '\r' && text[i + 1] === '\n') i++;
      tokens.push({ source_word: '\n', is_newline: true });
      i++;
      continue;
    }

    // Preserve whitespace (spaces and tabs)
    if (char === ' ' || char === '\t') {
      let spaceStr = '';
      while (i < text.length && (text[i] === ' ' || text[i] === '\t')) {
        spaceStr += text[i];
        i++;
      }
      tokens.push({ source_word: spaceStr, is_space: true });
      continue;
    }

    // Preserve punctuation
    if (/[.,/;':"<>?!@#$%^&*()_+\-=\[\]{}|\\`~，。！？；：、“”（）《》【】…—～・]/i.test(char)) {
      tokens.push({ source_word: char, is_punct: true });
      i++;
      continue;
    }

    let matched = false;
    for (let len = Math.min(maxWordLen, text.length - i); len >= 1; len--) {
      const sub = text.substring(i, i + len);
      const res = cedict.getBySimplified(sub) || cedict.getByTraditional(sub);
      if (res) {
        const pinyinKeys = Object.keys(res);
        const entry = res[pinyinKeys[0]]?.[0];
        if (entry) {
          const englishDefs = Array.isArray(entry.english) ? entry.english[0] : (entry.english || '');
          tokens.push({
            source_word: sub,
            pronunciation: formatPinyin(entry.pinyin),
            translated_word: englishDefs
          });
          i += len;
          matched = true;
          break;
        }
      }
    }

    if (!matched) {
      tokens.push({
        source_word: char,
        pronunciation: '',
        translated_word: ''
      });
      i++;
    }
  }

  return tokens;
}

module.exports = {
  lookupChineseWord,
  mapChineseText,
  formatPinyin
};
