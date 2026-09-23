# Technology Stack & Dependencies

## Overview
Open Studio is a client-side single page web application built with modern TypeScript, React 19, and Vite 8. It compiles UI design prompts directly in the browser with zero backend server dependencies.

---

## Core Production Stack

| Category | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Language** | [TypeScript](https://www.typescriptlang.org/) | `~6` | Static type safety and strict contracts across components, engines, and indexers |
| **UI Framework** | [React](https://react.dev/) | `^19.2.8` | Declarative UI component tree, context state providers, and hooks |
| **DOM Renderer** | [React DOM](https://react.dev/) | `^19.2.8` | DOM rendering and portal mounting |
| **Build & Bundler** | [Vite](https://vite.dev/) | `^8.3.0` | Client bundler, HMR dev server, static production assets pipeline |
| **Vite React Plugin** | `@vitejs/plugin-react` | `^6` | Fast Refresh and JSX transformation for React |
| **CSS Engine** | [Tailwind CSS](https://tailwindcss.com/) | `^4` | Utility-first styling engine with `@theme` token definitions |
| **Vite Tailwind Plugin** | `@tailwindcss/vite` | `^4` | Direct Vite integration for Tailwind CSS v4 compiler |
| **UI Component Primitives** | [@base-ui/react](https://base-ui.com/) | `^1.8.0` | Accessible unstyled primitives (Dialog, Tabs, Accordion, ScrollArea, Switch, Slider) |
| **Component Helpers** | `shadcn` | `^4.21.0` | Primitive wrappers and theme tokens integration |
| **CSS Class Utilities** | `cn` | `^0.3.2` | Clean classname conditional concatenation |
| **Variant Authority** | `class-variance-authority` | `^0.7.1` | Type-safe component variant dispatching |
| **Animation Tokens** | `tw-animate-css` | `^1.4.0` | CSS keyframe animation helpers for micro-interactions |
| **Iconography** | [Lucide React](https://lucide.dev/) | `^1.47.0` | Consistent, lightweight SVG icon system |
| **Typography** | `@fontsource-variable/inter` | `^5.3.0` | Variable geometric sans-serif font for UI text |
| **Typography (Secondary)** | `@fontsource-variable/roboto` | `^5.3.0` | Variable font family for technical and body elements |

---

## Tooling & Development Stack

| Category | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Package Manager** | [pnpm](https://pnpm.io/) | Workspace | Monorepo package management and script delegation |
| **Script Runner** | `tsx` | `^4.23.15` | Native TypeScript script runner for `generate-catalog.ts` |
| **Test Framework** | [Vitest](https://vitest.dev/) | `^5.0.1` | Ultra-fast Vite-native unit and integration test runner |
| **DOM Environment** | `happy-dom` | `^20.14.5` | Lightweight browser DOM simulation for headless testing |
| **Linter** | [ESLint](https://eslint.org/) | `^10` | Static code analysis and React hook enforcement |
| **TypeScript Linter** | `typescript-eslint` | `^8` | TypeScript AST rules for ESLint |
| **Formatter** | [Prettier](https://prettier.io/) | `^3.9.6` | Opinionated code formatting across TS, TSX, CSS, JSON |
| **Tailwind Formatter** | `prettier-plugin-tailwindcss` | `^0.8.1` | Automatic Tailwind CSS class sorting |

---

## Build & Workspace Scripts

Defined in root `package.json` delegating to `web` package:

- `pnpm dev`: Runs Vite development server (`vite`)
- `pnpm build`: Executes `tsc -b && vite build` generating static files in `web/dist/`
- `pnpm test`: Runs Vitest test suite (`vitest run`)
- `pnpm typecheck`: Executes `tsc --noEmit`
- `pnpm lint`: Runs ESLint analysis (`eslint .`)
- `pnpm catalog:generate`: Executes TS build script `scripts/generate-catalog.ts` via `tsx`

---

## Evidence & Verification Sources

- Root workspace configuration: [`package.json`](../../package.json)
- Web application dependencies: [`web/package.json`](../../web/package.json)
- Vite configuration: [`web/vite.config.ts`](../../web/vite.config.ts)
- TypeScript settings: [`web/tsconfig.json`](../../web/tsconfig.json), [`web/tsconfig.app.json`](../../web/tsconfig.app.json)
- ESLint configuration: [`web/eslint.config.js`](../../web/eslint.config.js)
