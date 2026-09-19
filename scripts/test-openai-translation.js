const translationService = require('../services/translationService');
const promptService = require('../services/promptService');
const assert = require('assert');

async function runTests() {
  console.log('--- STARTING OPENAI TRANSLATION ENGINE & PROMPT TESTS ---');

  // 1. Verify System Prompt generation
  console.log('1. Testing Prompt Construction...');
  const messages = promptService.buildTranslationMessages({
    content: 'Bonjour le monde',
    original_language: 'French',
    target_language: 'English',
    custom_vocab: 'Bonjour::Hello::bon-zhoor'
  });

  assert(Array.isArray(messages) && messages.length === 2, 'Messages array should contain system and user prompt');
  assert(messages[1].content.includes('CUSTOM VOCABULARY OVERRIDES'), 'User prompt should include custom vocabulary');
  console.log('✓ Prompt constructed successfully.');

  // 2. Test Translation Driver (Fallback or Live API)
  console.log('2. Testing Translation Orchestration...');
  const result = await translationService.translateAndMap({
    content: 'Bonjour le monde',
    original_language: 'French',
    target_language: 'English',
    custom_vocab: 'Bonjour::Hello::bon-zhoor'
  });

  assert(result && typeof result === 'object', 'Translation result should be an object');
  assert(result.full_translation, 'Result should contain full_translation');
  assert(Array.isArray(result.words), 'Result should contain words array');
  console.log('✓ Translation returned output structure:');
  console.log('  Full Translation:', result.full_translation);
  console.log('  Words Token Count:', result.words.length);

  console.log('\n✅ ALL TRANSLATION ENGINE TESTS PASSED SUCCESSFULLY!');
}

runTests().catch(err => {
  console.error('❌ TRANSLATION TEST FAILED:', err);
  process.exit(1);
});
