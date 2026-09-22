import { useState, useEffect, useMemo, useCallback } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog"
import { Input } from "../ui/input"
import { Badge } from "../ui/badge"
import { useCatalog } from "../../hooks/useCatalog"
import { useComposer } from "../../hooks/useComposer"
import {
  Search as SearchIcon,
  Palette as PaletteIcon,
  SlidersHorizontal as RuleIcon,
  Check as CheckIcon,
  Sparkles as SparklesIcon,
} from "lucide-react"
import { cn } from "cn"

export interface CommandMenuDialogProps {
  readonly open?: boolean
  readonly onOpenChange?: (open: boolean) => void
  readonly defaultOpen?: boolean
}

export function CommandMenuDialog({
  open,
  onOpenChange,
  defaultOpen = false,
}: CommandMenuDialogProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen)
  const [query, setQuery] = useState("")

  const isControlled = open !== undefined
  const isOpen = isControlled ? open : internalOpen

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!isControlled) {
        setInternalOpen(nextOpen)
      }
      if (!nextOpen) {
        setQuery("")
      }
      onOpenChange?.(nextOpen)
    },
    [isControlled, onOpenChange]
  )

  // Listen for global Cmd+K and Ctrl+K shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        handleOpenChange(!isOpen)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [handleOpenChange, isOpen])

  const catalogContext = useCatalog()
  const composer = useComposer()

  const normalizedQuery = query.trim().toLowerCase()

  // Filter design systems
  const filteredDesignSystems = useMemo(() => {
    const systems = catalogContext.catalog?.designSystems ?? []
    if (!normalizedQuery) return systems

    return systems.filter(
      (ds) =>
        ds.name.toLowerCase().includes(normalizedQuery) ||
        ds.id.toLowerCase().includes(normalizedQuery) ||
        ds.description.toLowerCase().includes(normalizedQuery) ||
        ds.category.toLowerCase().includes(normalizedQuery) ||
        ds.tags.some((tag) => tag.toLowerCase().includes(normalizedQuery))
    )
  }, [catalogContext.catalog?.designSystems, normalizedQuery])

  // Filter craft rules
  const filteredCraftRules = useMemo(() => {
    const rules = catalogContext.catalog?.craftRules ?? []
    if (!normalizedQuery) return rules

    return rules.filter(
      (cr) =>
        cr.name.toLowerCase().includes(normalizedQuery) ||
        cr.id.toLowerCase().includes(normalizedQuery) ||
        cr.description.toLowerCase().includes(normalizedQuery) ||
        cr.category.toLowerCase().includes(normalizedQuery)
    )
  }, [catalogContext.catalog?.craftRules, normalizedQuery])

  const activeSystemId = composer.config.layer5BrandContract.selectedSystemId
  const activeRuleIds = composer.config.layer6CraftRules.selectedRuleIds

  const handleSelectSystem = (systemId: string) => {
    composer.selectDesignSystem(systemId)
    handleOpenChange(false)
  }

  const handleToggleRule = (ruleId: string) => {
    composer.toggleCraftRule(ruleId)
  }

  const totalResults = filteredDesignSystems.length + filteredCraftRules.length

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        data-slot="command-menu-dialog"
        className="max-w-xl gap-4 p-0 overflow-hidden sm:max-w-xl bg-background/95 backdrop-blur-md border border-border shadow-2xl"
      >
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="text-base font-semibold flex items-center gap-2">
            <SparklesIcon className="size-4 text-primary" />
            Quick Command Palette
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Search design systems and craft rules (Cmd+K)
          </DialogDescription>
        </DialogHeader>

        <div className="relative px-4">
          <SearchIcon className="absolute left-7 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            data-slot="command-search-input"
            type="text"
            placeholder="Search design systems or craft rules..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9 pr-4 h-10 bg-input/20 border-border/70 text-sm focus-visible:ring-1 focus-visible:ring-primary"
            autoFocus
          />
        </div>

        <div className="max-h-80 overflow-y-auto px-4 pb-4 space-y-4">
          {totalResults === 0 ? (
            <div
              data-slot="command-empty"
              className="py-10 text-center text-sm text-muted-foreground"
            >
              {query ? (
                <>No matching resources found for &ldquo;{query}&rdquo;</>
              ) : (
                "No matching resources found"
              )}
            </div>
          ) : (
            <>
              {/* Design Systems Section */}
              {filteredDesignSystems.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-2">
                    Design Systems ({filteredDesignSystems.length})
                  </div>
                  <div className="space-y-1">
                    {filteredDesignSystems.map((ds) => {
                      const isActive = activeSystemId === ds.id
                      return (
                        <button
                          key={ds.id}
                          type="button"
                          data-slot="command-item-system"
                          className={cn(
                            "w-full text-left flex items-center justify-between p-2.5 rounded-lg text-sm transition-colors cursor-pointer",
                            "hover:bg-muted/70 focus-visible:bg-muted/70 focus-visible:outline-none",
                            isActive && "bg-primary/10 border-l-2 border-primary"
                          )}
                          onClick={() => handleSelectSystem(ds.id)}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className="size-4 rounded-full border border-border shrink-0 flex items-center justify-center text-[10px]"
                              style={{
                                backgroundColor: ds.swatches?.primary ?? "var(--primary)",
                              }}
                            />
                            <div className="min-w-0">
                              <div className="font-medium text-foreground truncate flex items-center gap-1.5">
                                <span>{ds.name}</span>
                                <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4">
                                  {ds.category}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground truncate max-w-sm">
                                {ds.description}
                              </p>
                            </div>
                          </div>
                          {isActive && (
                            <Badge variant="default" className="text-xs gap-1 shrink-0">
                              <CheckIcon className="size-3" />
                              Active
                            </Badge>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Craft Rules Section */}
              {filteredCraftRules.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-2">
                    Craft Rules ({filteredCraftRules.length})
                  </div>
                  <div className="space-y-1">
                    {filteredCraftRules.map((cr) => {
                      const isActive = activeRuleIds.includes(cr.id)
                      return (
                        <button
                          key={cr.id}
                          type="button"
                          data-slot="command-item-rule"
                          className={cn(
                            "w-full text-left flex items-center justify-between p-2.5 rounded-lg text-sm transition-colors cursor-pointer",
                            "hover:bg-muted/70 focus-visible:bg-muted/70 focus-visible:outline-none",
                            isActive && "bg-secondary/40 border-l-2 border-secondary"
                          )}
                          onClick={() => handleToggleRule(cr.id)}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <RuleIcon className="size-4 text-muted-foreground shrink-0" />
                            <div className="min-w-0">
                              <div className="font-medium text-foreground truncate flex items-center gap-1.5">
                                <span>{cr.name}</span>
                                <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4">
                                  {cr.category}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground truncate max-w-sm">
                                {cr.description}
                              </p>
                            </div>
                          </div>
                          {isActive && (
                            <Badge variant="secondary" className="text-xs gap-1 shrink-0">
                              <CheckIcon className="size-3" />
                              Enabled
                            </Badge>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="border-t border-border/40 bg-muted/20 px-4 py-2 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <span><kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono">↵</kbd> Select</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono">Esc</kbd> Close</span>
          </div>
          <div className="flex items-center gap-1 text-[11px]">
            <PaletteIcon className="size-3 text-muted-foreground" />
            <span>Open Studio Catalog</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
