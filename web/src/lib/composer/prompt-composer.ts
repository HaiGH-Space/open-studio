/**
 * 9-Layer In-Memory Prompt Composer Core Engine.
 * Spec reference: SPEC-open-studio.md Section 7.2 & 7.3.
 */

import { countTokens } from "../tokenizer/token-counter"
import type {
  ComposerConfig,
  ComposerAssets,
  CompiledPromptResult,
  LayerCompilationResult,
  IPromptComposer,
  TurnMode,
} from "./composer-types"
import {
  compileLayer1Security,
  compileLayer2RuntimeContract,
  compileLayer3AuthoritativeConstraints,
  compileLayer4WorkflowManifest,
  compileLayer5BrandContract,
  compileLayer6CraftRules,
  compileLayer7SkillTemplate,
  compileLayer8UserMemory,
  compileLayer9BriefAndClarification,
} from "./layer-compilers"

/**
 * Compiles a multi-layered, brand-accurate design prompt from composer configuration
 * and asset bundles, enforcing strict authority hierarchy:
 * L3 (Constraints) > L8/L9 (User Directives & Brief) > L5 (Brand Contract) > L6 (Craft) > L7 (Skills).
 * Supports 2-Turn roundtrip:
 * - turn1_discovery: Token Diet on Layer 5, Layer 9 omitted, appended with <discovery-directive>
 * - turn2_execution: Full asset payload re-injected, Layer 9 <clarification-answers>, appended with <execution-mandate>
 */
export function compilePrompt(
  config: ComposerConfig,
  assets?: ComposerAssets,
  turn: TurnMode = "turn1_discovery"
): CompiledPromptResult {
  const generatedAt = new Date().toISOString()

  // Compile individual layers
  const l1 = compileLayer1Security(config.layer1Security)
  const l2 = compileLayer2RuntimeContract(config.layer2RuntimeContract)
  const l3 = compileLayer3AuthoritativeConstraints(
    config.layer3AuthoritativeConstraints
  )
  const l4 = compileLayer4WorkflowManifest(config.layer4WorkflowManifest)
  const l5 = compileLayer5BrandContract(
    config.layer5BrandContract,
    assets?.designSystem,
    turn
  )
  const l6 = compileLayer6CraftRules(
    config.layer6CraftRules,
    assets?.craftRules
  )
  const l7 = compileLayer7SkillTemplate(
    config.layer7SkillTemplate,
    assets?.skillContent,
    assets?.templateContent
  )
  const l8 = compileLayer8UserMemory(config.layer8UserMemory, {
    userObjective: config.layer9BriefAndClarification.userObjective,
    featureRequirements: config.layer9BriefAndClarification.featureRequirements,
  })
  const l9 = compileLayer9BriefAndClarification(
    config.layer9BriefAndClarification,
    turn
  )

  const layerBreakdown: readonly LayerCompilationResult[] = [
    l1,
    l2,
    l3,
    l4,
    l5,
    l6,
    l7,
    l8,
    l9,
  ]

  // System prompt layers: L1 through L8
  const systemLayers = [l1, l2, l3, l4, l5, l6, l7, l8].filter(
    (layer) => layer.enabled && layer.content.trim().length > 0
  )
  const systemPromptBlock = systemLayers.map((l) => l.content).join("\n\n")

  // User prompt layer: L9
  const userPromptBlock = l9.content

  // All enabled layers for full directive
  const allEnabledLayers = layerBreakdown.filter(
    (layer) => layer.enabled && layer.content.trim().length > 0
  )

  const directiveBlocks: string[] = allEnabledLayers.map((l) =>
    l.content
      .split("\n")
      .map((line) => `  ${line}`)
      .join("\n")
  )

  // Append Turn-specific directive:
  // Turn 1: Discovery Directive with micro-schema
  // Turn 2: Execution Mandate
  if (turn === "turn1_discovery") {
    const discoveryDirective = [
      "  <discovery-directive>",
      "    DISCOVERY & QUESTION ELICITATION PROTOCOL:",
      "    - Do NOT write code, scaffold files, or complete the design implementation yet.",
      "    - Analyze the user brief (Layer 8), authoritative constraints, brand contract, and craft requirements.",
      "    - Elicit design clarifications by outputting an inline <question-form> XML artifact conforming EXACTLY to this schema:",
      "",
      "    <question-form>",
      '      <field name="field_name" type="select" label="Question Label" options="Option A, Option B, Option C" default="Option A" />',
      '      <field name="another_field" type="text" label="Short text question" placeholder="Brief hint..." />',
      "    </question-form>",
      "",
      "    - Focus questions strictly on ambiguities in layout, target audience, visual hierarchy, or interaction density.",
      "  </discovery-directive>",
    ].join("\n")
    directiveBlocks.push(discoveryDirective)
  } else {
    const executionMandate = [
      "  <execution-mandate>",
      "    FINAL PRODUCTION DIRECTIVE:",
      "    - All design directions and requirements are finalized in <clarification-answers>.",
      "    - Do NOT ask further questions and do NOT output <question-form>.",
      "    - Proceed immediately to generate the complete production-grade files and implementation code.",
      "  </execution-mandate>",
    ].join("\n")
    directiveBlocks.push(executionMandate)
  }

  const fullPrompt = [
    '<open-studio-directive version="1.0">',
    directiveBlocks.join("\n\n"),
    "</open-studio-directive>",
  ].join("\n")

  const totalTokens = countTokens(fullPrompt)

  return {
    fullPrompt,
    systemPromptBlock,
    userPromptBlock,
    totalTokens,
    layerBreakdown,
    generatedAt,
    turnMode: turn,
  }
}

/**
 * Convenience helper to compose system prompt block for a specific turn.
 */
export function composeSystemPrompt(
  config: ComposerConfig,
  turn: TurnMode = "turn1_discovery"
): string {
  const compiled = compilePrompt(config, undefined, turn)
  return compiled.systemPromptBlock
}

/**
 * Singleton instance of IPromptComposer.
 */
export const promptComposer: IPromptComposer = {
  compile: compilePrompt,
}
