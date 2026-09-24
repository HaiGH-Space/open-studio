import React from "react"
import { useComposer } from "../../hooks/useComposer"
import { cn } from "cn"
import {
  Compass as CompassIcon,
  HelpCircle as QuestionIcon,
  Code as CodeIcon,
  CheckCircle2 as CheckIcon,
  ArrowRight as ArrowRightIcon,
} from "lucide-react"

export interface RoundtripPhaseHeaderProps {
  readonly className?: string
}

interface PhaseDefinition {
  readonly id: 1 | 2 | 3
  readonly title: string
  readonly subtitle: string
  readonly icon: React.ComponentType<{ className?: string }>
  readonly dataSlot: string
}

const PHASES: readonly PhaseDefinition[] = [
  {
    id: 1,
    title: "Setup & Discovery",
    subtitle: "Turn 1: Constraints & Brief",
    icon: CompassIcon,
    dataSlot: "phase-step-1",
  },
  {
    id: 2,
    title: "Clarify & Answer",
    subtitle: "AI Questions & Answers",
    icon: QuestionIcon,
    dataSlot: "phase-step-2",
  },
  {
    id: 3,
    title: "Final Code Prompt",
    subtitle: "Turn 2: Production Code",
    icon: CodeIcon,
    dataSlot: "phase-step-3",
  },
]

export function RoundtripPhaseHeader({ className }: RoundtripPhaseHeaderProps) {
  const { roundtripStep, setRoundtripStep, activeTurn } = useComposer()

  // Determine current active phase (1, 2, or 3)
  const currentPhaseId: 1 | 2 | 3 = (() => {
    if (
      roundtripStep === "STEP_1_CONFIGURING" ||
      roundtripStep === "STEP_1_PROMPT_READY"
    ) {
      return 1
    }
    if (
      roundtripStep === "AWAITING_AI_RESPONSE" ||
      roundtripStep === "CLARIFICATION_ACTIVE"
    ) {
      return 2
    }
    return 3
  })()

  return (
    <div
      data-slot="roundtrip-phase-header"
      className={cn(
        "flex items-center justify-between gap-2 border-b border-border/50 bg-background/60 px-4 py-2 backdrop-blur-xs select-none",
        className
      )}
    >
      <div className="flex max-w-2xl flex-1 items-center gap-1 sm:gap-2">
        {PHASES.map((phase, idx) => {
          const Icon = phase.icon
          const isActive = currentPhaseId === phase.id
          const isCompleted = currentPhaseId > phase.id
          const isPending = currentPhaseId < phase.id

          return (
            <React.Fragment key={phase.id}>
              {idx > 0 && (
                <ArrowRightIcon className="size-3 shrink-0 text-muted-foreground/40" />
              )}

              <button
                type="button"
                data-slot={phase.dataSlot}
                onClick={() => {
                  if (phase.id === 1) {
                    setRoundtripStep("STEP_1_CONFIGURING")
                  } else if (phase.id === 2) {
                    setRoundtripStep("AWAITING_AI_RESPONSE")
                  } else if (phase.id === 3) {
                    setRoundtripStep("STEP_2_PROMPT_READY")
                  }
                }}
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 text-left transition-all",
                  isActive &&
                    "border border-primary/40 bg-primary/10 text-foreground shadow-xs",
                  isCompleted &&
                    "text-muted-foreground hover:bg-muted/30 hover:text-foreground",
                  isPending &&
                    "text-muted-foreground/60 hover:bg-muted/20 hover:text-muted-foreground"
                )}
              >
                <div
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold transition-colors",
                    isActive && "bg-primary text-primary-foreground",
                    isCompleted && "bg-muted text-foreground",
                    isPending && "bg-muted/40 text-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <CheckIcon className="size-3 text-primary" />
                  ) : (
                    phase.id
                  )}
                </div>

                <div className="flex min-w-0 flex-col">
                  <div className="flex items-center gap-1.5">
                    <Icon className="size-3 shrink-0 text-muted-foreground" />
                    <span
                      className={cn(
                        "truncate text-xs font-semibold",
                        isActive ? "text-foreground" : "text-muted-foreground"
                      )}
                    >
                      {phase.title}
                    </span>
                  </div>
                  <span className="hidden truncate text-[10px] text-muted-foreground/80 sm:inline-block">
                    {phase.subtitle}
                  </span>
                </div>
              </button>
            </React.Fragment>
          )
        })}
      </div>

      {/* Active Turn Pill */}
      <div className="flex shrink-0 items-center gap-1.5 pl-2">
        <span
          data-slot="turn-indicator-badge"
          className={cn(
            "rounded-full border px-2 py-0.5 font-mono text-[10px] font-medium transition-all",
            activeTurn === "turn1_discovery"
              ? "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
              : "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          )}
        >
          {activeTurn === "turn1_discovery"
            ? "Turn 1: Discovery Diet"
            : "Turn 2: Execution Ready"}
        </span>
      </div>
    </div>
  )
}
