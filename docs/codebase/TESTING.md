# Testing Strategy & Test Suites

## Overview
Open Studio uses [Vitest](https://vitest.dev/) with [`happy-dom`](https://github.com/capricorn86/happy-dom) for headless browser environment simulation. The test suite thoroughly validates unit domain logic, build-time scripts, React context providers, UI primitives, and end-to-end cockpit workflows.

---

## Test Infrastructure

- **Runner**: Vitest `5.0.1`
- **Environment**: `happy-dom` `20.14.5`
- **Configuration**: Defined in [`web/vite.config.ts`](../../web/vite.config.ts) under the `test` block.
- **Root Invocation**: `pnpm test` (delegates to `pnpm --filter web test`)

---

## Verified Test Suites (16 Files, 303 Tests)

| Test File | Type | Tests | Scope & Assertions |
| :--- | :--- | :---: | :--- |
| [`catalog-contracts.test.ts`](../../web/tests/catalog-contracts.test.ts) | Unit | 18 | Validates catalog TypeScript schemas, taxonomy bounds, and validation guards |
| [`catalog-indexer.test.ts`](../../web/tests/catalog-indexer.test.ts) | Unit | 22 | Tests CSS variable parsing, color swatch extraction (OKLCH, HEX, HSL), and catalog builder |
| [`catalog-service.test.ts`](../../web/tests/catalog-service.test.ts) | Unit | 16 | Tests CatalogService static asset fetching, in-memory LRU caching, and error resilience |
| [`token-counter.test.ts`](../../web/tests/token-counter.test.ts) | Unit | 12 | Tests in-browser token count heuristics, budget alerts, and per-layer calculations |
| [`question-form-parser.test.ts`](../../web/tests/question-form-parser.test.ts) | Unit | 20 | Tests XML AST regex extraction, field types (radio, checkbox, text), and error states |
| [`prompt-composer.test.ts`](../../web/tests/prompt-composer.test.ts) | Unit | 26 | Tests 9-layer prompt compilation, layer precedence hierarchy, and token mode filters |
| [`agent-exporters.test.ts`](../../web/tests/agent-exporters.test.ts) | Unit | 24 | Tests Claude Code (`CLAUDE.md`), Cursor (`.cursorrules`), and Universal Chat output formatting |
| [`persistence.test.ts`](../../web/tests/persistence.test.ts) | Unit | 14 | Tests browser `localStorage` read/write for Layer 8 user memory and active presets |
| [`composer-context.test.tsx`](../../web/tests/composer-context.test.tsx) | Integration | 28 | Tests ComposerProvider state transitions, debounced compilation, and reset actions |
| [`ui-components.test.tsx`](../../web/tests/ui-components.test.tsx) | Component | 28 | Tests Base UI primitives (buttons, switches, dialogs, sliders, tabs, scroll areas) |
| [`app-header.test.tsx`](../../web/tests/app-header.test.tsx) | Component | 20 | Tests header logo, active brand indicator, token gauge bar, and Cmd+K shortcut |
| [`resource-navigator.test.tsx`](../../web/tests/resource-navigator.test.tsx) | Component | 24 | Tests left column fuzzy search, category filter chips, and brand preview modal |
| [`composer-manager.test.tsx`](../../web/tests/composer-manager.test.tsx) | Component | 29 | Tests center column 9-layer accordion toggles, presets bar, and Layer 9 user brief |
| [`clarification-loop.test.tsx`](../../web/tests/clarification-loop.test.tsx) | Component | 22 | Tests question form modal, dynamic input rendering, and XML answer serialization |
| [`prompt-inspector.test.tsx`](../../web/tests/prompt-inspector.test.tsx) | Component | 20 | Tests right column token gauge, per-layer token breakdown, copy to clipboard, and file downloads |
| [`cockpit-e2e.test.tsx`](../../web/tests/cockpit-e2e.test.tsx) | E2E | 10 | Tests full user journey: search brand -> customize layers -> answer clarification -> copy prompt |

**Total passing test cases**: `303 / 303 (100%)`  
**Execution duration**: `~17.8 seconds`

---

## Running Tests

```bash
# Run all tests once
pnpm test

# Run tests in watch mode
pnpm --filter web run test:watch

# Run a specific test suite
pnpm --filter web test tests/cockpit-e2e.test.tsx
```

---

## Evidence & Verification Sources

- Terminal test run output: 16 test files passed, 303 tests passed
- Test directory: [`web/tests/`](../../web/tests)
- Test runner configuration: [`web/vite.config.ts`](../../web/vite.config.ts)
