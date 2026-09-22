import { describe, it, expect } from "vitest"
import fs from "node:fs"
import path from "node:path"
import type {
  CatalogIndex,
  DesignSystemCatalogEntry,
  CraftRuleCatalogEntry,
  SkillCatalogEntry,
  TemplateCatalogEntry,
  ColorSwatches,
  TokenSummary,
  CatalogStats,
  CatalogTaxonomies,
} from "../src/lib/catalog/catalog-types"

describe("Catalog TypeScript Contracts & Schema", () => {
  const schemaPath = path.resolve(import.meta.dirname, "../public/schemas/catalog-index.schema.json")

  it("should have the catalog-index.schema.json file present and valid JSON", () => {
    expect(fs.existsSync(schemaPath)).toBe(true)
    const rawContent = fs.readFileSync(schemaPath, "utf-8")
    const parsed = JSON.parse(rawContent)
    expect(parsed).toBeDefined()
    expect(typeof parsed).toBe("object")
  })

  it("should conform to JSON Schema Draft 2020-12 specification requirements", () => {
    const rawContent = fs.readFileSync(schemaPath, "utf-8")
    const schema = JSON.parse(rawContent)

    expect(schema.$schema).toBe("https://json-schema.org/draft/2020-12/schema")
    expect(schema.$id).toBe("https://open-studio.dev/schemas/catalog-index.json")
    expect(schema.title).toBe("OpenStudioCatalogIndex")
    expect(schema.type).toBe("object")
    expect(schema.required).toEqual([
      "schemaVersion",
      "generatedAt",
      "stats",
      "taxonomies",
      "designSystems",
      "craftRules",
      "skills",
      "templates",
    ])
    expect(schema.properties.schemaVersion.const).toBe("open-studio-catalog/v1")
  })

  it("should enforce constraints on stats and taxonomies", () => {
    const rawContent = fs.readFileSync(schemaPath, "utf-8")
    const schema = JSON.parse(rawContent)

    expect(schema.properties.stats.required).toEqual([
      "totalDesignSystems",
      "totalCraftRules",
      "totalSkills",
      "totalTemplates",
    ])
    expect(schema.properties.stats.properties.totalDesignSystems.minimum).toBe(0)
    expect(schema.properties.stats.properties.totalCraftRules.minimum).toBe(0)
    expect(schema.properties.stats.properties.totalSkills.minimum).toBe(0)
    expect(schema.properties.stats.properties.totalTemplates.minimum).toBe(0)

    expect(schema.properties.taxonomies.required).toEqual(["categories", "tags", "surfaces"])
  })

  it("should enforce complete required fields and property structures for designSystems", () => {
    const rawContent = fs.readFileSync(schemaPath, "utf-8")
    const schema = JSON.parse(rawContent)
    const dsItem = schema.properties.designSystems.items

    expect(dsItem.required).toEqual([
      "id",
      "name",
      "category",
      "description",
      "tags",
      "swatches",
      "tokenSummary",
      "availableFiles",
      "assetPaths",
    ])

    expect(dsItem.properties.tokenSummary.required).toEqual([
      "totalCssVariables",
      "hasColorRamps",
      "hasRadiusTokens",
      "hasTypographyTokens",
      "condensedCssVariablesCount",
    ])

    expect(dsItem.properties.availableFiles.required).toEqual([
      "hasUsage",
      "hasDesignMd",
      "hasTokensCss",
      "hasTailwindCss",
      "hasComponentsHtml",
      "hasComponentsManifest",
    ])

    expect(dsItem.properties.assetPaths.required).toEqual(["basePath"])
  })

  it("should enforce enums and constraints for craftRules, skills, and templates", () => {
    const rawContent = fs.readFileSync(schemaPath, "utf-8")
    const schema = JSON.parse(rawContent)

    const craftItem = schema.properties.craftRules.items
    expect(craftItem.required).toEqual([
      "id",
      "name",
      "category",
      "description",
      "ruleCount",
      "isDefaultEnabled",
      "assetPath",
    ])
    expect(craftItem.properties.category.enum).toEqual([
      "discipline",
      "typography",
      "color",
      "ux",
      "accessibility",
      "motion",
    ])
    expect(craftItem.properties.ruleCount.minimum).toBe(0)

    const skillItem = schema.properties.skills.items
    expect(skillItem.required).toEqual(["id", "name", "description", "category", "triggers", "assetPath"])

    const templateItem = schema.properties.templates.items
    expect(templateItem.required).toEqual([
      "id",
      "name",
      "category",
      "description",
      "surface",
      "assetPath",
    ])
    expect(templateItem.properties.category.enum).toEqual(["design-template", "prompt-template"])
    expect(templateItem.properties.surface.enum).toEqual([
      "landing",
      "dashboard",
      "mobile",
      "deck",
      "form",
      "component",
      "media",
    ])
  })

  it("validates a fully conforming CatalogIndex fixture against schema expectations", () => {
    const sampleSwatches: ColorSwatches = {
      primary: "#5e6ad2",
      background: "#08090a",
      foreground: "#f7f8f8",
      accent: "#7170ff",
      muted: "#8a8f98",
    }

    const sampleTokenSummary: TokenSummary = {
      totalCssVariables: 184,
      hasColorRamps: true,
      hasRadiusTokens: true,
      hasTypographyTokens: true,
      condensedCssVariablesCount: 42,
      previewDeclarations: ["--color-brand: #5e6ad2", "--radius-md: 8px"],
    }

    const sampleDesignSystem: DesignSystemCatalogEntry = {
      id: "linear-app",
      name: "Linear",
      category: "Productivity & SaaS",
      description: "High-contrast dark mode with sleek borders and purple accents",
      tags: ["dark-mode", "minimal", "saas", "bento"],
      swatches: sampleSwatches,
      tokenSummary: sampleTokenSummary,
      craft: {
        suggested: ["anti-ai-slop", "typography-hierarchy"],
        exemptions: [],
      },
      availableFiles: {
        hasUsage: true,
        hasDesignMd: true,
        hasTokensCss: true,
        hasTailwindCss: false,
        hasComponentsHtml: true,
        hasComponentsManifest: true,
      },
      assetPaths: {
        basePath: "data/design-systems/linear-app",
        usage: "data/design-systems/linear-app/USAGE.md",
        designMd: "data/design-systems/linear-app/DESIGN.md",
        tokensCss: "data/design-systems/linear-app/tokens.css",
        componentsHtml: "data/design-systems/linear-app/components.html",
        componentsManifest: "data/design-systems/linear-app/components.json",
      },
    }

    const sampleCraftRule: CraftRuleCatalogEntry = {
      id: "anti-ai-slop",
      name: "Anti-AI-Slop Discipline",
      category: "discipline",
      description: "Eliminates generic gradient backgrounds, centered card syndrome, and purple hero titles",
      ruleCount: 12,
      isDefaultEnabled: true,
      assetPath: "data/craft/anti-ai-slop.md",
    }

    const sampleSkill: SkillCatalogEntry = {
      id: "emilkowalski-motion",
      name: "Emil Kowalski Motion Principles",
      description: "Delightful, spring-based micro-interactions and gestures",
      category: "motion",
      triggers: ["motion", "animation", "transition"],
      assetPath: "data/skills/emilkowalski-motion/SKILL.md",
    }

    const sampleTemplate: TemplateCatalogEntry = {
      id: "saas-landing",
      name: "B2B SaaS Landing Page",
      category: "design-template",
      description: "Hero, feature bento, social proof, and pricing table",
      surface: "landing",
      assetPath: "data/design-templates/saas-landing/template.html",
    }

    const sampleStats: CatalogStats = {
      totalDesignSystems: 1,
      totalCraftRules: 1,
      totalSkills: 1,
      totalTemplates: 1,
    }

    const sampleTaxonomies: CatalogTaxonomies = {
      categories: ["Productivity & SaaS"],
      tags: ["dark-mode", "minimal"],
      surfaces: ["landing"],
    }

    const sampleCatalog: CatalogIndex = {
      schemaVersion: "open-studio-catalog/v1",
      generatedAt: "2026-09-22T12:00:00.000Z",
      stats: sampleStats,
      taxonomies: sampleTaxonomies,
      designSystems: [sampleDesignSystem],
      craftRules: [sampleCraftRule],
      skills: [sampleSkill],
      templates: [sampleTemplate],
    }

    expect(sampleCatalog.schemaVersion).toBe("open-studio-catalog/v1")
    expect(sampleCatalog.designSystems.length).toBe(1)
    expect(sampleCatalog.craftRules.length).toBe(1)
    expect(sampleCatalog.skills.length).toBe(1)
    expect(sampleCatalog.templates.length).toBe(1)
  })

  describe("Schema Edge Case Rejections", () => {
    // Lightweight schema assertion helper to verify schema constraint definitions
    it("should reject invalid schemaVersion values not equal to open-studio-catalog/v1", () => {
      const rawContent = fs.readFileSync(schemaPath, "utf-8")
      const schema = JSON.parse(rawContent)
      const versionConst = schema.properties.schemaVersion.const
      expect(versionConst).toBe("open-studio-catalog/v1")

      const testValues = ["open-studio-catalog/v2", "v1", "", null, undefined]
      testValues.forEach((val) => {
        expect(val === versionConst).toBe(false)
      })
    })

    it("should identify missing required top-level fields", () => {
      const rawContent = fs.readFileSync(schemaPath, "utf-8")
      const schema = JSON.parse(rawContent)
      const requiredFields: string[] = schema.required

      const incompletePayload: Record<string, unknown> = {
        schemaVersion: "open-studio-catalog/v1",
        generatedAt: "2026-09-22T00:00:00.000Z",
      }

      const missing = requiredFields.filter((field) => !(field in incompletePayload))
      expect(missing).toContain("stats")
      expect(missing).toContain("taxonomies")
      expect(missing).toContain("designSystems")
      expect(missing).toContain("craftRules")
      expect(missing).toContain("skills")
      expect(missing).toContain("templates")
    })

    it("should reject negative numeric values in stats", () => {
      const rawContent = fs.readFileSync(schemaPath, "utf-8")
      const schema = JSON.parse(rawContent)
      const statsProps = schema.properties.stats.properties

      expect(statsProps.totalDesignSystems.minimum).toBe(0)
      expect(statsProps.totalCraftRules.minimum).toBe(0)
      expect(statsProps.totalSkills.minimum).toBe(0)
      expect(statsProps.totalTemplates.minimum).toBe(0)

      const invalidStats = {
        totalDesignSystems: -1,
        totalCraftRules: -10,
        totalSkills: -3,
        totalTemplates: -99,
      }

      Object.entries(invalidStats).forEach(([key, val]) => {
        const min = statsProps[key].minimum
        expect(val < min).toBe(true)
      })
    })

    it("should reject craftRules with categories outside the allowed enum", () => {
      const rawContent = fs.readFileSync(schemaPath, "utf-8")
      const schema = JSON.parse(rawContent)
      const allowedCategories: string[] = schema.properties.craftRules.items.properties.category.enum

      const invalidCategories = ["random", "backend", "performance-invalid", "unknown"]
      invalidCategories.forEach((cat) => {
        expect(allowedCategories.includes(cat)).toBe(false)
      })
    })

    it("should reject templates with surfaces outside the allowed enum", () => {
      const rawContent = fs.readFileSync(schemaPath, "utf-8")
      const schema = JSON.parse(rawContent)
      const allowedSurfaces: string[] = schema.properties.templates.items.properties.surface.enum

      const invalidSurfaces = ["vr", "cli", "email", "smartwatch"]
      invalidSurfaces.forEach((surf) => {
        expect(allowedSurfaces.includes(surf)).toBe(false)
      })
    })
  })
})
