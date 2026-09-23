# Code Conventions & Style Guidelines

## Overview
Open Studio adheres to strict TypeScript standards, immutable component interfaces, clean decoupling between pure domain logic and React UI, and test-friendly DOM attributes.

---

## TypeScript Guidelines

1. **Strict Type Safety**:
   - `tsconfig.app.json` has `strict: true`, `noUncheckedIndexedAccess: true`, and `noImplicitOverride: true`.
   - The `any` type is strictly forbidden. Use explicit interfaces or generics.
2. **Immutable Interface Properties**:
   - Props interfaces and domain state models use `readonly` property modifiers:
     ```typescript
     export interface StudioCockpitProps {
       readonly className?: string
     }
     ```
3. **Explicit Service Contracts**:
   - Services are defined by TypeScript interfaces (e.g., `ICatalogService`) to enable dependency injection and isolated test mocking.
4. **Error Handling**:
   - Catch blocks use `unknown` and perform type checking before accessing properties:
     ```typescript
     try {
       // ...
     } catch (err) {
       const message = err instanceof Error ? err.message : String(err)
       console.warn("Failed operation:", message)
     }
     ```

---

## Component Architecture

1. **Pure Presentation vs Domain Logic**:
   - Core algorithms (parsers, AST generators, serializers, token estimators, formatters) reside in pure TypeScript modules in `web/src/lib/` with 0 DOM or React dependencies.
   - React components in `web/src/components/` consume domain logic via hooks and contexts.
2. **Testable DOM Elements with `data-slot`**:
   - All major containers and interactive controls feature `data-slot` attributes for resilient query selectors in unit and E2E tests:
     ```tsx
     <header data-slot="app-header" className="...">
     <div data-slot="active-brand-badge" className="...">
     ```
3. **Accessibility**:
   - Dialogs, tabs, accordions, and switches use `@base-ui/react` primitives to ensure proper ARIA roles, keyboard focus traps, and screen-reader accessibility.

---

## File & Directory Naming

| Category | Convention | Examples |
| :--- | :--- | :--- |
| **React Components** | PascalCase `.tsx` | `StudioCockpit.tsx`, `AppHeader.tsx`, `QuestionFormModal.tsx` |
| **Custom Hooks** | camelCase with `use` prefix `.ts` | `useCatalog.ts`, `useComposer.ts`, `useTokenCount.ts` |
| **Domain Logic & Services** | kebab-case `.ts` | `catalog-service.ts`, `question-form-parser.ts`, `9-layer-composer.ts` |
| **Types & Contracts** | kebab-case `.ts` | `catalog-types.ts`, `composer-types.ts` |
| **Test Suites** | kebab-case `.test.ts` or `.test.tsx` | `catalog-indexer.test.ts`, `cockpit-e2e.test.tsx` |

---

## Styling Conventions

1. **Tailwind CSS v4 Integration**:
   - CSS variables defined in `@theme` in `web/src/index.css`.
   - Dynamic colors leverage semantic tokens: `bg-background`, `text-foreground`, `bg-primary`, `border-border`.
2. **Class Merging**:
   - Use the `cn()` utility (`import { cn } from "cn"`) for all conditional and prop-driven class concatenation.

---

## Evidence & Verification Sources

- Strict compiler configuration: [`web/tsconfig.app.json`](../../web/tsconfig.app.json)
- Interface definitions: [`web/src/lib/catalog/catalog-types.ts`](../../web/src/lib/catalog/catalog-types.ts)
- Component slot patterns: [`web/src/components/cockpit/AppHeader.tsx`](../../web/src/components/cockpit/AppHeader.tsx)
- Pure domain logic separation: [`web/src/lib/clarification/question-form-parser.ts`](../../web/src/lib/clarification/question-form-parser.ts)
