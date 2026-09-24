import type { ComponentType } from "react"
import { useComposer } from "../../hooks/useComposer"
import { type ActiveAgentTarget } from "../../context/composer-context-def"
import { TokenGaugeBar } from "./TokenGaugeBar"
import { LayerTokenStackedBar } from "./LayerTokenStackedBar"
import { PromptOutputViewer } from "./PromptOutputViewer"
import { ExportFooterBar } from "./ExportFooterBar"
import { cn } from "cn"
import {
  Cpu as CpuIcon,
  Bot as BotIcon,
  Sparkles as SparklesIcon,
  Code as CodeIcon,
  Layers as LayersIcon,
} from "lucide-react"

export interface PromptInspectorProps {
  readonly className?: string
  readonly modelLimit?: number
}

interface AgentTabOption {
  readonly id: ActiveAgentTarget
  readonly label: string
  readonly dataSlot: string
  readonly icon: ComponentType<{ className?: string }>
  readonly hint: string
}

const AGENT_TARGET_TABS: readonly AgentTabOption[] = [
  {
    id: "claude-code",
    label: "Claude Code",
    dataSlot: "agent-tab-claude-code",
    icon: SparklesIcon,
    hint: "Claude 3.7 Sonnet extended reasoning mode with CLAUDE.md",
  },
  {
    id: "cursor",
    label: "Cursor",
    dataSlot: "agent-tab-cursor",
    icon: BotIcon,
    hint: "Dual clipboard: System Rules + User Task (.cursorrules & .mdc)",
  },
  {
    id: "generic-llm",
    label: "Generic LLM",
    dataSlot: "agent-tab-generic-llm",
    icon: CpuIcon,
    hint: "Standard Markdown suitable for ChatGPT, Claude Web & Gemini",
  },
  {
    id: "prompt-xml",
    label: "Prompt XML",
    dataSlot: "agent-tab-prompt-xml",
    icon: CodeIcon,
    hint: "Raw multi-layer XML representation with system & user prompt tags",
  },
]

export function PromptInspector({
  className,
  modelLimit = 128000,
}: PromptInspectorProps) {
  const {
    compiledPrompt,
    agentTarget,
    setAgentTarget,
    getExportOutput,
    activeTurn,
    setActiveTurn,
  } = useComposer()

  const exportOutput = getExportOutput()
  const activeTabMeta = AGENT_TARGET_TABS.find((tab) => tab.id === agentTarget)

  return (
    <aside
      data-slot="prompt-inspector"
      className={cn(
        "flex h-full w-80 shrink-0 flex-col overflow-hidden border-l border-border/60 bg-card/30 lg:w-[30rem]",
        className
      )}
    >
      {/* Top Header: Agent Target Selector Tabs */}
      <div className="flex shrink-0 flex-col gap-2 border-b border-border/60 bg-background/50 p-3 backdrop-blur-md select-none">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
            <LayersIcon className="size-3.5 text-primary" />
            <span>Prompt Inspector</span>
          </div>

          <span className="font-mono text-[10px] text-muted-foreground">
            {compiledPrompt.totalTokens.toLocaleString()} tokens
          </span>
        </div>

        {/* Turn Mode Selector Toggle */}
        <div
          data-slot="turn-mode-toggle"
          className="flex items-center gap-1 rounded-lg border border-border/40 bg-muted/40 p-0.5 text-[11px]"
        >
          <button
            type="button"
            data-slot="turn-mode-turn1-btn"
            onClick={() => setActiveTurn("turn1_discovery")}
            className={cn(
              "flex-1 cursor-pointer truncate rounded-md px-2 py-1 text-center font-medium transition-all",
              activeTurn === "turn1_discovery"
                ? "border border-amber-500/30 bg-amber-500/15 font-semibold text-amber-700 shadow-2xs dark:text-amber-300"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Turn 1: Discovery Diet
          </button>
          <button
            type="button"
            data-slot="turn-mode-turn2-btn"
            onClick={() => setActiveTurn("turn2_execution")}
            className={cn(
              "flex-1 cursor-pointer truncate rounded-md px-2 py-1 text-center font-medium transition-all",
              activeTurn === "turn2_execution"
                ? "border border-emerald-500/30 bg-emerald-500/15 font-semibold text-emerald-700 shadow-2xs dark:text-emerald-300"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Turn 2: Execution Ready
          </button>
        </div>

        {/* Tab Pills */}
        <div
          data-slot="agent-target-tabs"
          className="flex items-center gap-0.5 rounded-lg border border-border/40 bg-muted/40 p-0.5"
        >
          {AGENT_TARGET_TABS.map((tab) => {
            const Icon = tab.icon
            const isActive = agentTarget === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                data-slot={tab.dataSlot}
                onClick={() => setAgentTarget(tab.id)}
                className={cn(
                  "inline-flex flex-1 cursor-pointer items-center justify-center gap-1.5 truncate rounded-md px-1.5 py-1 text-[11px] font-medium transition-all",
                  isActive
                    ? "bg-background font-semibold text-foreground shadow-xs"
                    : "text-muted-foreground hover:bg-muted/30 hover:text-foreground"
                )}
                title={tab.hint}
              >
                <Icon
                  className={cn(
                    "size-3 shrink-0",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                />
                <span className="truncate">{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* Active Target Format Subtitle */}
        {activeTabMeta && (
          <div className="truncate text-[11px] text-muted-foreground">
            {activeTabMeta.hint}
          </div>
        )}
      </div>

      {/* Live Token Gauge & Layer Breakdown Bar */}
      <div className="flex shrink-0 flex-col gap-2 border-b border-border/50 bg-background/30 px-3.5 py-2.5">
        <TokenGaugeBar
          tokenCount={compiledPrompt.totalTokens}
          modelLimit={modelLimit}
        />
        <LayerTokenStackedBar
          breakdown={compiledPrompt.layerBreakdown}
          totalTokens={compiledPrompt.totalTokens}
        />
      </div>

      {/* Prompt Output Code Viewer */}
      <div className="flex min-h-0 flex-1 flex-col p-2.5">
        <PromptOutputViewer
          content={exportOutput.primaryClipboardText}
          secondaryContent={exportOutput.secondaryClipboardText}
          format={agentTarget}
        />
      </div>

      {/* Bottom Export Action Bar */}
      <ExportFooterBar />
    </aside>
  )
}
