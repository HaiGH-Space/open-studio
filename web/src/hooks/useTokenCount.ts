import { useMemo, useContext } from "react"
import { ComposerContext } from "../context/composer-context-def"
import {
  countTokens,
  estimateCost,
  type SupportedModel,
  DEFAULT_MODEL,
} from "../lib/tokenizer/token-counter"
import type { LayerCompilationResult } from "../lib/composer/composer-types"

export interface UseTokenCountOptions {
  readonly customText?: string | null
  readonly targetModel?: SupportedModel
  readonly budgetLimit?: number
}

export interface UseTokenCountResult {
  readonly totalTokens: number
  readonly estimatedCost: { inputCost: number }
  readonly budgetLimit: number
  readonly budgetUsagePercent: number
  readonly isOverBudget: boolean
  readonly layerBreakdown: readonly LayerCompilationResult[]
  readonly systemPromptTokens: number
  readonly userPromptTokens: number
}

export function useTokenCount(
  options?: UseTokenCountOptions
): UseTokenCountResult {
  const composer = useContext(ComposerContext)

  const customText = options?.customText
  const targetModel = options?.targetModel ?? DEFAULT_MODEL
  const budgetLimit = options?.budgetLimit ?? 8000

  if (customText === undefined && !composer) {
    throw new Error(
      "useTokenCount must be used within a ComposerProvider when customText is omitted"
    )
  }

  return useMemo(() => {
    let totalTokens: number
    let layerBreakdown: readonly LayerCompilationResult[] = []
    let systemPromptTokens = 0
    let userPromptTokens = 0

    if (customText !== undefined) {
      totalTokens = countTokens(customText)
      userPromptTokens = totalTokens
    } else if (composer) {
      totalTokens = composer.compiledPrompt.totalTokens
      layerBreakdown = composer.compiledPrompt.layerBreakdown
      systemPromptTokens = countTokens(composer.compiledPrompt.systemPromptBlock)
      userPromptTokens = countTokens(composer.compiledPrompt.userPromptBlock)
    } else {
      totalTokens = 0
    }

    const estimatedCost = estimateCost(totalTokens, targetModel)
    const budgetUsagePercent =
      budgetLimit > 0
        ? Math.round((totalTokens / budgetLimit) * 10000) / 100
        : 0
    const isOverBudget = totalTokens > budgetLimit

    return {
      totalTokens,
      estimatedCost,
      budgetLimit,
      budgetUsagePercent,
      isOverBudget,
      layerBreakdown,
      systemPromptTokens,
      userPromptTokens,
    }
  }, [composer, customText, targetModel, budgetLimit])
}
