import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from "react"
import {
  catalogService as defaultCatalogService,
  type ICatalogService,
} from "../lib/catalog/catalog-service"
import type { CatalogIndex } from "../lib/catalog/catalog-types"
import { CatalogContext, type CatalogContextValue } from "./catalog-context-def"

export interface CatalogProviderProps {
  readonly children: ReactNode
  readonly catalogService?: ICatalogService
  readonly initialCatalog?: CatalogIndex | null
  readonly autoLoad?: boolean
}

export function CatalogProvider({
  children,
  catalogService = defaultCatalogService,
  initialCatalog = null,
  autoLoad = true,
}: CatalogProviderProps) {
  const [catalog, setCatalog] = useState<CatalogIndex | null>(initialCatalog)
  const [isLoading, setIsLoading] = useState<boolean>(
    !initialCatalog && autoLoad
  )
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedTags, setSelectedTags] = useState<readonly string[]>([])
  const [previewSystemId, setPreviewSystemId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await catalogService.loadCatalog()
      setCatalog(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [catalogService])

  useEffect(() => {
    let isMounted = true
    if (!initialCatalog && autoLoad) {
      catalogService.loadCatalog().then(
        (data) => {
          if (isMounted) {
            setCatalog(data)
            setIsLoading(false)
          }
        },
        (err) => {
          if (isMounted) {
            setError(err instanceof Error ? err.message : String(err))
            setIsLoading(false)
          }
        }
      )
    }
    return () => {
      isMounted = false
    }
  }, [initialCatalog, autoLoad, catalogService])

  const normalizedQuery = useMemo(
    () => searchQuery.trim().toLowerCase(),
    [searchQuery]
  )

  const filteredDesignSystems = useMemo(() => {
    if (!catalog) return []
    return catalog.designSystems.filter((ds) => {
      if (selectedCategory && selectedCategory.toLowerCase() !== "all") {
        if (ds.category.toLowerCase() !== selectedCategory.toLowerCase()) {
          return false
        }
      }

      if (selectedTags.length > 0) {
        const hasAllTags = selectedTags.every((t) =>
          ds.tags.some((tag) => tag.toLowerCase() === t.toLowerCase())
        )
        if (!hasAllTags) {
          return false
        }
      }

      if (!normalizedQuery) return true

      return (
        ds.name.toLowerCase().includes(normalizedQuery) ||
        ds.id.toLowerCase().includes(normalizedQuery) ||
        ds.description.toLowerCase().includes(normalizedQuery) ||
        ds.category.toLowerCase().includes(normalizedQuery) ||
        ds.tags.some((tag) => tag.toLowerCase().includes(normalizedQuery))
      )
    })
  }, [catalog, selectedCategory, selectedTags, normalizedQuery])

  const filteredCraftRules = useMemo(() => {
    if (!catalog) return []
    return catalog.craftRules.filter((cr) => {
      if (!normalizedQuery) return true
      return (
        cr.name.toLowerCase().includes(normalizedQuery) ||
        cr.id.toLowerCase().includes(normalizedQuery) ||
        cr.description.toLowerCase().includes(normalizedQuery) ||
        cr.category.toLowerCase().includes(normalizedQuery)
      )
    })
  }, [catalog, normalizedQuery])

  const filteredSkills = useMemo(() => {
    if (!catalog) return []
    return catalog.skills.filter((sk) => {
      if (!normalizedQuery) return true
      return (
        sk.name.toLowerCase().includes(normalizedQuery) ||
        sk.id.toLowerCase().includes(normalizedQuery) ||
        sk.description.toLowerCase().includes(normalizedQuery) ||
        sk.category.toLowerCase().includes(normalizedQuery) ||
        sk.triggers.some((tr) => tr.toLowerCase().includes(normalizedQuery))
      )
    })
  }, [catalog, normalizedQuery])

  const filteredTemplates = useMemo(() => {
    if (!catalog) return []
    return catalog.templates.filter((tp) => {
      if (!normalizedQuery) return true
      return (
        tp.name.toLowerCase().includes(normalizedQuery) ||
        tp.id.toLowerCase().includes(normalizedQuery) ||
        tp.description.toLowerCase().includes(normalizedQuery) ||
        tp.category.toLowerCase().includes(normalizedQuery)
      )
    })
  }, [catalog, normalizedQuery])

  const previewSystem = useMemo(() => {
    if (!catalog || !previewSystemId) return null
    return catalog.designSystems.find((ds) => ds.id === previewSystemId) ?? null
  }, [catalog, previewSystemId])

  const value: CatalogContextValue = useMemo(
    () => ({
      catalog,
      isLoading,
      error,
      searchQuery,
      selectedCategory,
      selectedTags,
      filteredDesignSystems,
      filteredCraftRules,
      filteredSkills,
      filteredTemplates,
      previewSystemId,
      previewSystem,
      setSearchQuery,
      setSelectedCategory,
      setSelectedTags,
      setPreviewSystemId,
      refreshCatalog: load,
      catalogService,
    }),
    [
      catalog,
      isLoading,
      error,
      searchQuery,
      selectedCategory,
      selectedTags,
      filteredDesignSystems,
      filteredCraftRules,
      filteredSkills,
      filteredTemplates,
      previewSystemId,
      previewSystem,
      load,
      catalogService,
    ]
  )

  return (
    <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>
  )
}
