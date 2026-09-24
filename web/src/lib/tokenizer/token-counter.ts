export type SupportedModel =
  | "claude-3-5-sonnet"
  | "claude-3-7-sonnet"
  | "claude-3-5-haiku"
  | "claude-3-opus"
  | "gpt-4o"
  | "gpt-4o-mini"

export interface ModelPricing {
  name: string
  inputPerMillion: number
}

export const MODEL_PRICING: Record<SupportedModel, ModelPricing> = {
  "claude-3-5-sonnet": {
    name: "Claude 3.5 Sonnet",
    inputPerMillion: 3.0,
  },
  "claude-3-7-sonnet": {
    name: "Claude 3.7 Sonnet",
    inputPerMillion: 3.0,
  },
  "claude-3-5-haiku": {
    name: "Claude 3.5 Haiku",
    inputPerMillion: 0.8,
  },
  "claude-3-opus": {
    name: "Claude 3 Opus",
    inputPerMillion: 15.0,
  },
  "gpt-4o": {
    name: "GPT-4o",
    inputPerMillion: 2.5,
  },
  "gpt-4o-mini": {
    name: "GPT-4o Mini",
    inputPerMillion: 0.15,
  },
}

export const DEFAULT_MODEL: SupportedModel = "claude-3-5-sonnet"

/**
 * Fast client-side token count approximation using standard 4 characters per token heuristic.
 * Returns 0 for falsy or non-string inputs.
 */
export function countTokens(text?: string | null): number {
  if (!text || typeof text !== "string") {
    return 0
  }
  return Math.ceil(text.length / 4)
}

/**
 * Estimates input cost in USD for a given token count and target model.
 * Falls back to DEFAULT_MODEL (Claude 3.5 Sonnet) if the model is unknown or omitted.
 */
export function estimateCost(
  tokens: number,
  model: string = DEFAULT_MODEL
): { inputCost: number } {
  if (!tokens || tokens <= 0) {
    return { inputCost: 0 }
  }

  const normalizedKey = (model || DEFAULT_MODEL)
    .trim()
    .toLowerCase() as SupportedModel
  const pricing = MODEL_PRICING[normalizedKey] ?? MODEL_PRICING[DEFAULT_MODEL]

  const rawCost = (tokens / 1_000_000) * pricing.inputPerMillion
  // Normalize IEEE 754 floating point imprecision to 6 decimal places
  const inputCost = Math.round(rawCost * 1_000_000) / 1_000_000

  return { inputCost }
}
