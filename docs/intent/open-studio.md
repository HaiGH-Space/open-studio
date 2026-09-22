# Statement of Intent: Open Studio

## Overview
Open Studio is a specialized Prompt Composer and Generator web application that compiles brand-grade UI/UX design prompts for coding agents (Claude Code, Cursor, Codex/ChatGPT, Windsurf), grounded in the core assets from `open-design-core-resources` (150+ design systems, craft rules, domain skills, and templates).

---

## Core Intent

- **Outcome**: A 100% client-side web application that composes multi-layered, brand-accurate design prompts with real-time token inspection, agent presets, and an interactive `<question-form>` clarification loop.
- **User**: Frontend engineers, product designers, and AI creators using coding agents to generate production-quality UI/UX code without AI styling drift or slop.
- **Why now**: AI coding agents default to generic, visually bland patterns unless anchored with strict brand contracts, design token definitions, and craft discipline rules.
- **Success**: Instant sub-second search across 150+ design systems, zero-lag in-memory prompt compilation across all 9 layers, live token context estimation, agent-specific exports, and human-in-the-loop clarification without terminal or backend dependencies.
- **Constraint**: Pure static client-side execution (deployable to Vercel, GitHub Pages, Cloudflare Pages, or local `pnpm dev` with zero backend server dependencies); on-demand lazy loading for raw Markdown and CSS files to keep the initial JS bundle ultra-fast and lightweight.
- **Out of scope**: Daemon runtime, MCP servers, sub-process CLI runtimes, or autonomous AI execution loops.

---

## Technical Specifications

### 1. Technology Stack
- **Framework**: Vite + React 19 SPA (`web/` workspace) with TypeScript.
- **Styling**: Tailwind CSS v4 + Base UI / Shadcn UI components.
- **Icons**: Lucide React.
- **Token Analytics**: `gpt-tokenizer` (fast in-browser tokenizer).
- **Deployment**: Static build output (`dist/`).

### 2. Resource Ingestion Pipeline
- **Build-Time Indexer (`scripts/generate-catalog.ts`)**:
  - Scans `open-design-core-resources/` (`design-systems/`, `craft/`, `skills/`, `design-templates/`).
  - Generates `web/public/catalog-index.json` containing metadata, tags, category/surface taxonomy, and extracted preview color swatches (`primary`, `background`, `accent`).
  - Copies or links raw asset files into `web/public/data/` for on-demand lazy `fetch()`.
- **Token Extractor**:
  - Parses `tokens.css` to offer either full CSS or an extracted compact `:root` summary to conserve token budget.

### 3. The 9-Layer Composition Pipeline
1. **Layer 1: Prompt-Injection Resistance & Security Guardrails** — Enforces boundary encapsulation against untrusted input or jailbreak attempts.
2. **Layer 2: Core Artifact & UI Inspection Runtime Contract** — Enforces `data-od-id` attributes and includes the `<question-form>` protocol instructions.
3. **Layer 3: Project Metadata & Authoritative Technical Constraints** — Target framework, aspect ratio, slide count, and hard system override directives.
4. **Layer 4: Plugin / Workflow Stage Manifest** — Workflow context (`taskKind`: prototype | deck | dashboard, `phase`: discovery | draft | refine).
5. **Layer 5: Design System Brand Contract** — Ingested in order: `USAGE.md`, `DESIGN.md`, `tokens.css` (Full vs Condensed), `components.json`/`manifest.html`.
6. **Layer 6: Universal Brand-Agnostic Craft Rules** — Anti-AI-slop rules, typography scale, letter-spacing, color contrast, and animation discipline (driven by `od.craft.requires` with manual toggles).
7. **Layer 7: Active Functional Skill / Template Blueprint** — Selected `SKILL.md` body or template scaffold.
8. **Layer 8: Persistent User Rules & Memory Injection** — Custom user design preferences and negative constraints stored in browser `localStorage`.
9. **Layer 9: Dynamic Brief, Clarification State & User Prompt** — User objective + committed answers from `<question-form>` loops.

**Precedence Hierarchy**:
$$\text{Authoritative UI Constraints (L3)} > \text{User Rules / Brief (L8/L9)} > \text{Brand Contract (L5)} > \text{Craft Rules (L6)} > \text{Skill Defaults (L7)}$$

### 4. Agent Targeting & Export Presets
- **Claude Code**: Single XML-delimited prompt (`<open-design-system>`, `<brand-contract>`, `<task>`) or downloadable `CLAUDE.md`.
- **Cursor**: Split System / User task blocks or downloadable `.cursorrules` / `.cursor/rules/*.mdc`.
- **Generic LLM / ChatGPT**: Dual-tab System & User copy/paste.

### 5. Workspace Layout & `<question-form>` Clarification Loop
- **3-Column Cockpit Layout**:
  - **Left (~25%)**: Resource Navigator with fuzzy search, taxonomy chips (SaaS, Fintech, Editorial, Dark Mode, etc.), and brand preview cards with live color swatches.
  - **Center (~45%)**: 9-layer accordion manager with toggles and token modes, authoritative constraints bar, User Brief editor, and "Paste AI Clarification" drawer.
  - **Right (~30%)**: Real-time syntax-highlighted compiled prompt inspector, token meter with per-layer breakdown, agent preset switchers, and 1-click Copy/Export actions.
- **Interactive Clarification Loop**:
  - Regex parser extracts `<question-form>` from pasted AI responses.
  - Dynamically renders interactive form fields (radio, checkbox, text).
  - Automatically compiles submitted answers into a `<clarification-answers>` block inside Layer 9.
