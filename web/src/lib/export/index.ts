/**
 * Agent Exporters Module entry point.
 * Spec reference: SPEC-open-studio.md Section 7.3.
 */

import type { CompiledPromptResult, ComposerConfig } from "../composer/composer-types"
import type { AgentTarget, AgentExportPackage, IAgentExporter } from "./export-types"
import { claudeCodeExporter, ClaudeCodeExporter } from "./claude-code-exporter"
import { cursorExporter, CursorExporter } from "./cursor-exporter"
import { genericLlmExporter, GenericLlmExporter } from "./generic-llm-exporter"

export * from "./export-types"
export { claudeCodeExporter, ClaudeCodeExporter }
export { cursorExporter, CursorExporter }
export { genericLlmExporter, GenericLlmExporter }

export const AGENT_EXPORTERS: Record<AgentTarget, IAgentExporter> = {
  "claude-code": claudeCodeExporter,
  "cursor": cursorExporter,
  "generic-llm": genericLlmExporter,
}

/**
 * Retrieves the matching exporter instance for a given agent target.
 * Throws a descriptive error if the target is unknown.
 */
export function getExporter(agentName: AgentTarget): IAgentExporter {
  const exporter = AGENT_EXPORTERS[agentName]
  if (!exporter) {
    throw new Error(`Unsupported agent target: "${agentName}". Supported: ${Object.keys(AGENT_EXPORTERS).join(", ")}`)
  }
  return exporter
}

/**
 * Convenience helper to format export packages directly given target, compilation result, and config.
 */
export function exportPrompt(
  agentName: AgentTarget,
  result: CompiledPromptResult,
  config: ComposerConfig
): AgentExportPackage {
  const exporter = getExporter(agentName)
  return exporter.formatExport(result, config)
}
