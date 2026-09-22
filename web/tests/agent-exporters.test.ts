import { describe, it, expect } from "vitest"
import {
  createDefaultComposerConfig,
  type ComposerConfig,
  type ComposerAssets,
} from "../src/lib/composer/composer-types"
import { compilePrompt } from "../src/lib/composer/prompt-composer"
import type { AgentTarget } from "../src/lib/export/export-types"
import { claudeCodeExporter } from "../src/lib/export/claude-code-exporter"
import { cursorExporter } from "../src/lib/export/cursor-exporter"
import { genericLlmExporter } from "../src/lib/export/generic-llm-exporter"
import {
  getExporter,
  exportPrompt,
  AGENT_EXPORTERS,
} from "../src/lib/export"

describe("Agent-Specific Export Formatters", () => {
  const sampleAssets: ComposerAssets = {
    designSystem: {
      usage: "Follow Linear dark mode aesthetics with crisp 1px borders.",
      designMd: "Colors: Background is #0d0e11, accent is indigo #5e6ad2.",
      tokensCss: ":root { --bg: #0d0e11; --primary: #5e6ad2; }",
      componentsHtml: '<button class="btn-linear">Action</button>',
    },
    craftRules: {
      "anti-ai-slop": "Never use saturated purple gradient blobs or floating glass spheres.",
    },
    skillContent: "# Animation Guidelines\nUse 200ms ease-out transitions.",
  }

  function createSampleConfig(overrides?: Partial<ComposerConfig>): ComposerConfig {
    const base = createDefaultComposerConfig()
    return {
      ...base,
      layer3AuthoritativeConstraints: {
        ...base.layer3AuthoritativeConstraints,
        targetFramework: "react",
        cssEngine: "tailwind-v4",
        viewport: "responsive",
        strictHardRules: ["No third-party component libraries without permission"],
      },
      layer5BrandContract: {
        ...base.layer5BrandContract,
        selectedSystemId: "linear-dark",
      },
      layer8UserMemory: {
        ...base.layer8UserMemory,
        persistentDirectives: ["Always prefer semantic HTML5 elements"],
        negativeConstraints: ["Never use inline styles"],
      },
      layer9BriefAndClarification: {
        userObjective: "Build a high-converting pricing page with monthly/annual toggle.",
        featureRequirements: [
          "3 tiers: Starter, Pro, Enterprise",
          "Interactive comparison table",
        ],
        clarificationAnswers: [
          {
            questionId: "q1",
            questionLabel: "Default billing interval?",
            selectedValues: ["Annual (20% discount)"],
          },
        ],
      },
      ...overrides,
    }
  }

  describe("Claude Code Exporter (claude-code-exporter.ts)", () => {
    it("has the correct agentName identifier", () => {
      expect(claudeCodeExporter.agentName).toBe("claude-code")
    })

    it("produces primary clipboard text optimized for Claude 3.7 Sonnet reasoning mode with XML delimiters", () => {
      const config = createSampleConfig()
      const result = compilePrompt(config, sampleAssets)
      const exportPkg = claudeCodeExporter.formatExport(result, config)

      // Must be a string with non-zero length
      expect(typeof exportPkg.primaryClipboardText).toBe("string")
      expect(exportPkg.primaryClipboardText.length).toBeGreaterThan(0)

      // Must contain XML delimiters and reasoning directives
      expect(exportPkg.primaryClipboardText).toContain("<open-studio-directive")
      expect(exportPkg.primaryClipboardText).toContain("reasoning")
      expect(exportPkg.primaryClipboardText).toContain("authoritative-constraints")
      expect(exportPkg.primaryClipboardText).toContain("brand-contract")
      expect(exportPkg.primaryClipboardText).toContain("brief-and-clarification")
    })

    it("generates a downloadable CLAUDE.md file with markdown formatting", () => {
      const config = createSampleConfig()
      const result = compilePrompt(config, sampleAssets)
      const exportPkg = claudeCodeExporter.formatExport(result, config)

      const claudeMd = exportPkg.downloadableFiles.find((f) => f.filename === "CLAUDE.md")
      expect(claudeMd).toBeDefined()
      expect(claudeMd?.mimeType).toBe("text/markdown")

      // Verify content structure of CLAUDE.md
      expect(claudeMd?.content).toContain("# Project Guidelines & Design System Directives")
      expect(claudeMd?.content).toContain("react")
      expect(claudeMd?.content).toContain("tailwind-v4")
      expect(claudeMd?.content).toContain("linear-dark")
      expect(claudeMd?.content).toContain("Always prefer semantic HTML5 elements")
      expect(claudeMd?.content).toContain("Never use inline styles")
    })

    it("includes downloadable prompt.xml with application/xml mimeType", () => {
      const config = createSampleConfig()
      const result = compilePrompt(config, sampleAssets)
      const exportPkg = claudeCodeExporter.formatExport(result, config)

      const promptXml = exportPkg.downloadableFiles.find((f) => f.filename === "prompt.xml")
      expect(promptXml).toBeDefined()
      expect(promptXml?.mimeType).toBe("application/xml")
      expect(promptXml?.content).toBe(result.fullPrompt)
    })
  })

  describe("Cursor Exporter (cursor-exporter.ts)", () => {
    it("has the correct agentName identifier", () => {
      expect(cursorExporter.agentName).toBe("cursor")
    })

    it("splits System Rules vs. User Task into primary and secondary clipboard targets", () => {
      const config = createSampleConfig()
      const result = compilePrompt(config, sampleAssets)
      const exportPkg = cursorExporter.formatExport(result, config)

      // Primary clipboard: System Rules
      expect(typeof exportPkg.primaryClipboardText).toBe("string")
      expect(exportPkg.primaryClipboardText).toContain("<security-guardrails")
      expect(exportPkg.primaryClipboardText).toContain("<authoritative-constraints")
      expect(exportPkg.primaryClipboardText).toContain("<brand-contract")
      expect(exportPkg.primaryClipboardText).not.toContain("<brief-and-clarification")

      // Secondary clipboard: User Task / Message
      expect(exportPkg.secondaryClipboardText).toBeDefined()
      expect(typeof exportPkg.secondaryClipboardText).toBe("string")
      expect(exportPkg.secondaryClipboardText).toContain("Build a high-converting pricing page")
      expect(exportPkg.secondaryClipboardText).toContain("Starter, Pro, Enterprise")
      expect(exportPkg.secondaryClipboardText).not.toContain("<security-guardrails")
    })

    it("generates a downloadable .cursorrules file with plain text mimeType", () => {
      const config = createSampleConfig()
      const result = compilePrompt(config, sampleAssets)
      const exportPkg = cursorExporter.formatExport(result, config)

      const cursorrules = exportPkg.downloadableFiles.find((f) => f.filename === ".cursorrules")
      expect(cursorrules).toBeDefined()
      expect(cursorrules?.mimeType).toBe("text/plain")
      expect(cursorrules?.content).toContain("# Open Studio Cursor Rules")
      expect(cursorrules?.content).toContain("react")
      expect(cursorrules?.content).toContain("tailwind-v4")
      expect(cursorrules?.content).toContain("linear-dark")
    })

    it("generates a downloadable .cursor/rules/open-studio.mdc file with MDC frontmatter", () => {
      const config = createSampleConfig()
      const result = compilePrompt(config, sampleAssets)
      const exportPkg = cursorExporter.formatExport(result, config)

      const mdcFile = exportPkg.downloadableFiles.find(
        (f) => f.filename === ".cursor/rules/open-studio.mdc"
      )
      expect(mdcFile).toBeDefined()
      expect(mdcFile?.mimeType).toBe("text/markdown")

      // Must have valid frontmatter
      expect(mdcFile?.content).toMatch(/^---\n[\s\S]*?description:[\s\S]*?globs:[\s\S]*?---\n/)
      expect(mdcFile?.content).toContain("linear-dark")
    })

    it("includes downloadable prompt.xml", () => {
      const config = createSampleConfig()
      const result = compilePrompt(config, sampleAssets)
      const exportPkg = cursorExporter.formatExport(result, config)

      const promptXml = exportPkg.downloadableFiles.find((f) => f.filename === "prompt.xml")
      expect(promptXml).toBeDefined()
      expect(promptXml?.mimeType).toBe("application/xml")
      expect(promptXml?.content).toBe(result.fullPrompt)
    })
  })

  describe("Generic LLM Exporter (generic-llm-exporter.ts)", () => {
    it("has the correct agentName identifier", () => {
      expect(genericLlmExporter.agentName).toBe("generic-llm")
    })

    it("provides clean Markdown copy-paste targets for ChatGPT, v0, Lovable, and Gemini", () => {
      const config = createSampleConfig()
      const result = compilePrompt(config, sampleAssets)
      const exportPkg = genericLlmExporter.formatExport(result, config)

      expect(typeof exportPkg.primaryClipboardText).toBe("string")
      expect(exportPkg.primaryClipboardText).toContain("# Open Studio Design Directive")
      expect(exportPkg.primaryClipboardText).toContain("## System Directives & Constraints")
      expect(exportPkg.primaryClipboardText).toContain("## User Objective & Requirements")
      expect(exportPkg.primaryClipboardText).toContain("Build a high-converting pricing page")

      // Secondary clipboard target for Dual-Tab user task copy
      expect(exportPkg.secondaryClipboardText).toBeDefined()
      expect(exportPkg.secondaryClipboardText).toContain("Build a high-converting pricing page")
    })

    it("generates downloadable prompt.md and prompt.xml files", () => {
      const config = createSampleConfig()
      const result = compilePrompt(config, sampleAssets)
      const exportPkg = genericLlmExporter.formatExport(result, config)

      const promptMd = exportPkg.downloadableFiles.find((f) => f.filename === "prompt.md")
      expect(promptMd).toBeDefined()
      expect(promptMd?.mimeType).toBe("text/markdown")
      expect(promptMd?.content).toBe(exportPkg.primaryClipboardText)

      const promptXml = exportPkg.downloadableFiles.find((f) => f.filename === "prompt.xml")
      expect(promptXml).toBeDefined()
      expect(promptXml?.mimeType).toBe("application/xml")
      expect(promptXml?.content).toBe(result.fullPrompt)
    })
  })

  describe("Exporter Registry & Helper Utilities", () => {
    it("returns correct exporter instance via getExporter", () => {
      expect(getExporter("claude-code")).toBe(claudeCodeExporter)
      expect(getExporter("cursor")).toBe(cursorExporter)
      expect(getExporter("generic-llm")).toBe(genericLlmExporter)
    })

    it("throws a descriptive error when querying an unknown agent target", () => {
      expect(() => getExporter("unknown-agent" as unknown as AgentTarget)).toThrow(
        "Unsupported agent target"
      )
    })

    it("exports directly via exportPrompt helper", () => {
      const config = createSampleConfig()
      const result = compilePrompt(config, sampleAssets)

      const claudeExport = exportPrompt("claude-code", result, config)
      expect(claudeExport.downloadableFiles.some((f) => f.filename === "CLAUDE.md")).toBe(true)

      const cursorExport = exportPrompt("cursor", result, config)
      expect(cursorExport.downloadableFiles.some((f) => f.filename === ".cursorrules")).toBe(true)

      const genericExport = exportPrompt("generic-llm", result, config)
      expect(genericExport.downloadableFiles.some((f) => f.filename === "prompt.md")).toBe(true)
    })

    it("AGENT_EXPORTERS contains all three registered targets", () => {
      expect(Object.keys(AGENT_EXPORTERS).sort()).toEqual(
        ["claude-code", "cursor", "generic-llm"].sort()
      )
    })
  })

  describe("Edge Cases & Defensive Behaviors", () => {
    it("handles empty user brief gracefully across all exporters", () => {
      const emptyBriefConfig = createSampleConfig({
        layer9BriefAndClarification: {
          userObjective: "",
          featureRequirements: [],
          clarificationAnswers: [],
        },
      })
      const result = compilePrompt(emptyBriefConfig, sampleAssets)

      // Claude Code
      const claudePkg = claudeCodeExporter.formatExport(result, emptyBriefConfig)
      expect(claudePkg.primaryClipboardText).toBeDefined()
      expect(claudePkg.primaryClipboardText.length).toBeGreaterThan(0)
      expect(claudePkg.downloadableFiles.length).toBeGreaterThan(0)

      // Cursor
      const cursorPkg = cursorExporter.formatExport(result, emptyBriefConfig)
      expect(cursorPkg.primaryClipboardText.length).toBeGreaterThan(0)
      expect(cursorPkg.secondaryClipboardText).toBe("")
      expect(cursorPkg.downloadableFiles.length).toBeGreaterThan(0)

      // Generic LLM
      const genericPkg = genericLlmExporter.formatExport(result, emptyBriefConfig)
      expect(genericPkg.primaryClipboardText.length).toBeGreaterThan(0)
      expect(genericPkg.secondaryClipboardText).toBe("")
    })

    it("handles disabled system layers gracefully across all exporters", () => {
      const base = createDefaultComposerConfig()
      const allDisabledConfig: ComposerConfig = {
        ...base,
        layer1Security: { enabled: false, strictMode: false },
        layer2RuntimeContract: { enabled: false, enforceDataOdId: false, injectQuestionProtocol: false },
        layer3AuthoritativeConstraints: { ...base.layer3AuthoritativeConstraints, enabled: false },
        layer4WorkflowManifest: { ...base.layer4WorkflowManifest, enabled: false },
        layer5BrandContract: { ...base.layer5BrandContract, enabled: false },
        layer6CraftRules: { ...base.layer6CraftRules, enabled: false },
        layer7SkillTemplate: { enabled: false },
        layer8UserMemory: { enabled: false, persistentDirectives: [], negativeConstraints: [] },
        layer9BriefAndClarification: {
          userObjective: "Standalone UI task",
          featureRequirements: [],
          clarificationAnswers: [],
        },
      }
      const result = compilePrompt(allDisabledConfig)

      for (const target of ["claude-code", "cursor", "generic-llm"] as const) {
        const pkg = exportPrompt(target, result, allDisabledConfig)
        expect(pkg.primaryClipboardText).toBeDefined()
        expect(pkg.downloadableFiles.length).toBeGreaterThan(0)
      }
    })

    it("handles special characters and XML/markdown syntax in user input", () => {
      const specialCharsConfig = createSampleConfig({
        layer9BriefAndClarification: {
          userObjective: "Build a <tag> & 'quote' \"table\" with price < $50 and > $10.",
          featureRequirements: ["Support `code` & **bold** syntax"],
          clarificationAnswers: [],
        },
      })
      const result = compilePrompt(specialCharsConfig, sampleAssets)

      const claudePkg = claudeCodeExporter.formatExport(result, specialCharsConfig)
      expect(claudePkg.primaryClipboardText).toBeDefined()

      const cursorPkg = cursorExporter.formatExport(result, specialCharsConfig)
      expect(cursorPkg.secondaryClipboardText).toContain("<tag>")

      const genericPkg = genericLlmExporter.formatExport(result, specialCharsConfig)
      expect(genericPkg.primaryClipboardText).toContain("<tag>")
    })

    it("formats hard rules and persistent directives when present", () => {
      const config = createSampleConfig({
        layer3AuthoritativeConstraints: {
          enabled: true,
          targetFramework: "nextjs",
          cssEngine: "vanilla-css",
          viewport: "desktop-only",
          aspectRatio: "16:9",
          strictHardRules: ["Must compile with zero warnings", "Must support WCAG AA"],
        },
        layer8UserMemory: {
          enabled: true,
          persistentDirectives: ["Follow BEM class naming", "Keep bundle under 50KB"],
          negativeConstraints: ["Never import external CDNs", "No CSS-in-JS"],
        },
      })
      const result = compilePrompt(config, sampleAssets)

      // Test CLAUDE.md
      const claudePkg = claudeCodeExporter.formatExport(result, config)
      const claudeMd = claudePkg.downloadableFiles.find((f) => f.filename === "CLAUDE.md")?.content
      expect(claudeMd).toContain("Must compile with zero warnings")
      expect(claudeMd).toContain("Follow BEM class naming")
      expect(claudeMd).toContain("Never import external CDNs")

      // Test .cursorrules
      const cursorPkg = cursorExporter.formatExport(result, config)
      const cursorrules = cursorPkg.downloadableFiles.find((f) => f.filename === ".cursorrules")?.content
      expect(cursorrules).toContain("Must compile with zero warnings")
      expect(cursorrules).toContain("Follow BEM class naming")
      expect(cursorrules).toContain("Never import external CDNs")

      // Test .cursor/rules/open-studio.mdc
      const mdc = cursorPkg.downloadableFiles.find(
        (f) => f.filename === ".cursor/rules/open-studio.mdc"
      )?.content
      expect(mdc).toContain("Must compile with zero warnings")

      // Test Generic LLM
      const genericPkg = genericLlmExporter.formatExport(result, config)
      expect(genericPkg.primaryClipboardText).toContain("Must compile with zero warnings")
      expect(genericPkg.primaryClipboardText).toContain("Follow BEM class naming")
    })
  })
})
