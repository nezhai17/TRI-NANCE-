# TRINANCE OMNIVISUAL INTELLIGENCE ENGINE
## Technical Architecture, Visualization Audit & Implementation Specification

### 1. Executive Visual Audit & Baseline Assessment

- **Current Framework**: Next.js 15.5.27 (App Router), React 19, TypeScript 5.7, Tailwind CSS 3.4.
- **Installed Visualization Libraries**: `recharts` 2.15.1, `motion` 12.4.7 (Framer Motion v12), `lucide-react` 0.475.0.
- **Current State**:
  - `AnalyticalCharts.tsx` previously contained only 2 basic, static charts (sentiment pie + severity bar).
  - Risk Center, Sentiment, Financial Analytics, Evidence Explorer, and Entity Explorer had strong tabular and card layouts, but lacked interactive visual graphs, scatter matrices, dynamic timelines, network relationship topologies, and cross-filtering between visualizations and underlying records.
  - AI Copilot responses returned rich markdown and deterministic math cards, but lacked validated visual chart payloads.
  - Missing standardized visualization shell: No unified time window filtering, no data table toggle for accessibility, no SVG/CSV export menu, and no synchronized cross-filtering context across charts.
- **Target Transformation**:
  - Implement a unified institutional financial workstation visual design system.
  - Build a reusable `VisualizationEngine` with standardized shells, tooltips, legends, export menus, and accessible data tables.
  - Deploy dynamic, data-driven graphs across all 10 core workspaces (Dashboard, Risk Center, Sentiment, Financial Analytics, Evidence, Entities, Investigations, Copilot).
  - Implement bidirectional cross-filtering: clicking chart elements (bars, scatter points, network nodes) dynamically filters underlying record tables and highlights linked evidence.
  - Enable interactive chart rendering in AI Copilot message streams.

---

### 2. Design System Tokens & Color Palette

- **Structural Foundations**:
  - Ink Navy Background: `#0A0F1D` (dark headers/toolbars) / `#FFFFFF` (clean analytical cards) / `#F8FAFC` (workspace canvas).
  - Surface Borders: `border-slate-200/90` with subtle elevation `shadow-2xs` and `shadow-xs`.
  - Typography: Geist Sans for UI text, Geist Mono with `tabular-nums` for precise numerical metrics, financial deltas, and coordinates.
- **Analytical Chart Palettes**:
  - Primary Series: Brand Blue `#2563EB`, Steel Indigo `#4F46E5`, Cyan Teal `#0EA5E9`.
  - Semantic Severity: Critical `#DC2626` / `#991B1B`, High `#EA580C`, Medium `#D97706`, Low `#059669`.
  - Sentiment Spectrum: Positive `#10B981`, Negative `#EF4444`, Neutral `#64748B`, Mixed `#F59E0B`.
  - Epistemic Grounding: Documented Fact `#059669`, Hedged Projection `#D97706`, Ambiguous Disclosure `#8B5CF6`.
- **Motion Primitives**:
  - Durations: Micro (150ms), Standard (250ms), Complex Layout (350ms).
  - Easing: `cubic-bezier(0.16, 1, 0.3, 1)` (spring-like institutional precision).
  - Reduced Motion: Fully compliant via `@media (prefers-reduced-motion: reduce)`.

---

### 3. Core Visualization Modules to Implement

1. `src/components/visualization/VisualizationShell.tsx`: Standard container with header, timeframe selector, export menu, data table view toggle, and metadata summary.
2. `src/components/visualization/InteractiveTooltip.tsx`: Institutional dark-navy tooltip with metric delta, percentage share, and source citation tag.
3. `src/components/visualization/ChartDataTable.tsx`: Accessible data table view of underlying series data.
4. `src/components/visualization/RiskPriorityMatrix.tsx`: 2D scatter matrix (Potential Impact vs Evidence Strength / Confidence) with interactive drill-down.
5. `src/components/visualization/CategorySeverityBar.tsx`: 12-category commercial risk horizontal stacked bar with selection filtering.
6. `src/components/visualization/SentimentTrajectoryChart.tsx`: Chronological multi-dossier tone trajectory with zone shading and signal hover.
7. `src/components/visualization/FinancialVarianceWaterfall.tsx`: Multi-metric variance waterfall and period comparison.
8. `src/components/visualization/CashRunwayStressChart.tsx`: Cash burn depletion curve with +25% burn stress scenario.
9. `src/components/visualization/EntityRelationshipNetwork.tsx`: Interactive SVG topology graph mapping organizations, counterparties, auditors, and regulators.
10. `src/components/visualization/EvidenceProvenanceGraph.tsx`: Directed flow from Documents -> Excerpts -> Risk Findings -> Triage Status.
11. `src/components/visualization/CopilotVisualChart.tsx`: Dynamic chart renderer embedded directly into Copilot messages for analytical queries.

---

### 4. Implementation & Verification Progress

- [x] Phase 1: Comprehensive Visual Audit & Architecture Specification.
- [x] Phase 2: Design Tokens & Reusable Visualization Shells (`VisualizationShell`, `InteractiveTooltip`, `ChartDataTable`, `chart-tokens.ts`).
- [x] Phase 3: Core Workspace Visualizations (Dashboard 4-chart suite, Risk 12-category stacked bar + 2D priority scatter matrix, Sentiment chronological tone trajectory + epistemic donut, Financial variance waterfall bridge + cash runway stress curve).
- [x] Phase 4: Forensic & Relational Visualizations (Evidence Lineage Pipeline + tier distribution, Interactive SVG Entity Relationship Network Topology, Audit Resolution Progress Meter).
- [x] Phase 5: AI Copilot Dynamic Visual Output Integration (`CopilotVisualChart` embedded in conversation workspace and drawer, backend automated payload synthesis for variance and runway calculations).
- [x] Phase 6: Cross-Filtering & Synchronized Exploration Engine (clicking categories, chart bars, and scatter dots filters records in place with seamless navigation).
- [x] Phase 7: Type Checking, Automated Tests, Next.js Build, and Live Server Verification.

---

### 5. Production Build & Test Verification Log

- **TypeScript Typecheck (`npx tsc --noEmit`)**: 0 errors.
- **Vitest Unit & Integration Tests (`npm test`)**: 8/8 test files passed, 50/50 test cases green (Copilot engine, risk classification, sentiment scoring, cross-document comparison, numerical extraction, evidence verification, CSV export).
- **Next.js Production Build (`npm run build`)**: 33/33 static & dynamic routes compiled successfully in optimized mode.
- **Live HTTP E2E Verification**:
  - `POST /api/auth/login`: HTTP 200 OK
  - `GET /dashboard`: HTTP 200 OK (223 KB payload)
  - `GET /dashboard/risk`: HTTP 200 OK (644 KB payload)
  - `GET /dashboard/sentiment`: HTTP 200 OK (1.05 MB payload)
  - `GET /dashboard/analytics`: HTTP 200 OK (780 KB payload)
  - `GET /dashboard/evidence`: HTTP 200 OK (1.72 MB payload)
  - `GET /dashboard/entities`: HTTP 200 OK (587 KB payload)
  - `GET /dashboard/investigations`: HTTP 200 OK (50 KB payload)
  - `GET /dashboard/copilot`: HTTP 200 OK (567 KB payload)
  - `GET /dashboard/reports`: HTTP 200 OK (784 KB payload)
  - `POST /api/assistant` (Analytical Query): HTTP 200 OK with deterministic `chartPayload` (`waterfall` bridge rendered with exact metric shifts).
