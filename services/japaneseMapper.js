const wanakana = require('wanakana');

const COMMON_JAPANESE_WORDS = {
  // Standalone Nouns, Adjectives & Verbs
  'ばか': { pron: 'baka', def: 'foolish / silly / idiot' },
  'みたい': { pron: 'mitai', def: 'like / seems like' },
  'めんどくさい': { pron: 'mendokusai', def: 'bother / hassle / tiresome' },
  'シラケた': { pron: 'shiraketa', def: 'bored / indifferent / unamused' },
  'しらけた': { pron: 'shiraketa', def: 'bored / indifferent / unamused' },
  'ふり': { pron: 'furi', def: 'pretense / pretending' },
  'して': { pron: 'shite', def: 'doing / by doing' },
  '小石': { pron: 'koishi', def: 'small pebble / stone' },
  '蹴った': { pron: 'ketta', def: 'kicked' },
  '蹴る': { pron: 'keru', def: 'to kick' },
  'みんな': { pron: 'minna', def: 'everyone / everybody' },
  '恥ずかしくて': { pron: 'hazukashikute', def: 'embarrassed / shy' },
  '恥ずかしい': { pron: 'hazukashii', def: 'embarrassed / shy' },
  '言え': { pron: 'ie', def: 'say / able to say' },
  'しな': { pron: 'shina', def: 'do / do not' },
  'しない': { pron: 'shinai', def: 'do not' },
  '言えない': { pron: 'ienai', def: 'cannot say' },
  'お守り': { pron: 'omamori', def: 'talisman / lucky charm' },
  '守り': { pron: 'mamori', def: 'protection / charm' },
  '言葉': { pron: 'kotoba', def: 'word / language / expression' },
  'あって': { pron: 'atte', def: 'there is / having' },
  'ある': { pron: 'aru', def: 'to exist / to have' },
  'できる': { pron: 'dekiru', def: 'can do / possible' },
  'だけ': { pron: 'dake', def: 'only / as much as' },
  'わかり': { pron: 'wakari', def: 'understanding' },
  'やすく': { pron: 'yasuku', def: 'easily / simply' },
  '返す': { pron: 'kaesu', def: 'to return / give back' },
  '胸': { pron: 'mune', def: 'chest / heart' },
  '奥': { pron: 'oku', def: 'depths / interior' },
  '燃える': { pron: 'moeru', def: 'burning / fiery' },
  '想い': { pron: 'omoi', def: 'feelings / thoughts / passion' },
  'どこ': { pron: 'doko', def: 'where' },
  '行こう': { pron: 'ikou', def: 'let us go' },
  '雲': { pron: 'kumo', def: 'cloud' },
  'ひとつ': { pron: 'hitotsu', def: 'one / single' },
  'ない': { pron: 'nai', def: 'not / none' },
  '久しぶり': { pron: 'hisashiburi', def: 'after a long time' },
  '天気': { pron: 'tenki', def: 'weather / fine day' },
  '泣かせた': { pron: 'nakaseta', def: 'made cry / hurt' },
  '誰か': { pron: 'dareka', def: 'someone / somebody' },
  '誰': { pron: 'dare', def: 'who' },
  'こと': { pron: 'koto', def: 'thing / matter' },
  '思い出した': { pron: 'omoidashita', def: 'remembered / recalled' },
  '思い出す': { pron: 'omoidasu', def: 'to remember' },
  '仕方': { pron: 'shikata', def: 'way / method' },
  '上': { pron: 'ue', def: 'up / above' },
  '向いて': { pron: 'muite', def: 'facing / turning toward' },
  '歩いて': { pron: 'aruite', def: 'walking' },
  'いこう': { pron: 'ikou', def: 'let us go' },
  '歩く': { pron: 'aruku', def: 'to walk' },
  '子猫': { pron: 'koneko', def: 'kitten' },
  '空': { pron: 'sora', def: 'sky' },
  '仰いだ': { pron: 'aoida', def: 'looked up at' },
  '仰ぐ': { pron: 'aogu', def: 'to look up' },
  '美味しい': { pron: 'oishii', def: 'delicious / tasty' },
  'もの': { pron: 'mono', def: 'thing / food' },
  '食べな': { pron: 'tabena', def: 'eat / eat up' },
  '食べる': { pron: 'taberu', def: 'to eat' },
  '限り': { pron: 'kagiri', def: 'limit / as much as' },
  '遊びな': { pron: 'asobina', def: 'play / enjoy yourself' },
  '遊ぶ': { pron: 'asobu', def: 'to play' },
  '恋': { pron: 'koi', def: 'love / romance' },
  '結いた': { pron: 'yuita', def: 'tied up' },
  '結う': { pron: 'yuu', def: 'to tie (hair)' },
  '髪': { pron: 'kami', def: 'hair' },
  '毛': { pron: 'ke', def: 'hair / strand' },
  '乱れる': { pron: 'midareru', def: 'disheveled / coming undone' },
  'まで': { pron: 'made', def: 'until' },
  'いけ': { pron: 'ike', def: 'go / keep going' },
  'あなた': { pron: 'anata', def: 'you' },
  '振り絞った': { pron: 'furishibotta', def: 'wrung out / summoned up' },
  '愛': { pron: 'ai', def: 'love' },
  'まま': { pron: 'mama', def: 'as it is / remaining' },

  // Particles & Functional Auxiliaries
  'は': { pron: 'wa', def: 'topic marker' },
  'が': { pron: 'ga', def: 'subject marker' },
  'を': { pron: 'wo', def: 'object marker' },
  'に': { pron: 'ni', def: 'at / to / in' },
  'で': { pron: 'de', def: 'at / in / by' },
  'へ': { pron: 'e', def: 'toward / to' },
  'の': { pron: 'no', def: 'of / \'s' },
  'と': { pron: 'to', def: 'and / with' },
  'も': { pron: 'mo', def: 'also / too' },
  'から': { pron: 'kara', def: 'from / since' },
  'か': { pron: 'ka', def: 'question marker' },
  'ね': { pron: 'ne', def: 'isn\'t it?' },
  'よ': { pron: 'yo', def: 'assertion marker' },
  'って': { pron: 'tte', def: 'quote marker / saying' },
  'なあ': { pron: 'naa', def: 'emphasis particle' },
  'な': { pron: 'na', def: 'particle / sentence ender' },
  'だ': { pron: 'da', def: 'is / am / are' },
  'けど': { pron: 'kedo', def: 'but / although' },
  'です': { pron: 'desu', def: 'is / am / are' },
  'ます': { pron: 'masu', def: 'do / does' },
  'そう': { pron: 'sou', def: 'so / like that' },
  'いう': { pron: 'iu', def: 'to say / such' },
  '私': { pron: 'watashi', def: 'I / me' },
  'わたし': { pron: 'watashi', def: 'I / me' },
  '僕': { pron: 'boku', def: 'I / me' },
  'ぼく': { pron: 'boku', def: 'I / me' },
  '俺': { pron: 'ore', def: 'I / me' },
  'おれ': { pron: 'ore', def: 'I / me' }
};

const isKanji = (ch) => /[\u4e00-\u9fa5]/.test(ch);
const isKana = (ch) => /[\u3040-\u309f\u30a0-\u30ff]/.test(ch);

/**
 * Segment Japanese text using longest-prefix-matching and Japanese character grouping,
 * returning Symbol | Romaji | English dictionary entries.
 */
async function mapJapaneseText(text, translateFn) {
  const tokens = [];
  let i = 0;
  const maxWordLen = 8;

  while (i < text.length) {
    const char = text[i];

    // Preserve linebreaks
    if (char === '\n' || char === '\r') {
      if (char === '\r' && text[i + 1] === '\n') i++;
      tokens.push({ source_word: '\n', is_newline: true });
      i++;
      continue;
    }

    // Preserve whitespace
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
    if (/[.,/;':"<>?!@#$%^&*()_+\-=\[\]{}|\\`~、。！？；：、「」（）《》【】…—～・]/i.test(char)) {
      tokens.push({ source_word: char, is_punct: true });
      i++;
      continue;
    }

    let matched = false;

    // 1. Check common vocabulary dictionary (longest prefix match)
    for (let len = Math.min(maxWordLen, text.length - i); len >= 1; len--) {
      const sub = text.substring(i, i + len);
      if (COMMON_JAPANESE_WORDS[sub]) {
        const item = COMMON_JAPANESE_WORDS[sub];
        tokens.push({
          source_word: sub,
          pronunciation: item.pron,
          translated_word: item.def
        });
        i += len;
        matched = true;
        break;
      }
    }

    // 2. Character-type boundary grouping for un-matched Japanese words (Kanji compound + Okurigana)
    if (!matched) {
      let wordStr = '';
      if (isKanji(char)) {
        // Group Kanji + attached Hiragana inflections
        while (i < text.length && (isKanji(text[i]) || (wordStr.length > 0 && isKana(text[i])))) {
          // Stop if next character starts a known standalone word or particle
          if (wordStr.length > 0 && COMMON_JAPANESE_WORDS[text[i]]) break;
          wordStr += text[i];
          i++;
        }
      } else if (isKana(char)) {
        // Group Kana phrase until punctuation/kanji/space
        while (
          i < text.length &&
          isKana(text[i]) &&
          !/[.,/;':"<>?!@#$%^&*()_+\-=\[\]{}|\\`~、。！？；：、「」（）《》【】…—～・\s\n\r]/.test(text[i])
        ) {
          const rem = text.substring(i);
          // Stop if remaining substring matches a known standalone word/particle
          let foundCommon = false;
          for (let l = Math.min(maxWordLen, rem.length); l >= 1; l--) {
            if (COMMON_JAPANESE_WORDS[rem.substring(0, l)]) {
              foundCommon = true;
              break;
            }
          }
          if (foundCommon && wordStr.length > 0) break;

          wordStr += text[i];
          i++;
        }
      } else {
        wordStr = char;
        i++;
      }

      if (wordStr) {
        const romaji = wanakana.toRomaji(wordStr);
        tokens.push({
          source_word: wordStr,
          pronunciation: romaji,
          translated_word: ''
        });
        matched = true;
      }
    }
  }

  // Translate missing Japanese word definitions in 1 single batch call
  if (typeof translateFn === 'function') {
    const missingTokens = tokens.filter(t => !t.is_newline && !t.is_space && !t.is_punct && !t.translated_word);
    if (missingTokens.length > 0) {
      try {
        const payload = missingTokens.map(t => t.source_word).join('\n');
        const batchRes = await translateFn(payload);
        if (batchRes && typeof batchRes === 'string') {
          const lines = batchRes.split(/\r?\n/);
          missingTokens.forEach((token, idx) => {
            const tr = lines[idx] ? lines[idx].trim() : '';
            if (tr && tr !== token.source_word) {
              token.translated_word = tr;
            }
          });
        }
      } catch (err) {
        console.warn('[japaneseMapper] Batch translate missing tokens warning:', err.message);
      }
    }
  }

  return tokens;
}

module.exports = {
  mapJapaneseText
};
