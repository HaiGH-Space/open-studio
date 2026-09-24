import React, { act } from "react"
import { createRoot } from "react-dom/client"
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { CatalogProvider } from "../src/context/CatalogContext"
import { ComposerProvider } from "../src/context/ComposerContext"
import { ColorSwatchBar } from "../src/components/cockpit/ColorSwatchBar"
import { DesignSystemCard } from "../src/components/cockpit/DesignSystemCard"
import { DesignSystemPreviewModal } from "../src/components/preview/DesignSystemPreviewModal"
import { ResourceNavigator } from "../src/components/cockpit/ResourceNavigator"
import type {
  CatalogIndex,
  ICatalogService,
} from "../src/lib/catalog/catalog-types"
import type { ComposerConfig } from "../src/lib/composer/composer-types"

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true

const mockCatalog: CatalogIndex = {
  schemaVersion: "open-studio-catalog/v1",
  generatedAt: "2026-09-22T00:00:00.000Z",
  stats: {
    totalDesignSystems: 3,
    totalCraftRules: 2,
    totalSkills: 2,
    totalTemplates: 1,
  },
  taxonomies: {
    categories: ["SaaS", "Developer Tools", "Finance"],
    tags: ["dark-mode", "minimal", "cards", "bento", "fintech"],
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
        accent: "#6875e5",
        muted: "#2e3238",
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
        accent: "#00d4ff",
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
        componentsManifest:
          "data/design-systems/stripe-dev/components.manifest.json",
      },
    },
    {
      id: "revolut-fin",
      name: "Revolut",
      category: "Finance",
      description: "Modern neo-bank sleek financial interface",
      tags: ["fintech", "bento", "dark-mode"],
      swatches: {
        primary: "#1969ff",
        background: "#000000",
        foreground: "#ffffff",
      },
      tokenSummary: {
        totalCssVariables: 25,
        hasColorRamps: true,
        hasRadiusTokens: true,
        hasTypographyTokens: false,
        condensedCssVariablesCount: 18,
        previewDeclarations: ["--primary: #1969ff"],
      },
      craft: {
        suggested: [],
        exemptions: [],
      },
      availableFiles: {
        hasUsage: false,
        hasDesignMd: true,
        hasTokensCss: true,
        hasTailwindCss: false,
        hasComponentsHtml: false,
        hasComponentsManifest: false,
      },
      assetPaths: {
        basePath: "data/design-systems/revolut-fin",
        designMd: "data/design-systems/revolut-fin/DESIGN.md",
        tokensCss: "data/design-systems/revolut-fin/tokens.css",
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
  skills: [
    {
      id: "motion-animation",
      name: "Motion & Micro-interactions",
      description: "Fluid spring animations and layout transitions",
      category: "motion",
      triggers: ["animate", "transition", "spring"],
      assetPath: "data/skills/motion.md",
    },
    {
      id: "data-table",
      name: "Complex Data Grids",
      description: "Virtualized table columns, sorting and filters",
      category: "tables",
      triggers: ["table", "grid", "sorting"],
      assetPath: "data/skills/data-table.md",
    },
  ],
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
      .mockResolvedValue(":root { --primary: #5e6ad2; --bg: #08090a; }"),
    fetchDesignSystemBundle: vi.fn().mockImplementation((systemId: string) => {
      return Promise.resolve({
        id: systemId,
        name: systemId === "linear-app" ? "Linear" : "Stripe",
        tokensCss: `:root {\n  --primary: #5e6ad2;\n  --background: #08090a;\n  --foreground: #f7f8f8;\n}`,
        typography: "font-family: Inter, sans-serif;",
        componentsHtml: `<div class="btn-primary">Click me</div>`,
        designMd: "# Linear Design System\nMinimal dark-mode interface.",
        usage: "Import tokens.css into your main stylesheet.",
      })
    }),
    fetchAssetContent: vi.fn().mockResolvedValue("# Content"),
    clearCache: vi.fn(),
    hasAssetCached: vi.fn().mockReturnValue(true),
  }
}

describe("ResourceNavigator & BrandPreviewModal (Task 12)", () => {
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
    const initialCatalog =
      options && "catalog" in options ? options.catalog : mockCatalog
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

  describe("ColorSwatchBar", () => {
    it("renders swatch items for present colors", () => {
      act(() => {
        root.render(
          <ColorSwatchBar
            swatches={{
              primary: "#5e6ad2",
              background: "#08090a",
              accent: "#6875e5",
            }}
          />
        )
      })

      const bar = container.querySelector("[data-slot='color-swatch-bar']")
      expect(bar).toBeTruthy()
      const swatches = container.querySelectorAll("[data-slot='swatch-item']")
      expect(swatches.length).toBe(3)
    })

    it("renders fallback indicator when swatches is empty or undefined", () => {
      act(() => {
        root.render(<ColorSwatchBar swatches={undefined} />)
      })

      const bar = container.querySelector("[data-slot='color-swatch-bar']")
      expect(bar).toBeTruthy()
      const fallback = container.querySelector("[data-slot='swatch-fallback']")
      expect(fallback).toBeTruthy()
    })
  })

  describe("DesignSystemCard", () => {
    const sampleSystem = mockCatalog.designSystems[0]

    it("displays brand name, category badge, description, and token metrics", () => {
      renderWithProviders(<DesignSystemCard system={sampleSystem} />)

      const card = container.querySelector("[data-slot='design-system-card']")
      expect(card).toBeTruthy()
      expect(card?.textContent).toContain("Linear")
      expect(card?.textContent).toContain("SaaS")
      expect(card?.textContent).toContain("20 tokens")
      expect(card?.textContent).toContain("Curated design system")
    })

    it("displays tag chips", () => {
      renderWithProviders(<DesignSystemCard system={sampleSystem} />)
      expect(container.textContent).toContain("dark-mode")
      expect(container.textContent).toContain("minimal")
    })

    it("clicking Select invokes onSelect handler with system id", () => {
      const handleSelect = vi.fn()
      renderWithProviders(
        <DesignSystemCard system={sampleSystem} onSelect={handleSelect} />
      )

      const selectBtn = container.querySelector(
        "[data-slot='select-system-button']"
      ) as HTMLButtonElement
      expect(selectBtn).toBeTruthy()
      act(() => {
        selectBtn.click()
      })
      expect(handleSelect).toHaveBeenCalledWith("linear-app")
    })

    it("clicking Preview invokes onPreview handler with system id", () => {
      const handlePreview = vi.fn()
      renderWithProviders(
        <DesignSystemCard system={sampleSystem} onPreview={handlePreview} />
      )

      const previewBtn = container.querySelector(
        "[data-slot='preview-system-button']"
      ) as HTMLButtonElement
      expect(previewBtn).toBeTruthy()
      act(() => {
        previewBtn.click()
      })
      expect(handlePreview).toHaveBeenCalledWith("linear-app")
    })

    it("displays active/selected badge when isSelected is true", () => {
      renderWithProviders(
        <DesignSystemCard system={sampleSystem} isSelected={true} />
      )

      const selectBtn = container.querySelector(
        "[data-slot='select-system-button']"
      )
      expect(selectBtn?.textContent).toMatch(/(active|selected)/i)
    })
  })

  describe("DesignSystemPreviewModal", () => {
    it("renders modal dialog with system title, category, and tabs", async () => {
      await act(async () => {
        renderWithProviders(
          <DesignSystemPreviewModal systemId="linear-app" open={true} />
        )
      })

      const dialog = document.querySelector("[role='dialog']")
      expect(dialog).toBeTruthy()
      expect(dialog?.getAttribute("data-open")).not.toBeNull()
      expect(dialog?.textContent).toContain("Linear")
      expect(dialog?.textContent).toContain("SaaS")
    })

    it("fetches bundle assets and displays tokens CSS content", async () => {
      await act(async () => {
        renderWithProviders(
          <DesignSystemPreviewModal systemId="linear-app" open={true} />
        )
      })

      expect(mockService.fetchDesignSystemBundle).toHaveBeenCalledWith(
        "linear-app"
      )
      const tokensPreview = document.querySelector(
        "[data-slot='tokens-css-preview']"
      )
      expect(tokensPreview?.textContent).toContain("--primary: #5e6ad2")
    })

    it("switches to Typography tab when clicked", async () => {
      await act(async () => {
        renderWithProviders(
          <DesignSystemPreviewModal systemId="linear-app" open={true} />
        )
      })

      const typographyTabTrigger = document.querySelector(
        "[data-slot='tab-trigger-typography']"
      ) as HTMLElement
      expect(typographyTabTrigger).toBeTruthy()

      act(() => {
        typographyTabTrigger.click()
      })

      const typographyContent = document.querySelector(
        "[data-slot='tab-content-typography']"
      )
      expect(typographyContent).toBeTruthy()
    })

    it("switches to Components HTML tab and displays markup preview", async () => {
      await act(async () => {
        renderWithProviders(
          <DesignSystemPreviewModal systemId="linear-app" open={true} />
        )
      })

      const componentsTabTrigger = document.querySelector(
        "[data-slot='tab-trigger-components']"
      ) as HTMLElement
      expect(componentsTabTrigger).toBeTruthy()

      act(() => {
        componentsTabTrigger.click()
      })

      const componentsContent = document.querySelector(
        "[data-slot='tab-content-components']"
      )
      expect(componentsContent).toBeTruthy()
      expect(componentsContent?.textContent).toContain("btn-primary")
    })

    it("clicking 'Use System' button selects brand in composer and closes modal", async () => {
      const handleOpenChange = vi.fn()
      await act(async () => {
        renderWithProviders(
          <DesignSystemPreviewModal
            systemId="linear-app"
            open={true}
            onOpenChange={handleOpenChange}
          />
        )
      })

      const useSystemBtn = document.querySelector(
        "[data-slot='modal-select-system-button']"
      ) as HTMLButtonElement
      expect(useSystemBtn).toBeTruthy()

      await act(async () => {
        useSystemBtn.click()
      })

      expect(handleOpenChange).toHaveBeenCalledWith(false)
    })
  })

  describe("ResourceNavigator Component", () => {
    it("renders search input, category dropdown, tag chips, and resource tabs", () => {
      renderWithProviders(<ResourceNavigator />)

      expect(
        container.querySelector("[data-slot='catalog-search-input']")
      ).toBeTruthy()
      expect(
        container.querySelector("[data-slot='category-filter-select']")
      ).toBeTruthy()
      expect(
        container.querySelector("[data-slot='tag-filter-chips']")
      ).toBeTruthy()
      expect(
        container.querySelector("[data-slot='resource-tabs']")
      ).toBeTruthy()
    })

    it("displays tab counts for Design Systems, Craft Rules, and Skills", () => {
      renderWithProviders(<ResourceNavigator />)

      const systemsTab = container.querySelector(
        "[data-slot='tab-trigger-systems']"
      )
      const rulesTab = container.querySelector(
        "[data-slot='tab-trigger-rules']"
      )
      const skillsTab = container.querySelector(
        "[data-slot='tab-trigger-skills']"
      )

      expect(systemsTab?.textContent).toContain("3")
      expect(rulesTab?.textContent).toContain("2")
      expect(skillsTab?.textContent).toContain("2")
    })

    it("filters design systems by search query in real time", () => {
      renderWithProviders(<ResourceNavigator />)

      const searchInput = container.querySelector(
        "[data-slot='catalog-search-input']"
      ) as HTMLInputElement
      expect(searchInput).toBeTruthy()

      act(() => {
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          "value"
        )?.set
        nativeInputValueSetter?.call(searchInput, "linear")
        searchInput.dispatchEvent(new Event("input", { bubbles: true }))
      })

      const cards = container.querySelectorAll(
        "[data-slot='design-system-card']"
      )
      expect(cards.length).toBe(1)
      expect(cards[0].textContent).toContain("Linear")
    })

    it("filters design systems by category selection", () => {
      renderWithProviders(<ResourceNavigator />)

      const categorySelect = container.querySelector(
        "[data-slot='category-filter-select']"
      ) as HTMLSelectElement
      expect(categorySelect).toBeTruthy()

      act(() => {
        categorySelect.value = "Finance"
        categorySelect.dispatchEvent(new Event("change", { bubbles: true }))
      })

      const cards = container.querySelectorAll(
        "[data-slot='design-system-card']"
      )
      expect(cards.length).toBe(1)
      expect(cards[0].textContent).toContain("Revolut")
    })

    it("filters design systems by clicking a tag chip", () => {
      renderWithProviders(<ResourceNavigator />)

      // Find 'fintech' tag chip
      const tagChips = container.querySelectorAll("[data-slot='tag-chip']")
      const fintechChip = Array.from(tagChips).find((chip) =>
        chip.textContent?.includes("fintech")
      ) as HTMLElement
      expect(fintechChip).toBeTruthy()

      act(() => {
        fintechChip.click()
      })

      const cards = container.querySelectorAll(
        "[data-slot='design-system-card']"
      )
      expect(cards.length).toBe(1)
      expect(cards[0].textContent).toContain("Revolut")

      // Clicking tag chip again deselects it and restores list
      act(() => {
        fintechChip.click()
      })
      const restoredCards = container.querySelectorAll(
        "[data-slot='design-system-card']"
      )
      expect(restoredCards.length).toBe(3)
    })

    it("handles regex special characters safely in search input", () => {
      renderWithProviders(<ResourceNavigator />)

      const searchInput = container.querySelector(
        "[data-slot='catalog-search-input']"
      ) as HTMLInputElement

      expect(() => {
        act(() => {
          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
            window.HTMLInputElement.prototype,
            "value"
          )?.set
          nativeInputValueSetter?.call(searchInput, "[+*?\\")
          searchInput.dispatchEvent(new Event("input", { bubbles: true }))
        })
      }).not.toThrow()
    })

    it("shows empty state when search matches no systems", () => {
      renderWithProviders(<ResourceNavigator />)

      const searchInput = container.querySelector(
        "[data-slot='catalog-search-input']"
      ) as HTMLInputElement

      act(() => {
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          "value"
        )?.set
        nativeInputValueSetter?.call(searchInput, "nonexistent-query-xyz")
        searchInput.dispatchEvent(new Event("input", { bubbles: true }))
      })

      const emptySlot = container.querySelector("[data-slot='empty-systems']")
      expect(emptySlot).toBeTruthy()
      expect(emptySlot?.textContent).toMatch(/no design systems found/i)
    })

    it("switches to Craft Rules tab and toggles rule state via switch", async () => {
      renderWithProviders(<ResourceNavigator />)

      const rulesTab = container.querySelector(
        "[data-slot='tab-trigger-rules']"
      ) as HTMLElement
      act(() => {
        rulesTab.click()
      })

      const ruleCards = container.querySelectorAll(
        "[data-slot='craft-rule-card']"
      )
      expect(ruleCards.length).toBe(2)
      expect(container.textContent).toContain("Anti-AI-Slop Discipline")
      expect(container.textContent).toContain("12 rules")

      // Find switch on first rule and toggle it
      const switches = container.querySelectorAll(
        "[data-slot='craft-rule-switch']"
      )
      expect(switches.length).toBe(2)
      const firstSwitch = switches[0] as HTMLElement

      await act(async () => {
        firstSwitch.click()
      })

      expect(firstSwitch).toBeTruthy()
    })

    it("switches to Skills tab and displays skill cards and trigger chips", () => {
      renderWithProviders(<ResourceNavigator />)

      const skillsTab = container.querySelector(
        "[data-slot='tab-trigger-skills']"
      ) as HTMLElement
      act(() => {
        skillsTab.click()
      })

      const skillCards = container.querySelectorAll("[data-slot='skill-card']")
      expect(skillCards.length).toBe(2)
      expect(container.textContent).toContain("Motion & Micro-interactions")
      expect(container.textContent).toContain("Complex Data Grids")
      expect(container.textContent).toContain("animate")
    })

    it("clicking Preview on a card opens DesignSystemPreviewModal", async () => {
      renderWithProviders(<ResourceNavigator />)

      const previewButtons = container.querySelectorAll(
        "[data-slot='preview-system-button']"
      )
      expect(previewButtons.length).toBeGreaterThanOrEqual(1)

      await act(async () => {
        ;(previewButtons[0] as HTMLElement).click()
      })

      const dialog = document.querySelector("[role='dialog']")
      expect(dialog).toBeTruthy()
      expect(dialog?.getAttribute("data-open")).not.toBeNull()
      expect(dialog?.textContent).toContain("Linear")
    })

    it("clicking Select on a card activates design system in Composer", async () => {
      renderWithProviders(<ResourceNavigator />)

      const selectButtons = container.querySelectorAll(
        "[data-slot='select-system-button']"
      )
      expect(selectButtons.length).toBeGreaterThanOrEqual(1)

      await act(async () => {
        ;(selectButtons[0] as HTMLElement).click()
      })

      // The button should now reflect active state
      expect(selectButtons[0].textContent).toMatch(/(active|selected)/i)
    })

    it("handles null catalog gracefully without crashing", () => {
      const emptyService = createMockCatalogService(null)
      expect(() => {
        renderWithProviders(<ResourceNavigator />, {
          catalog: null,
          catalogService: emptyService,
        })
      }).not.toThrow()

      expect(
        container.querySelector("[data-slot='catalog-search-input']")
      ).toBeTruthy()
    })
  })
})
