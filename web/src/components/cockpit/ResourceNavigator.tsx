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
        "w-80 md:w-96 flex flex-col h-full border-r border-border/70 bg-sidebar/50 select-none overflow-hidden",
        className
      )}
    >
      {/* Top Search & Filter Bar */}
      <div className="p-3.5 space-y-2.5 border-b border-border/60 bg-background/40">
        {/* Search Input */}
        <div className="relative">
          <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            data-slot="catalog-search-input"
            type="text"
            placeholder="Filter systems, rules, skills..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 pr-7 h-8 text-xs bg-input/20 border-border/70 focus-visible:ring-1 focus-visible:ring-primary"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={handleClearSearch}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
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
            className="w-full text-xs h-7 px-2.5 rounded-lg border border-border/70 bg-input/25 text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
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
            className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar"
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
                    "text-[10px] px-2 py-0.5 rounded-full border transition-colors cursor-pointer shrink-0 font-mono",
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary shadow-2xs font-semibold"
                      : "bg-muted/40 text-muted-foreground border-border/60 hover:text-foreground hover:border-border"
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
        className="flex-1 flex flex-col overflow-hidden"
      >
        <div className="px-3.5 pt-2 border-b border-border/40">
          <TabsList className="w-full grid grid-cols-3 h-8 bg-muted/50 p-0.5 rounded-lg text-xs">
            <TabsTrigger
              value="systems"
              data-slot="tab-trigger-systems"
              className="gap-1.5 text-xs py-1 px-2 rounded-md font-medium cursor-pointer"
            >
              <PaletteIcon className="size-3" />
              <span>Systems</span>
              <span className="ml-0.5 text-[10px] opacity-75 font-mono">
                ({filteredDesignSystems.length})
              </span>
            </TabsTrigger>

            <TabsTrigger
              value="rules"
              data-slot="tab-trigger-rules"
              className="gap-1.5 text-xs py-1 px-2 rounded-md font-medium cursor-pointer"
            >
              <RuleIcon className="size-3" />
              <span>Rules</span>
              <span className="ml-0.5 text-[10px] opacity-75 font-mono">
                ({filteredCraftRules.length})
              </span>
            </TabsTrigger>

            <TabsTrigger
              value="skills"
              data-slot="tab-trigger-skills"
              className="gap-1.5 text-xs py-1 px-2 rounded-md font-medium cursor-pointer"
            >
              <ZapIcon className="size-3" />
              <span>Skills</span>
              <span className="ml-0.5 text-[10px] opacity-75 font-mono">
                ({filteredSkills.length})
              </span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab 1: Design Systems */}
        <TabsContent
          value="systems"
          data-slot="tab-content-systems"
          className="flex-1 min-h-0 outline-none"
        >
          <ScrollArea className="h-full" viewportClassName="p-3 space-y-2.5">
            {filteredDesignSystems.length === 0 ? (
              <div
                data-slot="empty-systems"
                className="py-12 px-4 text-center text-xs text-muted-foreground space-y-1.5"
              >
                <PaletteIcon className="size-6 text-muted-foreground/40 mx-auto" />
                <p className="font-medium text-foreground/80">No design systems found</p>
                <p className="text-[11px]">Try adjusting your search query or filters</p>
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
          className="flex-1 min-h-0 outline-none"
        >
          <ScrollArea className="h-full" viewportClassName="p-3 space-y-2">
            {filteredCraftRules.length === 0 ? (
              <div
                data-slot="empty-rules"
                className="py-12 px-4 text-center text-xs text-muted-foreground space-y-1.5"
              >
                <RuleIcon className="size-6 text-muted-foreground/40 mx-auto" />
                <p className="font-medium text-foreground/80">No craft rules found</p>
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
                      "p-3 rounded-xl border transition-all duration-150 flex items-start justify-between gap-3 select-none",
                      isEnabled
                        ? "border-primary/50 bg-primary/5"
                        : "border-border/70 bg-card/60 hover:bg-card/90 hover:border-border"
                    )}
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-medium text-xs text-foreground truncate">
                          {cr.name}
                        </span>
                        <Badge variant="outline" className="text-[9px] py-0 px-1 h-3.5 capitalize">
                          {cr.category}
                        </Badge>
                        <Badge variant="secondary" className="text-[9px] py-0 px-1 h-3.5 font-mono">
                          {cr.ruleCount} rules
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
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
          className="flex-1 min-h-0 outline-none"
        >
          <ScrollArea className="h-full" viewportClassName="p-3 space-y-2">
            {filteredSkills.length === 0 ? (
              <div
                data-slot="empty-skills"
                className="py-12 px-4 text-center text-xs text-muted-foreground space-y-1.5"
              >
                <ZapIcon className="size-6 text-muted-foreground/40 mx-auto" />
                <p className="font-medium text-foreground/80">No skills found</p>
                <p className="text-[11px]">Try clearing search filters</p>
              </div>
            ) : (
              filteredSkills.map((sk) => (
                <div
                  key={sk.id}
                  data-slot="skill-card"
                  className="p-3 rounded-xl border border-border/70 bg-card/60 hover:bg-card/90 hover:border-border transition-all duration-150 space-y-1.5 select-none"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-xs text-foreground truncate">
                      {sk.name}
                    </span>
                    <Badge variant="outline" className="text-[9px] py-0 px-1.5 h-4">
                      {sk.category}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                    {sk.description}
                  </p>
                  {sk.triggers && sk.triggers.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {sk.triggers.map((trig) => (
                        <span
                          key={trig}
                          data-slot="skill-trigger-chip"
                          className="text-[9px] px-1.5 py-0.2 rounded bg-muted/60 text-muted-foreground border border-border/40 font-mono"
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
