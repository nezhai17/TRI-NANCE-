import { describe, it, expect } from 'vitest';
import { verifyEvidenceAgainstSource } from '../lib/intelligence/evidence-verifier';

describe('Evidence Intelligence Verifier', () => {
  const document = `Apex Global Corp Q3 Financial Statement.
Revenue reached $50M.
Operating cash flow deficit was recorded at $12M due to unprecedented material shortages.
The audit committee found internal control weaknesses in inventory valuation.`;

  it('accurately locates exact evidence with correct line numbers and character offsets', () => {
    const excerpt = 'Operating cash flow deficit was recorded at $12M due to unprecedented material shortages.';
    const result = verifyEvidenceAgainstSource(excerpt, document);

    expect(result.isVerified).toBe(true);
    expect(result.matchType).toBe('exact');
    expect(result.line).toBe(3);
    expect(result.startOffset).toBeDefined();
    expect(result.snippetWithContext).toContain('[EVIDENCE]');
  });

  it('matches normalized excerpts when whitespace varies', () => {
    const excerpt = 'The  audit  committee   found   internal   control weaknesses';
    const result = verifyEvidenceAgainstSource(excerpt, document);

    expect(result.isVerified).toBe(true);
    expect(result.matchType).toBe('normalized');
  });

  it('flags ungrounded or fabricated excerpts as unverified', () => {
    const excerpt = 'The CEO fled the country with company treasury funds.';
    const result = verifyEvidenceAgainstSource(excerpt, document);

    expect(result.isVerified).toBe(false);
    expect(result.matchType).toBe('unverified');
  });
});
