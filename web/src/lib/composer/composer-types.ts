/**
 * Core TypeScript contracts and schemas for the 9-Layer Prompt Composer Engine.
 * Spec reference: SPEC-open-studio.md Section 7.2 & 7.3.
 */

import type { ClarificationAnswerEntry } from "../clarification/question-form-types"

export type TargetFramework =
  | "react"
  | "nextjs"
  | "vite"
  | "html-vanilla"
  | "vue"
  | "svelte"

export type CssEngine =
  | "tailwind-v4"
  | "tailwind-v3"
  | "css-modules"
  | "vanilla-css"

export type TaskKind =
  | "prototype"
  | "deck"
  | "dashboard"
  | "marketing-landing"
  | "application"

export type WorkflowPhase =
  | "discovery"
  | "draft"
  | "refine"
  | "production-ready"

export type TokenMode = "condensed" | "full"

export interface Layer1SecurityConfig {
  readonly enabled: boolean;
  readonly strictMode: boolean;
}

export interface Layer2RuntimeContractConfig {
  readonly enabled: boolean;
  readonly enforceDataOdId: boolean;
  readonly injectQuestionProtocol: boolean;
}

export interface Layer3AuthoritativeConstraintsConfig {
  readonly enabled: boolean;
  readonly targetFramework: TargetFramework;
  readonly cssEngine: CssEngine;
  readonly viewport: "responsive" | "desktop-only" | "mobile-only";
  readonly aspectRatio?: string;
  readonly strictHardRules: readonly string[];
}

export interface Layer4WorkflowManifestConfig {
  readonly enabled: boolean;
  readonly taskKind: TaskKind;
  readonly phase: WorkflowPhase;
}

export interface Layer5BrandContractConfig {
  readonly enabled: boolean;
  readonly selectedSystemId?: string;
  readonly tokenMode: TokenMode;
  readonly includeUsage: boolean;
  readonly includeDesignMd: boolean;
  readonly includeTokensCss: boolean;
  readonly includeComponentsHtml: boolean;
}

export interface Layer6CraftRulesConfig {
  readonly enabled: boolean;
  readonly selectedRuleIds: readonly string[];
  readonly customCraftDirectives: readonly string[];
}

export interface Layer7SkillTemplateConfig {
  readonly enabled: boolean;
  readonly selectedSkillId?: string;
  readonly selectedTemplateId?: string;
}

export interface Layer8UserMemoryConfig {
  readonly enabled: boolean;
  readonly persistentDirectives: readonly string[];
  readonly negativeConstraints: readonly string[];
}

export interface Layer9BriefAndClarificationConfig {
  readonly userObjective: string;
  readonly featureRequirements: readonly string[];
  readonly clarificationAnswers: readonly ClarificationAnswerEntry[];
}

export interface ComposerConfig {
  readonly layer1Security: Layer1SecurityConfig;
  readonly layer2RuntimeContract: Layer2RuntimeContractConfig;
  readonly layer3AuthoritativeConstraints: Layer3AuthoritativeConstraintsConfig;
  readonly layer4WorkflowManifest: Layer4WorkflowManifestConfig;
  readonly layer5BrandContract: Layer5BrandContractConfig;
  readonly layer6CraftRules: Layer6CraftRulesConfig;
  readonly layer7SkillTemplate: Layer7SkillTemplateConfig;
  readonly layer8UserMemory: Layer8UserMemoryConfig;
  readonly layer9BriefAndClarification: Layer9BriefAndClarificationConfig;
}

export interface DesignSystemAssets {
  readonly usage?: string;
  readonly designMd?: string;
  readonly tokensCss?: string;
  readonly componentsHtml?: string;
}

export interface ComposerAssets {
  readonly designSystem?: DesignSystemAssets;
  readonly craftRules?: Record<string, string>;
  readonly skillContent?: string;
  readonly templateContent?: string;
}

export interface LayerCompilationResult {
  readonly layerIndex: number;
  readonly layerName: string;
  readonly xmlTag: string;
  readonly content: string;
  readonly tokenCount: number;
  readonly enabled: boolean;
}

export interface CompiledPromptResult {
  readonly fullPrompt: string;
  readonly systemPromptBlock: string;
  readonly userPromptBlock: string;
  readonly totalTokens: number;
  readonly layerBreakdown: readonly LayerCompilationResult[];
  readonly generatedAt: string;
}

export interface IPromptComposer {
  compile(config: ComposerConfig, assets?: ComposerAssets): CompiledPromptResult;
}

/**
 * Creates a clean default 9-layer configuration.
 */
export function createDefaultComposerConfig(): ComposerConfig {
  return {
    layer1Security: {
      enabled: true,
      strictMode: true,
    },
    layer2RuntimeContract: {
      enabled: true,
      enforceDataOdId: true,
      injectQuestionProtocol: true,
    },
    layer3AuthoritativeConstraints: {
      enabled: true,
      targetFramework: "react",
      cssEngine: "tailwind-v4",
      viewport: "responsive",
      strictHardRules: [],
    },
    layer4WorkflowManifest: {
      enabled: true,
      taskKind: "application",
      phase: "draft",
    },
    layer5BrandContract: {
      enabled: true,
      tokenMode: "condensed",
      includeUsage: true,
      includeDesignMd: true,
      includeTokensCss: true,
      includeComponentsHtml: false,
    },
    layer6CraftRules: {
      enabled: true,
      selectedRuleIds: ["anti-ai-slop"],
      customCraftDirectives: [],
    },
    layer7SkillTemplate: {
      enabled: false,
    },
    layer8UserMemory: {
      enabled: true,
      persistentDirectives: [],
      negativeConstraints: [],
    },
    layer9BriefAndClarification: {
      userObjective: "",
      featureRequirements: [],
      clarificationAnswers: [],
    },
  }
}
