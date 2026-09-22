# Implementation Plan: Open Studio (Prompt Composer & Generator)

## Overview

Open Studio is a 100% client-side web application that decouples prompt synthesis from agent execution, eliminating OS spawn buffer limit failures (`ENAMETOOLONG`, Issue #7733) and daemon crashes. It ingests 153 curated design systems, 13 craft rulebooks, 114 templates, and 163 skills from `open-design-core-resources` to compose multi-layer, brand-accurate design prompts for Claude Code, Cursor, and universal LLMs. The application features a 9-layer deterministic composition pipeline, in-browser token analytics via `gpt-tokenizer`, an interactive `<question-form>` clarification engine, and a desktop-first 3-column cockpit interface.

## Architecture Decisions

- **Pure Client-Side Static Execution:** Zero backend servers, zero background daemons, zero CLI child-process execution. The application compiles to static assets deployable on GitHub Pages, Cloudflare Pages, or Vercel, running entirely in browser memory.
- **Two-Tier Catalog Ingestion (Build Index + On-Demand Fetch):** A build-time Node/TypeScript indexer (`scripts/generate-catalog.ts`) generates a lightweight `public/catalog-index.json` (~350KB uncompressed, ~60KB gzipped) containing metadata, taxonomy, color swatches, and token metrics. Raw documentation (`DESIGN.md`, `USAGE.md`), CSS files, and HTML fixtures are stored under `public/data/` and fetched lazily on selection to preserve sub-second initial paint.
- **Strict 9-Layer Precedence Hierarchy:** Layer compilation strictly enforces authority precedence:
  $$\text{L3 (Technical Constraints)} > \text{L8/L9 (User Brief \& Directives)} > \text{L5 (Brand Contract)} > \text{L6 (Craft Rules)} > \text{L7 (Skill Defaults)}$$
  All output is encapsulated in distinct XML tags (`<authoritative-constraints>`, `<brand-contract>`, etc.) with prompt-injection sanitization.
- **Condensed `:root` Token Mode:** To prevent token bloat, `tokens.css` can be included in full (1,500–4,000 tokens) or stripped down to essential brand variables (colors, radii, typography, ~65% token reduction).
- **Interactive `<question-form>` AST Parser:** Agents request clarification by returning an embedded `<question-form>` XML tag. An in-browser parser generates a type-safe AST that dynamically renders radio/checkbox/text form fields, compiling submitted answers back into `<clarification-answers>` in Layer 9.
- **Standardized UI System:** React 19 + Vite 8 + TypeScript + Tailwind CSS v4 + Base UI primitives (`@base-ui/react`) styled with `cva` and `cn` utilities.

---

## Detailed Task Breakdown

### Phase 1: Foundations & Catalog Indexer (`catalog-indexer`)

#### Task 1: Test Infrastructure & Catalog TypeScript Contracts

**Description:** Configure lightweight Vitest (Node environment, without jsdom) in the `web` workspace and define core data contracts and schemas for catalog indexing.
**Acceptance criteria:**

- [x] `vitest` in `web/package.json` with `"test": "vitest run"` script.
- [x] `web/src/lib/catalog/catalog-types.ts` exports complete interfaces (`CatalogIndex`, `DesignSystemCatalogEntry`, `CraftRuleCatalogEntry`, `SkillCatalogEntry`, `TemplateCatalogEntry`, `ColorSwatches`, `TokenSummary`).
- [x] `web/public/schemas/catalog-index.schema.json` matches JSON schema specification in Section 6.2 of SPEC.
- [x] `pnpm --filter web test` executes cleanly.
      **Verification:**
- [x] Tests pass: `pnpm --filter web test`
- [x] Build succeeds: `pnpm --filter web typecheck`
- [x] Manual check: Types export without circular dependencies.
      **Dependencies:** None
      **Files likely touched:**
- `web/package.json`
- `web/vite.config.ts`
- `web/src/lib/catalog/catalog-types.ts`
- `web/public/schemas/catalog-index.schema.json`
  **Estimated scope:** Medium: 4 files

---

#### Task 2: Build-Time Catalog Indexer & Asset Bundler

**Description:** Implement `scripts/generate-catalog.ts` to scan `open-design-core-resources`, extract taxonomy, swatches, and token metrics, and generate `web/public/catalog-index.json` plus `web/public/data/`.
**Acceptance criteria:**

- [x] Scans 153 design systems, 13 craft rules, 163 skills, and 114 design templates from `open-design-core-resources/`.
- [x] Extracts color swatches (`primary`, `background`, `accent`, `foreground`, `muted`) parsing HEX, RGB, and OKLCH CSS values.
- [x] Analyzes `tokens.css` to compute `totalCssVariables`, `condensedCssVariablesCount`, and top 8 preview declarations.
- [x] Copies referenced Markdown docs and CSS files into `web/public/data/` for on-demand lazy loading.
- [x] Registered as `catalog:generate` script in `web/package.json` and root script.
      **Verification:**
- [x] Tests pass: `tsx scripts/generate-catalog.ts` executes in < 2 seconds.
- [x] Build succeeds: Generated `web/public/catalog-index.json` is valid JSON and contains all 153 systems.
- [x] Manual check: Swatches for known design systems (e.g. `linear-app`, `stripe`) match their CSS tokens.
      **Dependencies:** Task 1
      **Files likely touched:**
- `scripts/generate-catalog.ts`
- `web/package.json`
- `package.json`
  **Estimated scope:** Medium: 3 files

---

#### Task 3: Unit Tests & Schema Validation for Catalog Indexer

**Description:** Add comprehensive unit tests and automated JSON Schema validation for `generate-catalog.ts` and its generated output.
**Acceptance criteria:**

- [x] Vitest unit test verifies swatch extraction from various CSS formats (HEX, RGB, HSL, OKLCH).
- [x] Vitest unit test validates generated `catalog-index.json` against `catalog-index.schema.json`.
- [x] Tests verify condensed token generation strips private/internal utility variables while preserving brand tokens.
      **Verification:**
- [x] Tests pass: `pnpm --filter web test tests/catalog-indexer.test.ts`
- [x] Build succeeds: `pnpm --filter web typecheck`
- [x] Manual check: All assertions in `catalog-indexer.test.ts` pass without warnings.
      **Dependencies:** Task 2
      **Files likely touched:**
- `web/tests/catalog-indexer.test.ts`
- `web/tests/fixtures/sample-tokens.css`
  **Estimated scope:** Small: 2 files

---

### Checkpoint 1: Catalog Indexing Foundation

- [x] `pnpm --filter web run catalog:generate` runs in < 2 seconds and produces valid `web/public/catalog-index.json`.
- [x] Schema validation and indexer unit tests pass 100%.
- [x] `web/public/data/` populated with static asset files for on-demand fetching.

---

### Phase 2: Core Domain Logic & Clarification Engine (`prompt-composer`)

#### Task 4: In-Browser Token Counter Service

**Description:** Implement client-side token counting using standard 4 characters per token heuristic to support real-time token gauge and per-layer cost tracking.
**Acceptance criteria:**

- [x] In-browser 4 characters per token heuristic integrated into `web/src/lib/tokenizer/token-counter.ts`.
- [x] Function `countTokens(text: string): number` returns fast, accurate token approximations.
- [x] Function `estimateCost(tokens: number, model: string): { inputCost: number }` provides cost estimation.
- [x] Unit tests verify token counts for small, medium, and multi-thousand word strings.
      **Verification:**
- [x] Tests pass: `pnpm --filter web test tests/token-counter.test.ts`
- [x] Build succeeds: `pnpm --filter web typecheck`
- [x] Manual check: Token counting for a 10KB prompt executes in under 5ms.
      **Dependencies:** Task 1
      **Files likely touched:**
- `web/package.json`
- `web/src/lib/tokenizer/token-counter.ts`
- `web/tests/token-counter.test.ts`
  **Estimated scope:** Small: 3 files

---

#### Task 5: `<question-form>` AST Parser & Answer Serializer

**Description:** Implement robust AST parser for `<question-form>` XML tags embedded in AI responses, with support for radio, checkbox, and text fields, plus answer serialization.
**Acceptance criteria:**

- [ ] `web/src/lib/clarification/question-form-types.ts` defines `QuestionFormAST`, `QuestionNode`, and `ClarificationAnswerEntry`.
- [ ] `web/src/lib/clarification/question-form-parser.ts` parses valid `<question-form>` XML into AST.
- [ ] Parser handles malformed or incomplete XML gracefully without throwing unhandled exceptions.
- [ ] Serializer `serializeAnswers(answers)` formats user answers into `<clarification-answers>` XML block.
- [ ] Unit tests cover radio, checkbox, text inputs, invalid XML fallbacks, and roundtrip serialization.
      **Verification:**
- [ ] Tests pass: `pnpm --filter web test tests/question-form-parser.test.ts`
- [ ] Build succeeds: `pnpm --filter web typecheck`
- [ ] Manual check: AST correctly captures checked attributes and default option values.
      **Dependencies:** Task 1
      **Files likely touched:**
- `web/src/lib/clarification/question-form-types.ts`
- `web/src/lib/clarification/question-form-parser.ts`
- `web/tests/question-form-parser.test.ts`
  **Estimated scope:** Small: 3 files

---

#### Task 6: 9-Layer Prompt Composer Core Engine & Compilers

**Description:** Build the in-memory 9-layer prompt synthesis engine that resolves layer configuration, enforces precedence, sanitizes user input, and compiles XML/Markdown prompt output.
**Acceptance criteria:**

- [ ] `web/src/lib/composer/composer-types.ts` implements `ComposerConfig`, `LayerCompilationResult`, and `CompiledPromptResult`.
- [ ] `web/src/lib/composer/layer-compilers.ts` contains dedicated compiler functions for Layers 1 through 9.
- [ ] `web/src/lib/composer/prompt-composer.ts` compiles full prompt, calculates per-layer token breakdown, and formats system/user blocks.
- [ ] Enforces authority hierarchy: L3 Constraints > L8/L9 User Brief > L5 Brand Contract > L6 Craft > L7 Skills.
- [ ] Unit tests verify deterministic output, layer toggling, condensed tokens formatting, and token calculation.
      **Verification:**
- [ ] Tests pass: `pnpm --filter web test tests/prompt-composer.test.ts`
- [ ] Build succeeds: `pnpm --filter web typecheck`
- [ ] Manual check: All 9 layer tags (`<security-guardrails>`, `<brand-contract>`, etc.) are well-formed and non-empty.
      **Dependencies:** Tasks 4, 5
      **Files likely touched:**
- `web/src/lib/composer/composer-types.ts`
- `web/src/lib/composer/layer-compilers.ts`
- `web/src/lib/composer/prompt-composer.ts`
- `web/tests/prompt-composer.test.ts`
  **Estimated scope:** Medium: 4 files

---

### Checkpoint 2: Prompt Engine & Clarification AST

- [ ] `prompt-composer` compiles all 9 layers deterministically in < 20ms.
- [ ] `question-form-parser` parses complex multi-field XML and produces clean `<clarification-answers>`.
- [ ] In-browser token estimation calculates layer breakdowns accurately with Vitest coverage > 90%.

---

### Phase 3: Exporters, Catalog Service & State Pipeline

#### Task 7: Agent-Specific Export Formatters

**Description:** Implement export adapters for Claude Code (`CLAUDE.md`), Cursor (`.cursorrules` and `.cursor/rules/open-studio.mdc`), and Generic LLMs.
**Acceptance criteria:**

- [ ] `web/src/lib/export/claude-code-exporter.ts` produces prompt optimized for Claude 3.7 Sonnet reasoning mode + downloadable `CLAUDE.md`.
- [ ] `web/src/lib/export/cursor-exporter.ts` splits System Rules vs. User Task and generates downloadable `.cursorrules`.
- [ ] `web/src/lib/export/generic-llm-exporter.ts` provides clean Markdown copy-paste targets for ChatGPT, v0, Lovable, and Gemini.
- [ ] Unit tests verify export format structure, file names, mime-types, and clipboard outputs.
      **Verification:**
- [ ] Tests pass: `pnpm --filter web test tests/agent-exporters.test.ts`
- [ ] Build succeeds: `pnpm --filter web typecheck`
- [ ] Manual check: Downloadable file contents match expected agent conventions.
      **Dependencies:** Task 6
      **Files likely touched:**
- `web/src/lib/export/export-types.ts`
- `web/src/lib/export/claude-code-exporter.ts`
- `web/src/lib/export/cursor-exporter.ts`
- `web/src/lib/export/generic-llm-exporter.ts`
- `web/tests/agent-exporters.test.ts`
  **Estimated scope:** Medium: 5 files

---

#### Task 8: Catalog Client Service & LocalStorage Persistence

**Description:** Implement `CatalogService` for fetching index/assets and `persistence.ts` for saving user preferences, memory directives, and draft briefs in `localStorage`.
**Acceptance criteria:**

- [ ] `web/src/lib/catalog/catalog-service.ts` implements `ICatalogService` with caching for `catalog-index.json` and static asset text.
- [ ] `web/src/lib/storage/persistence.ts` provides typed getters/setters for user rules (Layer 8), dark mode theme, and draft brief auto-save.
- [ ] Gracefully handles `localStorage` quota errors or non-browser environments.
- [ ] Unit tests verify caching behavior and storage read/write serialization.
      **Verification:**
- [ ] Tests pass: `pnpm --filter web test tests/catalog-service.test.ts tests/persistence.test.ts`
- [ ] Build succeeds: `pnpm --filter web typecheck`
- [ ] Manual check: Reloading simulated state restores saved user rules and draft text.
      **Dependencies:** Tasks 1, 6
      **Files likely touched:**
- `web/src/lib/catalog/catalog-service.ts`
- `web/src/lib/storage/persistence.ts`
- `web/tests/catalog-service.test.ts`
- `web/tests/persistence.test.ts`
  **Estimated scope:** Medium: 4 files

---

#### Task 9: Composer & Catalog React Contexts and Custom Hooks

**Description:** Create React Context providers (`CatalogContext`, `ComposerContext`) and custom hooks (`useCatalog`, `useComposer`, `useTokenCount`) to drive reactive application state.
**Acceptance criteria:**

- [ ] `CatalogContext` manages catalog loading, error states, active search query, and category filters.
- [ ] `ComposerContext` manages `ComposerConfig`, debounced (100ms) re-compilation, active agent target, and clarification rounds.
- [ ] `useTokenCount` hook provides real-time token metrics and budget usage.
- [ ] Component tests verify state updates propagate to compiled output within 100ms debounce.
      **Verification:**
- [ ] Tests pass: `pnpm --filter web test tests/composer-context.test.tsx`
- [ ] Build succeeds: `pnpm --filter web typecheck`
- [ ] Manual check: Hook consumers receive updated prompt whenever config changes.
      **Dependencies:** Tasks 6, 8
      **Files likely touched:**
- `web/src/context/CatalogContext.tsx`
- `web/src/context/ComposerContext.tsx`
- `web/src/hooks/useCatalog.ts`
- `web/src/hooks/useComposer.ts`
- `web/src/hooks/useTokenCount.ts`
  **Estimated scope:** Medium: 5 files

---

### Checkpoint 3: Client Services & State Pipeline

- [ ] `CatalogService` successfully loads catalog and caches asset requests.
- [ ] `useComposer` updates prompt output and token counts reactively with 100ms debounce.
- [ ] Agent exporters generate valid `CLAUDE.md`, `.cursorrules`, and generic LLM outputs.

---

### Phase 4: UI Primitives & Navigation Cockpit (`studio-ui` part 1)

#### Task 10: Atomic UI Components (Base UI + Tailwind v4)

**Description:** Build accessible, themed atomic UI primitives using `@base-ui/react`, Tailwind CSS v4, and `cva`.
**Acceptance criteria:**

- [ ] Implements atomic components in `web/src/components/ui/`: `accordion.tsx`, `badge.tsx`, `dialog.tsx`, `input.tsx`, `select.tsx`, `switch.tsx`, `tabs.tsx`, `textarea.tsx`, `tooltip.tsx`.
- [ ] All components follow dark-mode first, sleek styling with accessible keyboard navigation (Focus rings, ARIA roles).
- [ ] Component tests verify open/close, select changes, and toggle switch behavior.
      **Verification:**
- [ ] Tests pass: `pnpm --filter web test tests/ui-components.test.tsx`
- [ ] Build succeeds: `pnpm --filter web typecheck`
- [ ] Manual check: Components render cleanly with no CSS glitch or missing styles.
      **Dependencies:** Task 1
      **Files likely touched:**
- `web/src/components/ui/accordion.tsx`
- `web/src/components/ui/badge.tsx`
- `web/src/components/ui/dialog.tsx`
- `web/src/components/ui/input.tsx`
- `web/src/components/ui/select.tsx`
- `web/src/components/ui/switch.tsx`
- `web/src/components/ui/tabs.tsx`
- `web/src/components/ui/textarea.tsx`
- `web/src/components/ui/tooltip.tsx`
  **Estimated scope:** Medium: 5-8 files (atomic UI components)

---

#### Task 11: App Header & Quick Command Palette (Cmd+K)

**Description:** Build `AppHeader` featuring brand logo, active design system pill, token gauge summary, quick export button, and Cmd+K command search dialog.
**Acceptance criteria:**

- [ ] `AppHeader.tsx` displays logo, active brand badge, global token count, and quick export action.
- [ ] `CommandMenuDialog.tsx` opens on `Cmd+K` or `Ctrl+K`, allowing instant search and activation of any design system or craft rule.
- [ ] Keyboard shortcut listener cleans up properly on unmount.
      **Verification:**
- [ ] Tests pass: `pnpm --filter web test tests/app-header.test.tsx`
- [ ] Build succeeds: `pnpm --filter web typecheck`
- [ ] Manual check: Pressing `Cmd+K` opens dialog; selecting an item sets active design system.
      **Dependencies:** Tasks 9, 10
      **Files likely touched:**
- `web/src/components/cockpit/AppHeader.tsx`
- `web/src/components/cockpit/CommandMenuDialog.tsx`
  **Estimated scope:** Small: 2 files

---

#### Task 12: Left Column: Resource Navigator & Brand Preview Modal

**Description:** Build `ResourceNavigator` containing search bar, category dropdown, tag chips, resource tabs (Design Systems, Craft Rules, Skills), brand cards with swatches, and the `DesignSystemPreviewModal`.
**Acceptance criteria:**

- [ ] Real-time search and category filtering filters 153 design systems with < 16ms render response.
- [ ] `DesignSystemCard` displays name, category, tags, token metrics, and `ColorSwatchBar` with primary/accent colors.
- [ ] Clicking "Select" sets active brand for Layer 5; clicking "Preview" opens `DesignSystemPreviewModal`.
- [ ] `DesignSystemPreviewModal` renders preview tabs (Tokens CSS, Typography, Components HTML) with syntax preview.
- [ ] Craft Rules tab lists rules with instant enable/disable toggle switches.
      **Verification:**
- [ ] Tests pass: `pnpm --filter web test tests/resource-navigator.test.tsx`
- [ ] Build succeeds: `pnpm --filter web typecheck`
- [ ] Manual check: Typing in search filters card list immediately; preview modal displays CSS variables.
      **Dependencies:** Tasks 9, 10
      **Files likely touched:**
- `web/src/components/cockpit/ResourceNavigator.tsx`
- `web/src/components/cockpit/DesignSystemCard.tsx`
- `web/src/components/cockpit/ColorSwatchBar.tsx`
- `web/src/components/preview/DesignSystemPreviewModal.tsx`
  **Estimated scope:** Medium: 4 files

---

### Checkpoint 4: Navigation, Discovery & UI Primitives

- [ ] Resource Navigator renders cards for all design systems and craft rules smoothly.
- [ ] Search filter updates list at 60fps (< 16ms).
- [ ] Cmd+K search modal and Design System Preview Modal open and operate smoothly.

---

### Phase 5: Composer Cockpit & Interactive Clarification Loop (`studio-ui` part 2)

#### Task 13: Center Column: 9-Layer Accordion Panels & Preset Action Bar

**Description:** Implement `ComposerManager` with quick preset buttons (SaaS, Fintech, Dashboard, Reset) and configuration panels for Layers 1 through 8.
**Acceptance criteria:**

- [ ] `ComposerManager.tsx` renders accordion items for L1 through L8 with active badges and toggles.
- [ ] `Layer3Constraints.tsx` provides framework dropdown (React, Next.js, Vite, HTML Vanilla), CSS engine, and viewport switches.
- [ ] `Layer5DesignSystem.tsx` shows active system, token mode toggle (Condensed vs. Full), and asset inclusion checkboxes (`tokens.css`, `DESIGN.md`, `USAGE.md`).
- [ ] `Layer6CraftRules.tsx` renders recommended rules chip grid and custom craft directive input.
- [ ] `Layer8UserRules.tsx` allows adding/removing persistent directives and negative constraints.
- [ ] Preset actions (e.g. "SaaS Starter", "Fintech Dark") configure layers in 1-click.
      **Verification:**
- [ ] Tests pass: `pnpm --filter web test tests/composer-manager.test.tsx`
- [ ] Build succeeds: `pnpm --filter web typecheck`
- [ ] Manual check: Toggling accordion items and changing constraints immediately updates composer config.
      **Dependencies:** Tasks 9, 10
      **Files likely touched:**
- `web/src/components/cockpit/ComposerManager.tsx`
- `web/src/components/layers/Layer1Security.tsx`
- `web/src/components/layers/Layer2RuntimeContract.tsx`
- `web/src/components/layers/Layer3Constraints.tsx`
- `web/src/components/layers/Layer5DesignSystem.tsx`
- `web/src/components/layers/Layer6CraftRules.tsx`
- `web/src/components/layers/Layer8UserRules.tsx`
  **Estimated scope:** Medium: 5 files

---

#### Task 14: Interactive `<question-form>` Clarification Loop & Layer 9

**Description:** Implement Layer 9 Brief panel, AI response paste drawer, dynamic `QuestionFormRenderer` for parsed `<question-form>` ASTs, and answer submission into Layer 9.
**Acceptance criteria:**

- [ ] `Layer9BriefClarification.tsx` provides multi-line textarea for user objective and feature checklist inputs.
- [ ] "Paste AI Response" drawer/modal accepts raw text containing `<question-form>` XML.
- [ ] `QuestionFormModal.tsx` and `QuestionFieldRenderer.tsx` dynamically render radio buttons, checkboxes, and text inputs based on AST.
- [ ] Submitting answers serializes entries into `<clarification-answers>` and injects them into Layer 9.
- [ ] Shows submitted answers summary with option to edit or clear rounds.
      **Verification:**
- [ ] Tests pass: `pnpm --filter web test tests/clarification-loop.test.tsx`
- [ ] Build succeeds: `pnpm --filter web typecheck`
- [ ] Manual check: Pasting sample AI XML renders interactive form, and submitting appends answers to prompt output.
      **Dependencies:** Tasks 5, 9, 10
      **Files likely touched:**
- `web/src/components/layers/Layer9BriefClarification.tsx`
- `web/src/components/clarification/QuestionFormModal.tsx`
- `web/src/components/clarification/QuestionFieldRenderer.tsx`
  **Estimated scope:** Medium: 3 files

---

#### Task 15: Right Column: Prompt Inspector, Token Breakdown & Exporters

**Description:** Build `PromptInspector` featuring agent target selector tabs (Claude Code, Cursor, Generic), token gauge bar, per-layer token stacked bar, syntax-highlighted prompt viewer with copy toast, and file download menu.
**Acceptance criteria:**

- [ ] Displays live token gauge bar with visual color indicators (green < 30k, amber 30k-80k, red > 80k).
- [ ] `LayerTokenStackedBar.tsx` displays horizontal stacked bar breakdown showing proportional tokens per layer.
- [ ] `PromptOutputViewer.tsx` displays compiled prompt with copy-to-clipboard button and success toast notification.
- [ ] `ExportFooterBar.tsx` provides download dropdown to export `CLAUDE.md`, `.cursorrules`, `.cursor/rules/open-studio.mdc`, or `prompt.xml`.
      **Verification:**
- [ ] Tests pass: `pnpm --filter web test tests/prompt-inspector.test.tsx`
- [ ] Build succeeds: `pnpm --filter web typecheck`
- [ ] Manual check: Clicking Copy triggers clipboard copy and displays toast; selecting target agent formats prompt accordingly.
      **Dependencies:** Tasks 7, 9, 10
      **Files likely touched:**
- `web/src/components/cockpit/PromptInspector.tsx`
- `web/src/components/cockpit/LayerTokenStackedBar.tsx`
- `web/src/components/cockpit/PromptOutputViewer.tsx`
- `web/src/components/cockpit/ExportFooterBar.tsx`
  **Estimated scope:** Medium: 4 files

---

#### Task 16: Complete Cockpit Integration & End-to-End Flow Verification

**Description:** Assemble the 3-column `StudioCockpit` in `App.tsx`, wire all providers, and implement end-to-end integration tests covering the complete user journey.
**Acceptance criteria:**

- [ ] `StudioCockpit.tsx` coordinates Left (Resource Navigator), Center (Composer Manager), and Right (Prompt Inspector) panes in a responsive full-viewport layout (`100vh`).
- [ ] `App.tsx` wraps tree with `ThemeProvider`, `CatalogProvider`, and `ComposerProvider`.
- [ ] End-to-end integration test covers: Loading catalog → Selecting Linear design system → Toggling Anti-AI-Slop craft rule → Entering user brief → Pasting `<question-form>` XML → Answering question → Copying compiled prompt.
- [ ] `pnpm --filter web build` builds clean production bundle under 300KB (gzipped).
      **Verification:**
- [ ] Tests pass: `pnpm --filter web test tests/cockpit-e2e.test.tsx`
- [ ] Build succeeds: `pnpm --filter web build`
- [ ] Manual check: Application loads in browser, all 3 columns scroll independently, prompt compiles reactively.
      **Dependencies:** Tasks 11, 12, 13, 14, 15
      **Files likely touched:**
- `web/src/components/cockpit/StudioCockpit.tsx`
- `web/src/App.tsx`
- `web/tests/cockpit-e2e.test.tsx`
  **Estimated scope:** Medium: 3 files

---

### Checkpoint 5: Complete Open Studio Application

- [ ] Complete 3-column cockpit interface operates smoothly with zero console errors.
- [ ] End-to-end flow from search to question form loop to export passes automated tests.
- [ ] Static build (`pnpm --filter web build`) succeeds cleanly.

---

## Dependency Graph

```
Task 1: Test Infra & TypeScript Contracts
   │
   ├── Task 2: Build-Time Catalog Indexer
   │      │
   │      └── Task 3: Unit Tests & Schema Validation ─── [Checkpoint 1]
   │
   ├── Task 4: In-Browser Token Counter
   │      │
   │      └── Task 6: 9-Layer Prompt Composer Core Engine
   │             │
   ├── Task 5: Question-Form AST Parser ───┘
   │             │
   │             ├── Task 7: Agent-Specific Export Formatters
   │             │
   │             └── Task 8: Catalog Service & LocalStorage ─── [Checkpoint 2]
   │                    │
   │                    └── Task 9: Composer & Catalog React Contexts
   │                           │
   ├── Task 10: Atomic UI Components ───────┤
   │                           │            │
   │                           ├── Task 11: App Header & Cmd+K
   │                           │
   │                           ├── Task 12: Left Column: Resource Navigator ─── [Checkpoint 3 & 4]
   │                           │
   │                           ├── Task 13: Center Column: 9-Layer Accordion
   │                           │
   │                           ├── Task 14: Clarification Loop & Layer 9
   │                           │
   │                           └── Task 15: Right Column: Prompt Inspector
   │                                  │
   └────────────────────────────────── Task 16: Complete Cockpit Integration ─── [Checkpoint 5]
```

---

## Parallelization Opportunities

- **Safe to parallelize:**
  - Task 4 (Token Counter) and Task 5 (Question-Form AST Parser) can be developed simultaneously once Task 1 is complete.
  - Task 7 (Agent Exporters) and Task 8 (Catalog Client Service & Storage) can be built in parallel.
  - Task 10 (Atomic UI Components) can proceed concurrently with domain logic in Phase 2 & 3.
  - Task 12 (Left Column), Task 13 (Center Column), and Task 15 (Right Column) can be built independently once Task 9 and 10 are in place.
- **Must be sequential:**
  - Task 1 → Task 2 → Task 3 (Catalog Indexer pipeline)
  - Task 6 → Task 9 (Prompt Composer must precede Composer Context)
  - Tasks 11–15 → Task 16 (Component panes must precede final Cockpit assembly)

---

## Risks and Mitigations

| Risk                                                      | Impact | Mitigation                                                                                                                                             |
| --------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Ingestion of 153 design systems exceeds browser memory    | High   | Keep `catalog-index.json` lightweight (~350KB) with only metadata and swatches. Lazy-fetch full tokens, docs, and HTML only when a system is selected. |
| In-browser token estimation causes UI lag on large briefs | Medium | Use fast `gpt-tokenizer` with debounced execution (100ms) inside a custom hook, preventing blocking of the main React render thread.                   |
| AI models generate irregular `<question-form>` XML        | Medium | Implement forgiving AST parser with fallback recovery that captures question label and options even if closing tags or attributes are irregular.       |
| Tailored prompt exceeds agent context window              | Low    | Provide live visual token meter with color threshold indicators (green/amber/red) and default to Condensed `:root` token mode to save ~65% tokens.     |

---

## Open Questions

- None blocking. All technical contracts, schemas, and UI layout specifications are completely resolved in `SPEC-open-studio.md`.
