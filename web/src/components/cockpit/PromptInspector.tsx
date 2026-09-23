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
  const { compiledPrompt, agentTarget, setAgentTarget, getExportOutput } =
    useComposer()

  const exportOutput = getExportOutput()
  const activeTabMeta = AGENT_TARGET_TABS.find((tab) => tab.id === agentTarget)

  return (
    <aside
      data-slot="prompt-inspector"
      className={cn(
        "w-80 lg:w-[30rem] shrink-0 flex flex-col h-full bg-card/30 overflow-hidden border-l border-border/60",
        className
      )}
    >
      {/* Top Header: Agent Target Selector Tabs */}
      <div className="p-3 border-b border-border/60 bg-background/50 backdrop-blur-md flex flex-col gap-2 shrink-0 select-none">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
            <LayersIcon className="size-3.5 text-primary" />
            <span>Prompt Inspector</span>
          </div>

          <span className="text-[10px] text-muted-foreground font-mono">
            {compiledPrompt.totalTokens.toLocaleString()} tokens
          </span>
        </div>

        {/* Tab Pills */}
        <div
          data-slot="agent-target-tabs"
          className="flex items-center rounded-lg bg-muted/40 p-0.5 border border-border/40 gap-0.5"
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
                  "flex-1 inline-flex items-center justify-center gap-1.5 py-1 px-1.5 rounded-md text-[11px] font-medium transition-all cursor-pointer truncate",
                  isActive
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                )}
                title={tab.hint}
              >
                <Icon className={cn("size-3 shrink-0", isActive ? "text-primary" : "text-muted-foreground")} />
                <span className="truncate">{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* Active Target Format Subtitle */}
        {activeTabMeta && (
          <div className="text-[11px] text-muted-foreground truncate">
            {activeTabMeta.hint}
          </div>
        )}
      </div>

      {/* Live Token Gauge & Layer Breakdown Bar */}
      <div className="px-3.5 py-2.5 border-b border-border/50 bg-background/30 flex flex-col gap-2 shrink-0">
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
      <div className="flex-1 flex flex-col min-h-0 p-2.5">
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
