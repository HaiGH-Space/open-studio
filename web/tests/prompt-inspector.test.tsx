import { act } from "react"
import { createRoot } from "react-dom/client"
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { LayerTokenStackedBar } from "../src/components/cockpit/LayerTokenStackedBar"
import { TokenGaugeBar } from "../src/components/cockpit/TokenGaugeBar"
import { PromptOutputViewer } from "../src/components/cockpit/PromptOutputViewer"
import { ExportFooterBar } from "../src/components/cockpit/ExportFooterBar"
import { PromptInspector } from "../src/components/cockpit/PromptInspector"
import { CatalogProvider } from "../src/context/CatalogContext"
import { ComposerProvider } from "../src/context/ComposerContext"
import type {
  LayerCompilationResult,
  ComposerConfig,
} from "../src/lib/composer/composer-types"
import { createDefaultComposerConfig } from "../src/lib/composer/composer-types"
import type { ICatalogService } from "../src/lib/catalog/catalog-types"

function createMockCatalogService(): ICatalogService {
  return {
    loadCatalog: vi.fn().mockResolvedValue(null),
    getLoadedCatalog: vi.fn().mockReturnValue(null),
    fetchDesignTokens: vi.fn().mockResolvedValue(":root {}"),
    fetchDesignSystemBundle: vi.fn().mockResolvedValue(null),
    fetchAssetContent: vi.fn().mockResolvedValue(""),
    clearCache: vi.fn(),
    hasAssetCached: vi.fn().mockReturnValue(true),
  }
}

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true

describe("Right Column: Prompt Inspector & Exporters (Task 15)", () => {
  let container: HTMLDivElement
  let root: ReturnType<typeof createRoot>

  beforeEach(() => {
    container = document.createElement("div")
    document.body.appendChild(container)
    root = createRoot(container)
  })

  afterEach(() => {
    act(() => {
      root.unmount()
    })
    container.remove()
    vi.restoreAllMocks()
  })

  describe("LayerTokenStackedBar (Slice 1)", () => {
    const sampleBreakdown: LayerCompilationResult[] = [
      {
        layerIndex: 1,
        layerName: "Security Guardrails",
        xmlTag: "security-guardrails",
        content: "L1",
        tokenCount: 200,
        enabled: true,
      },
      {
        layerIndex: 2,
        layerName: "Runtime Contract",
        xmlTag: "runtime-contract",
        content: "L2",
        tokenCount: 100,
        enabled: true,
      },
      {
        layerIndex: 3,
        layerName: "Authoritative Constraints",
        xmlTag: "authoritative-constraints",
        content: "L3",
        tokenCount: 300,
        enabled: true,
      },
      {
        layerIndex: 4,
        layerName: "Workflow Manifest",
        xmlTag: "workflow-manifest",
        content: "L4",
        tokenCount: 0,
        enabled: false,
      },
      {
        layerIndex: 5,
        layerName: "Brand Contract",
        xmlTag: "brand-contract",
        content: "L5",
        tokenCount: 400,
        enabled: true,
      },
      {
        layerIndex: 6,
        layerName: "Craft Rules",
        xmlTag: "craft-rules",
        content: "L6",
        tokenCount: 0,
        enabled: true,
      },
      {
        layerIndex: 7,
        layerName: "Skill Template",
        xmlTag: "skill-template",
        content: "L7",
        tokenCount: 0,
        enabled: false,
      },
      {
        layerIndex: 8,
        layerName: "User Memory",
        xmlTag: "user-memory",
        content: "L8",
        tokenCount: 0,
        enabled: true,
      },
      {
        layerIndex: 9,
        layerName: "Brief & Clarification",
        xmlTag: "brief-and-clarification",
        content: "L9",
        tokenCount: 0,
        enabled: true,
      },
    ]
    // Total tokens with non-zero: 200 + 100 + 300 + 400 = 1000

    it("renders proportional segments for layers with positive token counts", () => {
      act(() => {
        root.render(
          <LayerTokenStackedBar
            breakdown={sampleBreakdown}
            totalTokens={1000}
          />
        )
      })

      const barContainer = container.querySelector(
        '[data-slot="layer-token-stacked-bar"]'
      )
      expect(barContainer).not.toBeNull()

      // L1 should have width 20%
      const seg1 = container.querySelector(
        '[data-slot="stacked-bar-segment-1"]'
      ) as HTMLElement
      expect(seg1).not.toBeNull()
      expect(seg1.style.width).toBe("20%")
      expect(seg1.getAttribute("title")).toContain("Security Guardrails")
      expect(seg1.getAttribute("title")).toContain("200")

      // L2 should have width 10%
      const seg2 = container.querySelector(
        '[data-slot="stacked-bar-segment-2"]'
      ) as HTMLElement
      expect(seg2).not.toBeNull()
      expect(seg2.style.width).toBe("10%")

      // L3 should have width 30%
      const seg3 = container.querySelector(
        '[data-slot="stacked-bar-segment-3"]'
      ) as HTMLElement
      expect(seg3).not.toBeNull()
      expect(seg3.style.width).toBe("30%")

      // L5 should have width 40%
      const seg5 = container.querySelector(
        '[data-slot="stacked-bar-segment-5"]'
      ) as HTMLElement
      expect(seg5).not.toBeNull()
      expect(seg5.style.width).toBe("40%")
    })

    it("does not render segments for layers with 0 tokens", () => {
      act(() => {
        root.render(
          <LayerTokenStackedBar
            breakdown={sampleBreakdown}
            totalTokens={1000}
          />
        )
      })

      // L4 has 0 tokens
      const seg4 = container.querySelector(
        '[data-slot="stacked-bar-segment-4"]'
      )
      expect(seg4).toBeNull()

      // L6 has 0 tokens
      const seg6 = container.querySelector(
        '[data-slot="stacked-bar-segment-6"]'
      )
      expect(seg6).toBeNull()
    })

    it("handles zero total tokens without division by zero errors or NaN", () => {
      const zeroBreakdown = sampleBreakdown.map((l) => ({
        ...l,
        tokenCount: 0,
      }))
      act(() => {
        root.render(
          <LayerTokenStackedBar breakdown={zeroBreakdown} totalTokens={0} />
        )
      })

      const barContainer = container.querySelector(
        '[data-slot="layer-token-stacked-bar"]'
      )
      expect(barContainer).not.toBeNull()
      const emptyIndicator = container.querySelector(
        '[data-slot="stacked-bar-empty"]'
      )
      expect(emptyIndicator).not.toBeNull()
      expect(container.textContent).not.toContain("NaN")
    })

    it("renders layer legend with layer names, tokens and color indicators", () => {
      act(() => {
        root.render(
          <LayerTokenStackedBar
            breakdown={sampleBreakdown}
            totalTokens={1000}
            showLegend={true}
          />
        )
      })

      const legend = container.querySelector('[data-slot="stacked-bar-legend"]')
      expect(legend).not.toBeNull()
      expect(legend?.textContent).toContain("Security Guardrails")
      expect(legend?.textContent).toContain("Brand Contract")
      expect(legend?.textContent).toContain("40%")
    })
  })

  describe("TokenGaugeBar (Slice 2)", () => {
    it("renders green indicator when token count is under 30k", () => {
      act(() => {
        root.render(<TokenGaugeBar tokenCount={12500} modelLimit={128000} />)
      })

      const gauge = container.querySelector('[data-slot="token-gauge-bar"]')
      expect(gauge).not.toBeNull()
      expect(gauge?.getAttribute("data-gauge-status")).toBe("green")
      expect(gauge?.textContent).toContain("12,500")
      expect(gauge?.textContent).toContain("128k")

      // Color indicator should have green class
      const indicator = container.querySelector(
        '[data-slot="token-gauge-indicator"]'
      )
      expect(indicator?.className).toContain("emerald")
    })

    it("renders amber indicator when token count is between 30k and 80k inclusive", () => {
      act(() => {
        root.render(<TokenGaugeBar tokenCount={30000} modelLimit={128000} />)
      })

      let gauge = container.querySelector('[data-slot="token-gauge-bar"]')
      expect(gauge?.getAttribute("data-gauge-status")).toBe("amber")
      let indicator = container.querySelector(
        '[data-slot="token-gauge-indicator"]'
      )
      expect(indicator?.className).toContain("amber")

      // At upper bound 80,000
      act(() => {
        root.render(<TokenGaugeBar tokenCount={80000} modelLimit={128000} />)
      })

      gauge = container.querySelector('[data-slot="token-gauge-bar"]')
      expect(gauge?.getAttribute("data-gauge-status")).toBe("amber")
      indicator = container.querySelector('[data-slot="token-gauge-indicator"]')
      expect(indicator?.className).toContain("amber")
    })

    it("renders red indicator when token count exceeds 80k", () => {
      act(() => {
        root.render(<TokenGaugeBar tokenCount={80001} modelLimit={128000} />)
      })

      const gauge = container.querySelector('[data-slot="token-gauge-bar"]')
      expect(gauge?.getAttribute("data-gauge-status")).toBe("red")
      const indicator = container.querySelector(
        '[data-slot="token-gauge-indicator"]'
      )
      expect(indicator?.className).toMatch(/rose|red/)
    })

    it("handles edge cases: zero tokens and over-budget token count", () => {
      // 0 tokens
      act(() => {
        root.render(<TokenGaugeBar tokenCount={0} modelLimit={128000} />)
      })

      let gauge = container.querySelector('[data-slot="token-gauge-bar"]')
      expect(gauge?.getAttribute("data-gauge-status")).toBe("green")
      let fill = container.querySelector(
        '[data-slot="token-gauge-fill"]'
      ) as HTMLElement
      expect(fill.style.width).toBe("0%")

      // Over limit (130,000 with 128,000 limit)
      act(() => {
        root.render(<TokenGaugeBar tokenCount={130000} modelLimit={128000} />)
      })

      gauge = container.querySelector('[data-slot="token-gauge-bar"]')
      expect(gauge?.getAttribute("data-gauge-status")).toBe("red")
      fill = container.querySelector(
        '[data-slot="token-gauge-fill"]'
      ) as HTMLElement
      // Capped at 100% width
      expect(fill.style.width).toBe("100%")
    })
  })

  describe("PromptOutputViewer (Slice 3)", () => {
    const samplePrompt = `<open-studio-directive target="claude-3.7-sonnet">
  <authoritative-constraints>
    - Target Framework: react
    - CSS Engine: tailwind-v4
  </authoritative-constraints>
</open-studio-directive>`

    it("renders prompt text with line count metrics and syntax tags", () => {
      act(() => {
        root.render(
          <PromptOutputViewer content={samplePrompt} format="claude-code" />
        )
      })

      const viewer = container.querySelector(
        '[data-slot="prompt-output-viewer"]'
      )
      expect(viewer).not.toBeNull()
      expect(viewer?.textContent).toContain("authoritative-constraints")
      expect(viewer?.textContent).toContain("tailwind-v4")

      // Line count badge
      const metrics = container.querySelector('[data-slot="prompt-metrics"]')
      expect(metrics?.textContent).toContain("6 lines")
    })

    it("copies prompt content to clipboard and displays success toast", async () => {
      const writeTextMock = vi.fn().mockResolvedValue(undefined)
      Object.defineProperty(navigator, "clipboard", {
        value: { writeText: writeTextMock },
        writable: true,
        configurable: true,
      })

      act(() => {
        root.render(
          <PromptOutputViewer content={samplePrompt} format="claude-code" />
        )
      })

      const copyBtn = container.querySelector(
        'button[data-slot="copy-prompt-btn"]'
      ) as HTMLButtonElement
      expect(copyBtn).not.toBeNull()

      await act(async () => {
        copyBtn.click()
      })

      expect(writeTextMock).toHaveBeenCalledWith(samplePrompt)

      // Toast notification should appear
      const toast = container.querySelector('[data-slot="copy-toast"]')
      expect(toast).not.toBeNull()
      expect(toast?.textContent).toContain("Copied")
    })

    it("handles clipboard failure gracefully and displays failure feedback", async () => {
      const writeTextMock = vi
        .fn()
        .mockRejectedValue(new Error("Permission denied"))
      Object.defineProperty(navigator, "clipboard", {
        value: { writeText: writeTextMock },
        writable: true,
        configurable: true,
      })

      act(() => {
        root.render(
          <PromptOutputViewer content={samplePrompt} format="claude-code" />
        )
      })

      const copyBtn = container.querySelector(
        'button[data-slot="copy-prompt-btn"]'
      ) as HTMLButtonElement

      await act(async () => {
        copyBtn.click()
      })

      // Toast or error indicator should be displayed without crash
      const toast = container.querySelector('[data-slot="copy-toast"]')
      expect(toast).not.toBeNull()
      expect(toast?.textContent).toContain("Failed")
    })

    it("provides secondary copy button when secondary content is present", async () => {
      const writeTextMock = vi.fn().mockResolvedValue(undefined)
      Object.defineProperty(navigator, "clipboard", {
        value: { writeText: writeTextMock },
        writable: true,
        configurable: true,
      })

      const secondaryTask = "User Task: Build pricing card component"

      act(() => {
        root.render(
          <PromptOutputViewer
            content={samplePrompt}
            secondaryContent={secondaryTask}
            format="cursor"
          />
        )
      })

      const copySecBtn = container.querySelector(
        'button[data-slot="copy-secondary-btn"]'
      ) as HTMLButtonElement
      expect(copySecBtn).not.toBeNull()
      expect(copySecBtn.textContent).toContain("User Task")

      await act(async () => {
        copySecBtn.click()
      })

      expect(writeTextMock).toHaveBeenCalledWith(secondaryTask)
      const toast = container.querySelector('[data-slot="copy-toast"]')
      expect(toast).not.toBeNull()
      expect(toast?.textContent).toContain("Copied")
    })
  })

  describe("ExportFooterBar (Slice 4)", () => {
    it("renders primary copy button and download dropdown trigger", () => {
      const mockService = createMockCatalogService()
      act(() => {
        root.render(
          <CatalogProvider catalogService={mockService} autoLoad={false}>
            <ComposerProvider catalogService={mockService}>
              <ExportFooterBar />
            </ComposerProvider>
          </CatalogProvider>
        )
      })

      const copyBtn = container.querySelector('[data-slot="export-copy-btn"]')
      expect(copyBtn).not.toBeNull()

      const dropdownBtn = container.querySelector(
        '[data-slot="export-download-dropdown"]'
      )
      expect(dropdownBtn).not.toBeNull()
    })

    it("reveals download items for CLAUDE.md, .cursorrules, .cursor/rules/open-studio.mdc, and prompt.xml when clicked", async () => {
      const mockService = createMockCatalogService()
      act(() => {
        root.render(
          <CatalogProvider catalogService={mockService} autoLoad={false}>
            <ComposerProvider catalogService={mockService}>
              <ExportFooterBar />
            </ComposerProvider>
          </CatalogProvider>
        )
      })

      const dropdownBtn = container.querySelector(
        'button[data-slot="export-download-dropdown"]'
      ) as HTMLButtonElement
      expect(dropdownBtn).not.toBeNull()

      await act(async () => {
        dropdownBtn.click()
      })

      const claudeItem = container.querySelector(
        '[data-slot="download-claude-md"]'
      )
      expect(claudeItem).not.toBeNull()
      expect(claudeItem?.textContent).toContain("CLAUDE.md")

      const cursorrulesItem = container.querySelector(
        '[data-slot="download-cursorrules"]'
      )
      expect(cursorrulesItem).not.toBeNull()
      expect(cursorrulesItem?.textContent).toContain(".cursorrules")

      const cursorMdcItem = container.querySelector(
        '[data-slot="download-cursor-mdc"]'
      )
      expect(cursorMdcItem).not.toBeNull()
      expect(cursorMdcItem?.textContent).toContain(
        ".cursor/rules/open-studio.mdc"
      )

      const promptXmlItem = container.querySelector(
        '[data-slot="download-prompt-xml"]'
      )
      expect(promptXmlItem).not.toBeNull()
      expect(promptXmlItem?.textContent).toContain("prompt.xml")
    })

    it("triggers file download callback and mock anchor click on selection", async () => {
      const onDownload = vi.fn()
      const mockService = createMockCatalogService()

      // Mock URL.createObjectURL and revokeObjectURL
      const mockCreateObjectURL = vi
        .fn()
        .mockReturnValue("blob:http://localhost/test-blob")
      const mockRevokeObjectURL = vi.fn()
      globalThis.URL.createObjectURL = mockCreateObjectURL
      globalThis.URL.revokeObjectURL = mockRevokeObjectURL

      act(() => {
        root.render(
          <CatalogProvider catalogService={mockService} autoLoad={false}>
            <ComposerProvider catalogService={mockService}>
              <ExportFooterBar onDownload={onDownload} />
            </ComposerProvider>
          </CatalogProvider>
        )
      })

      const dropdownBtn = container.querySelector(
        'button[data-slot="export-download-dropdown"]'
      ) as HTMLButtonElement

      await act(async () => {
        dropdownBtn.click()
      })

      const claudeItem = container.querySelector(
        'button[data-slot="download-claude-md"]'
      ) as HTMLButtonElement
      expect(claudeItem).not.toBeNull()

      await act(async () => {
        claudeItem.click()
      })

      expect(onDownload).toHaveBeenCalledWith("CLAUDE.md")
      expect(mockCreateObjectURL).toHaveBeenCalled()
      expect(mockRevokeObjectURL).toHaveBeenCalled()
    })
  })

  describe("PromptInspector Full Integration (Slice 5)", () => {
    it("renders complete 3rd column prompt inspector with tabs, token gauge, stacked bar, viewer, and export bar", async () => {
      const mockService = createMockCatalogService()
      await act(async () => {
        root.render(
          <CatalogProvider catalogService={mockService} autoLoad={false}>
            <ComposerProvider catalogService={mockService}>
              <PromptInspector />
            </ComposerProvider>
          </CatalogProvider>
        )
      })

      const inspector = container.querySelector(
        '[data-slot="prompt-inspector"]'
      )
      expect(inspector).not.toBeNull()

      const tabs = container.querySelector('[data-slot="agent-target-tabs"]')
      expect(tabs).not.toBeNull()

      const gauge = container.querySelector('[data-slot="token-gauge-bar"]')
      expect(gauge).not.toBeNull()

      const stackedBar = container.querySelector(
        '[data-slot="layer-token-stacked-bar"]'
      )
      expect(stackedBar).not.toBeNull()

      const viewer = container.querySelector(
        '[data-slot="prompt-output-viewer"]'
      )
      expect(viewer).not.toBeNull()

      const exportBar = container.querySelector(
        '[data-slot="export-footer-bar"]'
      )
      expect(exportBar).not.toBeNull()
    })

    it("switches agent target and formats prompt output accordingly when tabs are clicked", async () => {
      const mockService = createMockCatalogService()
      const sampleConfig: ComposerConfig = {
        ...createDefaultComposerConfig(),
        layer9BriefAndClarification: {
          userObjective: "Build high-converting pricing page",
          featureRequirements: ["Annual toggle"],
          clarificationAnswers: [],
        },
      }

      await act(async () => {
        root.render(
          <CatalogProvider catalogService={mockService} autoLoad={false}>
            <ComposerProvider
              catalogService={mockService}
              initialConfig={sampleConfig}
            >
              <PromptInspector />
            </ComposerProvider>
          </CatalogProvider>
        )
      })

      // Default: Generic LLM format
      let viewer = container.querySelector('[data-slot="prompt-output-viewer"]')
      expect(viewer?.textContent).toContain("# Open Studio Design Directive")

      // Click Claude Code tab
      const claudeTab = container.querySelector(
        'button[data-slot="agent-tab-claude-code"]'
      ) as HTMLButtonElement
      expect(claudeTab).not.toBeNull()

      await act(async () => {
        claudeTab.click()
      })

      viewer = container.querySelector('[data-slot="prompt-output-viewer"]')
      expect(viewer?.textContent).toContain("claude-code-directive")

      // Click Cursor tab
      const cursorTab = container.querySelector(
        'button[data-slot="agent-tab-cursor"]'
      ) as HTMLButtonElement
      expect(cursorTab).not.toBeNull()

      await act(async () => {
        cursorTab.click()
      })

      viewer = container.querySelector('[data-slot="prompt-output-viewer"]')
      // Cursor primary text is system rules, secondary is user task
      expect(viewer?.textContent).toContain("security-guardrails")
      const secondaryCopyBtn = container.querySelector(
        'button[data-slot="copy-secondary-btn"]'
      )
      expect(secondaryCopyBtn).not.toBeNull()

      // Click Prompt XML tab
      const xmlTab = container.querySelector(
        'button[data-slot="agent-tab-prompt-xml"]'
      ) as HTMLButtonElement
      expect(xmlTab).not.toBeNull()

      await act(async () => {
        xmlTab.click()
      })

      viewer = container.querySelector('[data-slot="prompt-output-viewer"]')
      expect(viewer?.textContent).toContain("<open-studio-directive")
    })
  })
})
