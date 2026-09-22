import { CatalogProvider } from "./context/CatalogContext"
import { ComposerProvider } from "./context/ComposerContext"
import { AppHeader } from "./components/cockpit/AppHeader"
import { ResourceNavigator } from "./components/cockpit/ResourceNavigator"
import { Sparkles, Palette, Layers, Terminal } from "lucide-react"

export function App() {
  return (
    <CatalogProvider>
      <ComposerProvider>
        <div className="flex flex-col h-screen w-screen overflow-hidden bg-background text-foreground select-none">
          {/* Top Bar: AppHeader with Brand pill, Cmd+K search, Token gauge, Export */}
          <AppHeader />

          {/* 3-Column Cockpit Workspace */}
          <div className="flex-1 flex overflow-hidden">
            {/* Left Column: Resource Navigator & Brand Preview Modal */}
            <ResourceNavigator />

            {/* Center & Right Column Preview Stage (Phases 5) */}
            <main className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-muted/10 relative overflow-y-auto">
              <div className="max-w-lg space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-xs font-medium text-primary">
                  <Sparkles className="size-3.5" />
                  <span>Open Studio Cockpit Active</span>
                </div>

                <div className="space-y-2">
                  <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                    Design System &amp; Craft Navigator
                  </h1>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Explore 153 curated design systems, 13 craft rules, and 163 skills in the Left Navigator. Click <strong className="text-foreground">Preview</strong> on any card to inspect tokens and typography, or press <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border text-[11px] font-mono">⌘K</kbd> / <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border text-[11px] font-mono">Ctrl+K</kbd> to trigger the quick command palette.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-left">
                  <div className="p-3.5 rounded-xl border border-border/70 bg-card/80 space-y-1">
                    <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                      <Palette className="size-3.5 text-primary" />
                      <span>153 Systems</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Linear, Stripe, Apple, Vercel &amp; more with color swatches &amp; CSS tokens.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl border border-border/70 bg-card/80 space-y-1">
                    <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                      <Layers className="size-3.5 text-primary" />
                      <span>13 Craft Rules</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Anti-AI-slop discipline, WCAG AAA contrast &amp; typography hierarchy.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl border border-border/70 bg-card/80 space-y-1">
                    <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                      <Terminal className="size-3.5 text-primary" />
                      <span>9-Layer Engine</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Center accordion and live prompt inspector coming in Phase 5.
                    </p>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
      </ComposerProvider>
    </CatalogProvider>
  )
}

export default App
