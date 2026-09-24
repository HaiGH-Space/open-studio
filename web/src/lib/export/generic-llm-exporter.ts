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

    return [
      "# Open Studio Design Directive",
      "<!-- Formatted for ChatGPT, v0, Lovable, and Gemini -->",
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
      "",
      "## User Objective & Requirements",
      userBriefSection,
    ]
      .filter((line) => line !== "")
      .join("\n")
  }

  private buildUserPrompt(
    _result: CompiledPromptResult,
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
    return this.formatUserBrief(l9)
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
