/**
 * Core TypeScript contracts and schemas for agent export formatters.
 * Spec reference: SPEC-open-studio.md Section 7.3.
 */

import type { CompiledPromptResult, ComposerConfig } from "../composer/composer-types"

export type AgentTarget = "claude-code" | "cursor" | "generic-llm"

export interface DownloadableFile {
  readonly filename: string;
  readonly mimeType: string;
  readonly content: string;
}

export interface AgentExportPackage {
  readonly primaryClipboardText: string;
  readonly secondaryClipboardText?: string;
  readonly downloadableFiles: readonly DownloadableFile[];
}

export interface IAgentExporter {
  readonly agentName: AgentTarget;

  /** Formats the compiled prompt for the specific agent target */
  formatExport(result: CompiledPromptResult, config: ComposerConfig): AgentExportPackage;
}
