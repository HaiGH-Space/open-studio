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
        "flex items-center justify-between gap-2 px-4 py-2 border-b border-border/50 bg-background/60 backdrop-blur-xs select-none",
        className
      )}
    >
      <div className="flex items-center gap-1 sm:gap-2 flex-1 max-w-2xl">
        {PHASES.map((phase, idx) => {
          const Icon = phase.icon
          const isActive = currentPhaseId === phase.id
          const isCompleted = currentPhaseId > phase.id
          const isPending = currentPhaseId < phase.id

          return (
            <React.Fragment key={phase.id}>
              {idx > 0 && (
                <ArrowRightIcon className="size-3 text-muted-foreground/40 shrink-0" />
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
                  "flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left transition-all cursor-pointer",
                  isActive &&
                    "bg-primary/10 border border-primary/40 text-foreground shadow-xs",
                  isCompleted &&
                    "text-muted-foreground hover:text-foreground hover:bg-muted/30",
                  isPending &&
                    "text-muted-foreground/60 hover:text-muted-foreground hover:bg-muted/20"
                )}
              >
                <div
                  className={cn(
                    "size-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 transition-colors",
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

                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5">
                    <Icon className="size-3 shrink-0 text-muted-foreground" />
                    <span
                      className={cn(
                        "text-xs font-semibold truncate",
                        isActive ? "text-foreground" : "text-muted-foreground"
                      )}
                    >
                      {phase.title}
                    </span>
                  </div>
                  <span className="hidden sm:inline-block text-[10px] text-muted-foreground/80 truncate">
                    {phase.subtitle}
                  </span>
                </div>
              </button>
            </React.Fragment>
          )
        })}
      </div>

      {/* Active Turn Pill */}
      <div className="shrink-0 flex items-center gap-1.5 pl-2">
        <span
          data-slot="turn-indicator-badge"
          className={cn(
            "text-[10px] font-mono font-medium px-2 py-0.5 rounded-full border transition-all",
            activeTurn === "turn1_discovery"
              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
              : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
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
