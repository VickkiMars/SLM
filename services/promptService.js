const fs = require('fs');
const path = require('path');

const PROMPT_FILE_PATH = path.join(process.cwd(), 'data', 'prompt.txt');

/**
 * Load base prompt rules from file or fallback default
 */
function getSystemPrompt() {
  if (fs.existsSync(PROMPT_FILE_PATH)) {
    try {
      const content = fs.readFileSync(PROMPT_FILE_PATH, 'utf8');
      if (content && content.trim()) return content.trim();
    } catch (err) {
      console.warn('[promptService] Error reading prompt.txt:', err.message);
    }
  }

  return `You are a professional multilingual translation engine and linguistic mapper.
Your task is to translate the source text into the target language and provide a token-by-token character/word breakdown.

STRICT OUTPUT RULES:
1. Respond ONLY with a valid JSON object matching the requested schema.
2. Do NOT wrap the JSON in markdown code blocks (\`\`\`json).
3. No preamble, no postscript, no explanations outside the JSON object.
4. Tokenize the input text while preserving spaces, newlines, and punctuation tokens as individual word objects.
5. Do NOT generate pronunciation or translation for spaces, newlines, or punctuation tokens (set translated_word and pronunciation to empty string "").

OUTPUT SCHEMA:
{
  "source_language": "string (detected or requested original language)",
  "target_language": "string (target language)",
  "full_translation": "string (complete, fluent translation of the whole text)",
  "words": [
    {
      "source_word": "string (exact token/word from source text)",
      "translated_word": "string (meaning in target language; empty string \"\" for space/newline/punctuation)",
      "pronunciation": "string (IPA phonetics for words only; empty string \"\" for space/newline/punctuation)"
    }
  ]
}`;
}

/**
 * Build messages array for OpenAI chat completions API
 */
function buildTranslationMessages({ content, original_language = 'Auto', target_language = 'English', custom_vocab = '' }) {
  const systemPrompt = getSystemPrompt();

  let userInstruction = `Translate the following text from ${original_language} to ${target_language}.\n`;
  userInstruction += `Provide the complete translation and token breakdown.\n`;

  if (custom_vocab && typeof custom_vocab === 'string' && custom_vocab.trim()) {
    userInstruction += `\nCUSTOM VOCABULARY OVERRIDES (Apply these exact definitions for matching terms):\n${custom_vocab.trim()}\n`;
  }

  userInstruction += `\nSOURCE TEXT TO TRANSLATE:\n"""\n${content}\n"""`;

  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userInstruction }
  ];
}

module.exports = {
  getSystemPrompt,
  buildTranslationMessages
};
