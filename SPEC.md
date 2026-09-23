# Open Studio Specification

The formal, detailed specifications for Open Studio are maintained under:
👉 **[docs/specs/SPEC-open-studio.md](./docs/specs/SPEC-open-studio.md)** (Full Cockpit Architecture & Catalog System)  
👉 **[docs/specs/SPEC-2turn-roundtrip.md](./docs/specs/SPEC-2turn-roundtrip.md)** (Scenario A: 2-Turn External Roundtrip Loop Specification)  

## Summary Capability Map

| Module ID | Responsibility | Inputs / Sources | Outputs | Status |
|:---|:---|:---|:---|:---|
| **`catalog-indexer`** | Resource extraction, taxonomy indexing, color swatch extraction, token summarization | `open-design-core-resources/` assets | `web/public/catalog-index.json`, asset bundles in `public/data/` | Specification Ready |
| **`prompt-composer`** | In-memory 9-layer prompt synthesis, token budget estimation, `<question-form>` AST parser, agent export formatters, 2-turn directives | Layer configs, user brief, catalog assets | Compiled prompt XML/Markdown, token metrics, agent export packages | Specification Ready |
| **`studio-ui`** | 3-column cockpit interface, catalog browser, 9-layer accordion, 5-state discrete state machine, 2-turn roundtrip stepper, live preview | User interactions, catalog index, composer engine | Interactive browser view, clipboard copy, file downloads | Specification Ready |

**Build Order:** `catalog-indexer` → `prompt-composer` → `studio-ui`

Refer to [SPEC-open-studio.md](./docs/specs/SPEC-open-studio.md) and [SPEC-2turn-roundtrip.md](./docs/specs/SPEC-2turn-roundtrip.md) for full TypeScript contracts, JSON schema specifications, API boundaries, and the UI component hierarchy.
