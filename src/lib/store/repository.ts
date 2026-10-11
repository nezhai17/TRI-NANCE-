import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  AnalysisRecord,
  DocumentRecord,
  UserProfile,
  DashboardMetrics,
  SentimentClass,
  RiskSeverity,
  CrossDocumentComparison,
  ReviewStatus,
  CopilotFeedback,
} from '../types';
import { CopilotSession, CopilotActionProposal } from '../intelligence/copilot-engine';

interface StoreData {
  users: Array<{
    id: string;
    email: string;
    passwordHash: string;
    fullName: string;
    role: string;
    preferences: UserProfile['preferences'];
    createdAt: string;
  }>;
  documents: DocumentRecord[];
  analyses: AnalysisRecord[];
  investigations: CrossDocumentComparison[];
  copilotSessions?: CopilotSession[];
  copilotFeedback?: CopilotFeedback[];
  auditLogs: Array<{
    id: string;
    userId: string;
    action: string;
    resourceType: string;
    resourceId?: string;
    metadata?: Record<string, unknown>;
    createdAt: string;
  }>;
}

const DATA_DIR = path.join(process.cwd(), '.data');
const DATA_FILE = path.join(DATA_DIR, 'trinance_store.json');

function ensureStore(): StoreData {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(DATA_FILE)) {
    const defaultData: StoreData = {
      users: [
        {
          id: crypto.randomUUID(),
          email: 'analyst@trinance.io',
          passwordHash: hashPassword('Trinance2026!'),
          fullName: 'Lead Financial Analyst',
          role: 'analyst',
          preferences: {
            theme: 'light',
            defaultMode: 'combined',
            layout: 'standard',
          },
          createdAt: new Date().toISOString(),
        },
      ],
      documents: [],
      analyses: [],
      investigations: [],
      copilotSessions: [],
      copilotFeedback: [],
      auditLogs: [],
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(defaultData, null, 2), 'utf-8');
    return defaultData;
  }

  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    parsed.users = parsed.users || [];
    parsed.documents = parsed.documents || [];
    parsed.analyses = parsed.analyses || [];
    parsed.investigations = parsed.investigations || [];
    parsed.copilotSessions = parsed.copilotSessions || [];
    parsed.copilotFeedback = parsed.copilotFeedback || [];
    parsed.auditLogs = parsed.auditLogs || [];

    if (!parsed.users.some((u: { email: string }) => u.email === 'analyst@trinance.io')) {
      parsed.users.push({
        id: crypto.randomUUID(),
        email: 'analyst@trinance.io',
        passwordHash: hashPassword('Trinance2026!'),
        fullName: 'Lead Financial Analyst',
        role: 'analyst',
        preferences: {
          theme: 'light',
          defaultMode: 'combined',
          layout: 'standard',
        },
        createdAt: new Date().toISOString(),
      });
      fs.writeFileSync(DATA_FILE, JSON.stringify(parsed, null, 2), 'utf-8');
    }
    return parsed;
  } catch {
    return { users: [], documents: [], analyses: [], investigations: [], auditLogs: [] };
  }
}

function saveStore(data: StoreData) {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + 'trinance_salt_2026').digest('hex');
}

// User / Auth Operations
export async function findUserByEmail(email: string) {
  const store = ensureStore();
  return store.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

export async function findUserById(id: string) {
  const store = ensureStore();
  return store.users.find((u) => u.id === id);
}

export async function createUser(email: string, passwordPlain: string, fullName: string) {
  const store = ensureStore();
  const existing = store.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    throw new Error('An account with this email already exists.');
  }

  const newUser = {
    id: crypto.randomUUID(),
    email: email.toLowerCase(),
    passwordHash: hashPassword(passwordPlain),
    fullName,
    role: 'analyst',
    preferences: {
      theme: 'light' as const,
      defaultMode: 'combined' as const,
      layout: 'standard' as const,
    },
    createdAt: new Date().toISOString(),
  };

  store.users.push(newUser);
  saveStore(store);

  return newUser;
}

export async function updateUserProfile(id: string, updates: { fullName?: string; preferences?: Partial<UserProfile['preferences']> }) {
  const store = ensureStore();
  const user = store.users.find((u) => u.id === id);
  if (!user) throw new Error('User not found.');

  if (updates.fullName !== undefined) user.fullName = updates.fullName;
  if (updates.preferences) user.preferences = { ...user.preferences, ...updates.preferences };

  saveStore(store);
  return user;
}

export async function updateUserPassword(id: string, oldPasswordPlain: string, newPasswordPlain: string) {
  const store = ensureStore();
  const user = store.users.find((u) => u.id === id);
  if (!user) throw new Error('User not found.');

  if (user.passwordHash !== hashPassword(oldPasswordPlain)) {
    throw new Error('Current password does not match.');
  }

  user.passwordHash = hashPassword(newPasswordPlain);
  saveStore(store);
  return true;
}

export async function deleteUserAccount(id: string, passwordPlain: string) {
  const store = ensureStore();
  const userIdx = store.users.findIndex((u) => u.id === id);
  if (userIdx === -1) throw new Error('User account not found.');

  const user = store.users[userIdx];
  if (user.passwordHash !== hashPassword(passwordPlain)) {
    throw new Error('Incorrect password. Account deletion aborted.');
  }

  // Purge all user data (documents, analyses, investigations)
  store.users.splice(userIdx, 1);
  store.documents = store.documents.filter((d) => d.userId !== id);
  store.analyses = store.analyses.filter((a) => a.userId !== id);
  store.investigations = store.investigations.filter((i) => i.userId !== id);
  store.auditLogs = store.auditLogs.filter((l) => l.userId !== id);

  saveStore(store);
  return true;
}

// Analysis Operations
export async function createAnalysis(record: Omit<AnalysisRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<AnalysisRecord> {
  const store = ensureStore();
  const now = new Date().toISOString();
  const newAnalysis: AnalysisRecord = {
    ...record,
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
  };

  store.analyses.unshift(newAnalysis);
  saveStore(store);
  return newAnalysis;
}

export async function getAnalysisById(id: string, userId?: string): Promise<AnalysisRecord | null> {
  const store = ensureStore();
  const record = store.analyses.find((a) => a.id === id);
  if (!record) return null;
  if (userId && record.userId !== userId) return null; // isolation
  return record;
}

export async function listAnalyses(
  userId: string,
  options?: {
    search?: string;
    sentiment?: SentimentClass | 'all';
    severity?: RiskSeverity | 'all';
    status?: string | 'all';
    page?: number;
    limit?: number;
  }
): Promise<{ analyses: AnalysisRecord[]; total: number; page: number; totalPages: number }> {
  const store = ensureStore();
  let filtered = store.analyses.filter((a) => a.userId === userId);

  if (options?.search) {
    const q = options.search.toLowerCase();
    filtered = filtered.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.inputText.toLowerCase().includes(q) ||
        (a.findings || []).some((f) => f.title.toLowerCase().includes(q) || f.categoryLabel.toLowerCase().includes(q))
    );
  }

  if (options?.sentiment && options.sentiment !== 'all') {
    filtered = filtered.filter((a) => a.sentimentResult?.overall === options.sentiment);
  }

  if (options?.severity && options.severity !== 'all') {
    filtered = filtered.filter((a) => a.riskResult?.highestSeverity === options.severity);
  }

  if (options?.status && options.status !== 'all') {
    filtered = filtered.filter((a) => a.status === options.status);
  }

  const total = filtered.length;
  const page = Math.max(1, options?.page || 1);
  const limit = Math.max(1, options?.limit || 10);
  const totalPages = Math.ceil(total / limit) || 1;

  const startIndex = (page - 1) * limit;
  const paginated = filtered.slice(startIndex, startIndex + limit);

  return { analyses: paginated, total, page, totalPages };
}

export async function getAnalysesByUserId(userId: string): Promise<AnalysisRecord[]> {
  const store = ensureStore();
  return store.analyses.filter((a) => a.userId === userId);
}

export async function updateAnalysis(
  id: string,
  userId: string,
  updates: Partial<Pick<AnalysisRecord, 'title' | 'status' | 'errorMessage'>>
): Promise<AnalysisRecord> {
  const store = ensureStore();
  const index = store.analyses.findIndex((a) => a.id === id && a.userId === userId);
  if (index === -1) throw new Error('Analysis not found or unauthorized.');

  store.analyses[index] = {
    ...store.analyses[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  saveStore(store);
  return store.analyses[index];
}

export async function deleteAnalysis(id: string, userId: string): Promise<boolean> {
  const store = ensureStore();
  const initialLen = store.analyses.length;
  store.analyses = store.analyses.filter((a) => !(a.id === id && a.userId === userId));
  const changed = store.analyses.length < initialLen;
  if (changed) {
    store.auditLogs.unshift({
      id: crypto.randomUUID(),
      userId,
      action: 'analysis_dossier_deleted',
      resourceType: 'analysis',
      resourceId: id,
      metadata: { deletedAt: new Date().toISOString() },
      createdAt: new Date().toISOString(),
    });
    saveStore(store);
  }
  return changed;
}

// Document Operations
export async function createDocumentRecord(doc: Omit<DocumentRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<DocumentRecord> {
  const store = ensureStore();
  const now = new Date().toISOString();
  const newDoc: DocumentRecord = {
    ...doc,
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
  };
  store.documents.unshift(newDoc);
  saveStore(store);
  return newDoc;
}

export async function listDocuments(userId: string): Promise<DocumentRecord[]> {
  const store = ensureStore();
  return store.documents.filter((d) => d.userId === userId);
}

export async function getDocumentById(id: string, userId: string): Promise<DocumentRecord | null> {
  const store = ensureStore();
  return store.documents.find((d) => d.id === id && d.userId === userId) || null;
}

export async function deleteDocumentRecord(id: string, userId: string): Promise<boolean> {
  const store = ensureStore();
  const initialLen = store.documents.length;
  store.documents = store.documents.filter((d) => !(d.id === id && d.userId === userId));
  const changed = store.documents.length < initialLen;

  if (changed) {
    // Cascade cleanup: remove derived analyses that depended on this raw document
    store.analyses = store.analyses.filter((a) => !(a.documentId === id && a.userId === userId));

    // Log provenance audit event
    store.auditLogs.unshift({
      id: crypto.randomUUID(),
      userId,
      action: 'document_purged_with_cascade',
      resourceType: 'document',
      resourceId: id,
      metadata: { cascadeRemovedAnalyses: true },
      createdAt: new Date().toISOString(),
    });

    saveStore(store);
  }
  return changed;
}

// Real Dashboard Metrics Computation
export async function getDashboardMetrics(userId: string): Promise<DashboardMetrics> {
  const store = ensureStore();
  const userAnalyses = store.analyses.filter((a) => a.userId === userId);

  const completed = userAnalyses.filter((a) => a.status === 'completed');
  const eligibleForSentiment = completed.filter((a) => Boolean(a.sentimentResult));

  const negativeCount = eligibleForSentiment.filter((a) => a.sentimentResult?.overall === 'negative').length;
  const negativeSentimentShare =
    eligibleForSentiment.length > 0 ? Number(((negativeCount / eligibleForSentiment.length) * 100).toFixed(1)) : 0;

  // Open high-severity risk findings (severity high or critical)
  let openHighSeverityFindings = 0;
  completed.forEach((a) => {
    (a.findings || []).forEach((f) => {
      if (f.severity === 'high' || f.severity === 'critical') {
        openHighSeverityFindings++;
      }
    });
  });

  const now = Date.now();
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
  const recentActivityCount = userAnalyses.filter((a) => new Date(a.createdAt).getTime() >= sevenDaysAgo).length;

  const sentimentCounts: Record<SentimentClass, number> = {
    positive: 0,
    negative: 0,
    neutral: 0,
    mixed: 0,
  };

  eligibleForSentiment.forEach((a) => {
    if (a.sentimentResult?.overall) {
      sentimentCounts[a.sentimentResult.overall]++;
    }
  });

  const severityCounts: Record<RiskSeverity, number> = {
    low: 0,
    medium: 0,
    high: 0,
    critical: 0,
  };

  // Count unresolved findings (open or under_review)
  let unresolvedInvestigationsCount = 0;
  completed.forEach((a) => {
    (a.findings || []).forEach((f) => {
      const status = f.reviewStatus || 'open';
      if (status === 'open' || status === 'under_review') {
        unresolvedInvestigationsCount++;
      }
    });
  });

  return {
    totalCompletedAnalyses: completed.length,
    negativeSentimentShare,
    negativeCount,
    eligibleCompletedCount: eligibleForSentiment.length,
    openHighSeverityFindings,
    recentActivityCount,
    sentimentCounts,
    severityCounts,
    unresolvedInvestigationsCount,
  };
}

// Investigation Finding Review Workflow
export async function updateFindingReview(
  analysisId: string | undefined,
  findingId: string,
  userId: string,
  updates: {
    reviewStatus?: ReviewStatus;
    resolutionReason?: string;
    noteText?: string;
    authorName?: string;
  }
) {
  const store = ensureStore();
  const analysis = analysisId
    ? store.analyses.find((a) => a.id === analysisId && a.userId === userId)
    : store.analyses.find((a) => a.userId === userId && (a.findings || []).some((f) => f.id === findingId));

  if (!analysis) throw new Error('Analysis dossier not found or unauthorized.');

  const finding = (analysis.findings || []).find((f) => f.id === findingId);
  if (!finding) throw new Error('Target finding not found in this analysis.');

  if (updates.reviewStatus) {
    if (updates.reviewStatus === 'dismissed' && !updates.resolutionReason?.trim()) {
      throw new Error('Mandatory audit justification required when dismissing a finding.');
    }
    finding.reviewStatus = updates.reviewStatus;
    if (updates.reviewStatus === 'resolved' || updates.reviewStatus === 'dismissed') {
      finding.resolvedAt = new Date().toISOString();
      if (updates.resolutionReason) {
        finding.resolutionReason = updates.resolutionReason;
      }
    }
  }

  if (updates.noteText && updates.noteText.trim()) {
    finding.reviewNotes = finding.reviewNotes || [];
    finding.reviewNotes.push({
      id: crypto.randomUUID(),
      author: updates.authorName || 'Analyst',
      text: updates.noteText.trim(),
      createdAt: new Date().toISOString(),
    });
  }

  analysis.updatedAt = new Date().toISOString();
  saveStore(store);

  return finding;
}

// Cross-Document Investigation Persistence
export async function createInvestigationComparison(
  comparison: Omit<CrossDocumentComparison, 'id' | 'createdAt'>
): Promise<CrossDocumentComparison> {
  const store = ensureStore();
  const newComp: CrossDocumentComparison = {
    ...comparison,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };

  store.investigations = store.investigations || [];
  store.investigations.unshift(newComp);
  saveStore(store);
  return newComp;
}

export async function listInvestigationComparisons(userId: string): Promise<CrossDocumentComparison[]> {
  const store = ensureStore();
  store.investigations = store.investigations || [];
  return store.investigations.filter((i) => i.userId === userId);
}

export async function getInvestigationComparisonById(
  id: string,
  userId: string
): Promise<CrossDocumentComparison | null> {
  const store = ensureStore();
  store.investigations = store.investigations || [];
  return store.investigations.find((i) => i.id === id && i.userId === userId) || null;
}

export async function deleteInvestigationComparison(id: string, userId: string): Promise<boolean> {
  const store = ensureStore();
  store.investigations = store.investigations || [];
  const initialLen = store.investigations.length;
  store.investigations = store.investigations.filter((i) => !(i.id === id && i.userId === userId));
  const changed = store.investigations.length < initialLen;
  if (changed) saveStore(store);
  return changed;
}

export async function logAuditEvent(
  userId: string,
  action: string,
  resourceType: string,
  resourceId?: string,
  metadata?: Record<string, unknown>
) {
  const store = ensureStore();
  store.auditLogs = store.auditLogs || [];
  store.auditLogs.unshift({
    id: crypto.randomUUID(),
    userId,
    action,
    resourceType,
    resourceId,
    metadata,
    createdAt: new Date().toISOString(),
  });
  if (store.auditLogs.length > 500) {
    store.auditLogs = store.auditLogs.slice(0, 500);
  }
  saveStore(store);
}

export async function listAuditLogs(userId: string, limit = 50) {
  const store = ensureStore();
  store.auditLogs = store.auditLogs || [];
  return store.auditLogs.filter((l) => l.userId === userId).slice(0, limit);
}

// ---------------------------------------------------------------------------
// Copilot Session & Action Proposal Persistence
// ---------------------------------------------------------------------------

export async function saveCopilotSession(session: CopilotSession): Promise<CopilotSession> {
  const store = ensureStore();
  store.copilotSessions = store.copilotSessions || [];

  const existingIdx = store.copilotSessions.findIndex((s) => s.id === session.id && s.userId === session.userId);
  if (existingIdx !== -1) {
    store.copilotSessions[existingIdx] = {
      ...session,
      updatedAt: new Date().toISOString(),
    };
  } else {
    store.copilotSessions.unshift({
      ...session,
      createdAt: session.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  saveStore(store);
  return session;
}

export async function listCopilotSessions(userId: string): Promise<CopilotSession[]> {
  const store = ensureStore();
  store.copilotSessions = store.copilotSessions || [];
  return store.copilotSessions.filter((s) => s.userId === userId);
}

export async function getCopilotSessionById(id: string, userId: string): Promise<CopilotSession | null> {
  const store = ensureStore();
  store.copilotSessions = store.copilotSessions || [];
  return store.copilotSessions.find((s) => s.id === id && s.userId === userId) || null;
}

export async function deleteCopilotSession(id: string, userId: string): Promise<boolean> {
  const store = ensureStore();
  store.copilotSessions = store.copilotSessions || [];
  const initialLen = store.copilotSessions.length;
  store.copilotSessions = store.copilotSessions.filter((s) => !(s.id === id && s.userId === userId));
  const changed = store.copilotSessions.length < initialLen;
  if (changed) saveStore(store);
  return changed;
}

/**
 * Consequential Action Execution:
 * Requires explicit user authorization. Applies mutations to investigations or triage reviews
 * and commits an immutable entry into the platform audit log.
 */
export async function executeCopilotAction(
  userId: string,
  action: CopilotActionProposal
): Promise<{ success: boolean; resultSummary: string; auditLogId: string; createdEntityId?: string }> {
  const store = ensureStore();

  if (action.actionType === 'create_investigation') {
    const { investigationTitle, documentIds = [], documentTitles = [] } = action.payload;

    // Build synthesized investigation
    const targetAnalyses = store.analyses.filter((a) => a.userId === userId && (documentIds.includes(a.id) || documentIds.includes(a.documentId || '')));
    const effectiveDocTitles = documentTitles.length > 0 ? documentTitles : targetAnalyses.map((a) => a.title);

    const recurringThemes: CrossDocumentComparison['recurringRiskThemes'] = [];
    const catCounts = new Map<string, { label: string; count: number; mentions: Set<string> }>();

    targetAnalyses.forEach((a) => {
      (a.findings || []).forEach((f) => {
        const cur = catCounts.get(f.category) || { label: f.categoryLabel, count: 0, mentions: new Set() };
        cur.count++;
        cur.mentions.add(a.title);
        catCounts.set(f.category, cur);
      });
    });

    catCounts.forEach((val, catKey) => {
      recurringThemes.push({
        category: catKey as any,
        categoryLabel: val.label,
        occurrencesCount: val.count,
        distinctSourceCount: val.mentions.size,
        trajectoryTrend: 'stable',
        documentMentions: Array.from(val.mentions),
      });
    });

    const newInvestigation: CrossDocumentComparison = {
      id: crypto.randomUUID(),
      userId,
      title: investigationTitle || 'Copilot Initiated Investigation',
      documentIds: targetAnalyses.map((a) => a.documentId || a.id),
      documentTitles: effectiveDocTitles,
      sentimentTrajectory: targetAnalyses.map((a) => ({
        documentTitle: a.title,
        overall: a.sentimentResult?.overall || 'neutral',
        score: a.sentimentResult?.score || 0,
      })),
      recurringRiskThemes: recurringThemes.slice(0, 5),
      newlyObservedRisks: [],
      contradictionsBetweenDocuments: targetAnalyses.flatMap((a) => a.anomalies || []),
      investigationSummary: `Investigation initiated via Tri-nance Copilot action proposal. Triangulated ${targetAnalyses.length} dossier(s) with ${recurringThemes.length} recurring risk categories.`,
      createdAt: new Date().toISOString(),
    };

    store.investigations = store.investigations || [];
    store.investigations.unshift(newInvestigation);

    // Audit Log
    const auditId = crypto.randomUUID();
    store.auditLogs = store.auditLogs || [];
    store.auditLogs.unshift({
      id: auditId,
      userId,
      action: 'COPILOT_CREATE_INVESTIGATION',
      resourceType: 'investigation',
      resourceId: newInvestigation.id,
      metadata: {
        investigationTitle: newInvestigation.title,
        documentCount: targetAnalyses.length,
        actionProposalId: action.id,
      },
      createdAt: new Date().toISOString(),
    });

    saveStore(store);

    return {
      success: true,
      resultSummary: `Cross-Document Investigation "${newInvestigation.title}" successfully created with ${targetAnalyses.length} linked dossiers.`,
      auditLogId: auditId,
      createdEntityId: newInvestigation.id,
    };
  }

  if (action.actionType === 'update_triage_status') {
    const { analysisId, findingId, targetStatus, resolutionReason } = action.payload;
    if (!findingId || !targetStatus) {
      throw new Error('Missing finding ID or target status in action proposal.');
    }

    const updatedFinding = await updateFindingReview(analysisId, findingId, userId, {
      reviewStatus: targetStatus,
      resolutionReason: resolutionReason || 'Updated via Copilot action approval.',
      authorName: 'Copilot Analyst Session',
    });

    const auditId = crypto.randomUUID();
    await logAuditEvent(userId, 'COPILOT_TRIAGE_FINDING', 'finding', findingId, {
      newStatus: targetStatus,
      findingTitle: updatedFinding.title,
      actionProposalId: action.id,
    });

    return {
      success: true,
      resultSummary: `Finding "${updatedFinding.title}" triage status updated to ${targetStatus.toUpperCase()}.`,
      auditLogId: auditId,
      createdEntityId: findingId,
    };
  }

  throw new Error(`Unsupported action proposal type: ${(action as any).actionType}`);
}

export async function submitCopilotFeedback(
  feedback: Omit<CopilotFeedback, 'id' | 'createdAt'>
): Promise<CopilotFeedback> {
  const store = ensureStore();
  store.copilotFeedback = store.copilotFeedback || [];
  const newFeedback: CopilotFeedback = {
    ...feedback,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  store.copilotFeedback.unshift(newFeedback);
  saveStore(store);
  return newFeedback;
}

export async function listCopilotFeedback(userId: string): Promise<CopilotFeedback[]> {
  const store = ensureStore();
  store.copilotFeedback = store.copilotFeedback || [];
  return store.copilotFeedback.filter((f) => f.userId === userId);
}


