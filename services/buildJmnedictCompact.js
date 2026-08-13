const fs = require('fs');
const path = require('path');

const srcPath = path.join('/home/kami/Desktop/codebase/slm/data/jmnedict-all-3.6.2+20260803141815.json/jmnedict-all-3.6.2.json');
const destMainPath = path.join('/home/kami/Desktop/codebase/slm/data/jmnedict_compact.json');
const destAbbrevPath = path.join('/home/kami/Desktop/codebase/slm/data/jmnedict_abbreviations.json');

// Check if a key is an abbreviation / acronym / Latin-digit name
function isAbbreviationKey(key) {
  if (!key) return false;
  // Matches half-width & full-width Latin letters (a-z, A-Z, ａ-ｚ, Ａ-Ｚ) and numbers (0-9, ０-９)
  return /[a-zA-Z0-9\uFF21-\uFF3A\uFF41-\uFF5A\uFF10-\uFF19]/.test(key);
}

async function buildCompactJmnedict() {
  console.log('--- Compacting & Separating JMnedict Database ---');
  console.log('Source file:', srcPath);

  if (!fs.existsSync(srcPath)) {
    throw new Error(`Source file not found: ${srcPath}`);
  }

  const startTime = Date.now();

  console.log('Reading source JSON...');
  const rawData = fs.readFileSync(srcPath, 'utf8');
  const parsed = JSON.parse(rawData);

  const words = parsed.words || [];
  console.log(`Processing ${words.length} total proper name entries...`);

  const mainMap = {};
  const abbrevMap = {};

  for (const item of words) {
    const kanjiText = item.kanji?.[0]?.text;
    const kanaText = item.kana?.[0]?.text;
    const primaryKey = kanjiText || kanaText;

    if (!primaryKey) continue;

    const reading = kanaText || kanjiText;

    const defs = [];
    const types = [];

    if (Array.isArray(item.translation)) {
      for (const t of item.translation) {
        if (Array.isArray(t.type)) types.push(...t.type);
        if (Array.isArray(t.translation)) {
          for (const tr of t.translation) {
            if (tr.text) defs.push(tr.text);
          }
        }
      }
    }

    const uniqueTypes = [...new Set(types)].join(',');
    const uniqueDefs = [...new Set(defs)].join('; ');
    const tuple = [reading, uniqueDefs, uniqueTypes];

    // Determine target map
    if (isAbbreviationKey(primaryKey)) {
      abbrevMap[primaryKey] = tuple;
    } else {
      mainMap[primaryKey] = tuple;
    }

    // Secondary indexing if kanjiText & kanaText differ
    if (kanjiText && kanaText) {
      if (isAbbreviationKey(kanjiText)) {
        if (!abbrevMap[kanjiText]) abbrevMap[kanjiText] = tuple;
      } else {
        if (!mainMap[kanjiText]) mainMap[kanjiText] = tuple;
      }
    }
  }

  console.log(`Main Japanese Words Keys  : ${Object.keys(mainMap).length}`);
  console.log(`Abbreviations & Latin Keys: ${Object.keys(abbrevMap).length}`);

  console.log('Writing main words to:', destMainPath);
  fs.writeFileSync(destMainPath, JSON.stringify(mainMap), 'utf8');

  console.log('Writing abbreviations to:', destAbbrevPath);
  fs.writeFileSync(destAbbrevPath, JSON.stringify(abbrevMap), 'utf8');

  const mainStat = fs.statSync(destMainPath);
  const abbrevStat = fs.statSync(destAbbrevPath);
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log('\n=== SEPARATION COMPLETED ===');
  console.log(`Main Words File (jmnedict_compact.json)      : ${(mainStat.size / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Abbreviations File (jmnedict_abbreviations.json): ${(abbrevStat.size / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Total Duration                                 : ${duration} seconds`);
}

buildCompactJmnedict().catch(err => {
  console.error('Build Error:', err);
  process.exit(1);
});
