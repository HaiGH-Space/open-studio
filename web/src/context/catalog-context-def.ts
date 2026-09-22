import { createContext } from "react"
import type { ICatalogService } from "../lib/catalog/catalog-service"
import type {
  CatalogIndex,
  DesignSystemCatalogEntry,
  CraftRuleCatalogEntry,
  SkillCatalogEntry,
  TemplateCatalogEntry,
} from "../lib/catalog/catalog-types"

export interface CatalogContextValue {
  readonly catalog: CatalogIndex | null
  readonly isLoading: boolean
  readonly error: string | null
  readonly searchQuery: string
  readonly selectedCategory: string | null
  readonly selectedTags: readonly string[]
  readonly filteredDesignSystems: readonly DesignSystemCatalogEntry[]
  readonly filteredCraftRules: readonly CraftRuleCatalogEntry[]
  readonly filteredSkills: readonly SkillCatalogEntry[]
  readonly filteredTemplates: readonly TemplateCatalogEntry[]
  readonly previewSystemId: string | null
  readonly previewSystem: DesignSystemCatalogEntry | null
  readonly setSearchQuery: (query: string) => void
  readonly setSelectedCategory: (category: string | null) => void
  readonly setSelectedTags: (tags: readonly string[]) => void
  readonly setPreviewSystemId: (id: string | null) => void
  readonly refreshCatalog: () => Promise<void>
  readonly catalogService: ICatalogService
}

export const CatalogContext = createContext<CatalogContextValue | null>(null)
