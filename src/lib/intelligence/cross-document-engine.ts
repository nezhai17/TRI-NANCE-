import { AnalysisRecord, CrossDocumentComparison, AnomalyFinding, RiskCategory } from '../types';

export function compareMultipleAnalyses(
  analyses: AnalysisRecord[],
  comparisonTitle?: string
): CrossDocumentComparison {
  if (!analyses || analyses.length < 2) {
    throw new Error('Cross-document investigation requires at least two comparative analysis dossiers.');
  }

  // Sort chronologically (oldest to newest) based on createdAt
  const sorted = [...analyses].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  const documentIds = sorted.map((a) => a.id);
  const documentTitles = sorted.map((a) => a.title);

  // 1. Sentiment Trajectory
  const sentimentTrajectory = sorted.map((a) => ({
    documentTitle: a.title,
    period: a.sourceCategory.replace(/_/g, ' '),
    overall: a.sentimentResult?.overall || 'neutral',
    score: a.sentimentResult?.score || 0,
  }));

  // 2. Recurring Risk Themes & Trajectory
  const categoryCounts: Record<
    string,
    { count: number; docs: Set<string>; docCounts: number[]; label: string }
  > = {};

  sorted.forEach((a, docIdx) => {
    const docCats = new Set<string>();
    (a.findings || []).forEach((f) => {
      if (!categoryCounts[f.category]) {
        categoryCounts[f.category] = {
          count: 0,
          docs: new Set(),
          docCounts: new Array(sorted.length).fill(0),
          label: f.categoryLabel,
        };
      }
      categoryCounts[f.category].count++;
      categoryCounts[f.category].docs.add(a.title);
      categoryCounts[f.category].docCounts[docIdx]++;
      docCats.add(f.category);
    });
  });

  const recurringRiskThemes = Object.entries(categoryCounts)
    .filter(([_, data]) => data.docs.size > 1)
    .map(([cat, data]) => {
      // Calculate trajectory trend: earlier vs recent document mentions
      const earlierCounts = data.docCounts.slice(0, Math.ceil(sorted.length / 2)).reduce((a, b) => a + b, 0);
      const recentCounts = data.docCounts.slice(Math.ceil(sorted.length / 2)).reduce((a, b) => a + b, 0);

      let trajectoryTrend: 'escalating' | 'stable' | 'declining' = 'stable';
      if (recentCounts > earlierCounts * 1.3) trajectoryTrend = 'escalating';
      else if (recentCounts < earlierCounts * 0.7) trajectoryTrend = 'declining';

      return {
        category: cat as RiskCategory,
        categoryLabel: data.label,
        occurrencesCount: data.count,
        distinctSourceCount: data.docs.size,
        trajectoryTrend,
        documentMentions: Array.from(data.docs),
      };
    });

  // Calculate Co-Occurring Risk Pairs across comparative documents
  const pairCounts: Record<string, { pair: [RiskCategory, RiskCategory]; labels: [string, string]; count: number }> = {};
  sorted.forEach((a) => {
    const catsInDoc = Array.from(new Set((a.findings || []).map((f) => f.category)));
    for (let i = 0; i < catsInDoc.length; i++) {
      for (let j = i + 1; j < catsInDoc.length; j++) {
        const catA = catsInDoc[i];
        const catB = catsInDoc[j];
        const key = [catA, catB].sort().join('::');
        if (!pairCounts[key]) {
          const labelA = a.findings.find((f) => f.category === catA)?.categoryLabel || catA;
          const labelB = a.findings.find((f) => f.category === catB)?.categoryLabel || catB;
          pairCounts[key] = { pair: [catA, catB], labels: [labelA, labelB], count: 0 };
        }
        pairCounts[key].count++;
      }
    }
  });

  const coOccurringRiskPairs = Object.values(pairCounts)
    .filter((p) => p.count >= 1)
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)
    .map((p) => ({
      pair: p.pair,
      labels: p.labels,
      coOccurrenceCount: p.count,
    }));

  // 3. Newly Observed Risks (categories present in newer reports that were absent in earlier reports)
  const newlyObservedRisks: Array<{
    category: RiskCategory;
    categoryLabel: string;
    firstObservedIn: string;
    findingTitle: string;
  }> = [];

  const seenCategories = new Set<string>();
  sorted.forEach((a, docIdx) => {
    (a.findings || []).forEach((f) => {
      if (!seenCategories.has(f.category)) {
        if (docIdx > 0) {
          // Newly emerged in later document!
          newlyObservedRisks.push({
            category: f.category,
            categoryLabel: f.categoryLabel,
            firstObservedIn: a.title,
            findingTitle: f.title,
          });
        }
        seenCategories.add(f.category);
      }
    });
  });

  // 4. Inter-Document Contradictions & Divergences
  const contradictions: AnomalyFinding[] = [];

  // Check if sentiment flipped drastically (e.g. from Positive to Negative)
  const firstDoc = sorted[0];
  const lastDoc = sorted[sorted.length - 1];

  if (firstDoc.sentimentResult && lastDoc.sentimentResult) {
    if (firstDoc.sentimentResult.overall === 'positive' && lastDoc.sentimentResult.overall === 'negative') {
      contradictions.push({
        id: `inter-doc-sentiment-reversal`,
        type: 'cross_period_conflict',
        title: 'Abrupt Sentiment Reversal Between Reporting Periods',
        description: `Tone flipped from strongly optimistic (${firstDoc.title}: +${firstDoc.sentimentResult.score}) to severe adverse distress (${lastDoc.title}: ${lastDoc.sentimentResult.score}).`,
        severity: 'critical',
        comparedExcerpts: [
          {
            label: `Earlier Report: ${firstDoc.title}`,
            text: firstDoc.sentimentResult.summary,
            documentTitle: firstDoc.title,
          },
          {
            label: `Subsequent Report: ${lastDoc.title}`,
            text: lastDoc.sentimentResult.summary,
            documentTitle: lastDoc.title,
          },
        ],
        requiresVerification: true,
      });
    }
  }

  // Check covenant differences: if older doc reported solvency / clean debt and newer doc reports covenant breach
  const isDebtOrCovenant = (cat: string) => cat === 'debt_covenants' || cat === 'debt_leverage' || cat === 'going_concern';
  const hadCleanDebt = (firstDoc.findings || []).length === 0 || !(firstDoc.findings || []).some(f => isDebtOrCovenant(f.category));
  const hasNowCovenantBreach = (lastDoc.findings || []).some(f => isDebtOrCovenant(f.category));

  if (hadCleanDebt && hasNowCovenantBreach) {
    const breachFinding = lastDoc.findings.find(f => isDebtOrCovenant(f.category));
    contradictions.push({
      id: `inter-doc-covenant-deterioration`,
      type: 'cross_period_conflict',
      title: 'Sudden Covenant Breach Escalation',
      description: `Earlier filing (${firstDoc.title}) reported stable debt conditions, whereas subsequent filing (${lastDoc.title}) disclosed an active senior credit facility covenant breach.`,
      severity: 'critical',
      comparedExcerpts: [
        {
          label: `Prior Baseline: ${firstDoc.title}`,
          text: 'No debt covenant strains reported in prior baseline period.',
          documentTitle: firstDoc.title,
        },
        {
          label: `Current Breach: ${lastDoc.title}`,
          text: breachFinding?.excerpt || 'Covenant breach disclosed.',
          documentTitle: lastDoc.title,
        },
      ],
      requiresVerification: true,
    });
  }

  // Construct Investigation Executive Summary
  const summaryParts = [
    `CROSS-DOCUMENT AUDIT (${sorted.length} comparative reports analyzed):`,
    `Sentiment moved from ${firstDoc.sentimentResult?.overall || 'neutral'} to ${lastDoc.sentimentResult?.overall || 'neutral'}.`,
    recurringRiskThemes.length > 0
      ? `Identified ${recurringRiskThemes.length} persistent multi-period risk theme(s): ${recurringRiskThemes.map(r => r.categoryLabel).join(', ')}.`
      : 'No recurring risk categories persisted across all documents.',
    newlyObservedRisks.length > 0
      ? `Flagged ${newlyObservedRisks.length} newly emerged risk category(ies) in subsequent periods: ${newlyObservedRisks.map(n => n.categoryLabel).join(', ')}.`
      : 'Risk profile remained stable with no newly emerged threat categories.',
  ];

  return {
    id: `comp-${Date.now()}`,
    userId: sorted[0].userId,
    title: comparisonTitle || `Comparative Audit: ${sorted[0].title} vs. ${sorted[sorted.length - 1].title}`,
    documentIds,
    documentTitles,
    sentimentTrajectory,
    recurringRiskThemes,
    coOccurringRiskPairs,
    newlyObservedRisks,
    contradictionsBetweenDocuments: contradictions,
    investigationSummary: summaryParts.join(' '),
    createdAt: new Date().toISOString(),
  };
}
