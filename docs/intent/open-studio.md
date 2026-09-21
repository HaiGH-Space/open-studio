# Statement of Intent: Open Studio

- **Status:** Confirmed
- **Date:** 2026-09-21
- **Project:** Open Studio (Visual Multi-Layer Prompt Composer & Design System Studio)

---

## 1. Outcome
A high-performance, local-first Vite + React + Tailwind web application that indexes and composes multi-layered design prompts into a single **Model-Agnostic Universal Standard** prompt from 151+ brand design systems, 13 craft rulebooks, and 114+ templates.

## 2. Target Users
Frontend engineers, UI/UX designers, and prompt crafters using frontier AI chat interfaces (Claude, ChatGPT, Gemini, DeepSeek, Qwen) or autonomous coding agents (Cursor, Windsurf, Claude Code, Aider).

## 3. Why Now
CLI agent daemons and terminal prompt wrappers frequently suffer from OS buffer and command-line length limits (`spawn ENAMETOOLONG`), agent initialization hangs, and high setup friction. Open Studio decouples prompt synthesis from agent execution with a fast, zero-setup visual workspace that allows users to copy rich design context directly into any AI environment.

## 4. Architecture & Ingestion
- **100% Client-Side:** Static application that can be hosted on GitHub Pages, Vercel, Cloudflare Pages, or run locally.
- **Resource Ingestion:** A lightweight pre-built catalog manifest paired with Vite's `import.meta.glob('/open-design-core-resources/**/*.{md,css,json}', { query: '?raw', eager: false })` for on-demand lazy loading of brand guidelines (`DESIGN.md`), compiled tokens (`tokens.css`), craft rules, and template blueprints so initial application load remains instantaneous.

## 5. Prompt Demarcation Standard
Universal standard format combining structured Markdown sections with standard semantic XML delimiters to ensure top-tier instruction adherence across Claude, OpenAI, and Gemini model families:
- `<brand_specification>`: Selected brand philosophy, design principles, and component patterns.
- `<tokens_css>`: Exact CSS custom properties, color ramps, typography scales, and radius definitions.
- `<craft_rules>`: Toggled universal UI/UX craft rules (anti-AI-slop heuristics, typography rules, accessibility baselines, color restraint).
- `<ui_template>`: Selected artifact shape and component blueprint (e.g., SaaS Landing, Analytics Dashboard, Mobile Flow).
- `<user_goal>`: User-specified feature requirements, constraints, and custom briefs.

## 6. Success Criteria
1. **Catalog Search & Filtering:** Instant fuzzy search and tag filtering across 151+ brands with visual color swatches and typography badges.
2. **Multi-Column Studio Workspace:** Unified, non-linear workspace with independent layer on/off toggles and inline overrides.
3. **Live Offline Metrics:** Client-side token and character estimation with visual threshold indicators and zero network latency.
4. **Export & Output:** One-click copy with toast feedback, and instant `.md` and `.txt` file downloads.
5. **Local Persistence:** Quick-starring (favorites pinned to top) and full Studio Preset Snapshots (saving/restoring complete composer state) persisted in browser `localStorage`, complete with JSON import/export.

## 7. Constraints
- **Zero Server Backend:** No background daemons, no local runtime servers beyond static asset serving.
- **Local-First Privacy:** Zero analytics, zero telemetry tracking, zero cookies, and zero external API keys. No prompt or brief data ever leaves the browser.

## 8. Out of Scope
- Direct in-app LLM API streaming/chat execution.
- Terminal child process spawning or stdio MCP agent handshakes.
- Cloud-synced user accounts or external database infrastructure.
