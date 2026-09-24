import { act } from "react"
import { createRoot } from "react-dom/client"
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { App } from "../src/App"
import { StudioCockpit } from "../src/components/cockpit/StudioCockpit"
import { CatalogProvider } from "../src/context/CatalogContext"
import { ComposerProvider } from "../src/context/ComposerContext"
import type {
  CatalogIndex,
  ICatalogService,
} from "../src/lib/catalog/catalog-types"

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true

// Mock matchMedia for happy-dom environment
if (typeof window !== "undefined" && !window.matchMedia) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
}

function setNativeInputValue(el: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    "value"
  )?.set
  setter?.call(el, value)
  el.dispatchEvent(new Event("input", { bubbles: true }))
  el.dispatchEvent(new Event("change", { bubbles: true }))
}

function setNativeTextareaValue(el: HTMLTextAreaElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(
    window.HTMLTextAreaElement.prototype,
    "value"
  )?.set
  setter?.call(el, value)
  el.dispatchEvent(new Event("input", { bubbles: true }))
  el.dispatchEvent(new Event("change", { bubbles: true }))
}

const mockCatalog: CatalogIndex = {
  schemaVersion: "open-studio-catalog/v1",
  generatedAt: "2026-09-22T00:00:00.000Z",
  stats: {
    totalDesignSystems: 2,
    totalCraftRules: 2,
    totalSkills: 1,
    totalTemplates: 1,
  },
  taxonomies: {
    categories: ["SaaS", "Developer Tools"],
    tags: ["dark-mode", "minimal"],
    surfaces: ["landing", "dashboard"],
  },
  designSystems: [
    {
      id: "linear-app",
      name: "Linear",
      category: "SaaS",
      description: "Curated design system for Linear dark-mode workspace",
      tags: ["dark-mode", "minimal"],
      swatches: {
        primary: "#5e6ad2",
        background: "#08090a",
        foreground: "#f7f8f8",
      },
      tokenSummary: {
        totalCssVariables: 20,
        hasColorRamps: false,
        hasRadiusTokens: true,
        hasTypographyTokens: true,
        condensedCssVariablesCount: 15,
        previewDeclarations: ["--bg: #08090a", "--primary: #5e6ad2"],
      },
      craft: {
        suggested: ["anti-ai-slop"],
        exemptions: [],
      },
      availableFiles: {
        hasUsage: true,
        hasDesignMd: true,
        hasTokensCss: true,
        hasTailwindCss: true,
        hasComponentsHtml: true,
        hasComponentsManifest: true,
      },
      assetPaths: {
        basePath: "data/design-systems/linear-app",
        usage: "data/design-systems/linear-app/USAGE.md",
        designMd: "data/design-systems/linear-app/DESIGN.md",
        tokensCss: "data/design-systems/linear-app/tokens.css",
        tailwindCss: "data/design-systems/linear-app/tailwind-v4.css",
        componentsHtml: "data/design-systems/linear-app/components.html",
        componentsManifest:
          "data/design-systems/linear-app/components.manifest.json",
      },
    },
    {
      id: "stripe-dev",
      name: "Stripe",
      category: "Developer Tools",
      description: "Iconic gradient developer-centric billing system",
      tags: ["cards", "minimal"],
      swatches: {
        primary: "#635bff",
        background: "#ffffff",
        foreground: "#0a2540",
      },
      tokenSummary: {
        totalCssVariables: 30,
        hasColorRamps: true,
        hasRadiusTokens: true,
        hasTypographyTokens: true,
        condensedCssVariablesCount: 22,
        previewDeclarations: ["--primary: #635bff"],
      },
      craft: {
        suggested: [],
        exemptions: [],
      },
      availableFiles: {
        hasUsage: true,
        hasDesignMd: true,
        hasTokensCss: true,
        hasTailwindCss: true,
        hasComponentsHtml: true,
        hasComponentsManifest: true,
      },
      assetPaths: {
        basePath: "data/design-systems/stripe-dev",
        usage: "data/design-systems/stripe-dev/USAGE.md",
        designMd: "data/design-systems/stripe-dev/DESIGN.md",
        tokensCss: "data/design-systems/stripe-dev/tokens.css",
        tailwindCss: "data/design-systems/stripe-dev/tailwind-v4.css",
        componentsHtml: "data/design-systems/stripe-dev/components.html",
        componentsManifest:
          "data/design-systems/stripe-dev/components.manifest.json",
      },
    },
  ],
  craftRules: [
    {
      id: "anti-ai-slop",
      name: "Anti-AI-Slop Discipline",
      category: "discipline",
      description:
        "Rules against generic AI generated styles and purple gradients",
      ruleCount: 12,
      isDefaultEnabled: true,
      assetPath: "data/craft/anti-ai-slop.md",
    },
    {
      id: "accessibility-contrast",
      name: "Accessibility & WCAG Contrast",
      category: "accessibility",
      description: "Ensures WCAG AAA color contrast and focus indicators",
      ruleCount: 8,
      isDefaultEnabled: false,
      assetPath: "data/craft/accessibility-contrast.md",
    },
  ],
  skills: [],
  templates: [],
}

function createMockCatalogService(
  catalogData: CatalogIndex | null = mockCatalog
): ICatalogService {
  return {
    loadCatalog: vi.fn().mockResolvedValue(catalogData),
    getLoadedCatalog: vi.fn().mockReturnValue(catalogData),
    fetchDesignTokens: vi
      .fn()
      .mockResolvedValue(":root { --primary: #5e6ad2; }"),
    fetchDesignSystemBundle: vi.fn().mockResolvedValue({
      id: "linear-app",
      name: "Linear",
      tokensCss: ":root { --primary: #5e6ad2; --bg: #08090a; }",
      componentsHtml: "<div>Linear components</div>",
    }),
    fetchAssetContent: vi
      .fn()
      .mockResolvedValue(
        "# Anti-AI-Slop Rules\n- Avoid purple glowing cards\n- Use deliberate shadows"
      ),
    clearCache: vi.fn(),
    hasAssetCached: vi.fn().mockReturnValue(true),
  }
}

const sampleQuestionXml = `
<question-form id="billing-clarification" title="Billing Module Clarifications">
  <description>Clarify billing preferences and payment gateways.</description>
  <question id="pricing-model" type="radio" required="true">
    <label>Pricing model?</label>
    <option value="tier-based" checked="true">Tier-based Subscription</option>
    <option value="usage-based">Usage-based</option>
  </question>
  <question id="gateways" type="checkbox">
    <label>Select payment gateways:</label>
    <option value="stripe" checked="true">Stripe</option>
    <option value="paddle">Paddle</option>
  </question>
</question-form>
`.trim()

describe("Cockpit Integration & End-to-End User Journey (Task 16)", () => {
  let container: HTMLDivElement
  let root: ReturnType<typeof createRoot>
  let mockService: ICatalogService
  let writeTextMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    container = document.createElement("div")
    document.body.appendChild(container)
    root = createRoot(container)
    mockService = createMockCatalogService()

    writeTextMock = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: writeTextMock },
      writable: true,
      configurable: true,
    })
  })

  afterEach(() => {
    act(() => {
      root.unmount()
    })
    container.remove()
    document.body.innerHTML = ""
    vi.restoreAllMocks()
  })

  describe("Slice 1: StudioCockpit Component Structure", () => {
    it("coordinates Left (Resource Navigator), Center (Composer Manager), and Right (Prompt Inspector) panes", async () => {
      await act(async () => {
        root.render(
          <CatalogProvider
            catalogService={mockService}
            initialCatalog={mockCatalog}
            autoLoad={false}
          >
            <ComposerProvider
              catalogService={mockService}
              autoPersist={false}
              debounceMs={0}
            >
              <StudioCockpit />
            </ComposerProvider>
          </CatalogProvider>
        )
      })

      const cockpit = container.querySelector('[data-slot="studio-cockpit"]')
      expect(cockpit).not.toBeNull()

      // Left Column
      const leftPane = container.querySelector(
        '[data-slot="resource-navigator"]'
      )
      expect(leftPane).not.toBeNull()

      // Center Column
      const centerPane = container.querySelector(
        '[data-slot="composer-manager"]'
      )
      expect(centerPane).not.toBeNull()

      // Right Column
      const rightPane = container.querySelector(
        '[data-slot="prompt-inspector"]'
      )
      expect(rightPane).not.toBeNull()
    })

    it("accepts and applies custom className to the cockpit container", async () => {
      await act(async () => {
        root.render(
          <CatalogProvider
            catalogService={mockService}
            initialCatalog={mockCatalog}
            autoLoad={false}
          >
            <ComposerProvider
              catalogService={mockService}
              autoPersist={false}
              debounceMs={0}
            >
              <StudioCockpit className="custom-cockpit-test" />
            </ComposerProvider>
          </CatalogProvider>
        )
      })

      const cockpit = container.querySelector('[data-slot="studio-cockpit"]')
      expect(cockpit?.className).toContain("custom-cockpit-test")
    })
  })

  describe("Slice 2: App Root Assembly & Provider Wiring", () => {
    it("renders App wrapped with ThemeProvider, CatalogProvider, and ComposerProvider", async () => {
      await act(async () => {
        root.render(<App catalogService={mockService} />)
      })

      // App Header should be rendered
      const header = container.querySelector("header")
      expect(header).not.toBeNull()

      // StudioCockpit should be rendered
      const cockpit = container.querySelector('[data-slot="studio-cockpit"]')
      expect(cockpit).not.toBeNull()

      // 3 columns rendered inside
      expect(
        container.querySelector('[data-slot="resource-navigator"]')
      ).not.toBeNull()
      expect(
        container.querySelector('[data-slot="composer-manager"]')
      ).not.toBeNull()
      expect(
        container.querySelector('[data-slot="prompt-inspector"]')
      ).not.toBeNull()
    })
  })

  describe("Slice 3: End-to-End User Flow", () => {
    it("completes full journey: loading catalog -> selecting Linear -> toggling Anti-AI-Slop -> entering brief -> pasting question form XML -> answering question -> copying prompt", async () => {
      await act(async () => {
        root.render(<App catalogService={mockService} />)
      })

      // Step 1: Catalog Loaded and Systems Visible
      const linearCard = container.querySelector(
        '[data-slot="design-system-card"]'
      )
      expect(linearCard).not.toBeNull()
      expect(container.textContent).toContain("Linear")

      // Step 2: Select Linear Design System
      const selectLinearBtn = container.querySelector(
        '[data-slot="select-system-button"]'
      ) as HTMLButtonElement
      expect(selectLinearBtn).not.toBeNull()

      await act(async () => {
        selectLinearBtn.click()
      })

      // Verify active brand updated in Composer L5 accordion header/content
      expect(container.textContent).toContain("Linear")

      // Step 3: Toggle Anti-AI-Slop craft rule
      // Switch to Craft Rules tab in Resource Navigator
      const rulesTab = container.querySelector(
        '[data-slot="tab-trigger-rules"]'
      ) as HTMLElement
      expect(rulesTab).not.toBeNull()

      await act(async () => {
        rulesTab.click()
      })

      expect(container.textContent).toContain("Anti-AI-Slop Discipline")

      const switches = container.querySelectorAll(
        '[data-slot="craft-rule-switch"]'
      )
      expect(switches.length).toBeGreaterThan(0)
      const antiAiSlopSwitch = switches[0] as HTMLElement

      // Toggle rule
      await act(async () => {
        antiAiSlopSwitch.click()
      })

      // Step 4: Enter User Brief in Layer 9
      const objectiveInput = container.querySelector(
        'textarea[data-slot="layer9-objective-input"]'
      ) as HTMLTextAreaElement
      expect(objectiveInput).not.toBeNull()

      await act(async () => {
        setNativeTextareaValue(
          objectiveInput,
          "Build high-converting pricing page with tiered plans"
        )
      })

      // Add feature requirement
      const featureInput = container.querySelector(
        'input[data-slot="layer9-feature-input"]'
      ) as HTMLInputElement
      const addFeatureBtn = container.querySelector(
        'button[data-slot="layer9-add-feature-btn"]'
      ) as HTMLButtonElement
      expect(featureInput).not.toBeNull()
      expect(addFeatureBtn).not.toBeNull()

      await act(async () => {
        setNativeInputValue(featureInput, "Annual / Monthly billing toggle")
      })

      await act(async () => {
        addFeatureBtn.click()
      })

      expect(container.textContent).toContain("Annual / Monthly billing toggle")

      // Step 5: Paste <question-form> XML via QuestionFormModal
      const pasteAiBtn = container.querySelector(
        'button[data-slot="paste-ai-response-btn"]'
      ) as HTMLButtonElement
      expect(pasteAiBtn).not.toBeNull()

      await act(async () => {
        pasteAiBtn.click()
      })

      // Modal should now be open in document.body
      const modal = document.body.querySelector(
        '[data-slot="question-form-modal"]'
      )
      expect(modal).not.toBeNull()

      // Switch to Raw tab to paste XML
      const rawTabBtn = document.body.querySelector(
        'button[data-slot="view-tab-raw"]'
      ) as HTMLButtonElement
      expect(rawTabBtn).not.toBeNull()

      await act(async () => {
        rawTabBtn.click()
      })

      const rawTextarea = document.body.querySelector(
        'textarea[data-slot="raw-ai-textarea"]'
      ) as HTMLTextAreaElement
      expect(rawTextarea).not.toBeNull()

      await act(async () => {
        setNativeTextareaValue(rawTextarea, sampleQuestionXml)
      })

      // Switch back to Form view to answer questions
      const formTabBtn = document.body.querySelector(
        'button[data-slot="view-tab-form"]'
      ) as HTMLButtonElement
      expect(formTabBtn).not.toBeNull()

      await act(async () => {
        formTabBtn.click()
      })

      expect(document.body.textContent).toContain(
        "Billing Module Clarifications"
      )
      expect(document.body.textContent).toContain("Pricing model?")

      // Step 6: Submit answers to Layer 9
      const submitAnswersBtn = document.body.querySelector(
        'button[data-slot="submit-answers-btn"]'
      ) as HTMLButtonElement
      expect(submitAnswersBtn).not.toBeNull()
      expect(submitAnswersBtn.disabled).toBe(false)

      await act(async () => {
        submitAnswersBtn.click()
      })

      // Verify clarification answers are reflected in L9 summary in ComposerManager
      expect(container.textContent).toContain("Pricing model?")

      // Step 7: Verify Prompt Output & Copy to Clipboard
      const promptViewer = container.querySelector(
        '[data-slot="prompt-output-viewer"]'
      )
      expect(promptViewer).not.toBeNull()

      // Ensure compiled prompt contains our user objective
      expect(promptViewer?.textContent).toContain("pricing page")

      // Click Copy Prompt button in PromptOutputViewer
      const copyPromptBtn = container.querySelector(
        'button[data-slot="copy-prompt-btn"]'
      ) as HTMLButtonElement
      expect(copyPromptBtn).not.toBeNull()

      await act(async () => {
        copyPromptBtn.click()
      })

      expect(writeTextMock).toHaveBeenCalledTimes(1)
      const copiedText = writeTextMock.mock.calls[0][0]
      expect(copiedText).toContain("pricing page")

      // Success toast appears
      const copyToast = container.querySelector('[data-slot="copy-toast"]')
      expect(copyToast).not.toBeNull()
      expect(copyToast?.textContent).toContain("Copied")
    })
  })

  describe("Edge Cases & Resiliency", () => {
    it("handles switching agent target tabs and formats prompt appropriately", async () => {
      await act(async () => {
        root.render(<App catalogService={mockService} />)
      })

      // Default target: generic-llm
      let promptViewer = container.querySelector(
        '[data-slot="prompt-output-viewer"]'
      )
      expect(promptViewer?.textContent).toContain(
        "# Open Studio Design Directive"
      )

      // Switch to Claude Code
      const claudeTab = container.querySelector(
        'button[data-slot="agent-tab-claude-code"]'
      ) as HTMLButtonElement
      expect(claudeTab).not.toBeNull()

      await act(async () => {
        claudeTab.click()
      })

      promptViewer = container.querySelector(
        '[data-slot="prompt-output-viewer"]'
      )
      expect(promptViewer?.textContent).toContain("claude-code-directive")

      // Switch to Cursor
      const cursorTab = container.querySelector(
        'button[data-slot="agent-tab-cursor"]'
      ) as HTMLButtonElement
      expect(cursorTab).not.toBeNull()

      await act(async () => {
        cursorTab.click()
      })

      promptViewer = container.querySelector(
        '[data-slot="prompt-output-viewer"]'
      )
      expect(promptViewer?.textContent).toContain("security-guardrails")

      // Switch to Prompt XML
      const xmlTab = container.querySelector(
        'button[data-slot="agent-tab-prompt-xml"]'
      ) as HTMLButtonElement
      expect(xmlTab).not.toBeNull()

      await act(async () => {
        xmlTab.click()
      })

      promptViewer = container.querySelector(
        '[data-slot="prompt-output-viewer"]'
      )
      expect(promptViewer?.textContent).toContain("<open-studio-directive")
    })

    it("handles clipboard failure gracefully in export without crash", async () => {
      writeTextMock.mockRejectedValueOnce(
        new Error("Clipboard permission denied")
      )

      await act(async () => {
        root.render(<App catalogService={mockService} />)
      })

      const copyBtn = container.querySelector(
        'button[data-slot="copy-prompt-btn"]'
      ) as HTMLButtonElement
      expect(copyBtn).not.toBeNull()

      await act(async () => {
        copyBtn.click()
      })

      const toast = container.querySelector('[data-slot="copy-toast"]')
      expect(toast).not.toBeNull()
      expect(toast?.textContent).toContain("Failed")
    })

    it("handles preset resets restoring initial configuration", async () => {
      await act(async () => {
        root.render(<App catalogService={mockService} />)
      })

      // Select SaaS preset
      const saasPresetBtn = container.querySelector(
        'button[data-slot="preset-saas"]'
      ) as HTMLButtonElement
      expect(saasPresetBtn).not.toBeNull()

      await act(async () => {
        saasPresetBtn.click()
      })

      // Click Reset preset
      const resetPresetBtn = container.querySelector(
        'button[data-slot="preset-reset"]'
      ) as HTMLButtonElement
      expect(resetPresetBtn).not.toBeNull()

      await act(async () => {
        resetPresetBtn.click()
      })

      // System should remain intact and prompt output still renders
      const promptViewer = container.querySelector(
        '[data-slot="prompt-output-viewer"]'
      )
      expect(promptViewer).not.toBeNull()
    })

    it("triggers quick export from AppHeader copying prompt to clipboard with visual confirmation", async () => {
      await act(async () => {
        root.render(<App catalogService={mockService} />)
      })

      const quickExportBtn = container.querySelector(
        'button[data-slot="quick-export-button"]'
      ) as HTMLButtonElement
      expect(quickExportBtn).not.toBeNull()
      expect(quickExportBtn.textContent).toContain("Export Prompt")

      await act(async () => {
        quickExportBtn.click()
      })

      expect(writeTextMock).toHaveBeenCalledTimes(1)
      expect(quickExportBtn.textContent).toContain("Copied!")
    })

    it("provides dual clipboard copy buttons in Cursor mode when brief is present", async () => {
      await act(async () => {
        root.render(<App catalogService={mockService} debounceMs={0} />)
      })

      // Enter a brief objective in Layer 9
      const objectiveInput = container.querySelector(
        'textarea[data-slot="layer9-objective-input"]'
      ) as HTMLTextAreaElement
      expect(objectiveInput).not.toBeNull()

      await act(async () => {
        setNativeTextareaValue(objectiveInput, "Create billing settings card")
      })

      // Switch to Cursor target
      const cursorTab = container.querySelector(
        'button[data-slot="agent-tab-cursor"]'
      ) as HTMLButtonElement
      expect(cursorTab).not.toBeNull()

      await act(async () => {
        cursorTab.click()
      })

      // Secondary copy button for User Task should now be rendered
      const secondaryCopyBtn = container.querySelector(
        'button[data-slot="copy-secondary-btn"]'
      ) as HTMLButtonElement
      expect(secondaryCopyBtn).not.toBeNull()
      expect(secondaryCopyBtn.textContent).toContain("User Task")

      await act(async () => {
        secondaryCopyBtn.click()
      })

      expect(writeTextMock).toHaveBeenCalled()
      const lastCallText =
        writeTextMock.mock.calls[writeTextMock.mock.calls.length - 1][0]
      expect(lastCallText).toContain("billing settings card")
    })

    it("handles empty catalog gracefully without breaking the layout", async () => {
      const emptyCatalog: CatalogIndex = {
        schemaVersion: "open-studio-catalog/v1",
        generatedAt: "2026-09-22T00:00:00.000Z",
        stats: {
          totalDesignSystems: 0,
          totalCraftRules: 0,
          totalSkills: 0,
          totalTemplates: 0,
        },
        taxonomies: { categories: [], tags: [], surfaces: [] },
        designSystems: [],
        craftRules: [],
        skills: [],
        templates: [],
      }
      const emptyService = createMockCatalogService(emptyCatalog)

      await act(async () => {
        root.render(<App catalogService={emptyService} />)
      })

      const cockpit = container.querySelector('[data-slot="studio-cockpit"]')
      expect(cockpit).not.toBeNull()

      const emptySystems = container.querySelector(
        '[data-slot="empty-systems"]'
      )
      expect(emptySystems).not.toBeNull()

      // Prompt inspector still renders clean prompt
      const promptViewer = container.querySelector(
        '[data-slot="prompt-output-viewer"]'
      )
      expect(promptViewer).not.toBeNull()
    })
  })
})
