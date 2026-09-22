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
 */
export function compilePrompt(
  config: ComposerConfig,
  assets?: ComposerAssets
): CompiledPromptResult {
  const generatedAt = new Date().toISOString()

  // Compile individual layers
  const l1 = compileLayer1Security(config.layer1Security)
  const l2 = compileLayer2RuntimeContract(config.layer2RuntimeContract)
  const l3 = compileLayer3AuthoritativeConstraints(config.layer3AuthoritativeConstraints)
  const l4 = compileLayer4WorkflowManifest(config.layer4WorkflowManifest)
  const l5 = compileLayer5BrandContract(config.layer5BrandContract, assets?.designSystem)
  const l6 = compileLayer6CraftRules(config.layer6CraftRules, assets?.craftRules)
  const l7 = compileLayer7SkillTemplate(
    config.layer7SkillTemplate,
    assets?.skillContent,
    assets?.templateContent
  )
  const l8 = compileLayer8UserMemory(config.layer8UserMemory)
  const l9 = compileLayer9BriefAndClarification(config.layer9BriefAndClarification)

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

  const fullPrompt = [
    '<open-studio-directive version="1.0">',
    allEnabledLayers
      .map((l) =>
        l.content
          .split("\n")
          .map((line) => `  ${line}`)
          .join("\n")
      )
      .join("\n\n"),
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
  }
}

/**
 * Singleton instance of IPromptComposer.
 */
export const promptComposer: IPromptComposer = {
  compile: compilePrompt,
}
