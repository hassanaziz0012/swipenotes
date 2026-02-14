export function truncateToWords(text: string, maxWords: number): string {
  // Match words while preserving the original text structure (for markdown)
  const wordRegex = /\S+/g;
  let match;
  let wordCount = 0;
  let lastIndex = 0;
  
  while ((match = wordRegex.exec(text)) !== null) {
    wordCount++;
    if (wordCount === maxWords) {
      lastIndex = match.index + match[0].length;
      break;
    }
  }
  
  // If we have fewer words than maxWords, return the original text
  if (wordCount < maxWords) {
    return text;
  }
  
  // Check if there are more words after our cutoff
  if (wordRegex.exec(text) !== null) {
    return text.slice(0, lastIndex) + '...';
  }
  
  return text;
}

export function truncatePreview(text: string, maxLength: number = 120): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + '…';
}
