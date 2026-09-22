# Specification: Open Studio (Prompt Composer & Generator)

**Status:** Proposed / Draft  
**Version:** 1.0.0  
**Authors:** Open Studio Architecture Team  
**Date:** 2026-09-22  

---

## 1. Objective & Scope

### 1.1 Problem Statement
AI coding agents (such as Claude Code, Cursor, Windsurf, Codex, and ChatGPT) default to visually generic, formulaic user interfaces ("AI slop") unless guided by comprehensive design tokens, strict craft guidelines, and contextual component blueprints.

Existing toolchains (e.g., Open Design CLI daemon) attempt to compose and deliver prompts via child process execution wrappers. In practice, this architecture suffers from:
1. **OS Buffer Limit Failures (Issue #7733):** Rich design systems with full token sets, typography rules, and HTML fixtures exceed command-line spawn length limits (`spawn ENAMETOOLONG` on Windows).
2. **Agent Stdio Hangs & 503 Errors:** Subprocess handshakes and MCP connections frequently freeze or crash.
3. **High Setup Friction:** Developers must install and configure complex CLI tools and local background daemons just to get high-craft prompts.

### 1.2 The Open Studio Solution
Open Studio decouples **prompt synthesis** from **agent execution**:
- A **100% client-side web application** (zero backend, zero CLI daemon, zero `ENAMETOOLONG` errors).
- Integrates the full `open-design-core-resources` catalog: **153 design systems**, **13 craft rulebooks**, **114 design templates**, and **163 skills**.
- Employs a deterministic **9-Layer Prompt Composition Pipeline** with explicit tag encapsulation, token-reduction modes, and live token analytics.
- Features a **Human-in-the-Loop Clarification Engine** that parses `<question-form>` XML tags from AI responses into interactive forms and injects answers into subsequent prompts.
- Provides **1-Click Agent-Specific Exports** tailored for Claude Code, Cursor (`.cursorrules` / `.cursor/rules/*.mdc`), and universal chat panes.

---

## 2. Capability Map (Phase 0 Scope Check)

Open Studio decomposes into three distinct, independently testable modules:

| Module ID | Responsibility | Boundary & Inputs | Outputs | Depends On |
|:---|:---|:---|:---|:---|
| `catalog-indexer` | Static resource extraction, taxonomy indexing, swatch parsing, token summarization | `open-design-core-resources/` assets | `catalog-index.json`, static asset bundles in `public/data/` | None (standalone build script) |
| `prompt-composer` | 9-layer prompt synthesis, token analytics, `<question-form>` parsing, agent formatting | Layer configurations, user brief, catalog assets | Compiled prompt string, token metrics, agent export files | `catalog-indexer` (schemas) |
| `studio-ui` | 3-column cockpit interface, catalog browser, layer accordion controls, interactive clarification forms | User interactions, catalog index, composer engine | Interactive browser view, clipboard copy, file downloads | `prompt-composer`, `catalog-indexer` |

**Build Order:** `catalog-indexer` → `prompt-composer` → `studio-ui`

---

## 3. Assumptions & Tradeoffs

### Assumptions
1. **Pure Client-Side Runtime:** All prompt compilation, token counting, and state management run in the browser memory. Static hosting targets: GitHub Pages, Cloudflare Pages, Vercel, or local Vite dev server.
2. **Submodule Source of Truth:** `open-design-core-resources` is the authoritative source for design systems, craft guidelines, and skills.
3. **Lazy Asset Fetching:** Only `catalog-index.json` is loaded initially (~350KB uncompressed, ~60KB gzipped). Individual Markdown docs, CSS files, and HTML fixtures are fetched on-demand when a user selects a design system or craft rule.
4. **Target Modern Browsers:** ES2023+ (Chrome/Edge 110+, Safari 16.4+, Firefox 115+).

### Tradeoffs
- **In-Browser Token Counting:** Exact BPE tokenization for every model family can bloat the bundle. **Decision:** Use lightweight `gpt-tokenizer` for accurate OpenAI/Claude approximation, keeping client-side bundle size under 200KB.
- **Full vs. Condensed Tokens:** Raw `tokens.css` files can consume 1,500 to 4,000 tokens. **Decision:** Provide a "Condensed `:root`" mode that strips internal utility variables and comments, retaining core brand variables (colors, radii, font families) to reduce token count by ~65%.

---

## 4. Tech Stack & Commands

### 4.1 Tech Stack
- **Web Framework:** React 19 + Vite 8 + TypeScript 5+ (Strict mode)
- **Styling:** Tailwind CSS v4 + Base UI (`@base-ui/react`) + Class Variance Authority (`cva`)
- **Icons:** Lucide React (`lucide-react`)
- **Token Analytics:** `gpt-tokenizer`
- **State Management:** React Context + lightweight custom hooks with `localStorage` persistence
- **Package Manager:** `pnpm` (workspace configuration)

### 4.2 Executable Commands
```bash
# Workspace setup & resource initialization
git submodule update --init --recursive
cd web && pnpm install

# Run asset catalog indexer
pnpm --filter web run catalog:generate
# (or from workspace root: tsx scripts/generate-catalog.ts)

# Development server
pnpm --filter web dev

# Type check
pnpm --filter web typecheck

# Code formatting & linting
pnpm --filter web lint
pnpm --filter web format

# Automated unit & integration tests
pnpm --filter web test
pnpm --filter web test:coverage

# Production static build
pnpm --filter web build
```

---

## 5. Project Structure

```
open-studio/
├── .agents/                               # Agent skills & guidelines
├── docs/
│   ├── intent/
│   │   └── open-studio.md                 # Statement of Intent & architecture decisions
│   └── specs/
│       └── SPEC-open-studio.md            # This specification document
├── open-design-core-resources/            # Git Submodule (curated design assets)
│   ├── craft/                             # 13 Universal Craft rulebooks
│   ├── design-systems/                    # 153 Curated Brand Packages
│   ├── design-templates/                  # 114 Component blueprints
│   ├── prompt-templates/                  # 107 Image & video blueprints
│   └── skills/                            # 163 Agent capability skills
├── scripts/
│   └── generate-catalog.ts                # Catalog indexing build tool
└── web/
    ├── public/
    │   ├── catalog-index.json             # Generated searchable catalog metadata
    │   └── data/                          # On-demand static assets (design systems, craft, skills)
    ├── src/
    │   ├── components/
    │   │   ├── cockpit/                   # 3-Column Cockpit layout containers
    │   │   │   ├── StudioCockpit.tsx
    │   │   │   ├── ResourceNavigator.tsx  # Left column: search, filters, cards
    │   │   │   ├── ComposerManager.tsx    # Center column: 9-layer accordion & brief
    │   │   │   └── PromptInspector.tsx    # Right column: preview, tokens, export
    │   │   ├── layers/                    # Layer-specific configuration panels
    │   │   │   ├── Layer1Security.tsx
    │   │   │   ├── Layer2RuntimeContract.tsx
    │   │   │   ├── Layer3Constraints.tsx
    │   │   │   ├── Layer4Workflow.tsx
    │   │   │   ├── Layer5DesignSystem.tsx
    │   │   │   ├── Layer6CraftRules.tsx
    │   │   │   ├── Layer7SkillTemplate.tsx
    │   │   │   ├── Layer8UserRules.tsx
    │   │   │   └── Layer9BriefClarification.tsx
    │   │   ├── clarification/             # <question-form> loop components
    │   │   │   ├── QuestionFormModal.tsx
    │   │   │   └── QuestionFieldRenderer.tsx
    │   │   ├── preview/                   # Design system preview modal & swatches
    │   │   │   ├── DesignSystemPreviewModal.tsx
    │   │   │   └── ColorSwatchPalette.tsx
    │   │   ├── ui/                        # Reusable atomic UI components (Base UI + Tailwind v4)
    │   │   │   ├── accordion.tsx
    │   │   │   ├── badge.tsx
    │   │   │   ├── button.tsx
    │   │   │   ├── dialog.tsx
    │   │   │   ├── input.tsx
    │   │   │   ├── select.tsx
    │   │   │   ├── switch.tsx
    │   │   │   ├── tabs.tsx
    │   │   │   ├── textarea.tsx
    │   │   │   └── tooltip.tsx
    │   │   └── theme-provider.tsx
    │   ├── lib/
    │   │   ├── catalog/                   # Catalog fetching & caching
    │   │   │   ├── catalog-service.ts
    │   │   │   └── catalog-types.ts
    │   │   ├── composer/                  # In-memory 9-layer prompt engine
    │   │   │   ├── prompt-composer.ts
    │   │   │   ├── layer-compilers.ts
    │   │   │   └── composer-types.ts
    │   │   ├── clarification/             # <question-form> AST parser & serializer
    │   │   │   ├── question-form-parser.ts
    │   │   │   └── question-form-types.ts
    │   │   ├── export/                    # Agent preset formatters
    │   │   │   ├── claude-code-exporter.ts
    │   │   │   ├── cursor-exporter.ts
    │   │   │   └── generic-llm-exporter.ts
    │   │   ├── tokenizer/                 # In-browser token estimation
    │   │   │   └── token-counter.ts
    │   │   ├── storage/                   # LocalStorage persistence for user memory/drafts
    │   │   │   └── persistence.ts
    │   │   └── utils.ts
    │   ├── hooks/
    │   │   ├── useCatalog.ts
    │   │   ├── useComposer.ts
    │   │   └── useTokenCount.ts
    │   ├── App.tsx
    │   ├── main.tsx
    │   └── index.css
    ├── tests/
    │   ├── catalog-indexer.test.ts
    │   ├── prompt-composer.test.ts
    │   ├── question-form-parser.test.ts
    │   └── agent-exporters.test.ts
    └── package.json
```

---

## 6. Data Models for `catalog-index.json`

The build-time indexer parses all design resources and compiles `web/public/catalog-index.json`. Below are the complete TypeScript data contracts and JSON Schema definitions.

### 6.1 TypeScript Interfaces (`src/lib/catalog/catalog-types.ts`)

```typescript
export interface CatalogIndex {
  readonly schemaVersion: 'open-studio-catalog/v1';
  readonly generatedAt: string; // ISO 8601
  readonly stats: CatalogStats;
  readonly taxonomies: CatalogTaxonomies;
  readonly designSystems: readonly DesignSystemCatalogEntry[];
  readonly craftRules: readonly CraftRuleCatalogEntry[];
  readonly skills: readonly SkillCatalogEntry[];
  readonly templates: readonly TemplateCatalogEntry[];
}

export interface CatalogStats {
  readonly totalDesignSystems: number;
  readonly totalCraftRules: number;
  readonly totalSkills: number;
  readonly totalTemplates: number;
}

export interface CatalogTaxonomies {
  readonly categories: readonly string[];
  readonly tags: readonly string[];
  readonly surfaces: readonly string[];
}

export interface ColorSwatches {
  readonly primary?: string;
  readonly background?: string;
  readonly foreground?: string;
  readonly accent?: string;
  readonly muted?: string;
}

export interface TokenSummary {
  readonly totalCssVariables: number;
  readonly hasColorRamps: boolean;
  readonly hasRadiusTokens: boolean;
  readonly hasTypographyTokens: boolean;
  readonly condensedCssVariablesCount: number;
  readonly previewDeclarations: readonly string[]; // Top 8 key declarations
}

export interface DesignSystemCatalogEntry {
  readonly id: string; // e.g. "linear-app", "stripe", "apple"
  readonly name: string; // e.g. "Linear"
  readonly category: string; // e.g. "Productivity & SaaS"
  readonly description: string;
  readonly tags: readonly string[]; // e.g. ["dark-mode", "minimal", "bento", "saas"]
  readonly swatches: ColorSwatches;
  readonly tokenSummary: TokenSummary;
  readonly craft: {
    readonly suggested: readonly string[];
    readonly exemptions: readonly string[];
  };
  readonly availableFiles: {
    readonly hasUsage: boolean;
    readonly hasDesignMd: boolean;
    readonly hasTokensCss: boolean;
    readonly hasTailwindCss: boolean;
    readonly hasComponentsHtml: boolean;
    readonly hasComponentsManifest: boolean;
  };
  readonly assetPaths: {
    readonly basePath: string; // e.g. "data/design-systems/linear-app"
    readonly usage?: string;
    readonly designMd?: string;
    readonly tokensCss?: string;
    readonly tailwindCss?: string;
    readonly componentsHtml?: string;
    readonly componentsManifest?: string;
  };
}

export interface CraftRuleCatalogEntry {
  readonly id: string; // e.g. "anti-ai-slop", "typography-hierarchy"
  readonly name: string; // e.g. "Anti-AI-Slop Discipline"
  readonly category: 'discipline' | 'typography' | 'color' | 'ux' | 'accessibility' | 'motion';
  readonly description: string;
  readonly ruleCount: number;
  readonly isDefaultEnabled: boolean;
  readonly assetPath: string; // e.g. "data/craft/anti-ai-slop.md"
}

export interface SkillCatalogEntry {
  readonly id: string; // e.g. "emilkowalski-motion", "d3-visualization"
  readonly name: string;
  readonly description: string;
  readonly category: string;
  readonly triggers: readonly string[];
  readonly assetPath: string; // e.g. "data/skills/emilkowalski-motion/SKILL.md"
}

export interface TemplateCatalogEntry {
  readonly id: string; // e.g. "saas-landing", "fintech-dashboard"
  readonly name: string;
  readonly category: 'design-template' | 'prompt-template';
  readonly description: string;
  readonly surface: 'landing' | 'dashboard' | 'mobile' | 'deck' | 'form' | 'component' | 'media';
  readonly assetPath: string;
}
```

### 6.2 JSON Schema Contract (`catalog-index.schema.json`)

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://open-studio.dev/schemas/catalog-index.json",
  "title": "OpenStudioCatalogIndex",
  "type": "object",
  "required": [
    "schemaVersion",
    "generatedAt",
    "stats",
    "taxonomies",
    "designSystems",
    "craftRules",
    "skills",
    "templates"
  ],
  "properties": {
    "schemaVersion": { "type": "string", "const": "open-studio-catalog/v1" },
    "generatedAt": { "type": "string", "format": "date-time" },
    "stats": {
      "type": "object",
      "required": ["totalDesignSystems", "totalCraftRules", "totalSkills", "totalTemplates"],
      "properties": {
        "totalDesignSystems": { "type": "integer", "minimum": 0 },
        "totalCraftRules": { "type": "integer", "minimum": 0 },
        "totalSkills": { "type": "integer", "minimum": 0 },
        "totalTemplates": { "type": "integer", "minimum": 0 }
      }
    },
    "taxonomies": {
      "type": "object",
      "required": ["categories", "tags", "surfaces"],
      "properties": {
        "categories": { "type": "array", "items": { "type": "string" } },
        "tags": { "type": "array", "items": { "type": "string" } },
        "surfaces": { "type": "array", "items": { "type": "string" } }
      }
    },
    "designSystems": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["id", "name", "category", "description", "tags", "swatches", "tokenSummary", "availableFiles", "assetPaths"],
        "properties": {
          "id": { "type": "string" },
          "name": { "type": "string" },
          "category": { "type": "string" },
          "description": { "type": "string" },
          "tags": { "type": "array", "items": { "type": "string" } },
          "swatches": {
            "type": "object",
            "properties": {
              "primary": { "type": "string" },
              "background": { "type": "string" },
              "foreground": { "type": "string" },
              "accent": { "type": "string" },
              "muted": { "type": "string" }
            }
          },
          "tokenSummary": {
            "type": "object",
            "required": ["totalCssVariables", "hasColorRamps", "hasRadiusTokens", "hasTypographyTokens", "condensedCssVariablesCount"],
            "properties": {
              "totalCssVariables": { "type": "integer" },
              "hasColorRamps": { "type": "boolean" },
              "hasRadiusTokens": { "type": "boolean" },
              "hasTypographyTokens": { "type": "boolean" },
              "condensedCssVariablesCount": { "type": "integer" },
              "previewDeclarations": { "type": "array", "items": { "type": "string" } }
            }
          }
        }
      }
    },
    "craftRules": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["id", "name", "category", "description", "ruleCount", "isDefaultEnabled", "assetPath"]
      }
    }
  }
}
```

---

## 7. API Schemas & Pipeline Contracts

Open Studio operates without a remote backend. The APIs define in-memory service boundaries, prompt compilation contracts, `<question-form>` protocols, and export encoders.

### 7.1 Catalog Service API (`CatalogService`)

```typescript
export interface ICatalogService {
  /** Loads the cached catalog index or fetches from public/catalog-index.json */
  loadCatalog(): Promise<CatalogIndex>;

  /** Retrieves a raw Markdown, CSS, or JSON text file on demand */
  fetchAssetContent(assetRelativePath: string): Promise<string>;

  /** Retrieves full or condensed CSS tokens for a design system */
  fetchDesignTokens(systemId: string, mode: 'full' | 'condensed'): Promise<string>;

  /** Retrieves the bundled design system assets for composition */
  fetchDesignSystemBundle(systemId: string): Promise<{
    usage?: string;
    designMd?: string;
    tokensCss?: string;
    componentsHtml?: string;
  }>;
}
```

### 7.2 The 9-Layer Composer Engine Contract

The composer takes a unified configuration object, resolves layer precedence, and compiles an XML/Markdown structured output.

```typescript
export type TargetFramework = 'react' | 'nextjs' | 'vite' | 'html-vanilla' | 'vue' | 'svelte';
export type CssEngine = 'tailwind-v4' | 'tailwind-v3' | 'css-modules' | 'vanilla-css';
export type TaskKind = 'prototype' | 'deck' | 'dashboard' | 'marketing-landing' | 'application';
export type WorkflowPhase = 'discovery' | 'draft' | 'refine' | 'production-ready';
export type TokenMode = 'condensed' | 'full';

export interface ComposerConfig {
  readonly layer1Security: {
    readonly enabled: boolean;
    readonly strictMode: boolean; // Disallow arbitrary script injections or framework escaping
  };
  readonly layer2RuntimeContract: {
    readonly enabled: boolean;
    readonly enforceDataOdId: boolean; // Require data-od-id="..." attributes on all key DOM elements
    readonly injectQuestionProtocol: boolean; // Instruct model how to format <question-form>
  };
  readonly layer3AuthoritativeConstraints: {
    readonly enabled: boolean;
    readonly targetFramework: TargetFramework;
    readonly cssEngine: CssEngine;
    readonly viewport: 'responsive' | 'desktop-only' | 'mobile-only';
    readonly aspectRatio?: string; // e.g. "16:9" for slides
    readonly strictHardRules: readonly string[]; // Overriding rules that supersede user requests
  };
  readonly layer4WorkflowManifest: {
    readonly enabled: boolean;
    readonly taskKind: TaskKind;
    readonly phase: WorkflowPhase;
  };
  readonly layer5BrandContract: {
    readonly enabled: boolean;
    readonly selectedSystemId?: string;
    readonly tokenMode: TokenMode;
    readonly includeUsage: boolean;
    readonly includeDesignMd: boolean;
    readonly includeTokensCss: boolean;
    readonly includeComponentsHtml: boolean;
  };
  readonly layer6CraftRules: {
    readonly enabled: boolean;
    readonly selectedRuleIds: readonly string[];
    readonly customCraftDirectives: readonly string[];
  };
  readonly layer7SkillTemplate: {
    readonly enabled: boolean;
    readonly selectedSkillId?: string;
    readonly selectedTemplateId?: string;
  };
  readonly layer8UserMemory: {
    readonly enabled: boolean;
    readonly persistentDirectives: readonly string[]; // Stored in localStorage
    readonly negativeConstraints: readonly string[]; // "Never use gradients", "No floating modals"
  };
  readonly layer9BriefAndClarification: {
    readonly userObjective: string;
    readonly featureRequirements: readonly string[];
    readonly clarificationAnswers: readonly ClarificationAnswerEntry[];
  };
}

export interface LayerCompilationResult {
  readonly layerIndex: number;
  readonly layerName: string;
  readonly xmlTag: string;
  readonly content: string;
  readonly tokenCount: number;
  readonly enabled: boolean;
}

export interface CompiledPromptResult {
  readonly fullPrompt: string;
  readonly systemPromptBlock: string;
  readonly userPromptBlock: string;
  readonly totalTokens: number;
  readonly layerBreakdown: readonly LayerCompilationResult[];
  readonly generatedAt: string;
}
```

### 7.3 Precedence Hierarchy Formulation
The layers are rendered in hierarchical order of authority:
$$\text{L3 (Technical Constraints)} > \text{L8/L9 (User Brief \& Directives)} > \text{L5 (Brand Contract)} > \text{L6 (Craft Rules)} > \text{L7 (Skill Defaults)}$$

Every compiled prompt encapsulates sections with strict, identifiable XML opening/closing tags for instruction following:
```xml
<open-studio-directive version="1.0">
  <security-guardrails>...</security-guardrails>
  <inspection-runtime-contract>...</inspection-runtime-contract>
  <authoritative-constraints>...</authoritative-constraints>
  <workflow-stage>...</workflow-stage>
  <brand-contract id="linear-app">...</brand-contract>
  <craft-discipline>...</craft-discipline>
  <skill-blueprint id="...">...</skill-blueprint>
  <user-memory-rules>...</user-memory-rules>
  <task-brief>
    <objective>...</objective>
    <clarification-answers>...</clarification-answers>
  </task-brief>
</open-studio-directive>
```

### 7.4 Interactive `<question-form>` Protocol & AST

When a coding agent encounters ambiguity or requires user decisions before drafting UI code, Open Studio instructs the model to return an embedded `<question-form>` block.

#### Formal Wire Schema:
```xml
<question-form id="unique-form-id" title="Form Title">
  <question id="q1" type="radio" required="true">
    <label>What visual theme should the analytics dashboard prioritize?</label>
    <option value="dark-slate">Dark Slate (Default Linear style)</option>
    <option value="high-contrast-light">High Contrast Light</option>
  </question>
  <question id="q2" type="checkbox">
    <label>Which chart modules should be displayed on first paint?</label>
    <option value="revenue-velocity" checked="true">Revenue Velocity Area Chart</option>
    <option value="latency-p99">P99 Latency Bar Chart</option>
    <option value="live-activity-stream">Live Activity Stream</option>
  </question>
  <question id="q3" type="text" placeholder="e.g. Acme Corp internal analytics">
    <label>What is the brand title or workspace display name?</label>
  </question>
</question-form>
```

#### TypeScript AST & Parser Schema (`src/lib/clarification/question-form-types.ts`):

```typescript
export type QuestionType = 'radio' | 'checkbox' | 'text' | 'textarea';

export interface QuestionOption {
  readonly value: string;
  readonly label: string;
  readonly defaultChecked?: boolean;
}

export interface QuestionNode {
  readonly id: string;
  readonly type: QuestionType;
  readonly label: string;
  readonly required?: boolean;
  readonly placeholder?: string;
  readonly options?: readonly QuestionOption[];
}

export interface QuestionFormAST {
  readonly formId: string;
  readonly title: string;
  readonly description?: string;
  readonly questions: readonly QuestionNode[];
}

export interface ClarificationAnswerEntry {
  readonly questionId: string;
  readonly questionLabel: string;
  readonly selectedValues: readonly string[];
}

export interface IQuestionFormParser {
  /** Scans raw text response from AI for <question-form> and compiles AST */
  parseForm(rawAiResponse: string): QuestionFormAST | null;

  /** Formats user answers into XML to be appended to Layer 9 */
  serializeAnswers(answers: readonly ClarificationAnswerEntry[]): string;
}
```

### 7.5 Agent Export Formatter Contracts

```typescript
export interface IAgentExporter {
  readonly agentName: 'claude-code' | 'cursor' | 'generic-llm';

  /** Formats the compiled prompt for the specific agent target */
  formatExport(result: CompiledPromptResult, config: ComposerConfig): AgentExportPackage;
}

export interface AgentExportPackage {
  readonly primaryClipboardText: string;
  readonly secondaryClipboardText?: string;
  readonly downloadableFiles: readonly {
    readonly filename: string;
    readonly mimeType: string;
    readonly content: string;
  }[];
}
```

1. **Claude Code Exporter:** Produces an integrated prompt wrapped with strict XML delimiters optimized for Claude 3.7 Sonnet’s extended reasoning mode, plus downloadable `CLAUDE.md`.
2. **Cursor Exporter:** Generates two distinct copy targets (System Rules vs. User Message) and generates ready-to-save `.cursorrules` or `.cursor/rules/open-studio.mdc`.
3. **Generic LLM Exporter:** Markdown-clean prompt with clear copy-paste demarcation for ChatGPT, v0, Lovable, Gemini, and Antigravity chat.

---

## 8. UI Component Hierarchy & State Architecture

### 8.1 3-Column Cockpit Layout
Open Studio utilizes a desktop-first, full-viewport cockpit layout (`100vh`) with three coordinated functional panes:

```
+------------------------------------------------------------------------------------+
|  AppHeader: Logo | Active Brand Pill | Quick Search (Cmd+K) | Token Meter | Export |
+--------------------------+------------------------------+--------------------------+
| Left Column (~25%)       | Center Column (~45%)         | Right Column (~30%)      |
| Resource Navigator       | Composer Manager             | Prompt Inspector         |
|--------------------------|------------------------------|--------------------------|
| Search & Category Filter | Quick Presets Bar            | Agent Target Selector    |
| Tabs: Systems | Rules    | Layer Accordion (L1 to L9):  | Token Gauge & Budget Bar |
| Virtualized Card List    |  - [L1] Security Guardrails  | Syntax-Colored Preview   |
|   - Brand Preview Card   |  - [L3] Hard Constraints     | Layer Token Breakdown    |
|     (Live Swatches)      |  - [L5] Brand Contract (DS)  | 1-Click Copy Button      |
|   - Craft Rule Toggle    |  - [L6] Craft Discipline     | Download Artifacts Drop  |
| Preview Modal Trigger    |  - [L9] Brief & Form Loop    |                          |
+--------------------------+------------------------------+--------------------------+
```

### 8.2 Component Tree & Hierarchy

```
<App>
└── <ThemeProvider defaultTheme="dark">
    └── <CatalogProvider>
        └── <ComposerProvider>
            ├── <AppHeader>
            │   ├── <BrandLogo>
            │   ├── <ActiveBrandBadge>
            │   ├── <CommandMenuDialog> (Cmd+K Search Modal)
            │   ├── <GlobalTokenBadge>
            │   └── <QuickExportButton>
            │
            └── <StudioCockpit> (Flex row: h-[calc(100vh-4rem)])
                │
                ├── <ResourceNavigator> (w-[26rem] shrink-0 border-r)
                │   ├── <CatalogSearchBar>
                │   ├── <CategoryFilterDropdown>
                │   ├── <TagFilterChips>
                │   ├── <ResourceTabs value={tab} onChange={setTab}>
                │   │   ├── <TabsList> ("Design Systems", "Craft Rules", "Skills")
                │   │   ├── <TabsContent value="design-systems">
                │   │   │   └── <DesignSystemCardList>
                │   │   │       └── <DesignSystemCard>
                │   │   │           ├── <CardHeader (Name, Category, Badges)>
                │   │   │           ├── <ColorSwatchBar swatches={item.swatches} />
                │   │   │           ├── <TokenMetricsBadge totalVars={...} />
                │   │   │           ├── <SelectSystemButton />
                │   │   │           └── <OpenPreviewDialogButton />
                │   │   ├── <TabsContent value="craft-rules">
                │   │   │   └── <CraftRuleCardList>
                │   │   │       └── <CraftRuleItem (ToggleSwitch, RuleCount, CategoryBadge)>
                │   │   └── <TabsContent value="skills">
                │   │       └── <SkillCardList>
                │   └── <DesignSystemPreviewModal>
                │       ├── <PreviewModalHeader>
                │       ├── <PreviewTabs: Tokens | Typography | Components>
                │       └── <TokenCssInspector />
                │
                ├── <ComposerManager> (flex-1 overflow-y-auto px-6 py-4)
                │   ├── <PresetActionBar> (Quick presets: SaaS, Fintech, Dashboard, Reset)
                │   ├── <Accordion type="multiple" defaultValue={["l3", "l5", "l6", "l9"]}>
                │   │   ├── <LayerAccordionItem value="l1"> (<Layer1Security />)
                │   │   ├── <LayerAccordionItem value="l2"> (<Layer2RuntimeContract />)
                │   │   ├── <LayerAccordionItem value="l3"> (<Layer3Constraints />)
                │   │   │   ├── <FrameworkSelect />
                │   │   │   ├── <CssEngineSelect />
                │   │   │   └── <ViewportSegmentedControl />
                │   │   ├── <LayerAccordionItem value="l4"> (<Layer4Workflow />)
                │   │   ├── <LayerAccordionItem value="l5"> (<Layer5DesignSystem />)
                │   │   │   ├── <ActiveSystemBanner />
                │   │   │   ├── <TokenModeSwitch mode={full|condensed} />
                │   │   │   └── <AssetInclusionCheckboxes (Tokens, DESIGN.md, USAGE.md)>
                │   │   ├── <LayerAccordionItem value="l6"> (<Layer6CraftRules />)
                │   │   │   ├── <RecommendedRulesButton />
                │   │   │   └── <CraftRulePillGrid />
                │   │   ├── <LayerAccordionItem value="l7"> (<Layer7SkillTemplate />)
                │   │   ├── <LayerAccordionItem value="l8"> (<Layer8UserRules />)
                │   │   │   └── <DirectivesTagInput />
                │   │   └── <LayerAccordionItem value="l9"> (<Layer9BriefClarification />)
                │   │       ├── <UserBriefTextarea placeholder="Describe the UI..." />
                │   │       ├── <FeatureRequirementsList />
                │   │       └── <ClarificationLoopSection>
                │   │           ├── <PasteAiResponseDrawerTrigger />
                │   │           ├── <QuestionFormRenderer formAst={parsedAst} />
                │   │           │   ├── <RadioQuestionItem />
                │   │           │   ├── <CheckboxQuestionItem />
                │   │           │   └── <TextQuestionItem />
                │   │           └── <AnswersSummaryBadge answers={submittedAnswers} />
                │   │
                └── <PromptInspector> (w-[30rem] shrink-0 border-l flex flex-col)
                    ├── <InspectorHeader>
                    │   ├── <AgentPresetTabs value={targetAgent} />
                    │   └── <TokenGaugeBar tokenCount={totalTokens} modelLimit={128000} />
                    ├── <LayerTokenStackedBar breakdown={layerBreakdown} />
                    ├── <PromptOutputViewer>
                    │   ├── <CopyButtonWithToast />
                    │   └── <MonospaceSyntaxHighlighter code={compiledPrompt} />
                    └── <ExportFooterBar>
                        ├── <PrimaryCopyButton />
                        └── <DownloadMenuDropdown (CLAUDE.md, .cursorrules, prompt.xml)>
```

### 8.3 State Management Architecture
State is maintained via a unidirectional React Context store (`ComposerContext`):
1. **`catalogState`**: Loaded `catalog-index.json`, search query, active taxonomy filters, preview dialog state.
2. **`composerConfig`**: Active settings across all 9 layers, active design system ID, selected craft rules, brief text.
3. **`clarificationState`**: Raw AI pasted text, parsed `QuestionFormAST`, user-selected answers, history of clarified rounds.
4. **`compiledState`**: Debounced (100ms) output of `prompt-composer`, token counts from `gpt-tokenizer`, layer token breakdown.
5. **Persistence (`LocalStorage`)**: User Memory (Layer 8), dark/light theme, custom negative constraints, and draft brief auto-save.

---

## 9. Testing Strategy

| Level | Scope | Tools | Verification Target |
|:---|:---|:---|:---|
| **Unit Tests** | `generate-catalog.ts` indexer | Vitest | Indexer scans all 153 design systems, generates valid `catalog-index.json` satisfying JSON schema, correctly extracts RGB/HEX/OKLCH swatches, and computes token counts. |
| **Unit Tests** | `prompt-composer.ts` engine | Vitest | 9 layers compile deterministically, layer precedence hierarchy is respected, condensed tokens mode strips internal variables, XML tags are balanced and non-empty. |
| **Unit Tests** | `question-form-parser.ts` | Vitest | Correctly parses valid `<question-form>` XML tags, handles malformed tags gracefully without crashing, supports radio/checkbox/text fields, and serializes answers accurately. |
| **Unit Tests** | `agent-exporters.ts` | Vitest | Claude Code, Cursor, and Generic LLM presets export expected schemas and file formats (`CLAUDE.md`, `.cursorrules`). |
| **Component Tests** | UI Cockpit & Form Rendering | Vitest + Testing Library | Search filter updates card list, selecting a design system activates Layer 5, `<QuestionFormRenderer>` renders questions and commits answers to state. |
| **End-to-End** | Full user flow | Playwright | User loads page → selects Linear design system → toggles Anti-AI-Slop → types brief → pastes `<question-form>` response → answers questions → copies final prompt to clipboard. |

---

## 10. Boundaries

### Always Do
- Validate `catalog-index.json` against `catalog-index.schema.json` during the build step.
- Preserve 100% static client-side execution—never introduce mandatory backend server daemons.
- Sanitize and escape user input when generating XML tags to prevent prompt injection inside prompts.
- Maintain strict typing on all layer configs and AST nodes (`noImplicitAny`, strict null checks).
- Provide immediate visual feedback (copy toast, token meter update, swatch previews).

### Ask First
- Adding third-party UI component libraries beyond Base UI and Tailwind CSS v4.
- Altering the 9-layer composition order or XML tag naming conventions.
- Introducing large dependency libraries (>100KB) into the client bundle.

### Never Do
- Never spawn CLI child processes or rely on native OS commands (`spawn`, `exec`) in the browser client.
- Never write hardcoded API keys or external telemetry endpoints into the client source.
- Never bypass the `<question-form>` AST validation when rendering dynamic interactive inputs.

---

## 11. Testable Success Criteria

1. **Catalog Integrity:** `catalog:generate` scans and indexes all 153 design systems in `open-design-core-resources` in < 2 seconds, producing a valid `catalog-index.json` with swatches and token metrics.
2. **Bundle Size & Speed:** Initial web application bundle is < 300KB (gzipped), with First Contentful Paint (FCP) < 0.8s on standard broadband.
3. **Sub-second Search:** Filtering across 153 design systems by query, tag, or category updates results in < 16ms (60fps UI).
4. **Prompt Compilation Performance:** Re-compiling prompts across all 9 layers and calculating live token counts completes in < 50ms upon text input.
5. **Zero OS Limit Failures:** Prompt copying and artifact downloads succeed instantly for any prompt size, completely resolving Issue #7733.
6. **`<question-form>` Clarification Loop:** Pasting an AI XML question block renders an interactive form within 50ms, and submitting answers correctly inserts `<clarification-answers>` into the prompt output.
