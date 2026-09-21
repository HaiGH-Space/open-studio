# Open Studio — Web Client

The frontend interface for **Open Studio**, built with React 19, Vite, Tailwind CSS v4, and shadcn/ui.

## Tech Stack

- **Framework:** [React 19](https://react.dev/)
- **Bundler:** [Vite](https://vitejs.dev/)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **UI Primitives:** [@base-ui/react](https://base-ui.com/) & [shadcn/ui](https://ui.shadcn.com/)
- **Icons:** [lucide-react](https://lucide.dev/)
- **Type Checking:** [TypeScript](https://www.typescriptlang.org/)

## Development

```bash
# Install dependencies
pnpm install

# Start local dev server
pnpm dev

# Type check
pnpm typecheck

# Lint source files
pnpm lint

# Build production bundle
pnpm build

# Preview production build
pnpm preview
```

## Adding UI Components

Open Studio uses `shadcn/ui` configured with `@base-ui/react` primitives. To add components:

```bash
pnpm dlx shadcn@latest add <component-name>
```

Components are installed into `src/components/ui/`.
