import { describe, it, expect } from "vitest"
import {
  countTokens,
  estimateCost,
  MODEL_PRICING,
} from "../src/lib/tokenizer/token-counter"

describe("Token Counter Service", () => {
  describe("countTokens", () => {
    it("returns 0 for empty string", () => {
      expect(countTokens("")).toBe(0)
    })

    it("returns 0 for null or undefined input", () => {
      expect(countTokens(null)).toBe(0)
      expect(countTokens(undefined)).toBe(0)
    })

    it("calculates 1 token for strings from 1 to 4 characters", () => {
      expect(countTokens("a")).toBe(1)
      expect(countTokens("ab")).toBe(1)
      expect(countTokens("abc")).toBe(1)
      expect(countTokens("abcd")).toBe(1)
    })

    it("divides by 4 characters per token with ceiling rounding", () => {
      expect(countTokens("abcde")).toBe(2) // 5 chars -> 2 tokens
      expect(countTokens("abcdefgh")).toBe(2) // 8 chars -> 2 tokens
      expect(countTokens("abcdefghi")).toBe(3) // 9 chars -> 3 tokens
      expect(countTokens("a".repeat(100))).toBe(25) // 100 chars -> 25 tokens
      expect(countTokens("a".repeat(101))).toBe(26) // 101 chars -> 26 tokens
    })

    it("handles whitespace, newlines, and tabs correctly", () => {
      expect(countTokens("    ")).toBe(1) // 4 spaces -> 1 token
      expect(countTokens(" \n\t ")).toBe(1) // 4 whitespace chars -> 1 token
      expect(countTokens("hello\nworld")).toBe(3) // 11 chars -> 3 tokens
    })

    it("handles unicode and emoji characters", () => {
      const text = "Open Studio 🚀" // 14 chars in UTF-16 (rocket is 2 code units)
      expect(countTokens(text)).toBe(Math.ceil(text.length / 4))
    })

    it("accurately counts multi-thousand word / character strings", () => {
      const tenKChars = "Lorem ipsum dolor sit amet. ".repeat(358) // 28 chars * 358 = 10,024 chars
      expect(countTokens(tenKChars)).toBe(Math.ceil(10024 / 4)) // 2506 tokens
    })

    it("executes 10KB string token counting in under 5ms", () => {
      const prompt10Kb = "const designSystem = 'linear-app';\n".repeat(286) // ~10KB
      const start = performance.now()
      const tokens = countTokens(prompt10Kb)
      const duration = performance.now() - start

      expect(tokens).toBeGreaterThan(0)
      expect(duration).toBeLessThan(5) // Fast execution < 5ms
    })
  })

  describe("estimateCost", () => {
    it("returns 0 cost for 0 or negative tokens", () => {
      expect(estimateCost(0, "claude-3-5-sonnet")).toEqual({ inputCost: 0 })
      expect(estimateCost(-50, "claude-3-5-sonnet")).toEqual({ inputCost: 0 })
    })

    it("calculates accurate cost for claude-3-5-sonnet ($3.00 / 1M tokens)", () => {
      // 1,000,000 tokens -> $3.00
      expect(estimateCost(1_000_000, "claude-3-5-sonnet")).toEqual({
        inputCost: 3.0,
      })
      // 10,000 tokens -> $0.03
      expect(estimateCost(10_000, "claude-3-5-sonnet")).toEqual({
        inputCost: 0.03,
      })
      // 1,000 tokens -> $0.003
      expect(estimateCost(1_000, "claude-3-5-sonnet")).toEqual({
        inputCost: 0.003,
      })
    })

    it("calculates accurate cost for claude-3-7-sonnet ($3.00 / 1M tokens)", () => {
      expect(estimateCost(100_000, "claude-3-7-sonnet")).toEqual({
        inputCost: 0.3,
      })
    })

    it("calculates accurate cost for claude-3-5-haiku ($0.80 / 1M tokens)", () => {
      expect(estimateCost(1_000_000, "claude-3-5-haiku")).toEqual({
        inputCost: 0.8,
      })
      expect(estimateCost(10_000, "claude-3-5-haiku")).toEqual({
        inputCost: 0.008,
      })
    })

    it("calculates accurate cost for claude-3-opus ($15.00 / 1M tokens)", () => {
      expect(estimateCost(1_000_000, "claude-3-opus")).toEqual({
        inputCost: 15.0,
      })
      expect(estimateCost(10_000, "claude-3-opus")).toEqual({ inputCost: 0.15 })
    })

    it("calculates accurate cost for gpt-4o ($2.50 / 1M tokens)", () => {
      expect(estimateCost(1_000_000, "gpt-4o")).toEqual({ inputCost: 2.5 })
      expect(estimateCost(10_000, "gpt-4o")).toEqual({ inputCost: 0.025 })
    })

    it("calculates accurate cost for gpt-4o-mini ($0.15 / 1M tokens)", () => {
      expect(estimateCost(1_000_000, "gpt-4o-mini")).toEqual({
        inputCost: 0.15,
      })
      expect(estimateCost(10_000, "gpt-4o-mini")).toEqual({ inputCost: 0.0015 })
    })

    it("handles model name case-insensitively and trims whitespace", () => {
      expect(estimateCost(10_000, "  CLAUDE-3-5-SONNET  ")).toEqual({
        inputCost: 0.03,
      })
      expect(estimateCost(10_000, "GPT-4O")).toEqual({ inputCost: 0.025 })
    })

    it("falls back to default model (claude-3-5-sonnet) when unknown model is provided", () => {
      const unknownResult = estimateCost(10_000, "some-unknown-model")
      expect(unknownResult).toEqual({ inputCost: 0.03 })
    })

    it("uses default model when model argument is omitted", () => {
      const defaultResult = estimateCost(10_000)
      expect(defaultResult).toEqual({ inputCost: 0.03 })
    })

    it("exposes MODEL_PRICING map with defined rates per million tokens", () => {
      expect(MODEL_PRICING["claude-3-5-sonnet"]).toBeDefined()
      expect(MODEL_PRICING["claude-3-5-sonnet"].inputPerMillion).toBe(3.0)
      expect(MODEL_PRICING["gpt-4o"].inputPerMillion).toBe(2.5)
    })
  })
})
