import { useState, useMemo, useCallback } from "react"
import { useCatalog } from "../../hooks/useCatalog"
import { useComposer } from "../../hooks/useComposer"
import { Input } from "../ui/input"
import { Badge } from "../ui/badge"
import { Switch } from "../ui/switch"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs"
import { ScrollArea } from "../ui/scroll-area"
import { DesignSystemCard } from "./DesignSystemCard"
import { DesignSystemPreviewModal } from "../preview/DesignSystemPreviewModal"
import {
  Search as SearchIcon,
  X as XIcon,
  Palette as PaletteIcon,
  SlidersHorizontal as RuleIcon,
  Zap as ZapIcon,
} from "lucide-react"
import { cn } from "cn"

export interface ResourceNavigatorProps {
  readonly className?: string
  readonly onSelectSystem?: (systemId: string) => void
  readonly onPreviewSystem?: (systemId: string) => void
}

export function ResourceNavigator({
  className,
  onSelectSystem,
  onPreviewSystem,
}: ResourceNavigatorProps) {
  const catalogContext = useCatalog()
  const composer = useComposer()

  const [activeTab, setActiveTab] = useState<string>("systems")

  const {
    catalog,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    selectedTags,
    setSelectedTags,
    filteredDesignSystems,
    filteredCraftRules,
    filteredSkills,
    setPreviewSystemId,
  } = catalogContext

  const activeSystemId = composer.config.layer5BrandContract.selectedSystemId
  const activeRuleIds = composer.config.layer6CraftRules.selectedRuleIds

  const categories = useMemo(() => {
    return catalog?.taxonomies.categories ?? []
  }, [catalog?.taxonomies.categories])

  const popularTags = useMemo(() => {
    return catalog?.taxonomies.tags ?? []
  }, [catalog?.taxonomies.tags])

  const handleSelectSystem = useCallback(
    async (systemId: string) => {
      await composer.selectDesignSystem(systemId)
      onSelectSystem?.(systemId)
    },
    [composer, onSelectSystem]
  )

  const handlePreviewSystem = useCallback(
    (systemId: string) => {
      setPreviewSystemId(systemId)
      onPreviewSystem?.(systemId)
    },
    [setPreviewSystemId, onPreviewSystem]
  )

  const handleToggleTag = (tag: string) => {
    const isAlreadySelected = selectedTags.some(
      (t) => t.toLowerCase() === tag.toLowerCase()
    )
    if (isAlreadySelected) {
      setSelectedTags(
        selectedTags.filter((t) => t.toLowerCase() !== tag.toLowerCase())
      )
    } else {
      setSelectedTags([...selectedTags, tag])
    }
  }

  const handleClearSearch = () => {
    setSearchQuery("")
  }

  return (
    <aside
      data-slot="resource-navigator"
      className={cn(
        "flex h-full w-80 flex-col overflow-hidden border-r border-border/70 bg-sidebar/50 select-none md:w-96",
        className
      )}
    >
      {/* Top Search & Filter Bar */}
      <div className="space-y-2.5 border-b border-border/60 bg-background/40 p-3.5">
        {/* Search Input */}
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            data-slot="catalog-search-input"
            type="text"
            placeholder="Filter systems, rules, skills..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 border-border/70 bg-input/20 pr-7 pl-8 text-xs focus-visible:ring-1 focus-visible:ring-primary"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={handleClearSearch}
              aria-label="Clear search"
              className="absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer text-muted-foreground hover:text-foreground"
            >
              <XIcon className="size-3.5" />
            </button>
          )}
        </div>

        {/* Category Filter Dropdown */}
        <div className="flex items-center gap-2">
          <select
            data-slot="category-filter-select"
            value={selectedCategory ?? "all"}
            onChange={(e) => {
              const val = e.target.value
              setSelectedCategory(val === "all" ? null : val)
            }}
            className="h-7 w-full cursor-pointer rounded-lg border border-border/70 bg-input/25 px-2.5 text-xs text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Tag Filter Chips */}
        {popularTags.length > 0 && (
          <div
            data-slot="tag-filter-chips"
            className="no-scrollbar flex items-center gap-1.5 overflow-x-auto pb-1 text-xs"
          >
            {popularTags.slice(0, 10).map((tag) => {
              const isSelected = selectedTags.some(
                (t) => t.toLowerCase() === tag.toLowerCase()
              )
              return (
                <button
                  key={tag}
                  type="button"
                  data-slot="tag-chip"
                  onClick={() => handleToggleTag(tag)}
                  className={cn(
                    "shrink-0 cursor-pointer rounded-full border px-2 py-0.5 font-mono text-[10px] transition-colors",
                    isSelected
                      ? "border-primary bg-primary font-semibold text-primary-foreground shadow-2xs"
                      : "border-border/60 bg-muted/40 text-muted-foreground hover:border-border hover:text-foreground"
                  )}
                >
                  #{tag}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Resource Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        data-slot="resource-tabs"
        className="flex flex-1 flex-col overflow-hidden"
      >
        <div className="border-b border-border/40 px-3.5 pt-2">
          <TabsList className="grid h-8 w-full grid-cols-3 rounded-lg bg-muted/50 p-0.5 text-xs">
            <TabsTrigger
              value="systems"
              data-slot="tab-trigger-systems"
              className="cursor-pointer gap-1.5 rounded-md px-2 py-1 text-xs font-medium"
            >
              <PaletteIcon className="size-3" />
              <span>Systems</span>
              <span className="ml-0.5 font-mono text-[10px] opacity-75">
                ({filteredDesignSystems.length})
              </span>
            </TabsTrigger>

            <TabsTrigger
              value="rules"
              data-slot="tab-trigger-rules"
              className="cursor-pointer gap-1.5 rounded-md px-2 py-1 text-xs font-medium"
            >
              <RuleIcon className="size-3" />
              <span>Rules</span>
              <span className="ml-0.5 font-mono text-[10px] opacity-75">
                ({filteredCraftRules.length})
              </span>
            </TabsTrigger>

            <TabsTrigger
              value="skills"
              data-slot="tab-trigger-skills"
              className="cursor-pointer gap-1.5 rounded-md px-2 py-1 text-xs font-medium"
            >
              <ZapIcon className="size-3" />
              <span>Skills</span>
              <span className="ml-0.5 font-mono text-[10px] opacity-75">
                ({filteredSkills.length})
              </span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab 1: Design Systems */}
        <TabsContent
          value="systems"
          data-slot="tab-content-systems"
          className="min-h-0 flex-1 outline-none"
        >
          <ScrollArea className="h-full" viewportClassName="p-3 space-y-2.5">
            {filteredDesignSystems.length === 0 ? (
              <div
                data-slot="empty-systems"
                className="space-y-1.5 px-4 py-12 text-center text-xs text-muted-foreground"
              >
                <PaletteIcon className="mx-auto size-6 text-muted-foreground/40" />
                <p className="font-medium text-foreground/80">
                  No design systems found
                </p>
                <p className="text-[11px]">
                  Try adjusting your search query or filters
                </p>
              </div>
            ) : (
              filteredDesignSystems.map((ds) => (
                <DesignSystemCard
                  key={ds.id}
                  system={ds}
                  isSelected={activeSystemId === ds.id}
                  onSelect={handleSelectSystem}
                  onPreview={handlePreviewSystem}
                />
              ))
            )}
          </ScrollArea>
        </TabsContent>

        {/* Tab 2: Craft Rules */}
        <TabsContent
          value="rules"
          data-slot="tab-content-rules"
          className="min-h-0 flex-1 outline-none"
        >
          <ScrollArea className="h-full" viewportClassName="p-3 space-y-2">
            {filteredCraftRules.length === 0 ? (
              <div
                data-slot="empty-rules"
                className="space-y-1.5 px-4 py-12 text-center text-xs text-muted-foreground"
              >
                <RuleIcon className="mx-auto size-6 text-muted-foreground/40" />
                <p className="font-medium text-foreground/80">
                  No craft rules found
                </p>
                <p className="text-[11px]">Try clearing search filters</p>
              </div>
            ) : (
              filteredCraftRules.map((cr) => {
                const isEnabled = activeRuleIds.includes(cr.id)
                return (
                  <div
                    key={cr.id}
                    data-slot="craft-rule-card"
                    data-rule-id={cr.id}
                    className={cn(
                      "flex items-start justify-between gap-3 rounded-xl border p-3 transition-all duration-150 select-none",
                      isEnabled
                        ? "border-primary/50 bg-primary/5"
                        : "border-border/70 bg-card/60 hover:border-border hover:bg-card/90"
                    )}
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="truncate text-xs font-medium text-foreground">
                          {cr.name}
                        </span>
                        <Badge
                          variant="outline"
                          className="h-3.5 px-1 py-0 text-[9px] capitalize"
                        >
                          {cr.category}
                        </Badge>
                        <Badge
                          variant="secondary"
                          className="h-3.5 px-1 py-0 font-mono text-[9px]"
                        >
                          {cr.ruleCount} rules
                        </Badge>
                      </div>
                      <p className="line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">
                        {cr.description}
                      </p>
                    </div>

                    <div className="shrink-0 pt-0.5">
                      <Switch
                        data-slot="craft-rule-switch"
                        checked={isEnabled}
                        onCheckedChange={() => composer.toggleCraftRule(cr.id)}
                        size="sm"
                        aria-label={`Toggle ${cr.name}`}
                      />
                    </div>
                  </div>
                )
              })
            )}
          </ScrollArea>
        </TabsContent>

        {/* Tab 3: Skills */}
        <TabsContent
          value="skills"
          data-slot="tab-content-skills"
          className="min-h-0 flex-1 outline-none"
        >
          <ScrollArea className="h-full" viewportClassName="p-3 space-y-2">
            {filteredSkills.length === 0 ? (
              <div
                data-slot="empty-skills"
                className="space-y-1.5 px-4 py-12 text-center text-xs text-muted-foreground"
              >
                <ZapIcon className="mx-auto size-6 text-muted-foreground/40" />
                <p className="font-medium text-foreground/80">
                  No skills found
                </p>
                <p className="text-[11px]">Try clearing search filters</p>
              </div>
            ) : (
              filteredSkills.map((sk) => (
                <div
                  key={sk.id}
                  data-slot="skill-card"
                  className="space-y-1.5 rounded-xl border border-border/70 bg-card/60 p-3 transition-all duration-150 select-none hover:border-border hover:bg-card/90"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs font-medium text-foreground">
                      {sk.name}
                    </span>
                    <Badge
                      variant="outline"
                      className="h-4 px-1.5 py-0 text-[9px]"
                    >
                      {sk.category}
                    </Badge>
                  </div>
                  <p className="line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">
                    {sk.description}
                  </p>
                  {sk.triggers && sk.triggers.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {sk.triggers.map((trig) => (
                        <span
                          key={trig}
                          data-slot="skill-trigger-chip"
                          className="py-0.2 rounded border border-border/40 bg-muted/60 px-1.5 font-mono text-[9px] text-muted-foreground"
                        >
                          {trig}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* Brand Preview Modal */}
      <DesignSystemPreviewModal />
    </aside>
  )
}
