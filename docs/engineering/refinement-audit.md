# Tri-nance | Source-Guided Engineering Refinement Audit & Decision Log

## Overview
This document records architectural decisions, authoritative standards compliance, performance baselines, and verification outcomes for the **Tri-nance Financial Sentiment & Risk Intelligence Platform**.

---

## 1. Authoritative Standards Consulted & Adopted

| Standard / Guide | Reference URI | Application in Tri-nance |
| :--- | :--- | :--- |
| **Next.js Production Checklist** | `https://nextjs.org/docs/pages/guides/production-checklist` | Strict type validity (`tsc`), zero-lint build (`eslint`), route-level code splitting, static prerendering of marketing routes, dynamic server execution on authenticated intelligence endpoints. |
| **WCAG 2.2 Accessibility Standards** | `https://www.w3.org/TR/WCAG22/` | Color contrast ratios $> 4.5:1$ (`#192C49`, `#202B3C`), focus visible outlines (`focus:ring-2`), ARIA labels on all iconography and modals, tab-indexed command palette, and screen-reader accessible data tables. |
| **Motion for React Accessibility** | `https://motion.dev/docs/react-accessibility` | Coordinated spring tokens (`--ease-spring`), zero layout-shift transforms, and strict media query enforcement: `@media (prefers-reduced-motion: reduce)` neutralizing non-essential animation durations. |
| **Supabase Product Security** | `https://supabase.com/docs/guides/security/product-security` | Row Level Security (RLS) policies on all tables (`profiles`, `documents`, `analyses`, `audit_logs`), preventing cross-tenant data leakage. Secure HTTP-only cookies for local session fallback. |
| **Core Web Vitals Thresholds** | `https://web.dev/articles/defining-core-web-vitals-thresholds` | Performance budgeting: Total shared bundle size constrained to 102 kB, Largest Contentful Paint (LCP) $< 2.5\text{s}$, Interaction to Next Paint (INP) $< 200\text{ms}$, Cumulative Layout Shift (CLS) $< 0.1$. |

---

## 2. Defect & Enhancement Ledger

| Area | Defect / Enhancement | Authoritative Best Practice | Implemented Fix | Verification |
| :--- | :--- | :--- | :--- | :---: |
| **Security** | Formula injection in CSV exports | OWASP Spreadsheet Injection Defense | Tab prefixing (`'\t'`) for cells starting with `=, +, -, @` in `src/lib/export/csv-export.ts` | Vitest Unit Test (`csv-export.test.ts`) |
| **Data Integrity** | Division by zero and inversion on negative variances | Financial Accounting Variance Standards | Absolute baseline formula $\frac{\text{Current} - \text{Prior}}{|\text{Prior}|} \times 100$ in `numerical-extractor.ts` | Vitest Unit Test (`numerical-extractor.test.ts`) |
| **NLP Accuracy** | Premature sentence splitting on numeric decimals | Tokenizer Best Practices | Lookahead/lookbehind segmentation preserving numbers like `$42.5M` and `14%` in `sentiment-engine.ts` | Vitest Unit Test (`sentiment-engine.test.ts`) |
| **Evidence Traceability** | Disconnection between findings and raw text | Traceable Evidence Mandate | Exact substring character offsets (`startOffset`, `endOffset`) in `evidence-verifier.ts` | Vitest Unit Test (`evidence-verifier.test.ts`) |
| **Governance** | Unaudited dismissal of risk flags | SEC/FINRA Compliance Auditing | Mandatory justification check returning HTTP 400 on empty dismissal reasons in `api/findings/[id]` | Automated Audit Phase 5 (`run-full-audit.js`) |
| **Access Control** | Client-side render flash on unauthenticated dashboard visit | Next.js Server Components Authentication | Server-side authentication check redirecting unauthenticated users with HTTP 307 | Automated Audit Phase 1 (`run-full-audit.js`) |
| **Account Lifecycle** | Irreversible account purge without verification | GDPR / Privacy Deletion Standards | `DELETE /api/auth/user` requiring password confirmation and cascading record deletion | Automated Audit Phase 10 (`run-full-audit.js`) |
| **Prioritization** | Opaque severity ranking | Transparent Risk Scoring | Deterministic 4-factor scoring (Severity, Textual Certainty, Materiality, Actionability) in `prioritization-engine.ts` | Vitest Unit Test (`prioritization.test.ts`) |
| **Document Ingestion** | Zero-byte or whitespace-only file corruptions | Safe Input Validation | Reject empty/whitespace-only files with explicit descriptive error in `document-parser.ts` | Automated Build & Tests |

---

## 3. Production Build & Bundle Metrics

- **Next.js Version:** 15.5.27
- **Total Shared JavaScript:** 102 kB (first-load JS shared by all routes)
- **First Load JS on Protected Routes:** 107 kB - 116 kB
- **Static Prerendered Routes:** 6 routes (`/`, `/_not-found`, `/login`, `/register`, `/forgot-password`, `/reset-password`)
- **Dynamic Intelligence Routes:** 17 routes (Dashboard, New Analysis, History, Reports, Investigations, Documents, Settings, API Endpoints)
- **Zero Type Errors:** Verified via `npx tsc --noEmit`
- **Zero Lint Errors:** Verified via `npm run lint`
- **Test Suite Results:** 30 passed / 30 total tests in Vitest across 7 test files
- **End-to-End Audit:** 34 passed / 34 checks in `run-full-audit.js`
