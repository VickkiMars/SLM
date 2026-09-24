const fs = require('fs');
const path = require('path');

const PROMPT_FILE_PATH = path.join(process.cwd(), 'data', 'prompt.txt');

/**
 * Load base system prompt enforcing strict line-by-line output format
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

  return `You are a professional multilingual transliterator and translation engine.
Your task is to analyze the source text word by word (or token by token) and output EACH word's romanization and English meaning.

STRICT OUTPUT RULES:
1. OUTPUT FORMAT: Output ONLY lines in the exact format:
   romanized_language | english meaning
2. DO NOT OUTPUT JSON. JSON IS STRICTLY FORBIDDEN.
3. DO NOT output markdown code blocks (no \`\`\` or \`\`\`text).
4. DO NOT output any preamble, postscript, intro, title, or explanations.
5. NO EXTRA TOKENS. Output ONLY the formatted pairs line by line.
6. Provide one line for each sequential word in the input text.

EXAMPLES BY LANGUAGE:
- Chinese: pinyin|english
  Example line: dào|the Word
- Japanese: Romaji|english
  Example line: sakura|cherry blossom
- Korean: Romaja|english
  Example line: annyeong|hello
- Languages without a non-Latin writing system (e.g., German, French, Spanish): german|english or french|english
  Example (German): hallo|hello
  Example (French): bonjour|hello`;
}

/**
 * Build messages array for OpenAI chat completions API
 */
function buildTranslationMessages({ content, original_language = 'Auto', target_language = 'English', custom_vocab = '' }) {
  const systemPrompt = getSystemPrompt();

  let userInstruction = `Analyze the following text (Source Language: ${original_language}, Target: ${target_language}).\n`;
  userInstruction += `Output each word's breakdown in the exact format: romanized_language | english meaning\n`;
  userInstruction += `Do NOT use JSON. No extra tokens. No markdown formatting.\n`;

  if (custom_vocab && typeof custom_vocab === 'string' && custom_vocab.trim()) {
    userInstruction += `\nCUSTOM VOCABULARY OVERRIDES (Apply these exact definitions for matching terms):\n${custom_vocab.trim()}\n`;
  }

  userInstruction += `\nSOURCE TEXT TO PROCESS:\n${content}`;

  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userInstruction }
  ];
}

module.exports = {
  getSystemPrompt,
  buildTranslationMessages
};

