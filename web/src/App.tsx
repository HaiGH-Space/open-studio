import { CatalogProvider } from "./context/CatalogContext"
import { ComposerProvider } from "./context/ComposerContext"
import { useComposer } from "./hooks/useComposer"
import { AppHeader } from "./components/cockpit/AppHeader"
import { ResourceNavigator } from "./components/cockpit/ResourceNavigator"
import { ComposerManager } from "./components/cockpit/ComposerManager"
import { FileText, Copy, Check } from "lucide-react"
import { useState } from "react"

function CockpitContent() {
  const { compiledPrompt } = useComposer()
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(compiledPrompt.fullPrompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Left Column: Resource Navigator & Brand Preview Modal */}
      <ResourceNavigator />

      {/* Center Column: 9-Layer Composer Manager (Task 13) */}
      <ComposerManager className="flex-1 border-r border-border/70 min-w-0" />

      {/* Right Column Preview: Live Prompt Inspector (Phase 5) */}
      <aside className="w-80 lg:w-96 shrink-0 flex flex-col h-full bg-card/30 overflow-hidden border-l border-border/60">
        <div className="p-3.5 border-b border-border/60 bg-background/40 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
            <FileText className="size-3.5 text-primary" />
            <span>Compiled Prompt Preview</span>
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-border/70 bg-input/20 hover:bg-input/40 text-xs font-medium text-foreground transition-all cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="size-3 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="size-3" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 font-mono text-[11px] leading-relaxed text-muted-foreground whitespace-pre-wrap select-text bg-muted/10">
          {compiledPrompt.fullPrompt}
        </div>
      </aside>
    </div>
  )
}

export function App() {
  return (
    <CatalogProvider>
      <ComposerProvider>
        <div className="flex flex-col h-screen w-screen overflow-hidden bg-background text-foreground select-none">
          {/* Top Bar: AppHeader with Brand pill, Cmd+K search, Token gauge, Export */}
          <AppHeader />

          {/* 3-Column Cockpit Workspace */}
          <CockpitContent />
        </div>
      </ComposerProvider>
    </CatalogProvider>
  )
}

export default App
