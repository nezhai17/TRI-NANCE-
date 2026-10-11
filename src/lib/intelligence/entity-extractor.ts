export interface ResolvedEntity {
  id: string;
  name: string;
  type: 'company' | 'subsidiary' | 'counterparty' | 'facility' | 'auditor';
  mentionsCount: number;
  excerpts: string[];
}

const COMMON_FINANCIAL_ENTITIES: Array<{
  name: string;
  type: ResolvedEntity['type'];
  aliases: RegExp[];
}> = [
  {
    name: 'Senior Credit Facility Syndicate',
    type: 'facility',
    aliases: [/\bsenior\s+credit\s+facility\b/i, /\brevolving\s+credit\s+facility\b/i, /\blenders?\b/i],
  },
  {
    name: 'Securities and Exchange Commission (SEC)',
    type: 'counterparty',
    aliases: [/\bsec\b/i, /\bsecurities\s+and\s+exchange\s+commission\b/i, /\bregulatory\s+authorities\b/i],
  },
  {
    name: 'Independent Audit Committee',
    type: 'auditor',
    aliases: [/\baudit\s+committee\b/i, /\bindependent\s+auditors?\b/i, /\bgoing[\s-]concern\b/i],
  },
  {
    name: 'Enterprise Cloud Customer Accounts',
    type: 'counterparty',
    aliases: [/\bkey\s+enterprise\s+accounts?\b/i, /\benterprise\s+clients?\b/i, /\benterprise\s+customers?\b/i],
  },
];

/**
 * Extracts and resolves entities referenced across financial filings.
 * Distinguishes facility counterparties, regulatory agencies, enterprise customers, and auditors.
 */
export function extractAndResolveEntities(text: string): ResolvedEntity[] {
  if (!text || text.trim().length === 0) return [];

  const entities: ResolvedEntity[] = [];

  COMMON_FINANCIAL_ENTITIES.forEach((entityDef, idx) => {
    const matchedExcerpts: string[] = [];

    entityDef.aliases.forEach((aliasRegex) => {
      const matches = text.match(new RegExp(`[^.!?\\n]*?${aliasRegex.source}[^.!?\\n]*?[.!?\\n]`, 'gi'));
      if (matches) {
        matches.forEach((m) => {
          const clean = m.trim();
          if (!matchedExcerpts.includes(clean)) {
            matchedExcerpts.push(clean);
          }
        });
      }
    });

    if (matchedExcerpts.length > 0) {
      entities.push({
        id: `entity-${idx + 1}`,
        name: entityDef.name,
        type: entityDef.type,
        mentionsCount: matchedExcerpts.length,
        excerpts: matchedExcerpts.slice(0, 5),
      });
    }
  });

  return entities;
}
