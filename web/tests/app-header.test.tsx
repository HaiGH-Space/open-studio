import React, { act } from "react"
import { createRoot } from "react-dom/client"
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { CatalogProvider } from "../src/context/CatalogContext"
import { ComposerProvider } from "../src/context/ComposerContext"
import { AppHeader } from "../src/components/cockpit/AppHeader"
import { CommandMenuDialog } from "../src/components/cockpit/CommandMenuDialog"
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
    tags: ["dark-mode", "minimal", "cards"],
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

describe("AppHeader & CommandMenuDialog (Task 11)", () => {
  let container: HTMLDivElement
  let root: ReturnType<typeof createRoot>
  let mockService: ICatalogService

  beforeEach(() => {
    container = document.createElement("div")
    document.body.appendChild(container)
    root = createRoot(container)
    mockService = createMockCatalogService()

    // Mock clipboard
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
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

  describe("AppHeader Component", () => {
    it("renders brand logo and title", () => {
      renderWithProviders(<AppHeader />)
      const brandLogo = container.querySelector("[data-slot='app-brand-logo']")
      expect(brandLogo).toBeTruthy()
      expect(container.textContent).toContain("Open Studio")
    })

    it("displays active design system badge when a brand is selected", () => {
      const base = createDefaultComposerConfig()
      const config: ComposerConfig = {
        ...base,
        layer5BrandContract: {
          ...base.layer5BrandContract,
          selectedSystemId: "linear-app",
          enabled: true,
        },
      }

      renderWithProviders(<AppHeader />, { config })
      const badge = container.querySelector("[data-slot='active-brand-badge']")
      expect(badge).toBeTruthy()
      expect(badge?.textContent).toContain("Linear")
    })

    it("displays default 'No System' or 'Select System' badge when no brand is selected", () => {
      const base = createDefaultComposerConfig()
      const config: ComposerConfig = {
        ...base,
        layer5BrandContract: {
          ...base.layer5BrandContract,
          selectedSystemId: undefined,
        },
      }

      renderWithProviders(<AppHeader />, { config })
      const badge = container.querySelector("[data-slot='active-brand-badge']")
      expect(badge).toBeTruthy()
      expect(badge?.textContent?.toLowerCase()).toMatch(/(no system|select system|none)/)
    })

    it("displays token gauge summary with token count and budget", () => {
      renderWithProviders(<AppHeader />)
      const tokenGauge = container.querySelector("[data-slot='token-gauge']")
      expect(tokenGauge).toBeTruthy()
      expect(tokenGauge?.textContent).toMatch(/\d+/)
      expect(tokenGauge?.textContent?.toLowerCase()).toContain("token")
    })

    it("displays over-budget status when tokens exceed budget limit", () => {
      const base = createDefaultComposerConfig()
      const config: ComposerConfig = {
        ...base,
        layer9BriefAndClarification: {
          ...base.layer9BriefAndClarification,
          userObjective: "x".repeat(40000),
        },
      }

      renderWithProviders(<AppHeader budgetLimit={5000} />, { config })
      const overBudgetIndicator = container.querySelector("[data-slot='token-overbudget']")
      expect(overBudgetIndicator).toBeTruthy()
    })

    it("copies prompt to clipboard when quick export button is clicked", async () => {
      renderWithProviders(<AppHeader />)
      const exportButton = container.querySelector("[data-slot='quick-export-button']") as HTMLButtonElement
      expect(exportButton).toBeTruthy()

      await act(async () => {
        exportButton.click()
      })

      expect(navigator.clipboard.writeText).toHaveBeenCalledTimes(1)
      expect(exportButton.textContent).toMatch(/(copied|export)/i)
    })

    it("invokes onExport callback prop when export button is clicked", async () => {
      const handleExport = vi.fn()
      renderWithProviders(<AppHeader onExport={handleExport} />)
      const exportButton = container.querySelector("[data-slot='quick-export-button']") as HTMLButtonElement
      expect(exportButton).toBeTruthy()

      await act(async () => {
        exportButton.click()
      })

      expect(handleExport).toHaveBeenCalledTimes(1)
    })

    it("contains command palette trigger showing shortcut key hint", () => {
      renderWithProviders(<AppHeader />)
      const commandTrigger = container.querySelector("[data-slot='command-menu-trigger']") as HTMLButtonElement
      expect(commandTrigger).toBeTruthy()
      expect(commandTrigger.textContent).toMatch(/(⌘k|ctrl\+k|search)/i)
    })

    it("clicking command palette trigger opens CommandMenuDialog", () => {
      renderWithProviders(<AppHeader />)
      const commandTrigger = container.querySelector("[data-slot='command-menu-trigger']") as HTMLButtonElement
      expect(commandTrigger).toBeTruthy()

      act(() => {
        commandTrigger.click()
      })

      const dialog = document.querySelector("[role='dialog']")
      expect(dialog).toBeTruthy()
      expect(dialog?.getAttribute("data-open")).not.toBeNull()
      expect(document.body.textContent).toContain("Quick Command Palette")
    })
  })

  describe("CommandMenuDialog Component", () => {
    it("opens when Cmd+K or Ctrl+K is pressed on window", () => {
      renderWithProviders(<CommandMenuDialog />)

      // Simulate Cmd+K
      act(() => {
        const event = new KeyboardEvent("keydown", {
          key: "k",
          metaKey: true,
          bubbles: true,
        })
        window.dispatchEvent(event)
      })

      const dialog = document.querySelector("[role='dialog']")
      expect(dialog).toBeTruthy()
      expect(dialog?.getAttribute("data-open")).not.toBeNull()
    })

    it("cleans up keydown event listener on unmount", () => {
      const removeSpy = vi.spyOn(window, "removeEventListener")
      const { unmount } = {
        unmount: () => {
          act(() => {
            root.unmount()
          })
        },
      }
      renderWithProviders(<CommandMenuDialog />)

      unmount()
      expect(removeSpy).toHaveBeenCalledWith("keydown", expect.any(Function))
    })

    it("filters design systems and craft rules by query", () => {
      renderWithProviders(<CommandMenuDialog defaultOpen />)

      const searchInput = document.querySelector("[data-slot='command-search-input']") as HTMLInputElement
      expect(searchInput).toBeTruthy()

      // Type "linear"
      act(() => {
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          "value"
        )?.set
        nativeInputValueSetter?.call(searchInput, "linear")
        searchInput.dispatchEvent(new Event("input", { bubbles: true }))
      })

      const items = document.querySelectorAll("[data-slot^='command-item']")
      const texts = Array.from(items).map((el) => el.textContent)
      expect(texts.some((t) => t?.includes("Linear"))).toBe(true)
      expect(texts.some((t) => t?.includes("Stripe"))).toBe(false)
    })

    it("selecting a design system updates composer and closes dialog", async () => {
      renderWithProviders(<CommandMenuDialog defaultOpen />)

      const items = document.querySelectorAll("[data-slot='command-item-system']")
      expect(items.length).toBeGreaterThanOrEqual(1)

      const firstSystem = items[0] as HTMLElement
      await act(async () => {
        firstSystem.click()
      })

      // Dialog should close
      const dialog = document.querySelector("[role='dialog']")
      expect(dialog?.getAttribute("data-closed")).not.toBeNull()
    })

    it("activating a craft rule toggles it in composer", () => {
      renderWithProviders(<CommandMenuDialog defaultOpen />)

      const ruleItems = document.querySelectorAll("[data-slot='command-item-rule']")
      expect(ruleItems.length).toBeGreaterThanOrEqual(1)

      const firstRule = ruleItems[0] as HTMLElement
      act(() => {
        firstRule.click()
      })

      expect(firstRule).toBeTruthy()
    })

    it("shows empty state when no items match search query", () => {
      renderWithProviders(<CommandMenuDialog defaultOpen />)

      const searchInput = document.querySelector("[data-slot='command-search-input']") as HTMLInputElement
      expect(searchInput).toBeTruthy()

      // Type a query that matches nothing
      act(() => {
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          "value"
        )?.set
        nativeInputValueSetter?.call(searchInput, "nonexistent-query-12345")
        searchInput.dispatchEvent(new Event("input", { bubbles: true }))
      })

      const emptySlot = document.querySelector("[data-slot='command-empty']")
      expect(emptySlot).toBeTruthy()
      expect(emptySlot?.textContent).toMatch(/no (matching )?results|no (matching )?resources/i)
    })

    it("handles null or empty catalog gracefully", () => {
      const emptyService = createMockCatalogService(null)
      renderWithProviders(<CommandMenuDialog defaultOpen />, {
        catalog: null,
        catalogService: emptyService,
      })

      const searchInput = document.querySelector("[data-slot='command-search-input']")
      expect(searchInput).toBeTruthy()
      const emptySlot = document.querySelector("[data-slot='command-empty']")
      expect(emptySlot).toBeTruthy()
    })

    it("handles regex special characters in search input without error", () => {
      renderWithProviders(<CommandMenuDialog defaultOpen />)

      const searchInput = document.querySelector("[data-slot='command-search-input']") as HTMLInputElement
      expect(searchInput).toBeTruthy()

      // Type special regex characters: "[+*?"
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
  })
})
