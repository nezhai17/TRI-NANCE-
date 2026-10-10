# Tri-nance | Financial Sentiment & Risk Intelligence Platform

Tri-nance is a financial sentiment and multi-category risk intelligence SaaS platform built for financial analysts, auditors, and executive teams. It ingests financial statements, earnings call transcripts, management commentary, customer feedback, and regulatory filings to provide evidence-backed intelligence through three interconnected dimensions:

1. **Sentiment Intelligence**: Financial domain sentiment scoring (Loughran-McDonald lexicon), negation handling, hedging analysis, and mixed/contradictory disclosure detection.
2. **Risk Intelligence**: Grounded pattern detection across 12 mission-critical risk categories (liquidity, debt covenants, revenue contraction, margin compression, churn, collections, disruptions, supply chains, regulatory probes, fraud/inconsistencies, reputational damage, and going-concern warnings).
3. **Evidence Intelligence**: Exact source grounding with line numbers, paragraph coordinates, character offsets, severity rationales, and impact assessments.

---

## Architecture & Technology Stack

- **Framework**: Next.js 15 (App Router, Server & Client Components, Server Actions, API routes)
- **Language**: TypeScript (Strict typing, Zero `any` leaks)
- **Styling & Design System**: Tailwind CSS with custom Tri-nance financial design tokens (`#172B4D`, `#101D35`, `#F6F8FB`, `#FFFFFF`, `#4263A5`)
- **Data Visualizations**: Recharts with accessible color tokens and tooltips
- **Document Parsers**: `pdf-parse` (PDF), `mammoth` (DOCX), `papaparse` (CSV), and raw UTF-8 (TXT)
- **Database & Auth**:
  - **Production Target**: Supabase Auth & PostgreSQL with Row Level Security (RLS) policies (`supabase/migrations/01_initial_schema.sql`)
  - **Local / Resilient Engine**: Local persistent JSON/SQLite store with SHA-256 salted password hashing and secure HTTP-only cookies
- **Security**: Formula-injection protected CSV exporter (`=`, `+`, `-`, `@`, `\t` escaping) and sanitized JSON exporter
- **Testing**: Vitest test runner (17 automated unit and integration tests)

---

## 12 Grounded Financial Risk Categories

1. **Liquidity & Cash Flow Risk**: Cash burn, operating deficits, working capital strain
2. **Debt & Leverage Structure**: Senior debt maturity, covenant default risk, leverage ratios
3. **Revenue & Earnings Pressure**: Top-line deceleration, sales slumps, missed guidance
4. **Expense Growth & Margin Deterioration**: Cost inflation, SG&A spikes, gross margin erosion
5. **Customer Churn & Confidence**: Enterprise account attrition, retention drops
6. **Late Payments & Collections**: Days sales outstanding (DSO) lengthening, uncollectible accounts
7. **Operational Disruption**: Core outages, downtime, production halts
8. **Supply Chain Dependency**: Single-source supplier exposure, component shortages
9. **Regulatory & Compliance Concerns**: SEC/DOJ probes, subpoena disclosures, license actions
10. **Internal Inconsistencies & Irregularities**: Control weaknesses, accounting irregularities, restatements
11. **Reputational Risk**: Public fallout, PR crises, governance controversies
12. **Business Continuity & Going Concern**: Auditor going-concern warnings, solvency threats

---

## Getting Started

### 1. Installation
```bash
npm install
```

### 2. Run Automated Tests
```bash
npm test
```
Executes all 17 unit and integration tests across sentiment scoring, risk pattern detection, evidence verification, and CSV formula sanitization.

### 3. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for Production
```bash
npm run build
npm start
```

---

## Default Analyst Credentials

When operating in local development mode without external Supabase credentials:
- **Email**: `analyst@trinance.io`
- **Password**: `Trinance2026!`

---

## Supabase Production Configuration

To connect your Supabase database:
1. Copy `.env.example` to `.env.local`
2. Populate:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```
3. Run the schema migrations from `supabase/migrations/01_initial_schema.sql` in the Supabase SQL Editor.
