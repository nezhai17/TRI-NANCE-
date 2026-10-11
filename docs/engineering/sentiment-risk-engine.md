# TRINANCE — FINANCIAL SENTIMENT & RISK PATTERN INTELLIGENCE ENGINE
## Engineering Audit, Architecture, Gap Analysis & Upgrade Specification

### 1. Executive System Audit

Tri-nance operates an evidence-grounded financial intelligence stack with Next.js 15.5.27, React 19, TypeScript 5.7, Vitest 3.0.5, and Recharts 2.15.1.
The application evaluates commercial text across 12 risk categories, Loughran-McDonald financial sentiment weighting, numerical metric extraction, and inter-document comparative analysis.

#### Current Capabilities:
1. **Document Ingestion (`document-parser.ts`)**:
   - Supports TXT, CSV (PapaParse), DOCX (Mammoth), and PDF (pdf-parse).
   - Sanitizes and counts words and characters.
2. **Sentiment Analysis (`sentiment-engine.ts`)**:
   - Loughran-McDonald financial dictionaries for positive, negative, and uncertainty/hedging words.
   - Sentence-level extraction with epistemic classification (`documented_fact` vs `hedged_projection`).
   - Contradiction tracking within documents.
3. **Risk Detection (`risk-engine.ts`)**:
   - 12 comprehensive categories: liquidity, debt, revenue, expense/margin, customer churn, late payments, operational disruption, supply chain, regulatory/compliance, fraud/inconsistencies, reputational, business continuity.
   - Evidence classification: `explicitly_stated`, `inferred`, `requiring_verification`.
   - Investigation diligence metadata (management questions, records to cross-examine, information gaps).
4. **Numerical Extraction (`numerical-extractor.ts`)**:
   - Extracts revenue, cash reserves, operating cash flow, net income, gross margin, DSO, churn rate, solvency ratio.
5. **Cross-Document Engine (`cross-document-engine.ts`)**:
   - Multi-document comparison, sentiment trajectory, recurring risk themes, newly observed risks, and cross-period contradictions.
6. **Evidence Verifier (`evidence-verifier.ts`)**:
   - Verifies quotes against source text with exact character offsets, line, and paragraph indices.

---

### 2. Gap Analysis Against Master Requirements

| Requirement Area | Existing Status | Missing / Required Upgrade |
|---|---|---|
| **Input & Document Formats** | Basic TXT/CSV/DOCX/PDF parsing | Support long document chunking with overlap; preserve section headings and table structures; explicit handling of customer surveys/batches; handle corrupted/empty files gracefully. |
| **Sentiment Intelligence** | Document-level & sentence-level sentiment | **Aspect-Based Sentiment Analysis (ABSA)** across 10 commercial aspects (Pricing, Delivery, Quality, Service, Reliability, Billing, Support, Product, Operational, Management). **Entity-Level Sentiment** (sentiment directed to specific organizations, counterparties, facilities). Distinguish between positive language masking substantive risk. |
| **Customer Text Intelligence** | Treated like generic text | Dedicated customer review/complaint pipeline: complaint category taxonomy, repeated issue detection, customer churn/escalation/cancellation detection, refund/billing dispute indicators. |
| **Sentiment vs. Risk Decoupling** | Handled in prompt & separate functions, but needs explicit analytical rules | Enforce non-conflation: negative sentiment must NOT automatically trigger solvency risk; neutral statements with high risk (e.g. current liabilities exceeding current assets) must be treated as neutral tone with severe financial risk; conditional risks marked as forward-looking. |
| **Cross-Document Pattern Intelligence** | Basic recurrence & trajectory | Escalating vs stable vs declining trend calculation; co-occurring risk matrix; deduplication to avoid repeated messages being treated as independent corroboration. |
| **Verification & Science** | 50 unit tests across basic scenarios | Scientific evaluation benchmark covering: (1) neutral tone + solvency risk, (2) customer complaint + aspect extraction, (3) conditional vs realized risk, (4) duplicate review handling, (5) long document section retention, (6) contradiction detection. |

---

### 3. Implementation Plan

- **Phase 1: Advanced Sentiment & Aspect Engine (`src/lib/intelligence/sentiment-engine.ts`)**:
  - Add Aspect-Based Sentiment Analysis (`AspectSentimentResult`, topics: `product_quality`, `service_support`, `pricing`, `delivery_reliability`, `billing_payment`, `management_execution`, `financial_performance`).
  - Add Entity-Level Sentiment resolution.
  - Implement negation boundary tracking and forward-looking statement separation.
- **Phase 2: Customer Text & Commentary Intelligence (`src/lib/intelligence/customer-text-engine.ts`)**:
  - Dedicated processor for reviews, complaints, and support feedback.
  - Detect cancellation requests, escalation signals, billing disputes, and satisfaction themes.
  - Distinct-customer normalization to prevent duplicated complaint bias.
- **Phase 3: Long Document Segmentation & Chunking (`src/lib/intelligence/document-parser.ts`)**:
  - Add section-aware chunking with sliding window and traceability.
- **Phase 4: Risk Engine Refinement & Decoupling (`src/lib/intelligence/risk-engine.ts`)**:
  - Strict analytical separation between emotional tone and financial risk materiality.
  - Explicit conditional vs historical risk classification.
- **Phase 5: Cross-Document Pattern Aggregator (`src/lib/intelligence/cross-document-engine.ts`)**:
  - Recurring risk trajectory (escalating, stable, declining).
  - Risk co-occurrence analysis.
  - Deduplicated corroboration calculation.
- **Phase 6: UI & Analytical Workspaces Integration**:
  - Connect Aspect Sentiment and Customer Text to the frontend workspaces.
- **Phase 7: Scientific Verification Suite**:
  - Comprehensive automated tests proving all 18 master acceptance criteria.

---

### 4. Implementation & Scientific Verification Results

- **TypeScript Validation (`npx tsc --noEmit`)**: 0 type errors.
- **Vitest Test Suite (`npm test`)**: 9 test files, 58/58 tests passing (100% green).
  - `acceptance-intelligence.test.ts`: 8 critical acceptance scenarios verified (neutral tone + liquidity decoupling, multi-aspect customer sentiment, document segmentation, evidence anchor verification, conditional risk classification, customer message deduplication, negative UI sentiment without false solvency risk, and cross-document co-occurrence).
- **Next.js Production Build (`npm run build`)**: 33/33 static & dynamic routes compiled successfully in optimized mode.
- **Live HTTP E2E Verification**:
  - `POST /api/analyze` with `customer_feedback`: Returns HTTP 201 Created with 4 aspects extracted (`product_quality`, `billing_payments`, `pricing_value`, `delivery_fulfillment`), `customerIntelligence` payload with 2 clusters (`Billing Discrepancy & Unauthorized Charges`, `Customer Cancellation & Churn Intent`).
  - Active daemon: Next.js 15.5.27 running on `http://localhost:3000`.
