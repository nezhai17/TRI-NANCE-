import Papa from 'papaparse';

export interface ExtractedDocumentResult {
  text: string;
  wordCount: number;
  charCount: number;
  metadata?: Record<string, unknown>;
  fileType: 'pdf' | 'docx' | 'txt' | 'csv';
}

export async function parseDocumentBuffer(
  buffer: Buffer,
  filename: string,
  mimetype?: string
): Promise<ExtractedDocumentResult> {
  const extension = filename.split('.').pop()?.toLowerCase();

  if (extension === 'txt' || mimetype === 'text/plain') {
    const text = buffer.toString('utf-8');
    return sanitizeAndCount(text, 'txt');
  }

  if (extension === 'csv' || mimetype === 'text/csv') {
    const rawCsv = buffer.toString('utf-8');
    const parsed = Papa.parse<string[]>(rawCsv, {
      skipEmptyLines: true,
    });
    // Format rows into structured readable text lines
    const text = parsed.data.map((row) => row.join(' | ')).join('\n');
    return sanitizeAndCount(text, 'csv', { rowCount: parsed.data.length });
  }

  if (extension === 'docx' || mimetype?.includes('wordprocessingml')) {
    try {
      const mammoth = await import('mammoth');
      const result = await mammoth.extractRawText({ buffer });
      return sanitizeAndCount(result.value, 'docx', { messages: result.messages });
    } catch (err: unknown) {
      throw new Error(`Failed to parse DOCX document: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  if (extension === 'pdf' || mimetype === 'application/pdf') {
    try {
      // Dynamic import to avoid build-time issues
      const pdfParse = (await import('pdf-parse')).default;
      const pdfData = await pdfParse(buffer);
      return sanitizeAndCount(pdfData.text, 'pdf', {
        numPages: pdfData.numpages,
        info: pdfData.info,
      });
    } catch (err: unknown) {
      throw new Error(`Failed to parse PDF document: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  throw new Error(`Unsupported file format .${extension}. Supported formats are PDF, DOCX, TXT, and CSV.`);
}

function sanitizeAndCount(
  rawText: string,
  fileType: 'pdf' | 'docx' | 'txt' | 'csv',
  metadata?: Record<string, unknown>
): ExtractedDocumentResult {
  const clean = rawText.replace(/\r\n/g, '\n').trim();
  if (!clean || clean.length === 0) {
    throw new Error('The uploaded document contains no readable text content.');
  }
  const words = clean.split(/\s+/).filter(Boolean);
  return {
    text: clean,
    wordCount: words.length,
    charCount: clean.length,
    fileType,
    metadata,
  };
}

export interface DocumentSegment {
  index: number;
  sectionHeading?: string;
  startOffset: number;
  endOffset: number;
  text: string;
  wordCount: number;
}

/**
 * Segments long documents into structured sections and paragraphs with controlled overlap.
 * Preserves section headers, paragraph boundaries, and source offsets.
 */
export function segmentDocumentText(
  text: string,
  maxSegmentWords = 350,
  overlapWords = 50
): DocumentSegment[] {
  if (!text || text.trim().length === 0) return [];

  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  const segments: DocumentSegment[] = [];
  let currentSegmentText: string[] = [];
  let currentWordCount = 0;
  let currentSection = 'General Disclosures';
  let segmentIndex = 0;
  let offsetTracker = 0;

  paragraphs.forEach((p) => {
    // Check if paragraph is a section heading (e.g., Item 1A, Note 4, Management Discussion)
    const isHeading =
      /^(?:Item\s+[0-9]+[A-Z]?|Note\s+[0-9]+|Section\s+[0-9]+|Management['’]s\s+Discussion|Risk\s+Factors|Financial\s+Statements|Selected\s+Financial\s+Data|Report\s+of\s+Independent)/i.test(
        p
      ) || (p.length < 60 && p.toUpperCase() === p && !p.includes('.'));

    if (isHeading) {
      currentSection = p.slice(0, 80);
    }

    const pWords = p.split(/\s+/).filter(Boolean);

    if (currentWordCount + pWords.length > maxSegmentWords && currentSegmentText.length > 0) {
      // Finalize current segment
      const segmentStr = currentSegmentText.join('\n\n');
      const startOffset = text.indexOf(segmentStr, offsetTracker);
      const safeStart = startOffset !== -1 ? startOffset : offsetTracker;
      const safeEnd = safeStart + segmentStr.length;
      offsetTracker = safeStart;

      segments.push({
        index: segmentIndex++,
        sectionHeading: currentSection,
        startOffset: safeStart,
        endOffset: safeEnd,
        text: segmentStr,
        wordCount: currentWordCount,
      });

      // Retain controlled overlap
      const lastParagraph = currentSegmentText[currentSegmentText.length - 1];
      const overlapWordsList = lastParagraph.split(/\s+/).slice(-overlapWords);
      currentSegmentText = [overlapWordsList.join(' '), p];
      currentWordCount = overlapWordsList.length + pWords.length;
    } else {
      currentSegmentText.push(p);
      currentWordCount += pWords.length;
    }
  });

  if (currentSegmentText.length > 0) {
    const segmentStr = currentSegmentText.join('\n\n');
    const startOffset = text.indexOf(segmentStr, offsetTracker);
    const safeStart = startOffset !== -1 ? startOffset : offsetTracker;
    const safeEnd = safeStart + segmentStr.length;

    segments.push({
      index: segmentIndex++,
      sectionHeading: currentSection,
      startOffset: safeStart,
      endOffset: safeEnd,
      text: segmentStr,
      wordCount: currentWordCount,
    });
  }

  return segments;
}
