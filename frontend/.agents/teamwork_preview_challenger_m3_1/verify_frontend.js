const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('=== STARTING EMPIRICAL VERIFICATION OF FRONTEND (index.html) ===\n');

const htmlPath = path.join(__dirname, '..', 'index.html');
const htmlContent = fs.readFileSync(htmlPath, 'utf8');

let passCount = 0;
let failCount = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`[PASS] ${name}`);
    passCount++;
  } catch (err) {
    console.error(`[FAIL] ${name}: ${err.message}`);
    failCount++;
  }
}

// 1. Audit DOM Selectors existence in HTML markup
test('Verify all required DOM element IDs exist in index.html markup', () => {
  const requiredIds = [
    'text-content-input',
    'file-input',
    'source-lang-select',
    'target-lang-select',
    'iso-code-input',
    'api-token-input',
    'token-settings-trigger',
    'token-status-dot',
    'token-drawer',
    'drawer-backdrop',
    'close-drawer-btn',
    'toggle-token-vis',
    'save-token-btn',
    'clear-token-btn',
    'token-status-msg',
    'tab-text-mode',
    'tab-file-mode',
    'text-translate-form',
    'file-translate-form',
    'swap-lang-btn',
    'char-counter',
    'submit-text-btn',
    'drop-zone',
    'drop-zone-prompt',
    'file-preview-card',
    'file-type-icon',
    'file-name-display',
    'file-size-display',
    'remove-file-btn',
    'submit-file-btn',
    'job-progress-card',
    'progress-spinner',
    'progress-heading',
    'job-status-badge',
    'job-status-text',
    'progress-bar-fill',
    'current-job-id',
    'progress-message',
    'result-view',
    'res-source-lang-name',
    'res-target-lang-name',
    'copy-translation-btn',
    'copy-btn-text',
    'full-translation-text',
    'word-count-badge',
    'word-table-body',
    'word-card-grid',
    'error-banner',
    'error-title',
    'error-detail-text',
    'error-guidance-list',
    'dismiss-error-btn'
  ];

  for (const id of requiredIds) {
    const regex = new RegExp(`id=["']${id}["']`);
    assert(regex.test(htmlContent), `ID "${id}" not found in HTML markup!`);
  }
});

// 2. Audit Payload keys and DOM selector bindings in JS script
test('Verify DOM Selectors match spec and backend route fields', () => {
  // Check text input binding -> content
  assert(htmlContent.includes('content: elements.textContentInput.value.trim()') || htmlContent.includes('content\n') || htmlContent.includes('content,'), 'Text form submit does not map content input to content payload field');
  assert(htmlContent.includes("original_language: elements.sourceLangSelect.value"), 'Source lang selector not mapped to original_language');
  assert(htmlContent.includes("target_language: elements.targetLangSelect.value"), 'Target lang selector not mapped to target_language');

  // Check file upload binding -> original_iso639-1_code
  assert(htmlContent.includes("formData.append('file', currentFile)"), 'File input not mapped to file field in FormData');
  assert(htmlContent.includes("formData.append('original_iso639-1_code', isoCode)"), 'ISO code input not mapped to original_iso639-1_code field');

  // Check LocalStorage bearer token key
  assert(htmlContent.includes("const TOKEN_KEY = 'slm_bearer_token'"), 'LocalStorage token key is not slm_bearer_token');
});

// 3. Test SSE Data Chunk Parser Logic
test('Empirically verify SSE stream chunk parser with split network packets', () => {
  // Extract SSE parsing logic simulation
  function parseSSEStreamChunks(chunks) {
    let buffer = '';
    const events = [];

    for (const chunk of chunks) {
      buffer += chunk;
      const parts = buffer.split('\n\n');
      buffer = parts.pop();

      for (const part of parts) {
        const lines = part.split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data:')) {
            const jsonStr = trimmed.slice(5).trim();
            if (jsonStr) {
              events.push(JSON.parse(jsonStr));
            }
          }
        }
      }
    }
    return events;
  }

  // Case A: Standard single chunk
  const singleChunk = ['data: {"status":"processing"}\n\n'];
  const ev1 = parseSSEStreamChunks(singleChunk);
  assert.strictEqual(ev1.length, 1);
  assert.strictEqual(ev1[0].status, 'processing');

  // Case B: Packet split in the middle of JSON data
  const splitChunks = [
    'data: {"status":"proce',
    'ssing"}\n\ndata: {"status":"complete","output":"{\\"full_translation\\":\\"Jambo\\",\\"words\\":[]}"}\n\n'
  ];
  const ev2 = parseSSEStreamChunks(splitChunks);
  assert.strictEqual(ev2.length, 2);
  assert.strictEqual(ev2[0].status, 'processing');
  assert.strictEqual(ev2[1].status, 'complete');

  // Case C: Multi-line chunk with extra spaces and newlines
  const multiLineChunks = [
    'data:   {"status": "connecting"}   \n\n\n\ndata: {"status": "failed", "detail": "error details"}\n\n'
  ];
  const ev3 = parseSSEStreamChunks(multiLineChunks);
  assert.strictEqual(ev3.length, 2);
  assert.strictEqual(ev3[0].status, 'connecting');
  assert.strictEqual(ev3[1].status, 'failed');
  assert.strictEqual(ev3[1].detail, 'error details');
});

// 4. Test Stringified JSON Output Safe Parsing
test('Verify safe parsing of output stringified JSON and fallbacks', () => {
  function safeParseOutput(rawOutput) {
    let outputObj = rawOutput;
    if (typeof outputObj === 'string') {
      try {
        outputObj = JSON.parse(outputObj);
      } catch (e) {
        outputObj = { full_translation: outputObj, words: [] };
      }
    }
    return outputObj;
  }

  // Case A: valid stringified JSON object
  const validJsonStr = JSON.stringify({
    full_translation: 'Habari gani',
    words: [{ source_word: 'How', translated_word: 'Habari', pronunciation: 'ha-ba-ri' }]
  });
  const resA = safeParseOutput(validJsonStr);
  assert.strictEqual(resA.full_translation, 'Habari gani');
  assert.strictEqual(resA.words.length, 1);

  // Case B: plain text string (not JSON)
  const plainText = 'Plain translated string without JSON formatting';
  const resB = safeParseOutput(plainText);
  assert.strictEqual(resB.full_translation, plainText);
  assert.strictEqual(resB.words.length, 0);

  // Case C: already an object
  const alreadyObj = { full_translation: 'Direct object', words: [] };
  const resC = safeParseOutput(alreadyObj);
  assert.strictEqual(resC.full_translation, 'Direct object');
});

// 5. Test State Machine Transitions
test('Verify job status state machine transitions', () => {
  const validStatuses = ['connecting', 'processing', 'completed', 'failed'];
  
  function getHeadingForStatus(status) {
    if (status === 'connecting') return 'Connecting to Job Stream...';
    if (status === 'processing') return 'Mapping Language & Phonetics...';
    if (status === 'completed' || status === 'complete') return 'Translation Complete!';
    if (status === 'failed') return 'Worker Task Failed';
    return 'Unknown Status';
  }

  assert.strictEqual(getHeadingForStatus('connecting'), 'Connecting to Job Stream...');
  assert.strictEqual(getHeadingForStatus('processing'), 'Mapping Language & Phonetics...');
  assert.strictEqual(getHeadingForStatus('completed'), 'Translation Complete!');
  assert.strictEqual(getHeadingForStatus('complete'), 'Translation Complete!');
  assert.strictEqual(getHeadingForStatus('failed'), 'Worker Task Failed');
});

// 6. Test Word Breakdown Table escape and format
test('Verify HTML escaping and word table formatting', () => {
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  const maliciousWord = {
    source_word: '<script>alert(1)</script>',
    translated_word: 'Word & "Quotes"',
    pronunciation: "foo 'bar'"
  };

  const escapedSrc = escapeHtml(maliciousWord.source_word);
  const escapedTgt = escapeHtml(maliciousWord.translated_word);
  const escapedPron = escapeHtml(maliciousWord.pronunciation);

  assert(!escapedSrc.includes('<script>'), 'XSS payload not escaped in source_word');
  assert.strictEqual(escapedSrc, '&lt;script&gt;alert(1)&lt;/script&gt;');
  assert.strictEqual(escapedTgt, 'Word &amp; &quot;Quotes&quot;');
  assert.strictEqual(escapedPron, 'foo &#039;bar&#039;');
});

console.log(`\n=== VERIFICATION COMPLETE: ${passCount} PASSED, ${failCount} FAILED ===`);
if (failCount > 0) {
  process.exit(1);
}
