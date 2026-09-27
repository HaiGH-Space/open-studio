/**
 * Generic LLM Agent Export Adapter.
 * Spec reference: SPEC-open-studio.md Section 7.3.
 *
 * Formats prompt in clean, standard Markdown suitable for ChatGPT, Claude web,
 * v0, Lovable, Gemini, and general LLM chat interfaces.
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

export class GenericLlmExporter implements IAgentExporter {
  readonly agentName = "generic-llm" as const

  formatExport(
    result: CompiledPromptResult,
    config: ComposerConfig
  ): AgentExportPackage {
    const primaryClipboardText = this.buildMarkdownPrompt(result, config)
    const secondaryClipboardText = this.buildUserPrompt(result, config)

    const downloadableFiles: readonly DownloadableFile[] = [
      {
        filename: "prompt.md",
        mimeType: "text/markdown",
        content: primaryClipboardText,
      },
      {
        filename: "prompt.xml",
        mimeType: "application/xml",
        content: result.fullPrompt,
      },
    ]

    return {
      primaryClipboardText,
      secondaryClipboardText,
      downloadableFiles,
    }
  }

  private buildMarkdownPrompt(
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
            "### Hard Rules",
            ...l3.strictHardRules.map((r) => `- ${r}`),
          ].join("\n")
        : ""

    const persistentDirectives =
      l8.enabled && l8.persistentDirectives.length > 0
        ? [
            "",
            "### User Preferences",
            ...l8.persistentDirectives.map((d) => `- ${d}`),
          ].join("\n")
        : ""

    const userBriefSection = this.formatUserBrief(l9)

    const turn1Callout = [
      "> ### MANDATORY INSTRUCTION FOR THE AI (TURN 1 OF 2: CLARIFICATION ONLY)",
      "> - **DO NOT WRITE CODE, HTML, CSS, OR PROJECT FILES YET.**",
      "> - **DO NOT summarize, review, or analyze the requirements or prompt components.**",
      "> - **DO NOT provide conversational filler, preambles, or acknowledgment prose.**",
      "> - **YOUR SOLE AND IMMEDIATE TASK:** Formulate 3 to 6 targeted clarification questions to resolve ambiguities in the brief below.",
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
      "> ### PRODUCTION EXECUTION MANDATE (TURN 2 OF 2: FINAL CODE)",
      "> - All design directions and requirements are finalized in the clarification answers below.",
      "> - Do NOT ask further questions and do NOT output `<question-form>`.",
      "> - Proceed immediately to generate the complete production-grade files and implementation code.",
    ].join("\n")

    const lines = [
      "# Open Studio Design Directive",
      "<!-- Formatted for ChatGPT, v0, Lovable, and Gemini -->",
      "",
      isTurn1 ? turn1Callout : turn2Callout,
      "",
      "## User Objective & Requirements",
      userBriefSection,
      "",
      "## System Directives & Constraints",
      `- **Framework:** ${l3.targetFramework}`,
      `- **Styling:** ${l3.cssEngine}`,
      `- **Viewport:** ${l3.viewport}`,
      `- **Brand System:** ${l5.selectedSystemId ?? "default"}`,
      hardRules,
      persistentDirectives,
      "",
      "### System Instructions & Contract",
      "```xml",
      result.systemPromptBlock,
      "```",
    ]

    if (isTurn1) {
      lines.push(
        "",
        "---",
        "**FINAL MANDATE:** Output ONLY the `<question-form>` XML artifact with your 3-6 clarification questions. Do not write code or prompt analysis."
      )
    }

    return lines.filter((line) => line !== "").join("\n")
  }

  private buildUserPrompt(
    result: CompiledPromptResult,
    config: ComposerConfig
  ): string {
    const l9 = config.layer9BriefAndClarification
    if (
      !l9.userObjective &&
      l9.featureRequirements.length === 0 &&
      l9.clarificationAnswers.length === 0
    ) {
      return ""
    }
    const brief = this.formatUserBrief(l9)
    if (result.turnMode === "turn1_discovery") {
      return [
        "[TURN 1: CLARIFICATION ONLY - DO NOT WRITE CODE - DO NOT SUMMARIZE]",
        "Formulate 3-6 clarification questions wrapped in <question-form> conforming to:",
        "<question-form>",
        '  <field name="field_name" type="select" label="Question Label" options="Option A, Option B" default="Option A" />',
        '  <field name="another_field" type="text" label="Short text question" placeholder="Brief hint..." />',
        "</question-form>",
        "",
        brief,
      ].join("\n")
    }
    return brief
  }

  private formatUserBrief(
    l9: ComposerConfig["layer9BriefAndClarification"]
  ): string {
    const parts: string[] = []

    if (l9.userObjective) {
      parts.push(`**Objective:** ${l9.userObjective}`)
    }

    if (l9.featureRequirements.length > 0) {
      parts.push(
        "\n### Feature Requirements:\n" +
          l9.featureRequirements.map((r) => `- ${r}`).join("\n")
      )
    }

    if (l9.clarificationAnswers.length > 0) {
      parts.push(
        "\n### Clarification Answers:\n" +
          l9.clarificationAnswers
            .map(
              (ans) =>
                `- **${ans.questionLabel}:** ${ans.selectedValues.join(", ")}`
            )
            .join("\n")
      )
    }

    return parts.join("\n")
  }
}

export const genericLlmExporter = new GenericLlmExporter()
