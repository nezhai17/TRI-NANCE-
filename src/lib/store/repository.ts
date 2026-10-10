import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { AnalysisRecord, DocumentRecord, UserProfile, DashboardMetrics, SentimentClass, RiskSeverity } from '../types';

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
      auditLogs: [],
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(defaultData, null, 2), 'utf-8');
    return defaultData;
  }

  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return { users: [], documents: [], analyses: [], auditLogs: [] };
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
  if (changed) saveStore(store);
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
  if (changed) saveStore(store);
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

  completed.forEach((a) => {
    if (a.riskResult?.highestSeverity) {
      severityCounts[a.riskResult.highestSeverity]++;
    }
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
  };
}
