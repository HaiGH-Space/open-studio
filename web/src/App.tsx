import type React from "react"
import { ThemeProvider } from "./components/theme-provider"
import { CatalogProvider } from "./context/CatalogContext"
import { ComposerProvider } from "./context/ComposerContext"
import { SidebarProvider } from "./components/ui/sidebar"
import { AppHeader } from "./components/cockpit/AppHeader"
import { StudioCockpit } from "./components/cockpit/StudioCockpit"
import type { ICatalogService } from "./lib/catalog/catalog-types"

export interface AppProps {
  readonly catalogService?: ICatalogService
  readonly defaultTheme?: "dark" | "light" | "system"
  readonly debounceMs?: number
}

export function App({
  catalogService,
  defaultTheme = "dark",
  debounceMs,
}: AppProps = {}) {
  return (
    <ThemeProvider defaultTheme={defaultTheme}>
      <CatalogProvider catalogService={catalogService}>
        <ComposerProvider
          catalogService={catalogService}
          debounceMs={debounceMs}
        >
          <SidebarProvider
            defaultOpen={true}
            style={
              {
                "--sidebar-width": "30rem",
                "--sidebar-width-mobile": "22rem",
              } as React.CSSProperties
            }
            className="flex h-screen w-screen min-h-0 flex-col overflow-hidden bg-background text-foreground select-none"
          >
            {/* Top Bar: AppHeader with Brand pill, Cmd+K search, Token gauge, Export, Sidebar toggle */}
            <AppHeader />

            {/* 3-Column Cockpit Workspace (Task 16) */}
            <StudioCockpit />
          </SidebarProvider>
        </ComposerProvider>
      </CatalogProvider>
    </ThemeProvider>
  )
}

export default App
