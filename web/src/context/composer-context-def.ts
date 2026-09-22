import { createContext } from "react"
import type {
  ComposerConfig,
  ComposerAssets,
  CompiledPromptResult,
} from "../lib/composer/composer-types"
import type {
  AgentTarget,
  DownloadableFile,
} from "../lib/export"
import type { ClarificationAnswerEntry } from "../lib/clarification/question-form-types"

export type ActiveAgentTarget = AgentTarget | "prompt-xml"

export interface ExportOutput {
  readonly format: ActiveAgentTarget
  readonly primaryClipboardText: string
  readonly secondaryClipboardText?: string
  readonly downloadableFiles: readonly DownloadableFile[]
}

export interface ComposerContextValue {
  readonly config: ComposerConfig
  readonly assets: ComposerAssets
  readonly compiledPrompt: CompiledPromptResult
  readonly isDebouncing: boolean
  readonly agentTarget: ActiveAgentTarget
  readonly rawAiResponse: string
  readonly clarificationHistory: readonly string[]
  readonly setConfig: React.Dispatch<React.SetStateAction<ComposerConfig>>
  readonly setAssets: React.Dispatch<React.SetStateAction<ComposerAssets>>
  readonly updateLayer: <K extends keyof ComposerConfig>(
    layerKey: K,
    patch: Partial<ComposerConfig[K]>
  ) => void
  readonly resetConfig: () => void
  readonly selectDesignSystem: (systemId: string | undefined) => Promise<void>
  readonly toggleCraftRule: (ruleId: string) => Promise<void>
  readonly setUserObjective: (objective: string) => void
  readonly setFeatureRequirements: (features: readonly string[]) => void
  readonly addClarificationAnswer: (answer: ClarificationAnswerEntry) => void
  readonly clearClarificationAnswers: () => void
  readonly setRawAiResponse: (response: string) => void
  readonly setAgentTarget: (target: ActiveAgentTarget) => void
  readonly compileNow: (overrideConfig?: ComposerConfig) => void
  readonly getExportOutput: () => ExportOutput
}

export const ComposerContext = createContext<ComposerContextValue | null>(null)
