import { createContext } from "react"
import type {
  ComposerConfig,
  ComposerAssets,
  CompiledPromptResult,
  TurnMode,
} from "../lib/composer/composer-types"
import type {
  AgentTarget,
  DownloadableFile,
} from "../lib/export"
import type {
  ClarificationAnswerEntry,
  QuestionFormAST,
} from "../lib/clarification/question-form-types"

export type ActiveAgentTarget = AgentTarget | "prompt-xml"

export type RoundtripStep =
  | "STEP_1_CONFIGURING"
  | "STEP_1_PROMPT_READY"
  | "AWAITING_AI_RESPONSE"
  | "CLARIFICATION_ACTIVE"
  | "STEP_2_PROMPT_READY"

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
  readonly roundtripStep: RoundtripStep
  readonly activeTurn: TurnMode
  readonly parsedFormAst: QuestionFormAST | null
  readonly isDisobedientAi: boolean
  readonly parseError: string | null
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
  readonly setRoundtripStep: (step: RoundtripStep) => void
  readonly setActiveTurn: (turn: TurnMode) => void
  readonly parseAndIngestAiResponse: (rawText: string) => boolean
  readonly enterCustomClarifications: (answers: readonly ClarificationAnswerEntry[]) => void
  readonly useSkillDefaultsAndProceed: () => void
  readonly skipClarification: () => void
  readonly submitClarificationAnswers: (answers: readonly ClarificationAnswerEntry[]) => void
  readonly goToNextStep: () => void
  readonly goToPreviousStep: () => void
  readonly compileNow: (overrideConfig?: ComposerConfig, overrideTurn?: TurnMode) => void
  readonly getExportOutput: () => ExportOutput
}

export const ComposerContext = createContext<ComposerContextValue | null>(null)
