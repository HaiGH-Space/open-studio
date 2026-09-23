import { CatalogProvider } from "./context/CatalogContext"
import { ComposerProvider } from "./context/ComposerContext"
import { AppHeader } from "./components/cockpit/AppHeader"
import { ResourceNavigator } from "./components/cockpit/ResourceNavigator"
import { ComposerManager } from "./components/cockpit/ComposerManager"
import { PromptInspector } from "./components/cockpit/PromptInspector"

function CockpitContent() {
  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Left Column: Resource Navigator & Brand Preview Modal */}
      <ResourceNavigator />

      {/* Center Column: 9-Layer Composer Manager (Task 13 & 14) */}
      <ComposerManager className="flex-1 border-r border-border/70 min-w-0" />

      {/* Right Column: Prompt Inspector & Exporters (Task 15) */}
      <PromptInspector />
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
