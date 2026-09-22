import React, { act } from "react"
import { createRoot } from "react-dom/client"
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { CatalogProvider } from "../src/context/CatalogContext"
import { useCatalog } from "../src/hooks/useCatalog"
import { ComposerProvider } from "../src/context/ComposerContext"
import { useComposer } from "../src/hooks/useComposer"
import { useTokenCount } from "../src/hooks/useTokenCount"
import type { CatalogIndex, ICatalogService, DesignSystemBundle } from "../src/lib/catalog/catalog-types"
import { STORAGE_KEYS } from "../src/lib/storage/persistence"

// Configure React act environment support in test environment
declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true

// Test helper to render hooks using pure React 19 createRoot + act
function renderHook<T>(
  hookFn: () => T,
  options?: { wrapper?: React.ComponentType<{ children: React.ReactNode }> }
) {
  const result: { current: T } = {} as { current: T }
  const container = document.createElement("div")
  document.body.appendChild(container)
  const root = createRoot(container)

  function TestComponent() {
    result.current = hookFn()
    return null
  }

  const Wrapper = options?.wrapper ?? (({ children }: { children: React.ReactNode }) => <>{children}</>)

  act(() => {
    root.render(
      <Wrapper>
        <TestComponent />
      </Wrapper>
    )
  })

  return {
    result,
    rerender: () => {
      act(() => {
        root.render(
          <Wrapper>
            <TestComponent />
          </Wrapper>
        )
      })
    },
    unmount: () => {
      act(() => {
        root.unmount()
      })
      container.remove()
    },
  }
}

describe("Composer & Catalog State Pipeline (Task 9)", () => {
  const mockCatalogData: CatalogIndex = {
    schemaVersion: "open-studio-catalog/v1",
    generatedAt: "2026-09-22T00:00:00.000Z",
    stats: {
      totalDesignSystems: 2,
      totalCraftRules: 2,
      totalSkills: 1,
      totalTemplates: 1,
    },
    taxonomies: {
      categories: ["Productivity & SaaS", "Developer Tools"],
      tags: ["dark-mode", "minimal", "cards"],
      surfaces: ["landing", "dashboard"],
    },
    designSystems: [
      {
        id: "linear-app",
        name: "Linear",
        category: "Productivity & SaaS",
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
        description: "Iconic gradient-rich developer-centric billing system",
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
        name: "WCAG Accessibility",
        category: "accessibility",
        description: "Enforces strict AAA contrast ratios",
        ruleCount: 8,
        isDefaultEnabled: false,
        assetPath: "data/craft/accessibility-contrast.md",
      },
    ],
    skills: [
      {
        id: "emil-motion",
        name: "Micro-interactions & Motion",
        description: "Fluid spring animations",
        category: "motion",
        triggers: ["animation", "spring", "modal"],
        assetPath: "data/skills/emil-motion/SKILL.md",
      },
    ],
    templates: [
      {
        id: "saas-landing",
        name: "SaaS Landing Page",
        category: "design-template",
        description: "Conversion-optimized hero, features, and pricing",
        surface: "landing",
        suggestedSystems: ["linear-app"],
        assetPath: "data/templates/saas-landing.md",
      },
    ],
  }

  let mockCatalogService: ICatalogService

  beforeEach(() => {
    localStorage.clear()
    vi.useFakeTimers()

    mockCatalogService = {
      loadCatalog: vi.fn().mockResolvedValue(mockCatalogData),
      fetchAssetContent: vi.fn().mockImplementation((path: string) => {
        return Promise.resolve(`Mock content for ${path}`)
      }),
      fetchDesignTokens: vi.fn().mockResolvedValue(":root { --primary: #5e6ad2; }"),
      fetchDesignSystemBundle: vi.fn().mockImplementation((systemId: string): Promise<DesignSystemBundle> => {
        return Promise.resolve({
          usage: `# ${systemId} Usage Guidelines`,
          designMd: `# ${systemId} Design Principles`,
          tokensCss: `:root { --system: "${systemId}"; }`,
          componentsHtml: `<div class="${systemId}-root">Component</div>`,
        })
      }),
      clearCache: vi.fn(),
      hasAssetCached: vi.fn().mockReturnValue(false),
      getLoadedCatalog: vi.fn().mockReturnValue(mockCatalogData),
    }
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    localStorage.clear()
  })

  describe("CatalogContext & useCatalog", () => {
    it("throws an informative error when used outside CatalogProvider", () => {
      // Suppress console.error for expected React uncaught error
      const consoleError = vi.spyOn(console, "error").mockImplementation(() => {})
      expect(() => {
        renderHook(() => useCatalog())
      }).toThrow(/useCatalog must be used within a CatalogProvider/)
      consoleError.mockRestore()
    })

    it("loads catalog on mount and provides data and categories", async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <CatalogProvider catalogService={mockCatalogService} autoLoad={true}>
          {children}
        </CatalogProvider>
      )

      const { result } = renderHook(() => useCatalog(), { wrapper })

      // Initial loading state
      expect(result.current.isLoading).toBe(true)
      expect(result.current.catalog).toBeNull()

      // Resolve loadCatalog
      await act(async () => {
        await Promise.resolve()
      })

      expect(result.current.isLoading).toBe(false)
      expect(result.current.catalog).not.toBeNull()
      expect(result.current.catalog?.designSystems).toHaveLength(2)
      expect(result.current.error).toBeNull()
    })

    it("filters design systems and craft rules by search query in real time", async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <CatalogProvider catalogService={mockCatalogService} initialCatalog={mockCatalogData}>
          {children}
        </CatalogProvider>
      )

      const { result } = renderHook(() => useCatalog(), { wrapper })

      expect(result.current.filteredDesignSystems).toHaveLength(2)
      expect(result.current.filteredCraftRules).toHaveLength(2)

      // Search by name "Linear"
      act(() => {
        result.current.setSearchQuery("Linear")
      })
      expect(result.current.filteredDesignSystems).toHaveLength(1)
      expect(result.current.filteredDesignSystems[0].id).toBe("linear-app")
      expect(result.current.filteredCraftRules).toHaveLength(0)

      // Search by tag "cards"
      act(() => {
        result.current.setSearchQuery("cards")
      })
      expect(result.current.filteredDesignSystems).toHaveLength(1)
      expect(result.current.filteredDesignSystems[0].id).toBe("stripe-dev")

      // Search by craft rule description "purple"
      act(() => {
        result.current.setSearchQuery("purple")
      })
      expect(result.current.filteredDesignSystems).toHaveLength(0)
      expect(result.current.filteredCraftRules).toHaveLength(1)
      expect(result.current.filteredCraftRules[0].id).toBe("anti-ai-slop")

      // Clear search
      act(() => {
        result.current.setSearchQuery("")
      })
      expect(result.current.filteredDesignSystems).toHaveLength(2)
    })

    it("filters design systems by selected category", async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <CatalogProvider catalogService={mockCatalogService} initialCatalog={mockCatalogData}>
          {children}
        </CatalogProvider>
      )

      const { result } = renderHook(() => useCatalog(), { wrapper })

      act(() => {
        result.current.setSelectedCategory("Developer Tools")
      })

      expect(result.current.filteredDesignSystems).toHaveLength(1)
      expect(result.current.filteredDesignSystems[0].id).toBe("stripe-dev")

      // Reset to all
      act(() => {
        result.current.setSelectedCategory(null)
      })
      expect(result.current.filteredDesignSystems).toHaveLength(2)
    })

    it("handles preview system selection cleanly", async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <CatalogProvider catalogService={mockCatalogService} initialCatalog={mockCatalogData}>
          {children}
        </CatalogProvider>
      )

      const { result } = renderHook(() => useCatalog(), { wrapper })

      expect(result.current.previewSystemId).toBeNull()
      expect(result.current.previewSystem).toBeNull()

      act(() => {
        result.current.setPreviewSystemId("linear-app")
      })

      expect(result.current.previewSystemId).toBe("linear-app")
      expect(result.current.previewSystem?.name).toBe("Linear")

      // Clear preview
      act(() => {
        result.current.setPreviewSystemId(null)
      })
      expect(result.current.previewSystem).toBeNull()
    })

    it("handles catalog load failures gracefully with error state", async () => {
      const failingService: ICatalogService = {
        ...mockCatalogService,
        loadCatalog: vi.fn().mockRejectedValue(new Error("Network timeout")),
      }

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <CatalogProvider catalogService={failingService} autoLoad={true}>
          {children}
        </CatalogProvider>
      )

      const { result } = renderHook(() => useCatalog(), { wrapper })

      await act(async () => {
        await Promise.resolve()
      })

      expect(result.current.isLoading).toBe(false)
      expect(result.current.catalog).toBeNull()
      expect(result.current.error).toBe("Network timeout")
    })
  })

  describe("ComposerContext & useComposer", () => {
    it("throws an informative error when used outside ComposerProvider", () => {
      const consoleError = vi.spyOn(console, "error").mockImplementation(() => {})
      expect(() => {
        renderHook(() => useComposer())
      }).toThrow(/useComposer must be used within a ComposerProvider/)
      consoleError.mockRestore()
    })

    it("initializes with default configuration and compiles initial prompt", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ComposerProvider catalogService={mockCatalogService}>
          {children}
        </ComposerProvider>
      )

      const { result } = renderHook(() => useComposer(), { wrapper })

      expect(result.current.config.layer1Security.enabled).toBe(true)
      expect(result.current.config.layer3AuthoritativeConstraints.targetFramework).toBe("react")
      expect(result.current.compiledPrompt).toBeDefined()
      expect(result.current.compiledPrompt.fullPrompt).toContain("<open-studio-directive")
      expect(result.current.compiledPrompt.totalTokens).toBeGreaterThan(0)
    })

    it("debounces prompt re-compilation with 100ms timer", async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ComposerProvider catalogService={mockCatalogService}>
          {children}
        </ComposerProvider>
      )

      const { result } = renderHook(() => useComposer(), { wrapper })
      const initialPrompt = result.current.compiledPrompt.fullPrompt

      // Update objective in Layer 9
      act(() => {
        result.current.setUserObjective("Create an AI analytics dashboard with real-time graphs")
      })

      // Immediately after update, the compiled prompt has NOT yet updated due to 100ms debounce
      expect(result.current.compiledPrompt.fullPrompt).toBe(initialPrompt)
      expect(result.current.isDebouncing).toBe(true)

      // Advance by 50ms - still debouncing
      act(() => {
        vi.advanceTimersByTime(50)
      })
      expect(result.current.compiledPrompt.fullPrompt).toBe(initialPrompt)

      // Advance past 100ms
      act(() => {
        vi.advanceTimersByTime(60)
      })

      expect(result.current.isDebouncing).toBe(false)
      expect(result.current.compiledPrompt.fullPrompt).toContain("Create an AI analytics dashboard")
    })

    it("coalesces rapid consecutive updates into a single compilation after 100ms", async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ComposerProvider catalogService={mockCatalogService}>
          {children}
        </ComposerProvider>
      )

      const { result } = renderHook(() => useComposer(), { wrapper })

      // Rapidly update 3 times
      act(() => {
        result.current.setUserObjective("Update 1")
      })
      act(() => {
        vi.advanceTimersByTime(30)
      })
      act(() => {
        result.current.setUserObjective("Update 2")
      })
      act(() => {
        vi.advanceTimersByTime(30)
      })
      act(() => {
        result.current.setUserObjective("Final Update 3")
      })

      // 40ms later, still not recompiled
      act(() => {
        vi.advanceTimersByTime(40)
      })
      expect(result.current.compiledPrompt.fullPrompt).not.toContain("Final Update 3")

      // Advance remaining 70ms to clear debounce
      act(() => {
        vi.advanceTimersByTime(70)
      })

      expect(result.current.compiledPrompt.fullPrompt).toContain("Final Update 3")
      expect(result.current.compiledPrompt.fullPrompt).not.toContain("Update 1")
    })

    it("supports compileNow() to bypass debounce when immediately needed", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ComposerProvider catalogService={mockCatalogService}>
          {children}
        </ComposerProvider>
      )

      const { result } = renderHook(() => useComposer(), { wrapper })

      act(() => {
        result.current.setUserObjective("Immediate compilation required")
        result.current.compileNow()
      })

      expect(result.current.compiledPrompt.fullPrompt).toContain("Immediate compilation required")
      expect(result.current.isDebouncing).toBe(false)
    })

    it("selectDesignSystem automatically loads bundle assets and enables Layer 5", async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ComposerProvider catalogService={mockCatalogService}>
          {children}
        </ComposerProvider>
      )

      const { result } = renderHook(() => useComposer(), { wrapper })

      await act(async () => {
        await result.current.selectDesignSystem("linear-app")
      })

      expect(result.current.config.layer5BrandContract.selectedSystemId).toBe("linear-app")
      expect(result.current.config.layer5BrandContract.enabled).toBe(true)
      expect(mockCatalogService.fetchDesignSystemBundle).toHaveBeenCalledWith("linear-app")
      expect(result.current.assets.designSystem?.usage).toContain("linear-app")

      // Advance timer for debounced recompilation
      act(() => {
        vi.advanceTimersByTime(100)
      })

      expect(result.current.compiledPrompt.fullPrompt).toContain("linear-app")
    })

    it("allows deselecting design system cleanly", async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ComposerProvider catalogService={mockCatalogService}>
          {children}
        </ComposerProvider>
      )

      const { result } = renderHook(() => useComposer(), { wrapper })

      await act(async () => {
        await result.current.selectDesignSystem("linear-app")
      })
      expect(result.current.config.layer5BrandContract.selectedSystemId).toBe("linear-app")

      await act(async () => {
        await result.current.selectDesignSystem(undefined)
      })
      expect(result.current.config.layer5BrandContract.selectedSystemId).toBeUndefined()
      expect(result.current.assets.designSystem).toBeUndefined()
    })

    it("toggles craft rules and loads their markdown content on demand", async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <CatalogProvider catalogService={mockCatalogService} initialCatalog={mockCatalogData}>
          <ComposerProvider catalogService={mockCatalogService}>
            {children}
          </ComposerProvider>
        </CatalogProvider>
      )

      const { result } = renderHook(() => useComposer(), { wrapper })

      // Initially "anti-ai-slop" is selected by default
      expect(result.current.config.layer6CraftRules.selectedRuleIds).toContain("anti-ai-slop")

      // Toggle off anti-ai-slop
      await act(async () => {
        await result.current.toggleCraftRule("anti-ai-slop")
      })
      expect(result.current.config.layer6CraftRules.selectedRuleIds).not.toContain("anti-ai-slop")

      // Toggle on accessibility-contrast
      await act(async () => {
        await result.current.toggleCraftRule("accessibility-contrast")
      })
      expect(result.current.config.layer6CraftRules.selectedRuleIds).toContain("accessibility-contrast")
      expect(mockCatalogService.fetchAssetContent).toHaveBeenCalledWith("data/craft/accessibility-contrast.md")
    })

    it("manages clarification answers and interactive loops", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ComposerProvider catalogService={mockCatalogService}>
          {children}
        </ComposerProvider>
      )

      const { result } = renderHook(() => useComposer(), { wrapper })

      act(() => {
        result.current.addClarificationAnswer({
          questionId: "auth-type",
          questionLabel: "Authentication Strategy",
          selectedValues: ["oauth-github", "magic-link"],
        })
      })

      expect(result.current.config.layer9BriefAndClarification.clarificationAnswers).toHaveLength(1)
      expect(result.current.config.layer9BriefAndClarification.clarificationAnswers[0].questionId).toBe("auth-type")

      // Adding answer for existing questionId replaces it
      act(() => {
        result.current.addClarificationAnswer({
          questionId: "auth-type",
          questionLabel: "Authentication Strategy",
          selectedValues: ["passkeys"],
        })
      })
      expect(result.current.config.layer9BriefAndClarification.clarificationAnswers).toHaveLength(1)
      expect(result.current.config.layer9BriefAndClarification.clarificationAnswers[0].selectedValues).toEqual(["passkeys"])

      // Clear answers
      act(() => {
        result.current.clearClarificationAnswers()
      })
      expect(result.current.config.layer9BriefAndClarification.clarificationAnswers).toHaveLength(0)
    })

    it("manages active agent export target and produces formatted export", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ComposerProvider catalogService={mockCatalogService}>
          {children}
        </ComposerProvider>
      )

      const { result } = renderHook(() => useComposer(), { wrapper })

      expect(result.current.agentTarget).toBe("generic-llm")

      act(() => {
        result.current.setAgentTarget("cursor")
      })
      expect(result.current.agentTarget).toBe("cursor")

      const exportResult = result.current.getExportOutput()
      expect(exportResult.format).toBe("cursor")
      expect(exportResult.primaryClipboardText).toBeDefined()
      expect(exportResult.downloadableFiles[0].filename).toBe(".cursorrules")
      expect(exportResult.downloadableFiles[0].content).toBeDefined()
    })

    it("auto-saves Layer 9 draft brief to localStorage", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ComposerProvider catalogService={mockCatalogService} autoPersist={true}>
          {children}
        </ComposerProvider>
      )

      const { result } = renderHook(() => useComposer(), { wrapper })

      act(() => {
        result.current.setUserObjective("Auto-persisted objective")
      })

      const rawStored = localStorage.getItem(STORAGE_KEYS.DRAFT_BRIEF)
      expect(rawStored).not.toBeNull()
      const parsed = JSON.parse(rawStored!)
      expect(parsed.userObjective).toBe("Auto-persisted objective")
    })

    it("restores Layer 8 User Memory from localStorage on mount", () => {
      const savedMemory = {
        enabled: true,
        persistentDirectives: ["Always adhere to WCAG AAA"],
        negativeConstraints: ["Never use inline styles"],
      }
      localStorage.setItem(STORAGE_KEYS.USER_MEMORY, JSON.stringify(savedMemory))

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ComposerProvider catalogService={mockCatalogService} autoPersist={true}>
          {children}
        </ComposerProvider>
      )

      const { result } = renderHook(() => useComposer(), { wrapper })

      expect(result.current.config.layer8UserMemory.persistentDirectives).toEqual([
        "Always adhere to WCAG AAA",
      ])
      expect(result.current.config.layer8UserMemory.negativeConstraints).toEqual([
        "Never use inline styles",
      ])
    })

    it("supports resetConfig to restore defaults", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ComposerProvider catalogService={mockCatalogService}>
          {children}
        </ComposerProvider>
      )

      const { result } = renderHook(() => useComposer(), { wrapper })

      act(() => {
        result.current.updateLayer("layer3AuthoritativeConstraints", {
          targetFramework: "svelte",
        })
      })
      expect(result.current.config.layer3AuthoritativeConstraints.targetFramework).toBe("svelte")

      act(() => {
        result.current.resetConfig()
      })
      expect(result.current.config.layer3AuthoritativeConstraints.targetFramework).toBe("react")
    })
  })

  describe("useTokenCount Hook", () => {
    it("provides real-time token counts, model cost, and budget usage metrics", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ComposerProvider catalogService={mockCatalogService}>
          {children}
        </ComposerProvider>
      )

      const { result } = renderHook(
        () => useTokenCount({ targetModel: "claude-3-5-sonnet", budgetLimit: 5000 }),
        { wrapper }
      )

      expect(result.current.totalTokens).toBeGreaterThan(0)
      expect(result.current.estimatedCost.inputCost).toBeGreaterThanOrEqual(0)
      expect(result.current.budgetLimit).toBe(5000)
      expect(result.current.budgetUsagePercent).toBeGreaterThan(0)
      expect(result.current.isOverBudget).toBe(false)
      expect(result.current.layerBreakdown.length).toBe(9)
    })

    it("flags isOverBudget when token count exceeds budget limit", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ComposerProvider catalogService={mockCatalogService}>
          {children}
        </ComposerProvider>
      )

      // Set tiny budget limit of 10 tokens
      const { result } = renderHook(
        () => useTokenCount({ targetModel: "claude-3-5-sonnet", budgetLimit: 10 }),
        { wrapper }
      )

      expect(result.current.isOverBudget).toBe(true)
      expect(result.current.budgetUsagePercent).toBeGreaterThan(100)
    })

    it("supports calculating tokens for custom arbitrary text", () => {
      const sampleText = "The quick brown fox jumps over the lazy dog."
      const { result } = renderHook(() =>
        useTokenCount({ customText: sampleText, targetModel: "gpt-4o", budgetLimit: 100 })
      )

      expect(result.current.totalTokens).toBe(11) // 44 chars / 4 = 11 tokens
      expect(result.current.isOverBudget).toBe(false)
      expect(result.current.budgetUsagePercent).toBe(11)
    })
  })
})
