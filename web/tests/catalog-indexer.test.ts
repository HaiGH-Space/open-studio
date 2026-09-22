import { describe, it, expect } from "vitest"
import fs from "node:fs"
import path from "node:path"
import {
  parseCssVariables,
  extractSwatches,
  summarizeTokens,
  generateCondensedTokens,
  buildDesignSystemEntry,
  buildCraftRuleEntry,
  buildSkillEntry,
  buildTemplateEntry,
  buildCatalogIndex,
} from "../../scripts/generate-catalog.ts"

describe("Catalog Indexer & Token Utilities", () => {
  const fixturePath = path.resolve(import.meta.dirname, "./fixtures/sample-tokens.css")
  const sampleCss = fs.readFileSync(fixturePath, "utf-8")

  describe("parseCssVariables", () => {
    it("parses CSS variables and strips inline comments", () => {
      const vars = parseCssVariables(sampleCss)
      expect(vars["--bg"]).toBe("#0b0f19")
      expect(vars["--surface"]).toBe("#111827")
      expect(vars["--primary"]).toBe("#6366f1")
    })

    it("resolves var() references when targets exist", () => {
      const vars = parseCssVariables(sampleCss)
      expect(vars["--surface-warm"]).toBe("#111827")
    })

    it("handles empty or malformed CSS gracefully", () => {
      expect(parseCssVariables("")).toEqual({})
      expect(parseCssVariables("invalid css without variables")).toEqual({})
      expect(parseCssVariables(":root { --only-key; }")).toEqual({})
    })
  })

  describe("extractSwatches", () => {
    it("extracts core swatches from sample tokens", () => {
      const swatches = extractSwatches(sampleCss)
      expect(swatches.background).toBe("#0b0f19")
      expect(swatches.foreground).toBe("#f9fafb")
      expect(swatches.primary).toBe("#6366f1")
      expect(swatches.accent).toBe("#818cf8")
      expect(swatches.muted).toBe("#9ca3af")
    })

    it("supports various color formats (HEX, RGB, HSL, OKLCH)", () => {
      const oklchCss = `:root {
        --bg: oklch(98.75% 0 0);
        --fg: oklch(21% 0.006 285.885);
        --accent: oklch(0.5772 0.2324 260);
      }`
      const swatchesOklch = extractSwatches(oklchCss)
      expect(swatchesOklch.background).toBe("oklch(98.75% 0 0)")
      expect(swatchesOklch.foreground).toBe("oklch(21% 0.006 285.885)")
      expect(swatchesOklch.accent).toBe("oklch(0.5772 0.2324 260)")

      const hslRgbCss = `:root {
        --background: hsl(210, 20%, 98%);
        --foreground: rgb(15, 23, 42);
        --primary: hsl(222, 47%, 11%);
        --muted: rgba(100, 116, 139, 0.7);
      }`
      const swatchesHsl = extractSwatches(hslRgbCss)
      expect(swatchesHsl.background).toBe("hsl(210, 20%, 98%)")
      expect(swatchesHsl.foreground).toBe("rgb(15, 23, 42)")
      expect(swatchesHsl.primary).toBe("hsl(222, 47%, 11%)")
      expect(swatchesHsl.muted).toBe("rgba(100, 116, 139, 0.7)")
    })

    it("handles missing swatches without throwing errors", () => {
      const swatches = extractSwatches(":root { --some-font: 16px; }")
      expect(swatches).toBeDefined()
      expect(swatches.background).toBeUndefined()
      expect(swatches.primary).toBeUndefined()
    })
  })

  describe("summarizeTokens", () => {
    it("computes accurate token metrics", () => {
      const summary = summarizeTokens(sampleCss)
      expect(summary.totalCssVariables).toBeGreaterThanOrEqual(20)
      expect(summary.hasColorRamps).toBe(true)
      expect(summary.hasRadiusTokens).toBe(true)
      expect(summary.hasTypographyTokens).toBe(true)
      expect(summary.condensedCssVariablesCount).toBeLessThan(summary.totalCssVariables)
      expect(summary.previewDeclarations.length).toBeLessThanOrEqual(8)
      expect(summary.previewDeclarations.length).toBeGreaterThan(0)
    })

    it("handles tokens without ramps or typography gracefully", () => {
      const minimalCss = ":root { --bg: #000; --fg: #fff; }"
      const summary = summarizeTokens(minimalCss)
      expect(summary.totalCssVariables).toBe(2)
      expect(summary.hasColorRamps).toBe(false)
      expect(summary.hasRadiusTokens).toBe(false)
      expect(summary.hasTypographyTokens).toBe(false)
      expect(summary.condensedCssVariablesCount).toBe(2)
    })
  })

  describe("generateCondensedTokens", () => {
    it("strips internal variables (--_*) and utility framework variables (--tw-*)", () => {
      const condensed = generateCondensedTokens(sampleCss)
      expect(condensed).not.toContain("--_internal-glow")
      expect(condensed).not.toContain("--_private-buffer")
      expect(condensed).not.toContain("--tw-ring-offset")
      expect(condensed).not.toContain("--tw-shadow")

      // Retains key brand tokens
      expect(condensed).toContain("--bg:")
      expect(condensed).toContain("--primary:")
      expect(condensed).toContain("--font-body:")
      expect(condensed).toContain("--radius-md:")
    })

    it("produces valid :root CSS block", () => {
      const condensed = generateCondensedTokens(sampleCss)
      expect(condensed.startsWith(":root {")).toBe(true)
      expect(condensed.endsWith("}")).toBe(true)
    })
  })

  describe("Catalog Entry Builders", () => {
    it("builds a conforming DesignSystemCatalogEntry from directory data", () => {
      const entry = buildDesignSystemEntry({
        id: "sample-system",
        dirPath: "/mock/sample-system",
        manifest: {
          id: "sample-system",
          name: "Sample System",
          category: "Productivity & SaaS",
          description: "A test design system",
          tags: ["dark-mode", "minimal"],
          craft: { suggested: ["anti-ai-slop"], exemptions: [] },
        },
        tokensCss: sampleCss,
        existingFiles: ["DESIGN.md", "tokens.css", "components.html"],
      })

      expect(entry.id).toBe("sample-system")
      expect(entry.name).toBe("Sample System")
      expect(entry.availableFiles.hasDesignMd).toBe(true)
      expect(entry.availableFiles.hasTokensCss).toBe(true)
      expect(entry.availableFiles.hasComponentsHtml).toBe(true)
      expect(entry.availableFiles.hasUsage).toBe(false)
      expect(entry.assetPaths.basePath).toBe("data/design-systems/sample-system")
      expect(entry.assetPaths.tokensCss).toBe("data/design-systems/sample-system/tokens.css")
      expect(entry.swatches.primary).toBe("#6366f1")
    })

    it("builds a conforming CraftRuleCatalogEntry from markdown content", () => {
      const markdown = `# Anti-AI-Slop Discipline

Eliminates generic gradient backgrounds, centered card syndrome, and purple hero titles.

## The seven cardinal sins
1. Rule one
2. Rule two
`
      const entry = buildCraftRuleEntry({
        id: "anti-ai-slop",
        markdown,
        filePath: "data/craft/anti-ai-slop.md",
      })

      expect(entry.id).toBe("anti-ai-slop")
      expect(entry.name).toBe("Anti-AI-Slop Discipline")
      expect(entry.category).toBe("discipline")
      expect(entry.isDefaultEnabled).toBe(true)
      expect(entry.ruleCount).toBeGreaterThan(0)
    })

    it("builds a conforming SkillCatalogEntry from frontmatter", () => {
      const skillMd = `---
name: emilkowalski-motion
description: Tasteful micro-interactions
triggers:
  - "motion"
  - "animation"
od:
  category: animation-motion
---
# Content`
      const entry = buildSkillEntry({
        id: "emilkowalski-motion",
        markdown: skillMd,
        assetPath: "data/skills/emilkowalski-motion/SKILL.md",
      })

      expect(entry.id).toBe("emilkowalski-motion")
      expect(entry.name).toBe("emilkowalski-motion")
      expect(entry.triggers).toEqual(["motion", "animation"])
      expect(entry.assetPath).toBe("data/skills/emilkowalski-motion/SKILL.md")
    })

    it("builds a conforming TemplateCatalogEntry from frontmatter", () => {
      const templateMd = `---
name: saas-landing
description: B2B SaaS landing page
od:
  surface: landing
---
# Template`
      const entry = buildTemplateEntry({
        id: "saas-landing",
        markdown: templateMd,
        assetPath: "data/design-templates/saas-landing/SKILL.md",
      })

      expect(entry.id).toBe("saas-landing")
      expect(entry.category).toBe("design-template")
      expect(entry.surface).toBe("landing")
    })
  })

  describe("buildCatalogIndex", () => {
    it("aggregates entries and computes taxonomies and stats", () => {
      const index = buildCatalogIndex({
        designSystems: [
          buildDesignSystemEntry({
            id: "system-1",
            dirPath: "/mock/system-1",
            manifest: {
              name: "System 1",
              category: "SaaS",
              description: "Desc",
              tags: ["dark-mode"],
            },
            tokensCss: sampleCss,
            existingFiles: ["DESIGN.md", "tokens.css"],
          }),
        ],
        craftRules: [
          buildCraftRuleEntry({
            id: "anti-ai-slop",
            markdown: "# Anti-AI-Slop\n\nDesc\n\n1. Rule",
            filePath: "data/craft/anti-ai-slop.md",
          }),
        ],
        skills: [
          buildSkillEntry({
            id: "motion",
            markdown: "---\nname: motion\ndescription: Motion\n---",
            assetPath: "data/skills/motion/SKILL.md",
          }),
        ],
        templates: [
          buildTemplateEntry({
            id: "landing",
            markdown: "---\nname: landing\ndescription: Landing\nod:\n  surface: landing\n---",
            assetPath: "data/design-templates/landing/SKILL.md",
          }),
        ],
      })

      expect(index.schemaVersion).toBe("open-studio-catalog/v1")
      expect(index.stats.totalDesignSystems).toBe(1)
      expect(index.stats.totalCraftRules).toBe(1)
      expect(index.stats.totalSkills).toBe(1)
      expect(index.stats.totalTemplates).toBe(1)
      expect(index.taxonomies.categories).toContain("SaaS")
      expect(index.taxonomies.tags).toContain("dark-mode")
      expect(index.taxonomies.surfaces).toContain("landing")
    })
  })

  describe("Generated catalog-index.json Validation", () => {
    const catalogPath = path.resolve(import.meta.dirname, "../public/catalog-index.json")
    const schemaPath = path.resolve(import.meta.dirname, "../public/schemas/catalog-index.schema.json")

    it("verifies the generated catalog-index.json exists and is valid JSON", () => {
      expect(fs.existsSync(catalogPath)).toBe(true)
      const raw = fs.readFileSync(catalogPath, "utf-8")
      const catalog = JSON.parse(raw)
      expect(catalog.schemaVersion).toBe("open-studio-catalog/v1")
    })

    it("verifies stats match the ingested resources", () => {
      const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf-8"))
      expect(catalog.stats.totalDesignSystems).toBeGreaterThanOrEqual(150)
      expect(catalog.stats.totalCraftRules).toBeGreaterThanOrEqual(11)
      expect(catalog.stats.totalSkills).toBeGreaterThanOrEqual(160)
      expect(catalog.stats.totalTemplates).toBeGreaterThanOrEqual(110)
    })

    it("verifies known brand swatches match their CSS tokens", () => {
      const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf-8"))
      const linear = catalog.designSystems.find((ds: { id: string }) => ds.id === "linear-app")
      expect(linear).toBeDefined()
      expect(linear.swatches.primary).toBe("#5e6ad2")
      expect(linear.swatches.background).toBe("#08090a")

      const stripe = catalog.designSystems.find((ds: { id: string }) => ds.id === "stripe")
      expect(stripe).toBeDefined()
      expect(stripe.swatches.primary).toBe("#533afd")
      expect(stripe.swatches.background).toBe("#ffffff")
    })

    it("verifies every entry adheres to schema required fields and enum constraints", () => {
      const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf-8"))
      const schema = JSON.parse(fs.readFileSync(schemaPath, "utf-8"))

      // Check design systems
      const dsRequired = schema.properties.designSystems.items.required
      for (const ds of catalog.designSystems) {
        for (const req of dsRequired) {
          expect(ds[req], `Missing required field ${req} on design system ${ds.id}`).toBeDefined()
        }
        expect(ds.assetPaths.basePath).toBeDefined()
        expect(ds.tokenSummary.totalCssVariables).toBeGreaterThanOrEqual(0)
      }

      // Check craft rules enum constraints
      const allowedCategories = schema.properties.craftRules.items.properties.category.enum
      for (const rule of catalog.craftRules) {
        expect(allowedCategories).toContain(rule.category)
        expect(rule.ruleCount).toBeGreaterThan(0)
        expect(rule.assetPath.startsWith("data/craft/")).toBe(true)
      }

      // Check templates surface enum constraints
      const allowedSurfaces = schema.properties.templates.items.properties.surface.enum
      for (const tpl of catalog.templates) {
        expect(allowedSurfaces).toContain(tpl.surface)
        expect(tpl.category).toBe("design-template")
      }
    })
  })
})
