import fs from "node:fs"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import type {
  CatalogIndex,
  DesignSystemCatalogEntry,
  CraftRuleCatalogEntry,
  SkillCatalogEntry,
  TemplateCatalogEntry,
  ColorSwatches,
  TokenSummary,
} from "../web/src/lib/catalog/catalog-types.ts"

/**
 * Parses CSS custom properties from raw CSS content into a key-value record.
 * Handles inline and multiline comments, trims values, and resolves single-hop var() references.
 */
export function parseCssVariables(css: string): Record<string, string> {
  const vars: Record<string, string> = {}
  if (!css || typeof css !== "string") return vars

  // Strip block comments /* ... */
  const cleanCss = css.replace(/\/\*[\s\S]*?\*\//g, "")

  // Match custom property declarations: --property-name: value;
  const declRegex = /(--[a-zA-Z0-9_-]+)\s*:\s*([^;]+);/g
  let match: RegExpExecArray | null

  while ((match = declRegex.exec(cleanCss)) !== null) {
    const key = match[1].trim()
    const value = match[2].trim()
    if (key && value) {
      vars[key] = value
    }
  }

  // Resolve simple single-hop var(--name) references
  for (const [key, value] of Object.entries(vars)) {
    const varMatch = value.match(/^var\((--[a-zA-Z0-9_-]+)\)$/)
    if (varMatch && vars[varMatch[1]]) {
      vars[key] = vars[varMatch[1]]
    }
  }

  return vars
}

/**
 * Extracts standard color swatches (primary, background, foreground, accent, muted)
 * from CSS content. Supports HEX, RGB, RGBA, HSL, HSLA, OKLCH, and resolved variables.
 */
export function extractSwatches(css: string): ColorSwatches {
  const vars = parseCssVariables(css)

  const findValue = (candidates: string[]): string | undefined => {
    for (const key of candidates) {
      if (vars[key]) {
        // Return clean value without internal comments
        return vars[key].replace(/\/\*.*?\*\//g, "").trim()
      }
    }
    return undefined
  }

  const background = findValue(["--bg", "--background", "--color-bg", "--color-background", "--surface"])
  const foreground = findValue(["--fg", "--foreground", "--color-fg", "--color-foreground", "--text", "--color-text"])
  const accent = findValue(["--accent", "--color-accent", "--accent-oklch", "--accent-hsl", "--accent-rgb", "--primary", "--color-primary"])
  const primary = findValue(["--primary", "--color-primary", "--accent", "--color-accent", "--brand", "--color-brand"])
  const muted = findValue(["--muted", "--color-muted", "--fg-2", "--text-muted", "--text-secondary", "--meta"])

  const swatches: ColorSwatches = {}
  if (primary) swatches.primary = primary
  if (background) swatches.background = background
  if (foreground) swatches.foreground = foreground
  if (accent) swatches.accent = accent
  if (muted) swatches.muted = muted

  return swatches
}

/**
 * Computes token metrics: total count, presence of color ramps, radii, typography tokens,
 * condensed count, and top 8 preview declarations.
 */
export function summarizeTokens(css: string): TokenSummary {
  const vars = parseCssVariables(css)
  const keys = Object.keys(vars)

  const hasColorRamps = keys.some((k) => /-(?:50|[1-9]00)\b/.test(k) || /ramp|scale/i.test(k))
  const hasRadiusTokens = keys.some((k) => /radius|rounded/i.test(k))
  const hasTypographyTokens = keys.some((k) => /font|text-|tracking|leading|line-height/i.test(k))

  // Filter out internal variables to determine condensed count
  const condensedKeys = keys.filter((k) => !k.startsWith("--_") && !k.startsWith("--tw-"))

  // Top 8 prioritized preview declarations
  const priorityOrder = [
    "--bg",
    "--background",
    "--surface",
    "--fg",
    "--foreground",
    "--primary",
    "--accent",
    "--muted",
    "--border",
    "--font-display",
    "--font-body",
    "--radius-md",
  ]

  const previewDeclarations: string[] = []
  const usedKeys = new Set<string>()

  for (const prio of priorityOrder) {
    if (previewDeclarations.length >= 8) break
    if (vars[prio] && !usedKeys.has(prio)) {
      previewDeclarations.push(`${prio}: ${vars[prio]}`)
      usedKeys.add(prio)
    }
  }

  for (const k of keys) {
    if (previewDeclarations.length >= 8) break
    if (!usedKeys.has(k) && !k.startsWith("--_") && !k.startsWith("--tw-")) {
      previewDeclarations.push(`${k}: ${vars[k]}`)
      usedKeys.add(k)
    }
  }

  return {
    totalCssVariables: keys.length,
    hasColorRamps,
    hasRadiusTokens,
    hasTypographyTokens,
    condensedCssVariablesCount: condensedKeys.length,
    previewDeclarations,
  }
}

/**
 * Generates a condensed :root token block by stripping private (--_*) and framework utility (--tw-*) variables.
 */
export function generateCondensedTokens(css: string): string {
  const vars = parseCssVariables(css)
  const condensedLines: string[] = []

  for (const [key, value] of Object.entries(vars)) {
    // Strip internal/private variables
    if (key.startsWith("--_") || key.startsWith("--tw-")) {
      continue
    }
    // Strip redundant intermediate color ramp steps beyond standard stops if excessive
    if (/-(?:50|100|200|300|400|600|700|800|900)\b/.test(key) && Object.keys(vars).length > 60) {
      continue
    }
    condensedLines.push(`  ${key}: ${value};`)
  }

  return `:root {\n${condensedLines.join("\n")}\n}`
}

/**
 * Infers appropriate tags for a design system based on category, name, and background color.
 */
export function inferTags(id: string, name: string, category: string, swatches: ColorSwatches, manifestTags?: readonly string[]): string[] {
  if (manifestTags && manifestTags.length > 0) {
    return Array.from(new Set(manifestTags.map((t) => t.toLowerCase())))
  }

  const tags = new Set<string>()

  // Dark or Light mode heuristic from background swatch
  const bg = (swatches.background || "").toLowerCase()
  if (
    bg.startsWith("#0") ||
    bg.startsWith("#1") ||
    bg.startsWith("#2") ||
    bg.includes("black") ||
    bg.includes("oklch(0") ||
    bg.includes("oklch(1") ||
    bg.includes("oklch(2") ||
    bg.includes("rgb(0") ||
    bg.includes("rgb(1") ||
    bg.includes("rgb(2")
  ) {
    tags.add("dark-mode")
  } else {
    tags.add("light-mode")
  }

  // Category tags
  const catLower = category.toLowerCase()
  if (catLower.includes("saas") || catLower.includes("productivity")) {
    tags.add("saas")
    tags.add("productivity")
  }
  if (catLower.includes("fintech") || catLower.includes("crypto")) {
    tags.add("fintech")
  }
  if (catLower.includes("developer") || catLower.includes("infra")) {
    tags.add("developer-tools")
  }
  if (catLower.includes("media") || catLower.includes("editorial")) {
    tags.add("editorial")
  }
  if (catLower.includes("consumer") || catLower.includes("lifestyle")) {
    tags.add("consumer")
  }

  // Id keywords
  const idLower = id.toLowerCase()
  if (idLower.includes("minimal")) tags.add("minimal")
  if (idLower.includes("bento")) tags.add("bento")
  if (idLower.includes("brutal")) tags.add("brutalism")
  if (idLower.includes("glass")) tags.add("glassmorphism")
  if (idLower.includes("mono")) tags.add("monochrome")
  if (idLower.includes("retro")) tags.add("retro")

  return Array.from(tags)
}

/**
 * Builds a validated DesignSystemCatalogEntry from directory data and manifest.
 */
export function buildDesignSystemEntry(input: {
  id: string
  dirPath: string
  manifest?: {
    id?: string
    name?: string
    category?: string
    description?: string
    tags?: string[]
    craft?: { suggested?: string[]; exemptions?: string[] }
  }
  tokensCss: string
  existingFiles: string[]
}): DesignSystemCatalogEntry {
  const { id, manifest, tokensCss, existingFiles } = input

  const swatches = extractSwatches(tokensCss)
  const tokenSummary = summarizeTokens(tokensCss)

  const name = manifest?.name || id.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")
  const category = manifest?.category || "General"
  const description = manifest?.description || `Curated design system package for ${name}.`
  const tags = inferTags(id, name, category, swatches, manifest?.tags)

  const fileSet = new Set(existingFiles)
  const hasUsage = fileSet.has("USAGE.md")
  const hasDesignMd = fileSet.has("DESIGN.md")
  const hasTokensCss = fileSet.has("tokens.css")
  const hasTailwindCss = fileSet.has("tailwind-v4.css")
  const hasComponentsHtml = fileSet.has("components.html")
  const hasComponentsManifest = fileSet.has("components.manifest.json") || fileSet.has("components.json")

  const basePath = `data/design-systems/${id}`

  return {
    id,
    name,
    category,
    description,
    tags,
    swatches,
    tokenSummary,
    craft: {
      suggested: manifest?.craft?.suggested || [],
      exemptions: manifest?.craft?.exemptions || [],
    },
    availableFiles: {
      hasUsage,
      hasDesignMd,
      hasTokensCss,
      hasTailwindCss,
      hasComponentsHtml,
      hasComponentsManifest,
    },
    assetPaths: {
      basePath,
      ...(hasUsage ? { usage: `${basePath}/USAGE.md` } : {}),
      ...(hasDesignMd ? { designMd: `${basePath}/DESIGN.md` } : {}),
      ...(hasTokensCss ? { tokensCss: `${basePath}/tokens.css` } : {}),
      ...(hasTailwindCss ? { tailwindCss: `${basePath}/tailwind-v4.css` } : {}),
      ...(hasComponentsHtml ? { componentsHtml: `${basePath}/components.html` } : {}),
      ...(hasComponentsManifest ? { componentsManifest: `${basePath}/components.manifest.json` } : {}),
    },
  }
}

/**
 * Builds a validated CraftRuleCatalogEntry from markdown rulebook.
 */
export function buildCraftRuleEntry(input: {
  id: string
  markdown: string
  filePath: string
}): CraftRuleCatalogEntry {
  const { id, markdown, filePath } = input

  // Extract first H1 for name
  const h1Match = markdown.match(/^#\s+(.+)$/m)
  const rawName = h1Match ? h1Match[1].trim() : id
  const name = rawName.replace(/^#+\s*/, "")

  // Category mapping
  let category: CraftRuleCatalogEntry["category"] = "ux"
  if (id.includes("anti-ai-slop")) {
    category = "discipline"
  } else if (id.includes("typography")) {
    category = "typography"
  } else if (id.includes("color")) {
    category = "color"
  } else if (id.includes("animation") || id.includes("motion")) {
    category = "motion"
  } else if (id.includes("accessibility")) {
    category = "accessibility"
  }

  // Description from first non-empty paragraph after heading
  const lines = markdown.split("\n")
  let description = ""
  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith("#") && !trimmed.startsWith(">") && !trimmed.startsWith("```")) {
      description = trimmed
      break
    }
  }
  if (!description) {
    description = `Universal craft rulebook for ${name}.`
  }

  // Count rules (numbered list items, bullet points under rule headings)
  const ruleMatches = markdown.match(/^(\d+\.|\*|-)\s+\*\*/gm) || markdown.match(/^(\d+\.|\*|-)\s+/gm) || []
  const ruleCount = Math.max(ruleMatches.length, 1)

  // Default enabled baseline rules
  const isDefaultEnabled = [
    "anti-ai-slop",
    "typography",
    "typography-hierarchy",
    "color",
    "accessibility-baseline",
  ].includes(id)

  return {
    id,
    name,
    category,
    description,
    ruleCount,
    isDefaultEnabled,
    assetPath: filePath.replace(/\\/g, "/"),
  }
}

/**
 * Parses simple YAML frontmatter from markdown files without external dependencies.
 */
function parseFrontmatter(markdown: string): { frontmatter: Record<string, unknown>; content: string } {
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/)
  if (!match) {
    return { frontmatter: {}, content: markdown }
  }

  const rawYaml = match[1]
  const content = match[2]
  const frontmatter: Record<string, unknown> = {}

  let currentKey = ""
  let currentList: string[] | null = null

  for (const rawLine of rawYaml.split("\n")) {
    const line = rawLine.replace(/\r$/, "")
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue

    // Array item: - "..." or - value
    if (trimmed.startsWith("- ") && currentKey && currentList) {
      const item = trimmed.slice(2).trim().replace(/^["']|["']$/g, "")
      currentList.push(item)
      continue
    }

    // Key-value or object start
    const colonIdx = line.indexOf(":")
    if (colonIdx !== -1) {
      const key = line.slice(0, colonIdx).trim()
      const val = line.slice(colonIdx + 1).trim().replace(/^["']|["']$/g, "")

      if (val === "" || val === "|") {
        currentKey = key
        currentList = []
        frontmatter[key] = currentList
      } else {
        currentKey = key
        currentList = null
        frontmatter[key] = val
      }
    }
  }

  return { frontmatter, content }
}

/**
 * Builds a validated SkillCatalogEntry from frontmatter.
 */
export function buildSkillEntry(input: {
  id: string
  markdown: string
  assetPath: string
}): SkillCatalogEntry {
  const { id, markdown, assetPath } = input
  const { frontmatter } = parseFrontmatter(markdown)

  const name = typeof frontmatter.name === "string" ? frontmatter.name : id
  let description = typeof frontmatter.description === "string" ? frontmatter.description.trim() : ""
  if (!description) {
    description = `Agent skill capability for ${name}.`
  }

  let triggers: string[] = []
  if (Array.isArray(frontmatter.triggers)) {
    triggers = frontmatter.triggers.map(String)
  }

  let category = "general"
  const categoryMatch = markdown.match(/category:\s*([a-zA-Z0-9_-]+)/)
  if (categoryMatch) {
    category = categoryMatch[1].trim()
  }

  return {
    id,
    name,
    description,
    category,
    triggers,
    assetPath: assetPath.replace(/\\/g, "/"),
  }
}

/**
 * Builds a validated TemplateCatalogEntry from frontmatter.
 */
export function buildTemplateEntry(input: {
  id: string
  markdown: string
  assetPath: string
}): TemplateCatalogEntry {
  const { id, markdown, assetPath } = input
  const { frontmatter } = parseFrontmatter(markdown)

  const name = typeof frontmatter.name === "string" ? frontmatter.name : id
  let description = typeof frontmatter.description === "string" ? frontmatter.description.trim() : ""
  if (!description) {
    description = `Template scaffold for ${name}.`
  }

  // Surface mapping
  const validSurfaces = ["landing", "dashboard", "mobile", "deck", "form", "component", "media"] as const
  let surface: TemplateCatalogEntry["surface"] = "landing"

  const surfaceMatch = markdown.match(/surface:\s*([a-zA-Z0-9_-]+)/) || markdown.match(/scenario:\s*([a-zA-Z0-9_-]+)/)
  if (surfaceMatch) {
    const candidate = surfaceMatch[1].toLowerCase()
    if (candidate === "marketing") surface = "landing"
    else if (candidate === "presentation" || candidate === "slides") surface = "deck"
    else if (validSurfaces.includes(candidate as (typeof validSurfaces)[number])) {
      surface = candidate as (typeof validSurfaces)[number]
    }
  }

  // Fallback infer from id
  if (id.includes("dashboard") || id.includes("tracker")) surface = "dashboard"
  else if (id.includes("mobile") || id.includes("app")) surface = "mobile"
  else if (id.includes("deck") || id.includes("ppt") || id.includes("keynote")) surface = "deck"
  else if (id.includes("form") || id.includes("intake") || id.includes("invoice")) surface = "form"
  else if (id.includes("video") || id.includes("media") || id.includes("audio")) surface = "media"
  else if (id.includes("widget") || id.includes("component")) surface = "component"

  return {
    id,
    name,
    category: "design-template",
    description,
    surface,
    assetPath: assetPath.replace(/\\/g, "/"),
  }
}

/**
 * Aggregates all entries and computes final CatalogIndex with stats and taxonomies.
 */
export function buildCatalogIndex(input: {
  designSystems: DesignSystemCatalogEntry[]
  craftRules: CraftRuleCatalogEntry[]
  skills: SkillCatalogEntry[]
  templates: TemplateCatalogEntry[]
}): CatalogIndex {
  const { designSystems, craftRules, skills, templates } = input

  const categorySet = new Set<string>()
  const tagSet = new Set<string>()
  const surfaceSet = new Set<string>(["landing", "dashboard", "mobile", "deck", "form", "component", "media"])

  for (const ds of designSystems) {
    if (ds.category) categorySet.add(ds.category)
    for (const tag of ds.tags) {
      if (tag) tagSet.add(tag)
    }
  }

  for (const t of templates) {
    if (t.surface) surfaceSet.add(t.surface)
  }

  return {
    schemaVersion: "open-studio-catalog/v1",
    generatedAt: new Date().toISOString(),
    stats: {
      totalDesignSystems: designSystems.length,
      totalCraftRules: craftRules.length,
      totalSkills: skills.length,
      totalTemplates: templates.length,
    },
    taxonomies: {
      categories: Array.from(categorySet).sort(),
      tags: Array.from(tagSet).sort(),
      surfaces: Array.from(surfaceSet).sort(),
    },
    designSystems,
    craftRules,
    skills,
    templates,
  }
}

/**
 * Main indexing and asset bundling routine.
 */
export async function generateCatalog(options?: {
  resourcesRoot?: string
  webPublicDir?: string
}): Promise<CatalogIndex> {
  const startTime = Date.now()
  const scriptDir = path.dirname(fileURLToPath(import.meta.url))
  const repoRoot = path.resolve(scriptDir, "..")
  const resourcesRoot = options?.resourcesRoot || path.resolve(repoRoot, "open-design-core-resources")
  const webPublicDir = options?.webPublicDir || path.resolve(repoRoot, "web/public")
  const dataOutputDir = path.join(webPublicDir, "data")

  // Ensure output directories exist
  fs.mkdirSync(webPublicDir, { recursive: true })
  fs.mkdirSync(dataOutputDir, { recursive: true })

  // 1. Index Design Systems
  const dsDir = path.join(resourcesRoot, "design-systems")
  const designSystems: DesignSystemCatalogEntry[] = []

  if (fs.existsSync(dsDir)) {
    const dsFolders = fs.readdirSync(dsDir, { withFileTypes: true })
      .filter((d) => d.isDirectory() && !d.name.startsWith("_"))
      .map((d) => d.name)
      .sort()

    for (const id of dsFolders) {
      const folderPath = path.join(dsDir, id)
      const existingFiles = fs.readdirSync(folderPath)

      let manifest: any = undefined
      const manifestPath = path.join(folderPath, "manifest.json")
      if (fs.existsSync(manifestPath)) {
        try {
          manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"))
        } catch {
          // Fallback to default metadata
        }
      }

      let tokensCss = ""
      const tokensCssPath = path.join(folderPath, "tokens.css")
      if (fs.existsSync(tokensCssPath)) {
        tokensCss = fs.readFileSync(tokensCssPath, "utf-8")
      }

      const entry = buildDesignSystemEntry({
        id,
        dirPath: folderPath,
        manifest,
        tokensCss,
        existingFiles,
      })
      designSystems.push(entry)

      // Copy assets to web/public/data/design-systems/<id>/
      const targetDsDir = path.join(dataOutputDir, "design-systems", id)
      fs.mkdirSync(targetDsDir, { recursive: true })

      const filesToCopy = [
        "DESIGN.md",
        "USAGE.md",
        "tokens.css",
        "tailwind-v4.css",
        "components.html",
        "components.manifest.json",
        "manifest.json",
      ]

      for (const file of filesToCopy) {
        const src = path.join(folderPath, file)
        if (fs.existsSync(src)) {
          fs.copyFileSync(src, path.join(targetDsDir, file))
        }
      }
    }
  }

  // 2. Index Craft Rules
  const craftDir = path.join(resourcesRoot, "craft")
  const craftRules: CraftRuleCatalogEntry[] = []

  if (fs.existsSync(craftDir)) {
    const craftFiles = fs.readdirSync(craftDir, { withFileTypes: true })
      .filter((f) => f.isFile() && f.name.endsWith(".md") && f.name !== "README.md" && f.name !== "FUTURE_SECTIONS.md")
      .map((f) => f.name)
      .sort()

    const targetCraftDir = path.join(dataOutputDir, "craft")
    fs.mkdirSync(targetCraftDir, { recursive: true })

    for (const fileName of craftFiles) {
      const id = fileName.replace(/\.md$/, "")
      const filePath = path.join(craftDir, fileName)
      const markdown = fs.readFileSync(filePath, "utf-8")

      const entry = buildCraftRuleEntry({
        id,
        markdown,
        filePath: `data/craft/${fileName}`,
      })
      craftRules.push(entry)

      fs.copyFileSync(filePath, path.join(targetCraftDir, fileName))
    }
  }

  // 3. Index Skills
  const skillsDir = path.join(resourcesRoot, "skills")
  const skills: SkillCatalogEntry[] = []

  if (fs.existsSync(skillsDir)) {
    const skillFolders = fs.readdirSync(skillsDir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
      .sort()

    for (const id of skillFolders) {
      const skillFilePath = path.join(skillsDir, id, "SKILL.md")
      if (fs.existsSync(skillFilePath)) {
        const markdown = fs.readFileSync(skillFilePath, "utf-8")
        const entry = buildSkillEntry({
          id,
          markdown,
          assetPath: `data/skills/${id}/SKILL.md`,
        })
        skills.push(entry)

        const targetSkillDir = path.join(dataOutputDir, "skills", id)
        fs.mkdirSync(targetSkillDir, { recursive: true })
        fs.copyFileSync(skillFilePath, path.join(targetSkillDir, "SKILL.md"))
      }
    }
  }

  // 4. Index Design Templates
  const templatesDir = path.join(resourcesRoot, "design-templates")
  const templates: TemplateCatalogEntry[] = []

  if (fs.existsSync(templatesDir)) {
    const templateFolders = fs.readdirSync(templatesDir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
      .sort()

    for (const id of templateFolders) {
      const templateFolderPath = path.join(templatesDir, id)
      const skillFilePath = path.join(templateFolderPath, "SKILL.md")
      let markdown = ""
      if (fs.existsSync(skillFilePath)) {
        markdown = fs.readFileSync(skillFilePath, "utf-8")
      }

      const entry = buildTemplateEntry({
        id,
        markdown,
        assetPath: `data/design-templates/${id}/SKILL.md`,
      })
      templates.push(entry)

      const targetTemplateDir = path.join(dataOutputDir, "design-templates", id)
      fs.mkdirSync(targetTemplateDir, { recursive: true })

      if (fs.existsSync(skillFilePath)) {
        fs.copyFileSync(skillFilePath, path.join(targetTemplateDir, "SKILL.md"))
      }

      for (const fixture of ["example.html", "template.html"]) {
        const fixturePath = path.join(templateFolderPath, fixture)
        if (fs.existsSync(fixturePath)) {
          fs.copyFileSync(fixturePath, path.join(targetTemplateDir, fixture))
        }
      }
    }
  }

  // Build combined catalog index
  const catalog = buildCatalogIndex({
    designSystems,
    craftRules,
    skills,
    templates,
  })

  // Write catalog-index.json
  const outputCatalogPath = path.join(webPublicDir, "catalog-index.json")
  fs.writeFileSync(outputCatalogPath, JSON.stringify(catalog, null, 2), "utf-8")

  const duration = Date.now() - startTime
  console.log(`[Catalog Indexer] Generated catalog-index.json in ${duration}ms`)
  console.log(`  - Design Systems: ${catalog.stats.totalDesignSystems}`)
  console.log(`  - Craft Rules:    ${catalog.stats.totalCraftRules}`)
  console.log(`  - Skills:         ${catalog.stats.totalSkills}`)
  console.log(`  - Templates:      ${catalog.stats.totalTemplates}`)

  return catalog
}

// CLI Execution Entry Point
const currentFile = fileURLToPath(import.meta.url)
const entryFile = process.argv[1] ? path.resolve(process.argv[1]) : ""

if (currentFile === entryFile || import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  generateCatalog().catch((err) => {
    console.error("[Catalog Indexer Error]:", err)
    process.exit(1)
  })
}
