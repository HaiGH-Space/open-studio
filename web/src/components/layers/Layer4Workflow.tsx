import { useComposer } from "../../hooks/useComposer"
import type { TaskKind, WorkflowPhase } from "../../lib/composer/composer-types"
import { Briefcase, GitBranch } from "lucide-react"
import { Label } from "../ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select"

const TASK_KIND_ITEMS = [
  { value: "application", label: "Full Web Application" },
  { value: "dashboard", label: "Analytics / SaaS Dashboard" },
  { value: "marketing-landing", label: "Marketing Landing Page" },
  { value: "prototype", label: "Rapid Interactive Prototype" },
  { value: "deck", label: "Visual Presentation Deck" },
]

const PHASE_ITEMS = [
  { value: "draft", label: "Draft (Fast layout & scaffolding)" },
  { value: "refine", label: "Refine (Design polish & spacing)" },
  {
    value: "production-ready",
    label: "Production Ready (Zero-compromise polish)",
  },
  { value: "discovery", label: "Discovery (Exploration & ideation)" },
]

export function Layer4Workflow() {
  const { config, updateLayer } = useComposer()
  const { taskKind, phase } = config.layer4WorkflowManifest

  const handleTaskKindChange = (val: string | null) => {
    if (val) {
      updateLayer("layer4WorkflowManifest", {
        taskKind: val as TaskKind,
      })
    }
  }

  const handlePhaseChange = (val: string | null) => {
    if (val) {
      updateLayer("layer4WorkflowManifest", {
        phase: val as WorkflowPhase,
      })
    }
  }

  return (
    <div data-slot="layer4-workflow-panel" className="space-y-4 py-2">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {/* Task Kind Selection */}
        <div className="relative space-y-1.5">
          <Label
            htmlFor="task-kind-select"
            className="flex cursor-pointer items-center gap-1.5 text-xs font-medium text-foreground"
          >
            <Briefcase className="size-3.5 text-primary" />
            <span>Task Kind</span>
          </Label>
          <select
            id="task-kind-select-native"
            data-slot="l4-task-kind-select"
            tabIndex={-1}
            aria-hidden="true"
            value={taskKind}
            onChange={(e) => handleTaskKindChange(e.target.value)}
            className="sr-only"
          >
            {TASK_KIND_ITEMS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          <Select
            items={TASK_KIND_ITEMS}
            value={taskKind}
            onValueChange={handleTaskKindChange}
          >
            <SelectTrigger
              id="task-kind-select"
              data-slot="l4-task-kind-trigger"
              size="sm"
              className="w-full cursor-pointer rounded-lg border-border/70 bg-input/20 text-xs"
            >
              <SelectValue placeholder="Select task kind" />
            </SelectTrigger>
            <SelectContent>
              {TASK_KIND_ITEMS.map((item) => (
                <SelectItem
                  key={item.value}
                  value={item.value}
                  className="py-1.5 text-xs"
                >
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Workflow Phase Selection */}
        <div className="relative space-y-1.5">
          <Label
            htmlFor="phase-select"
            className="flex cursor-pointer items-center gap-1.5 text-xs font-medium text-foreground"
          >
            <GitBranch className="size-3.5 text-primary" />
            <span>Workflow Phase</span>
          </Label>
          <select
            id="phase-select-native"
            data-slot="l4-phase-select"
            tabIndex={-1}
            aria-hidden="true"
            value={phase}
            onChange={(e) => handlePhaseChange(e.target.value)}
            className="sr-only"
          >
            {PHASE_ITEMS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          <Select
            items={PHASE_ITEMS}
            value={phase}
            onValueChange={handlePhaseChange}
          >
            <SelectTrigger
              id="phase-select"
              data-slot="l4-phase-trigger"
              size="sm"
              className="w-full cursor-pointer rounded-lg border-border/70 bg-input/20 text-xs"
            >
              <SelectValue placeholder="Select workflow phase" />
            </SelectTrigger>
            <SelectContent>
              {PHASE_ITEMS.map((item) => (
                <SelectItem
                  key={item.value}
                  value={item.value}
                  className="py-1.5 text-xs"
                >
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}
