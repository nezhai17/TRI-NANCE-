export interface EvidenceVerificationResult {
  isVerified: boolean;
  matchType: 'exact' | 'normalized' | 'unverified';
  startOffset?: number;
  endOffset?: number;
  line?: number;
  paragraph?: number;
  snippetWithContext: string;
}

export function normalizeTextForSearch(str: string): string {
  return str
    .toLowerCase()
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Verifies that a quoted finding or excerpt actually exists inside the source document.
 * Returns exact location, line, paragraph, and surrounding context.
 * Marks approximate/normalized if whitespace or punctuation was altered.
 */
export function verifyEvidenceAgainstSource(
  excerpt: string,
  sourceText: string
): EvidenceVerificationResult {
  if (!excerpt || !sourceText) {
    return {
      isVerified: false,
      matchType: 'unverified',
      snippetWithContext: excerpt || '',
    };
  }

  const cleanExcerpt = excerpt.trim();

  // 1. Try Exact match
  const exactIdx = sourceText.indexOf(cleanExcerpt);
  if (exactIdx !== -1) {
    const startOffset = exactIdx;
    const endOffset = exactIdx + cleanExcerpt.length;

    // Calculate line and paragraph
    const textBefore = sourceText.substring(0, startOffset);
    const line = (textBefore.match(/\n/g) || []).length + 1;
    const paragraph = (textBefore.match(/\n\s*\n/g) || []).length + 1;

    // Surrounding context (up to 100 chars before and after)
    const contextStart = Math.max(0, startOffset - 100);
    const contextEnd = Math.min(sourceText.length, endOffset + 100);
    const contextBefore = (contextStart > 0 ? '...' : '') + sourceText.substring(contextStart, startOffset);
    const contextAfter = sourceText.substring(endOffset, contextEnd) + (contextEnd < sourceText.length ? '...' : '');

    return {
      isVerified: true,
      matchType: 'exact',
      startOffset,
      endOffset,
      line,
      paragraph,
      snippetWithContext: `${contextBefore}[EVIDENCE]${cleanExcerpt}[/EVIDENCE]${contextAfter}`,
    };
  }

  // 2. Try normalized whitespace/punctuation match
  const normalizedSource = normalizeTextForSearch(sourceText);
  const normalizedExcerpt = normalizeTextForSearch(cleanExcerpt);

  if (normalizedExcerpt.length > 10 && normalizedSource.includes(normalizedExcerpt)) {
    // Find closest approximate index in original
    const words = cleanExcerpt.split(/\s+/).filter(w => w.length > 3);
    let bestStart = -1;
    if (words.length > 0) {
      const firstWord = words[0];
      const matchIdx = sourceText.toLowerCase().indexOf(firstWord.toLowerCase());
      if (matchIdx !== -1) bestStart = matchIdx;
    }

    const textBefore = bestStart !== -1 ? sourceText.substring(0, bestStart) : '';
    const line = bestStart !== -1 ? (textBefore.match(/\n/g) || []).length + 1 : 1;
    const paragraph = bestStart !== -1 ? (textBefore.match(/\n\s*\n/g) || []).length + 1 : 1;

    return {
      isVerified: true,
      matchType: 'normalized',
      startOffset: bestStart !== -1 ? bestStart : undefined,
      endOffset: bestStart !== -1 ? bestStart + cleanExcerpt.length : undefined,
      line,
      paragraph,
      snippetWithContext: cleanExcerpt,
    };
  }

  // 3. Fallback unverified (potential hallucination or altered text)
  return {
    isVerified: false,
    matchType: 'unverified',
    snippetWithContext: cleanExcerpt,
  };
}
