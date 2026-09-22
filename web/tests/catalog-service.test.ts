import { describe, it, expect, beforeEach, vi } from "vitest"
import { CatalogService } from "../src/lib/catalog/catalog-service"
import type { CatalogIndex } from "../src/lib/catalog/catalog-types"

describe("CatalogService", () => {
  const mockCatalog: CatalogIndex = {
    schemaVersion: "open-studio-catalog/v1",
    generatedAt: "2026-09-22T00:00:00.000Z",
    stats: {
      totalDesignSystems: 2,
      totalCraftRules: 1,
      totalSkills: 1,
      totalTemplates: 1,
    },
    taxonomies: {
      categories: ["Productivity & SaaS"],
      tags: ["dark-mode", "minimal"],
      surfaces: ["landing", "dashboard"],
    },
    designSystems: [
      {
        id: "linear-app",
        name: "Linear",
        category: "Productivity & SaaS",
        description: "Curated design system for Linear",
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
        id: "minimal-system",
        name: "Minimal System",
        category: "Productivity & SaaS",
        description: "Minimal system without extra files",
        tags: ["minimal"],
        swatches: {},
        tokenSummary: {
          totalCssVariables: 0,
          hasColorRamps: false,
          hasRadiusTokens: false,
          hasTypographyTokens: false,
          condensedCssVariablesCount: 0,
          previewDeclarations: [],
        },
        craft: {
          suggested: [],
          exemptions: [],
        },
        availableFiles: {
          hasUsage: false,
          hasDesignMd: false,
          hasTokensCss: false,
          hasTailwindCss: false,
          hasComponentsHtml: false,
          hasComponentsManifest: false,
        },
        assetPaths: {
          basePath: "data/design-systems/minimal-system",
        },
      },
    ],
    craftRules: [
      {
        id: "anti-ai-slop",
        name: "Anti-AI-Slop",
        category: "discipline",
        description: "Disciplined craft rules",
        ruleCount: 5,
        isDefaultEnabled: true,
        assetPath: "data/craft/anti-ai-slop.md",
      },
    ],
    skills: [],
    templates: [],
  }

  const sampleTokensCss = `/* Linear Tokens */
:root {
  --bg: #08090a;
  --fg: #f7f8f8;
  --accent: #5e6ad2;
  --tw-internal-helper: 1;
  --_private-var: hidden;
}
`

  let mockFetch: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockFetch = vi.fn(async (url: string | URL | Request) => {
      const urlStr = url.toString()

      if (urlStr.endsWith("/catalog-index.json") || urlStr === "/catalog-index.json") {
        return {
          ok: true,
          status: 200,
          statusText: "OK",
          json: async () => mockCatalog,
          text: async () => JSON.stringify(mockCatalog),
        } as unknown as Response
      }

      if (urlStr.includes("tokens.css")) {
        return {
          ok: true,
          status: 200,
          statusText: "OK",
          text: async () => sampleTokensCss,
        } as unknown as Response
      }

      if (urlStr.includes("USAGE.md")) {
        return {
          ok: true,
          status: 200,
          statusText: "OK",
          text: async () => "# Usage Guide",
        } as unknown as Response
      }

      if (urlStr.includes("DESIGN.md")) {
        return {
          ok: true,
          status: 200,
          statusText: "OK",
          text: async () => "# Design Language",
        } as unknown as Response
      }

      if (urlStr.includes("components.html")) {
        return {
          ok: true,
          status: 200,
          statusText: "OK",
          text: async () => "<button class='btn'>Click</button>",
        } as unknown as Response
      }

      if (urlStr.includes("anti-ai-slop.md")) {
        return {
          ok: true,
          status: 200,
          statusText: "OK",
          text: async () => "# Anti-AI-Slop Rules",
        } as unknown as Response
      }

      return {
        ok: false,
        status: 404,
        statusText: "Not Found",
        text: async () => "Not Found",
      } as unknown as Response
    })
  })

  describe("loadCatalog", () => {
    it("fetches catalog index and parses it", async () => {
      const service = new CatalogService({ fetch: mockFetch as unknown as typeof fetch })

      const catalog = await service.loadCatalog()

      expect(catalog.schemaVersion).toBe("open-studio-catalog/v1")
      expect(catalog.designSystems).toHaveLength(2)
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it("caches catalog index across multiple calls", async () => {
      const service = new CatalogService({ fetch: mockFetch as unknown as typeof fetch })

      const catalog1 = await service.loadCatalog()
      const catalog2 = await service.loadCatalog()

      expect(catalog1).toBe(catalog2)
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it("deduplicates concurrent in-flight loadCatalog requests", async () => {
      const service = new CatalogService({ fetch: mockFetch as unknown as typeof fetch })

      const [c1, c2, c3] = await Promise.all([
        service.loadCatalog(),
        service.loadCatalog(),
        service.loadCatalog(),
      ])

      expect(c1).toBe(c2)
      expect(c2).toBe(c3)
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it("throws a descriptive error when network fails", async () => {
      mockFetch = vi.fn().mockRejectedValue(new Error("Network Error"))
      const service = new CatalogService({ fetch: mockFetch as unknown as typeof fetch })

      await expect(service.loadCatalog()).rejects.toThrow("Network Error")
    })

    it("throws when catalog endpoint returns non-200 status", async () => {
      mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      } as Response)
      const service = new CatalogService({ fetch: mockFetch as unknown as typeof fetch })

      await expect(service.loadCatalog()).rejects.toThrow("500 Internal Server Error")
    })

    it("throws when catalog index schemaVersion is invalid", async () => {
      mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ schemaVersion: "invalid-version" }),
      } as Response)
      const service = new CatalogService({ fetch: mockFetch as unknown as typeof fetch })

      await expect(service.loadCatalog()).rejects.toThrow("Invalid catalog schema version")
    })
  })

  describe("fetchAssetContent", () => {
    it("fetches asset content by relative path", async () => {
      const service = new CatalogService({ fetch: mockFetch as unknown as typeof fetch })

      const content = await service.fetchAssetContent("data/craft/anti-ai-slop.md")

      expect(content).toBe("# Anti-AI-Slop Rules")
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("data/craft/anti-ai-slop.md")
      )
    })

    it("normalizes leading slashes in asset path", async () => {
      const service = new CatalogService({ fetch: mockFetch as unknown as typeof fetch })

      const content1 = await service.fetchAssetContent("/data/craft/anti-ai-slop.md")
      const content2 = await service.fetchAssetContent("data/craft/anti-ai-slop.md")

      expect(content1).toBe("# Anti-AI-Slop Rules")
      expect(content2).toBe("# Anti-AI-Slop Rules")
      // Should be fetched once and cached
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it("caches asset content so repeated calls do not re-fetch", async () => {
      const service = new CatalogService({ fetch: mockFetch as unknown as typeof fetch })

      await service.fetchAssetContent("data/craft/anti-ai-slop.md")
      await service.fetchAssetContent("data/craft/anti-ai-slop.md")

      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it("deduplicates concurrent fetches for the same asset", async () => {
      const service = new CatalogService({ fetch: mockFetch as unknown as typeof fetch })

      const [res1, res2] = await Promise.all([
        service.fetchAssetContent("data/craft/anti-ai-slop.md"),
        service.fetchAssetContent("data/craft/anti-ai-slop.md"),
      ])

      expect(res1).toBe(res2)
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it("throws descriptive error on 404", async () => {
      const service = new CatalogService({ fetch: mockFetch as unknown as typeof fetch })

      await expect(service.fetchAssetContent("data/nonexistent.md")).rejects.toThrow(
        "Failed to fetch asset 'data/nonexistent.md': 404 Not Found"
      )
    })
  })

  describe("fetchDesignTokens", () => {
    it("fetches full CSS tokens for a design system", async () => {
      const service = new CatalogService({ fetch: mockFetch as unknown as typeof fetch })

      const tokens = await service.fetchDesignTokens("linear-app", "full")

      expect(tokens).toBe(sampleTokensCss)
    })

    it("fetches condensed CSS tokens, removing internal vars and comments", async () => {
      const service = new CatalogService({ fetch: mockFetch as unknown as typeof fetch })

      const condensed = await service.fetchDesignTokens("linear-app", "condensed")

      expect(condensed).toContain("--bg: #08090a;")
      expect(condensed).toContain("--fg: #f7f8f8;")
      expect(condensed).toContain("--accent: #5e6ad2;")
      // Internal variables should be stripped
      expect(condensed).not.toContain("--tw-internal-helper")
      expect(condensed).not.toContain("--_private-var")
      expect(condensed).not.toContain("/* Linear Tokens */")
      expect(condensed.startsWith(":root {")).toBe(true)
    })

    it("throws error for unknown design system id", async () => {
      const service = new CatalogService({ fetch: mockFetch as unknown as typeof fetch })

      await expect(service.fetchDesignTokens("non-existent-system", "full")).rejects.toThrow(
        "Design system not found: 'non-existent-system'"
      )
    })

    it("returns empty string if system has no tokens.css", async () => {
      const service = new CatalogService({ fetch: mockFetch as unknown as typeof fetch })

      const tokens = await service.fetchDesignTokens("minimal-system", "full")
      expect(tokens).toBe("")
    })
  })

  describe("fetchDesignSystemBundle", () => {
    it("fetches all available design system assets in parallel", async () => {
      const service = new CatalogService({ fetch: mockFetch as unknown as typeof fetch })

      const bundle = await service.fetchDesignSystemBundle("linear-app")

      expect(bundle.usage).toBe("# Usage Guide")
      expect(bundle.designMd).toBe("# Design Language")
      expect(bundle.tokensCss).toBe(sampleTokensCss)
      expect(bundle.componentsHtml).toBe("<button class='btn'>Click</button>")
    })

    it("handles design systems with partial or missing files gracefully", async () => {
      const service = new CatalogService({ fetch: mockFetch as unknown as typeof fetch })

      const bundle = await service.fetchDesignSystemBundle("minimal-system")

      expect(bundle.usage).toBeUndefined()
      expect(bundle.designMd).toBeUndefined()
      expect(bundle.tokensCss).toBeUndefined()
      expect(bundle.componentsHtml).toBeUndefined()
    })

    it("throws error when design system id does not exist", async () => {
      const service = new CatalogService({ fetch: mockFetch as unknown as typeof fetch })

      await expect(service.fetchDesignSystemBundle("unknown-system")).rejects.toThrow(
        "Design system not found: 'unknown-system'"
      )
    })
  })

  describe("Cache Invalidation", () => {
    it("clears cached index and assets when clearCache() is called", async () => {
      const service = new CatalogService({ fetch: mockFetch as unknown as typeof fetch })

      await service.loadCatalog()
      await service.fetchAssetContent("data/craft/anti-ai-slop.md")
      expect(mockFetch).toHaveBeenCalledTimes(2)

      service.clearCache()

      await service.loadCatalog()
      await service.fetchAssetContent("data/craft/anti-ai-slop.md")
      expect(mockFetch).toHaveBeenCalledTimes(4)
    })
  })
})
