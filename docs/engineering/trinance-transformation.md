# Tri-nance | Master Transformation & Engineering Architecture Document

## Overview
This document records the master architectural transformation of **Tri-nance** into a commercial-grade Financial Sentiment and Risk Intelligence Platform.

---

## 1. Product Identity & Design Tokens

### Aesthetic Direction
Tri-nance is styled as an institutional financial intelligence command center, balancing analytical precision with deliberate editorial craftsmanship:
- **Primary Color Palette:** Deep ink navy (`#111D32`, `#192C49`), warm white surfaces (`#FFFFFF`), neutral slate (`#202B3C`, `#697586`), restrained steel blue (`#46699D`).
- **Semantic Accents:** Grounded positive emerald (`#12B76A`), warning amber (`#F79009`), and danger crimson (`#F04438`).
- **Typography Scale:**
  - `Geist Sans`: Primary UI font across headings, cards, inputs, buttons, and navigation.
  - `Geist Mono`: Tabular figures, exact byte offsets, currency formatting, and metadata coordinates.
  - `Space Grotesk`: Prominent brand headlines on landing and intelligence introductions.
- **Motion Tokens:**
  - `--ease-spring: cubic-bezier(0.16, 1, 0.3, 1)`
  - `--ease-smooth: cubic-bezier(0.4, 0, 0.2, 1)`
  - `--duration-fast: 150ms`, `--duration-normal: 250ms`, `--duration-slow: 400ms`
  - Strict `@media (prefers-reduced-motion: reduce)` accessibility clamp.

---

## 2. Implemented Intelligence Architecture

$$\mathbf{SOURCE} \longrightarrow \mathbf{SIGNAL} \longrightarrow \mathbf{CONTEXT} \longrightarrow \mathbf{PRIORITY} \longrightarrow \mathbf{INVESTIGATION} \longrightarrow \mathbf{REPORT}$$

### A. Tripartite Studio (`ReportView.tsx`)
1. **01. Source & Evidence Anchor:** Verifies exact character offsets matching raw document substrings (`startOffset`, `endOffset`).
2. **02. Detected Signal & Severity:** Classifies risk patterns across 12 institutional categories with Loughran-McDonald financial weighting and epistemic certainty tags (`documented_fact`, `hedged_projection`, `ambiguous_disclosure`).
3. **03. Investigation & Governance:** In-place triage workflow (`open`, `under_review`, `resolved`, `dismissed`) enforcing mandatory audit justifications on dismissal.

### B. Transparent Risk Prioritization (`prioritization-engine.ts`)
- Multi-factor score ($0\text{--}100$) combining Severity ($40\text{p}$), Textual Certainty ($25\text{p}$), Financial Materiality ($20\text{p}$), and Actionability ($15\text{p}$).
- Tiers: `P1_CRITICAL`, `P2_HIGH`, `P3_ELEVATED`, `P4_MONITOR`.

### C. Natural-Language Investigation Assistant (`InvestigationAssistant.tsx` & `/api/assistant`)
- Queries authorized stored analyses to answer diligence inquiries, citing exact evidence passages and highlighting disclosure gaps.

### D. Live Intelligence Activity Stream (`ActivityStream.tsx` & `/api/events`)
- Real-time audit stream with live synchronization indicators and refresh controls.

### E. Financial Entity Resolution (`entity-extractor.ts`)
- Identifies and connects debt syndicates, regulators, audit committees, and enterprise client groups.

### F. Multi-Period Comparative Intelligence (`cross-document-engine.ts`)
- Evaluates multi-period trajectory changes, recurring risk themes, newly emerged risks, and narrative contradictions.

### G. Safe Financial Arithmetic (`numerical-extractor.ts`)
- Standard-compliant formula $\frac{\text{Current} - \text{Prior}}{|\text{Prior}|} \times 100$ safely handling zero and negative baselines.

---

## 3. Production Verification & Quality Gate Results

- **TypeScript:** 100% clean (`npx tsc --noEmit` $\rightarrow$ 0 errors).
- **Linter:** 100% clean (`npm run lint` $\rightarrow$ 0 errors).
- **Vitest Unit & Integration:** 30 passed / 30 total tests across 7 test files.
- **End-to-End Audit:** 34 passed / 34 checks across 11 verification phases (`node run-full-audit.js`).
- **Live Server:** Running on `http://localhost:3000`.
- **Bundle Metrics:** Total shared JavaScript constrained to **102 kB**; individual routes under **116 kB**.
