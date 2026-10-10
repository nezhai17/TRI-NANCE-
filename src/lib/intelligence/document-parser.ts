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
  const words = clean.split(/\s+/).filter(Boolean);
  return {
    text: clean,
    wordCount: words.length,
    charCount: clean.length,
    fileType,
    metadata,
  };
}
