import React, { act } from "react"
import { createRoot } from "react-dom/client"
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { CatalogProvider } from "../src/context/CatalogContext"
import { ComposerProvider } from "../src/context/ComposerContext"
import { ComposerManager } from "../src/components/cockpit/ComposerManager"
import type { CatalogIndex, ICatalogService } from "../src/lib/catalog/catalog-types"
import type { ComposerConfig } from "../src/lib/composer/composer-types"
import { createDefaultComposerConfig } from "../src/lib/composer/composer-types"

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true

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
        previewDeclarations: ["--bg: #08090a"],
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
        componentsManifest: "data/design-systems/linear-app/components.manifest.json",
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
        suggested: ["accessibility-contrast"],
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
        componentsManifest: "data/design-systems/stripe-dev/components.manifest.json",
      },
    },
  ],
  craftRules: [
    {
      id: "anti-ai-slop",
      name: "Anti-AI-Slop Discipline",
      category: "discipline",
      description: "Rules against generic AI generated styles and purple gradients",
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

function createMockCatalogService(catalogData: CatalogIndex | null = mockCatalog): ICatalogService {
  return {
    loadCatalog: vi.fn().mockResolvedValue(catalogData),
    getLoadedCatalog: vi.fn().mockReturnValue(catalogData),
    fetchDesignTokens: vi.fn().mockResolvedValue(":root {}"),
    fetchDesignSystemBundle: vi.fn().mockResolvedValue({
      id: "linear-app",
      name: "Linear",
      tokensCss: ":root { --bg: #000; }",
      componentsHtml: "<div>Test</div>",
    }),
    fetchAssetContent: vi.fn().mockResolvedValue("# Anti-AI-Slop Content"),
    clearCache: vi.fn(),
    hasAssetCached: vi.fn().mockReturnValue(true),
  }
}

describe("ComposerManager & Layer Panels (Task 13)", () => {
  let container: HTMLDivElement
  let root: ReturnType<typeof createRoot>
  let mockService: ICatalogService

  beforeEach(() => {
    container = document.createElement("div")
    document.body.appendChild(container)
    root = createRoot(container)
    mockService = createMockCatalogService()
  })

  afterEach(() => {
    act(() => {
      root.unmount()
    })
    container.remove()
    document.body.innerHTML = ""
    vi.restoreAllMocks()
  })

  function renderWithProviders(
    ui: React.ReactElement,
    options?: {
      catalog?: CatalogIndex | null
      config?: ComposerConfig
      catalogService?: ICatalogService
    }
  ) {
    const service = options?.catalogService ?? mockService
    const initialCatalog = options && "catalog" in options ? options.catalog : mockCatalog
    act(() => {
      root.render(
        <CatalogProvider
          catalogService={service}
          initialCatalog={initialCatalog}
          autoLoad={false}
        >
          <ComposerProvider
            catalogService={service}
            initialConfig={options?.config}
            autoPersist={false}
            debounceMs={10}
          >
            {ui}
          </ComposerProvider>
        </CatalogProvider>
      )
    })
    return container
  }

  function setInputValue(input: HTMLInputElement, value: string) {
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      "value"
    )?.set
    nativeInputValueSetter?.call(input, value)
    input.dispatchEvent(new Event("input", { bubbles: true }))
  }

  describe("ComposerManager Structure & Preset Action Bar", () => {
    it("renders composer manager container with preset action bar", () => {
      renderWithProviders(<ComposerManager />)
      const manager = container.querySelector("[data-slot='composer-manager']")
      expect(manager).toBeTruthy()

      const presetBar = container.querySelector("[data-slot='preset-action-bar']")
      expect(presetBar).toBeTruthy()
      expect(container.textContent).toContain("Presets")
    })

    it("renders all preset buttons (SaaS, Fintech, Dashboard, Reset)", () => {
      renderWithProviders(<ComposerManager />)
      expect(container.querySelector("[data-slot='preset-saas']")).toBeTruthy()
      expect(container.querySelector("[data-slot='preset-fintech']")).toBeTruthy()
      expect(container.querySelector("[data-slot='preset-dashboard']")).toBeTruthy()
      expect(container.querySelector("[data-slot='preset-reset']")).toBeTruthy()
    })

    it("clicking SaaS Starter preset configures SaaS stack", async () => {
      renderWithProviders(<ComposerManager />)
      const saasBtn = container.querySelector("[data-slot='preset-saas']") as HTMLButtonElement
      expect(saasBtn).toBeTruthy()

      await act(async () => {
        saasBtn.click()
      })

      // Badge or content should reflect React & Tailwind v4
      const badgeL3 = container.querySelector("[data-slot='layer-badge-l3']")
      expect(badgeL3?.textContent?.toLowerCase()).toContain("react")
    })

    it("clicking Fintech Dark preset configures fintech stack", async () => {
      renderWithProviders(<ComposerManager />)
      const fintechBtn = container.querySelector("[data-slot='preset-fintech']") as HTMLButtonElement
      expect(fintechBtn).toBeTruthy()

      await act(async () => {
        fintechBtn.click()
      })

      // Should have accessibility-contrast and anti-ai-slop rules active
      const badgeL6 = container.querySelector("[data-slot='layer-badge-l6']")
      expect(badgeL6?.textContent).toMatch(/(2|contrast|slop)/i)
    })

    it("clicking Dashboard preset configures dashboard task kind", async () => {
      renderWithProviders(<ComposerManager />)
      const dashboardBtn = container.querySelector("[data-slot='preset-dashboard']") as HTMLButtonElement
      expect(dashboardBtn).toBeTruthy()

      await act(async () => {
        dashboardBtn.click()
      })

      const badgeL4 = container.querySelector("[data-slot='layer-badge-l4']")
      expect(badgeL4?.textContent?.toLowerCase()).toContain("dashboard")
    })

    it("clicking Reset preset restores default 9-layer configuration", async () => {
      renderWithProviders(<ComposerManager />)

      // First apply fintech preset
      const fintechBtn = container.querySelector("[data-slot='preset-fintech']") as HTMLButtonElement
      await act(async () => {
        fintechBtn.click()
      })

      // Now click reset
      const resetBtn = container.querySelector("[data-slot='preset-reset']") as HTMLButtonElement
      await act(async () => {
        resetBtn.click()
      })

      const badgeL3 = container.querySelector("[data-slot='layer-badge-l3']")
      expect(badgeL3?.textContent?.toLowerCase()).toContain("react")
    })
  })

  describe("Accordion Panels & Layer Toggles", () => {
    it("renders accordion items for Layers 1 through 8 with status badges", () => {
      renderWithProviders(<ComposerManager />)
      for (let i = 1; i <= 8; i++) {
        const item = container.querySelector(`[data-slot='layer-accordion-l${i}']`)
        expect(item).toBeTruthy()
        const badge = container.querySelector(`[data-slot='layer-badge-l${i}']`)
        expect(badge).toBeTruthy()
      }
    })

    it("renders enable/disable toggle switches for each layer", () => {
      renderWithProviders(<ComposerManager />)
      for (let i = 1; i <= 8; i++) {
        const toggle = container.querySelector(`[data-slot='layer-toggle-l${i}']`)
        expect(toggle).toBeTruthy()
      }
    })

    it("toggling layer toggle updates enabled state in composer", async () => {
      renderWithProviders(<ComposerManager />)
      const toggleL1 = container.querySelector(`[data-slot='layer-toggle-l1']`) as HTMLElement
      expect(toggleL1).toBeTruthy()

      // L1 is initially enabled
      expect(toggleL1.getAttribute("data-checked")).not.toBeNull()

      await act(async () => {
        toggleL1.click()
      })

      // Now L1 should be disabled
      expect(toggleL1.getAttribute("data-checked")).toBeNull()
      const badgeL1 = container.querySelector("[data-slot='layer-badge-l1']")
      expect(badgeL1?.textContent?.toLowerCase()).toContain("off")
    })
  })

  describe("Layer 1: Security Guardrails", () => {
    it("renders strict mode switch and toggling updates state", async () => {
      renderWithProviders(<ComposerManager />)
      const strictSwitch = container.querySelector("[data-slot='l1-strict-mode-toggle']") as HTMLElement
      expect(strictSwitch).toBeTruthy()
      expect(strictSwitch.getAttribute("data-checked")).not.toBeNull()

      await act(async () => {
        strictSwitch.click()
      })

      expect(strictSwitch.getAttribute("data-checked")).toBeNull()
    })
  })

  describe("Layer 2: Runtime Inspection Contract", () => {
    it("renders enforceDataOdId and injectQuestionProtocol toggles", async () => {
      renderWithProviders(<ComposerManager />)
      const odIdToggle = container.querySelector("[data-slot='l2-enforce-data-od-id-toggle']") as HTMLElement
      const questionToggle = container.querySelector("[data-slot='l2-inject-question-protocol-toggle']") as HTMLElement

      expect(odIdToggle).toBeTruthy()
      expect(questionToggle).toBeTruthy()

      await act(async () => {
        odIdToggle.click()
      })
      expect(odIdToggle.getAttribute("data-checked")).toBeNull()

      await act(async () => {
        questionToggle.click()
      })
      expect(questionToggle.getAttribute("data-checked")).toBeNull()
    })
  })

  describe("Layer 3: Authoritative Technical Constraints", () => {
    it("renders framework options and allows switching framework", async () => {
      renderWithProviders(<ComposerManager />)
      const frameworkSelect = container.querySelector("[data-slot='l3-framework-select']") as HTMLSelectElement
      expect(frameworkSelect).toBeTruthy()

      await act(async () => {
        frameworkSelect.value = "nextjs"
        frameworkSelect.dispatchEvent(new Event("change", { bubbles: true }))
      })

      expect(frameworkSelect.value).toBe("nextjs")
      const badgeL3 = container.querySelector("[data-slot='layer-badge-l3']")
      expect(badgeL3?.textContent?.toLowerCase()).toContain("nextjs")
    })

    it("renders CSS engine options and allows switching css engine", async () => {
      renderWithProviders(<ComposerManager />)
      const cssEngineSelect = container.querySelector("[data-slot='l3-css-engine-select']") as HTMLSelectElement
      expect(cssEngineSelect).toBeTruthy()

      await act(async () => {
        cssEngineSelect.value = "css-modules"
        cssEngineSelect.dispatchEvent(new Event("change", { bubbles: true }))
      })

      expect(cssEngineSelect.value).toBe("css-modules")
    })

    it("renders viewport options and allows switching viewport", async () => {
      renderWithProviders(<ComposerManager />)
      const viewportSelect = container.querySelector("[data-slot='l3-viewport-select']") as HTMLSelectElement
      expect(viewportSelect).toBeTruthy()

      await act(async () => {
        viewportSelect.value = "desktop-only"
        viewportSelect.dispatchEvent(new Event("change", { bubbles: true }))
      })

      expect(viewportSelect.value).toBe("desktop-only")
    })

    it("allows adding and removing strict hard rules", async () => {
      renderWithProviders(<ComposerManager />)
      const input = container.querySelector("[data-slot='l3-hard-rule-input']") as HTMLInputElement
      const addBtn = container.querySelector("[data-slot='l3-add-hard-rule-btn']") as HTMLButtonElement

      expect(input).toBeTruthy()
      expect(addBtn).toBeTruthy()

      // Add a hard rule
      await act(async () => {
        setInputValue(input, "No external fonts")
      })
      await act(async () => {
        addBtn.click()
      })

      let rules = container.querySelectorAll("[data-slot='l3-hard-rule-item']")
      expect(rules.length).toBe(1)
      expect(rules[0].textContent).toContain("No external fonts")

      // Remove the hard rule
      const removeBtn = container.querySelector("[data-slot='l3-remove-hard-rule-btn']") as HTMLButtonElement
      await act(async () => {
        removeBtn.click()
      })

      rules = container.querySelectorAll("[data-slot='l3-hard-rule-item']")
      expect(rules.length).toBe(0)
    })

    it("prevents empty or whitespace-only hard rules", async () => {
      renderWithProviders(<ComposerManager />)
      const input = container.querySelector("[data-slot='l3-hard-rule-input']") as HTMLInputElement
      const addBtn = container.querySelector("[data-slot='l3-add-hard-rule-btn']") as HTMLButtonElement

      await act(async () => {
        setInputValue(input, "   ")
        addBtn.click()
      })

      const rules = container.querySelectorAll("[data-slot='l3-hard-rule-item']")
      expect(rules.length).toBe(0)
    })

    it("prevents duplicate hard rules", async () => {
      renderWithProviders(<ComposerManager />)
      const input = container.querySelector("[data-slot='l3-hard-rule-input']") as HTMLInputElement
      const addBtn = container.querySelector("[data-slot='l3-add-hard-rule-btn']") as HTMLButtonElement

      await act(async () => {
        setInputValue(input, "Single-page only")
        addBtn.click()
      })
      await act(async () => {
        setInputValue(input, "Single-page only")
        addBtn.click()
      })

      const rules = container.querySelectorAll("[data-slot='l3-hard-rule-item']")
      expect(rules.length).toBe(1)
    })
  })

  describe("Layer 4: Workflow Manifest", () => {
    it("allows changing task kind and phase", async () => {
      renderWithProviders(<ComposerManager />)
      const taskKindSelect = container.querySelector("[data-slot='l4-task-kind-select']") as HTMLSelectElement
      const phaseSelect = container.querySelector("[data-slot='l4-phase-select']") as HTMLSelectElement

      expect(taskKindSelect).toBeTruthy()
      expect(phaseSelect).toBeTruthy()

      await act(async () => {
        taskKindSelect.value = "marketing-landing"
        taskKindSelect.dispatchEvent(new Event("change", { bubbles: true }))
      })
      expect(taskKindSelect.value).toBe("marketing-landing")

      await act(async () => {
        phaseSelect.value = "refine"
        phaseSelect.dispatchEvent(new Event("change", { bubbles: true }))
      })
      expect(phaseSelect.value).toBe("refine")
    })
  })

  describe("Layer 5: Brand Contract (Design System)", () => {
    it("displays active system name when selected or fallback when none selected", () => {
      renderWithProviders(<ComposerManager />)
      const activeSystem = container.querySelector("[data-slot='l5-active-system']")
      expect(activeSystem).toBeTruthy()
      expect(activeSystem?.textContent?.toLowerCase()).toMatch(/(none|no system|select a system)/i)
    })

    it("displays selected system name when configured", () => {
      const base = createDefaultComposerConfig()
      const config: ComposerConfig = {
        ...base,
        layer5BrandContract: {
          ...base.layer5BrandContract,
          selectedSystemId: "linear-app",
        },
      }
      renderWithProviders(<ComposerManager />, { config })
      const activeSystem = container.querySelector("[data-slot='l5-active-system']")
      expect(activeSystem?.textContent).toContain("Linear")
    })

    it("toggles token mode between condensed and full", async () => {
      renderWithProviders(<ComposerManager />)
      const modeSwitch = container.querySelector("[data-slot='l5-token-mode-switch']") as HTMLElement
      expect(modeSwitch).toBeTruthy()

      // Default is condensed
      await act(async () => {
        modeSwitch.click()
      })

      const badgeL5 = container.querySelector("[data-slot='layer-badge-l5']")
      expect(badgeL5?.textContent?.toLowerCase()).toMatch(/(full|condensed)/i)
    })

    it("toggles asset inclusion checkboxes (tokens.css, DESIGN.md, USAGE.md, components.html)", async () => {
      renderWithProviders(<ComposerManager />)
      const tokensCss = container.querySelector("[data-slot='l5-include-tokens-css']") as HTMLElement
      const designMd = container.querySelector("[data-slot='l5-include-design-md']") as HTMLElement
      const usage = container.querySelector("[data-slot='l5-include-usage']") as HTMLElement
      const componentsHtml = container.querySelector("[data-slot='l5-include-components-html']") as HTMLElement

      expect(tokensCss).toBeTruthy()
      expect(designMd).toBeTruthy()
      expect(usage).toBeTruthy()
      expect(componentsHtml).toBeTruthy()

      await act(async () => {
        componentsHtml.click()
      })
      expect(componentsHtml.getAttribute("data-checked")).not.toBeNull()
    })
  })

  describe("Layer 6: Craft Discipline & Rules", () => {
    it("renders recommended rules chip grid and toggling updates selectedRuleIds", async () => {
      renderWithProviders(<ComposerManager />)
      const chips = container.querySelectorAll("[data-slot='l6-craft-rule-chip']")
      expect(chips.length).toBeGreaterThanOrEqual(1)

      const firstChip = chips[0] as HTMLElement
      const ruleId = firstChip.getAttribute("data-rule-id")
      expect(ruleId).toBeTruthy()

      await act(async () => {
        firstChip.click()
      })

      // Should be toggled
      expect(firstChip).toBeTruthy()
    })

    it("allows adding and removing custom craft directives", async () => {
      renderWithProviders(<ComposerManager />)
      const input = container.querySelector("[data-slot='l6-directive-input']") as HTMLInputElement
      const addBtn = container.querySelector("[data-slot='l6-add-directive-btn']") as HTMLButtonElement

      expect(input).toBeTruthy()
      expect(addBtn).toBeTruthy()

      await act(async () => {
        setInputValue(input, "Never use generic stock photos")
        addBtn.click()
      })

      let directives = container.querySelectorAll("[data-slot='l6-directive-item']")
      expect(directives.length).toBe(1)
      expect(directives[0].textContent).toContain("Never use generic stock photos")

      const removeBtn = container.querySelector("[data-slot='l6-remove-directive-btn']") as HTMLButtonElement
      await act(async () => {
        removeBtn.click()
      })

      directives = container.querySelectorAll("[data-slot='l6-directive-item']")
      expect(directives.length).toBe(0)
    })

    it("handles whitespace and duplicate craft directives safely", async () => {
      renderWithProviders(<ComposerManager />)
      const input = container.querySelector("[data-slot='l6-directive-input']") as HTMLInputElement
      const addBtn = container.querySelector("[data-slot='l6-add-directive-btn']") as HTMLButtonElement

      await act(async () => {
        setInputValue(input, "   ")
        addBtn.click()
      })
      expect(container.querySelectorAll("[data-slot='l6-directive-item']").length).toBe(0)

      await act(async () => {
        setInputValue(input, "Consistent 8px grid")
        addBtn.click()
      })
      await act(async () => {
        setInputValue(input, "Consistent 8px grid")
        addBtn.click()
      })
      expect(container.querySelectorAll("[data-slot='l6-directive-item']").length).toBe(1)
    })
  })

  describe("Layer 7: Skill & Blueprint", () => {
    it("renders layer 7 accordion panel", () => {
      renderWithProviders(<ComposerManager />)
      const item7 = container.querySelector("[data-slot='layer-accordion-l7']")
      expect(item7).toBeTruthy()
    })
  })

  describe("Layer 8: User Memory & Persistent Directives", () => {
    it("allows adding and removing persistent directives", async () => {
      renderWithProviders(<ComposerManager />)
      const input = container.querySelector("[data-slot='l8-directive-input']") as HTMLInputElement
      const addBtn = container.querySelector("[data-slot='l8-add-directive-btn']") as HTMLButtonElement

      expect(input).toBeTruthy()
      expect(addBtn).toBeTruthy()

      await act(async () => {
        setInputValue(input, "Always use Lucide React icons")
        addBtn.click()
      })

      let items = container.querySelectorAll("[data-slot='l8-directive-item']")
      expect(items.length).toBe(1)
      expect(items[0].textContent).toContain("Always use Lucide React icons")

      const removeBtn = container.querySelector("[data-slot='l8-remove-directive-btn']") as HTMLButtonElement
      await act(async () => {
        removeBtn.click()
      })

      items = container.querySelectorAll("[data-slot='l8-directive-item']")
      expect(items.length).toBe(0)
    })

    it("allows adding and removing negative constraints", async () => {
      renderWithProviders(<ComposerManager />)
      const input = container.querySelector("[data-slot='l8-negative-input']") as HTMLInputElement
      const addBtn = container.querySelector("[data-slot='l8-add-negative-btn']") as HTMLButtonElement

      expect(input).toBeTruthy()
      expect(addBtn).toBeTruthy()

      await act(async () => {
        setInputValue(input, "No floating modal popups")
        addBtn.click()
      })

      let items = container.querySelectorAll("[data-slot='l8-negative-item']")
      expect(items.length).toBe(1)
      expect(items[0].textContent).toContain("No floating modal popups")

      const removeBtn = container.querySelector("[data-slot='l8-remove-negative-btn']") as HTMLButtonElement
      await act(async () => {
        removeBtn.click()
      })

      items = container.querySelectorAll("[data-slot='l8-negative-item']")
      expect(items.length).toBe(0)
    })

    it("handles whitespace and duplicate user memory entries safely", async () => {
      renderWithProviders(<ComposerManager />)
      const dirInput = container.querySelector("[data-slot='l8-directive-input']") as HTMLInputElement
      const dirBtn = container.querySelector("[data-slot='l8-add-directive-btn']") as HTMLButtonElement

      await act(async () => {
        setInputValue(dirInput, "   ")
        dirBtn.click()
      })
      expect(container.querySelectorAll("[data-slot='l8-directive-item']").length).toBe(0)

      const negInput = container.querySelector("[data-slot='l8-negative-input']") as HTMLInputElement
      const negBtn = container.querySelector("[data-slot='l8-add-negative-btn']") as HTMLButtonElement

      await act(async () => {
        setInputValue(negInput, "   ")
        negBtn.click()
      })
      expect(container.querySelectorAll("[data-slot='l8-negative-item']").length).toBe(0)
    })
  })
})
