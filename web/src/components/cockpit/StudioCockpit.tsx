import { ResourceNavigator } from "./ResourceNavigator"
import { ComposerManager } from "./ComposerManager"
import { PromptInspector } from "./PromptInspector"
import { cn } from "cn"

export interface StudioCockpitProps {
  readonly className?: string
}

export function StudioCockpit({ className }: StudioCockpitProps = {}) {
  return (
    <main
      data-slot="studio-cockpit"
      className={cn(
        "flex h-full min-h-0 w-full flex-1 overflow-hidden",
        className
      )}
    >
      {/* Left Column: Resource Navigator & Brand Preview Modal */}
      <ResourceNavigator />

      {/* Center Column: 9-Layer Composer Manager (Tasks 13 & 14) */}
      <ComposerManager className="min-w-0 flex-1 border-r border-border/70" />

      {/* Right Column: Prompt Inspector & Exporters (Task 15) */}
      <PromptInspector />
    </main>
  )
}

export default StudioCockpit
