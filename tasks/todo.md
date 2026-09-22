# Task List: Open Studio

## Phase 1: Foundations & Catalog Indexer (`catalog-indexer`)
- [ ] Task 1: Test Infrastructure & Catalog TypeScript Contracts
- [ ] Task 2: Build-Time Catalog Indexer & Asset Bundler
- [ ] Task 3: Unit Tests & Schema Validation for Catalog Indexer

## Checkpoint: Catalog Indexing Foundation
- [ ] `pnpm --filter web run catalog:generate` runs in < 2 seconds and produces valid `web/public/catalog-index.json`
- [ ] Schema validation and indexer unit tests pass 100%
- [ ] `web/public/data/` populated with static asset files for on-demand fetching

## Phase 2: Core Domain Logic & Clarification Engine (`prompt-composer`)
- [ ] Task 4: In-Browser Token Counter Service
- [ ] Task 5: `<question-form>` AST Parser & Answer Serializer
- [ ] Task 6: 9-Layer Prompt Composer Core Engine & Compilers

## Checkpoint: Prompt Engine & Clarification AST
- [ ] `prompt-composer` compiles all 9 layers deterministically in < 20ms
- [ ] `question-form-parser` parses complex multi-field XML and produces clean `<clarification-answers>`
- [ ] In-browser token estimation calculates layer breakdowns accurately with Vitest coverage > 90%

## Phase 3: Exporters, Catalog Service & State Pipeline
- [ ] Task 7: Agent-Specific Export Formatters
- [ ] Task 8: Catalog Client Service & LocalStorage Persistence
- [ ] Task 9: Composer & Catalog React Contexts and Custom Hooks

## Checkpoint: Client Services & State Pipeline
- [ ] `CatalogService` successfully loads catalog and caches asset requests
- [ ] `useComposer` updates prompt output and token counts reactively with 100ms debounce
- [ ] Agent exporters generate valid `CLAUDE.md`, `.cursorrules`, and generic LLM outputs

## Phase 4: UI Primitives & Navigation Cockpit (`studio-ui` part 1)
- [ ] Task 10: Atomic UI Components (Base UI + Tailwind v4)
- [ ] Task 11: App Header & Quick Command Palette (Cmd+K)
- [ ] Task 12: Left Column: Resource Navigator & Brand Preview Modal

## Checkpoint: Navigation, Discovery & UI Primitives
- [ ] Resource Navigator renders cards for all design systems and craft rules smoothly
- [ ] Search filter updates list at 60fps (< 16ms)
- [ ] Cmd+K search modal and Design System Preview Modal open and operate smoothly

## Phase 5: Composer Cockpit & Interactive Clarification Loop (`studio-ui` part 2)
- [ ] Task 13: Center Column: 9-Layer Accordion Panels & Preset Action Bar
- [ ] Task 14: Interactive `<question-form>` Clarification Loop & Layer 9
- [ ] Task 15: Right Column: Prompt Inspector, Token Breakdown & Exporters
- [ ] Task 16: Complete Cockpit Integration & End-to-End Flow Verification

## Checkpoint: Complete Open Studio Application
- [ ] Complete 3-column cockpit interface operates smoothly with zero console errors
- [ ] End-to-end flow from search to question form loop to export passes automated tests
- [ ] Static build (`pnpm --filter web build`) succeeds cleanly
