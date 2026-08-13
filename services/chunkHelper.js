/**
 * Chunk text into batches capped at maxChars (default: 500),
 * respecting natural linebreaks, sentence boundaries, or spaces when possible.
 */
function chunkContent(text, maxChars = 500) {
  if (!text || typeof text !== 'string') return [];
  const trimmed = text.trim();
  if (!trimmed) return [];
  if (trimmed.length <= maxChars) return [trimmed];

  const chunks = [];
  let remaining = trimmed;

  while (remaining.length > 0) {
    if (remaining.length <= maxChars) {
      chunks.push(remaining.trim());
      break;
    }

    let sliceEnd = maxChars;
    const candidate = remaining.slice(0, maxChars);

    const lastNewline = candidate.lastIndexOf('\n');
    const lastPeriod = Math.max(
      candidate.lastIndexOf('。'),
      candidate.lastIndexOf('！'),
      candidate.lastIndexOf('？'),
      candidate.lastIndexOf('. '),
      candidate.lastIndexOf('! '),
      candidate.lastIndexOf('? ')
    );
    const lastSpace = candidate.lastIndexOf(' ');

    if (lastNewline > 50) {
      sliceEnd = lastNewline + 1;
    } else if (lastPeriod > 50) {
      sliceEnd = lastPeriod + 1;
    } else if (lastSpace > 50) {
      sliceEnd = lastSpace + 1;
    }

    const chunkStr = remaining.slice(0, sliceEnd).trim();
    if (chunkStr) {
      chunks.push(chunkStr);
    }
    remaining = remaining.slice(sliceEnd);
  }

  return chunks;
}

module.exports = {
  chunkContent
};
