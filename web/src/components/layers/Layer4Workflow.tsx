import { useComposer } from "../../hooks/useComposer"
import type { TaskKind, WorkflowPhase } from "../../lib/composer/composer-types"
import { Briefcase, GitBranch } from "lucide-react"

export function Layer4Workflow() {
  const { config, updateLayer } = useComposer()
  const { taskKind, phase } = config.layer4WorkflowManifest

  const handleTaskKindChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateLayer("layer4WorkflowManifest", {
      taskKind: e.target.value as TaskKind,
    })
  }

  const handlePhaseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateLayer("layer4WorkflowManifest", {
      phase: e.target.value as WorkflowPhase,
    })
  }

  return (
    <div data-slot="layer4-workflow-panel" className="space-y-4 py-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Task Kind Selection */}
        <div className="space-y-1.5">
          <label
            htmlFor="task-kind-select"
            className="flex items-center gap-1.5 text-xs font-medium text-foreground"
          >
            <Briefcase className="size-3.5 text-primary" />
            <span>Task Kind</span>
          </label>
          <select
            id="task-kind-select"
            data-slot="l4-task-kind-select"
            value={taskKind}
            onChange={handleTaskKindChange}
            className="w-full h-8 px-2.5 rounded-lg border border-border/70 bg-input/20 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
          >
            <option value="application">Full Web Application</option>
            <option value="dashboard">Analytics / SaaS Dashboard</option>
            <option value="marketing-landing">Marketing Landing Page</option>
            <option value="prototype">Rapid Interactive Prototype</option>
            <option value="deck">Visual Presentation Deck</option>
          </select>
        </div>

        {/* Workflow Phase Selection */}
        <div className="space-y-1.5">
          <label
            htmlFor="phase-select"
            className="flex items-center gap-1.5 text-xs font-medium text-foreground"
          >
            <GitBranch className="size-3.5 text-primary" />
            <span>Workflow Phase</span>
          </label>
          <select
            id="phase-select"
            data-slot="l4-phase-select"
            value={phase}
            onChange={handlePhaseChange}
            className="w-full h-8 px-2.5 rounded-lg border border-border/70 bg-input/20 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
          >
            <option value="draft">Draft (Fast layout &amp; scaffolding)</option>
            <option value="refine">Refine (Design polish &amp; spacing)</option>
            <option value="production-ready">Production Ready (Zero-compromise polish)</option>
            <option value="discovery">Discovery (Exploration &amp; ideation)</option>
          </select>
        </div>
      </div>
    </div>
  )
}
