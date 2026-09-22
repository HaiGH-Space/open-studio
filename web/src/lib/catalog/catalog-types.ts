/**
 * TypeScript Data Contracts for Open Studio Catalog
 * Source of truth: docs/specs/SPEC-open-studio.md (Section 6.1)
 */

export interface CatalogIndex {
  readonly schemaVersion: 'open-studio-catalog/v1';
  readonly generatedAt: string; // ISO 8601
  readonly stats: CatalogStats;
  readonly taxonomies: CatalogTaxonomies;
  readonly designSystems: readonly DesignSystemCatalogEntry[];
  readonly craftRules: readonly CraftRuleCatalogEntry[];
  readonly skills: readonly SkillCatalogEntry[];
  readonly templates: readonly TemplateCatalogEntry[];
}

export interface CatalogStats {
  readonly totalDesignSystems: number;
  readonly totalCraftRules: number;
  readonly totalSkills: number;
  readonly totalTemplates: number;
}

export interface CatalogTaxonomies {
  readonly categories: readonly string[];
  readonly tags: readonly string[];
  readonly surfaces: readonly string[];
}

export interface ColorSwatches {
  readonly primary?: string;
  readonly background?: string;
  readonly foreground?: string;
  readonly accent?: string;
  readonly muted?: string;
}

export interface TokenSummary {
  readonly totalCssVariables: number;
  readonly hasColorRamps: boolean;
  readonly hasRadiusTokens: boolean;
  readonly hasTypographyTokens: boolean;
  readonly condensedCssVariablesCount: number;
  readonly previewDeclarations: readonly string[]; // Top 8 key declarations
}

export interface DesignSystemCatalogEntry {
  readonly id: string; // e.g. "linear-app", "stripe", "apple"
  readonly name: string; // e.g. "Linear"
  readonly category: string; // e.g. "Productivity & SaaS"
  readonly description: string;
  readonly tags: readonly string[]; // e.g. ["dark-mode", "minimal", "bento", "saas"]
  readonly swatches: ColorSwatches;
  readonly tokenSummary: TokenSummary;
  readonly craft: {
    readonly suggested: readonly string[];
    readonly exemptions: readonly string[];
  };
  readonly availableFiles: {
    readonly hasUsage: boolean;
    readonly hasDesignMd: boolean;
    readonly hasTokensCss: boolean;
    readonly hasTailwindCss: boolean;
    readonly hasComponentsHtml: boolean;
    readonly hasComponentsManifest: boolean;
  };
  readonly assetPaths: {
    readonly basePath: string; // e.g. "data/design-systems/linear-app"
    readonly usage?: string;
    readonly designMd?: string;
    readonly tokensCss?: string;
    readonly tailwindCss?: string;
    readonly componentsHtml?: string;
    readonly componentsManifest?: string;
  };
}

export interface CraftRuleCatalogEntry {
  readonly id: string; // e.g. "anti-ai-slop", "typography-hierarchy"
  readonly name: string; // e.g. "Anti-AI-Slop Discipline"
  readonly category: 'discipline' | 'typography' | 'color' | 'ux' | 'accessibility' | 'motion';
  readonly description: string;
  readonly ruleCount: number;
  readonly isDefaultEnabled: boolean;
  readonly assetPath: string; // e.g. "data/craft/anti-ai-slop.md"
}

export interface SkillCatalogEntry {
  readonly id: string; // e.g. "emilkowalski-motion", "d3-visualization"
  readonly name: string;
  readonly description: string;
  readonly category: string;
  readonly triggers: readonly string[];
  readonly assetPath: string; // e.g. "data/skills/emilkowalski-motion/SKILL.md"
}

export interface TemplateCatalogEntry {
  readonly id: string; // e.g. "saas-landing", "fintech-dashboard"
  readonly name: string;
  readonly category: 'design-template' | 'prompt-template';
  readonly description: string;
  readonly surface: 'landing' | 'dashboard' | 'mobile' | 'deck' | 'form' | 'component' | 'media';
  readonly assetPath: string;
}
