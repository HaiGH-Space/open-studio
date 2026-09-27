/**
 * Claude Code Agent Export Adapter.
 * Spec reference: SPEC-open-studio.md Section 7.3.
 *
 * Produces unified prompts with strict XML delimiters optimized for
 * Claude 3.7 Sonnet's extended reasoning mode, plus downloadable CLAUDE.md and prompt.xml.
 */

import type {
  CompiledPromptResult,
  ComposerConfig,
} from "../composer/composer-types"
import type {
  AgentExportPackage,
  DownloadableFile,
  IAgentExporter,
} from "./export-types"

export class ClaudeCodeExporter implements IAgentExporter {
  readonly agentName = "claude-code" as const

  formatExport(
    result: CompiledPromptResult,
    config: ComposerConfig
  ): AgentExportPackage {
    const primaryClipboardText = this.buildClaudeCodePrompt(result)
    const claudeMdContent = this.buildClaudeMd(result, config)

    const downloadableFiles: readonly DownloadableFile[] = [
      {
        filename: "CLAUDE.md",
        mimeType: "text/markdown",
        content: claudeMdContent,
      },
      {
        filename: "prompt.xml",
        mimeType: "application/xml",
        content: result.fullPrompt,
      },
    ]

    return {
      primaryClipboardText,
      downloadableFiles,
    }
  }

  private buildClaudeCodePrompt(result: CompiledPromptResult): string {
    if (result.turnMode === "turn1_discovery") {
      return [
        '<claude-code-directive target="claude-3.7-sonnet" reasoning="extended">',
        "  <reasoning-guidelines>",
        "    1. TURN 1 MANDATE: Do NOT write code, scaffold files, or generate CSS/HTML yet.",
        "    2. DO NOT summarize, analyze, or explain the prompt components or constraints.",
        "    3. Review the user brief and requirements in <brief-and-clarification> to identify essential design ambiguities.",
        "    4. Your ONLY task is to elicit 3 to 6 targeted clarification questions by outputting an inline <question-form> XML artifact conforming to <discovery-directive>.",
        "  </reasoning-guidelines>",
        "",
        result.fullPrompt,
        "</claude-code-directive>",
      ].join("\n")
    }

    return [
      '<claude-code-directive target="claude-3.7-sonnet" reasoning="extended">',
      "  <reasoning-guidelines>",
      "    1. Carefully examine <authoritative-constraints> and <brand-contract> tokens before generating code.",
      "    2. Comply strictly with all negative constraints, <craft-rules>, and design system tokens.",
      "    3. Reason through the layout architecture, component decomposition, and responsive state.",
      "    4. Deliver clean, production-ready code that satisfies <brief-and-clarification> without speculative complexity.",
      "  </reasoning-guidelines>",
      "",
      result.fullPrompt,
      "</claude-code-directive>",
    ].join("\n")
  }

  private buildClaudeMd(
    result: CompiledPromptResult,
    config: ComposerConfig
  ): string {
    const l3 = config.layer3AuthoritativeConstraints
    const l5 = config.layer5BrandContract
    const l8 = config.layer8UserMemory

    const l9 = config.layer9BriefAndClarification
    const isTurn1 = result.turnMode === "turn1_discovery"

    const hardRules =
      l3.enabled && l3.strictHardRules.length > 0
        ? [
            "",
            "### Strict Hard Rules",
            ...l3.strictHardRules.map((rule) => `- ${rule}`),
          ].join("\n")
        : ""

    const persistentDirectives =
      l8.enabled && l8.persistentDirectives.length > 0
        ? [
            "",
            "### Persistent Directives",
            ...l8.persistentDirectives.map((d) => `- ${d}`),
          ].join("\n")
        : ""

    const negativeConstraints =
      l8.enabled && l8.negativeConstraints.length > 0
        ? [
            "",
            "### Negative Constraints (Never Do)",
            ...l8.negativeConstraints.map((c) => `- ${c}`),
          ].join("\n")
        : ""

    const userBriefParts: string[] = []
    if (l9.userObjective.trim()) {
      userBriefParts.push(`**Objective:** ${l9.userObjective.trim()}`)
    }
    if (l9.featureRequirements.length > 0) {
      userBriefParts.push(
        "**Requirements:**\n" +
          l9.featureRequirements.map((r) => `- ${r}`).join("\n")
      )
    }
    if (l9.clarificationAnswers.length > 0) {
      userBriefParts.push(
        "**Clarification Answers:**\n" +
          l9.clarificationAnswers
            .map(
              (ans) =>
                `- ${ans.questionLabel}: ${ans.selectedValues.join(", ")}`
            )
            .join("\n")
      )
    }
    const userBriefSection = userBriefParts.join("\n\n")

    const turn1Callout = [
      "> ### MANDATORY AI INTERACTION PROTOCOL (TURN 1: CLARIFICATION ONLY)",
      "> - **DO NOT summarize, review, or analyze this document in your response.**",
      "> - **DO NOT write code, scaffold files, or generate CSS/HTML yet.**",
      "> - **YOUR SOLE AND IMMEDIATE DELIVERABLE:** Ask 3 to 6 targeted clarification questions to resolve ambiguities in the brief below.",
      "> - **OUTPUT FORMAT:** You MUST reply with an inline `<question-form>` XML artifact conforming to this schema:",
      ">",
      "> ```xml",
      "> <question-form>",
      '>   <field name="field_name" type="select" label="Question Label" options="Option A, Option B, Option C" default="Option A" />',
      '>   <field name="another_field" type="text" label="Short text question" placeholder="Brief hint..." />',
      "> </question-form>",
      "> ```",
      "> *(Supported types: select, checkbox, text, textarea)*",
    ].join("\n")

    const turn2Callout = [
      "> ### PRODUCTION EXECUTION MANDATE (TURN 2: FINAL PRODUCTION CODE)",
      "> - All design decisions and clarifications are finalized in the brief below.",
      "> - Proceed immediately to produce complete, production-ready implementation code.",
    ].join("\n")

    const lines = [
      "# Project Guidelines & Design System Directives",
      "<!-- Generated by Open Studio -->",
      "",
      isTurn1 ? turn1Callout : turn2Callout,
      "",
      userBriefSection
        ? "## Active User Brief & Requirements\n" + userBriefSection
        : "",
      "",
      "## Authoritative Constraints",
      `- **Target Framework:** ${l3.targetFramework}`,
      `- **CSS Engine:** ${l3.cssEngine}`,
      `- **Viewport:** ${l3.viewport}`,
      ...(l3.aspectRatio ? [`- **Aspect Ratio:** ${l3.aspectRatio}`] : []),
      hardRules,
      "",
      "## Active Brand Contract",
      `- **Selected Design System:** ${l5.selectedSystemId ?? "None / Default"}`,
      `- **Token Mode:** ${l5.tokenMode}`,
      persistentDirectives,
      negativeConstraints,
      "",
      "## Full System Directives",
      "```xml",
      result.systemPromptBlock,
      "```",
    ]

    if (isTurn1) {
      lines.push(
        "",
        "---",
        "**IMMEDIATE ACTION REQUIRED:** Output ONLY the `<question-form>` XML block with your 3-6 clarification questions. Do not summarize this document or write code."
      )
    }

    return lines.filter((line) => line !== "").join("\n")
  }
}

export const claudeCodeExporter = new ClaudeCodeExporter()
