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
import { ScrollArea } from "../ui/scroll-area"
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
        className="max-w-xl gap-4 overflow-hidden border border-border bg-background/95 p-0 shadow-2xl backdrop-blur-md sm:max-w-xl"
      >
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="flex items-center gap-2 text-base font-semibold">
            <SparklesIcon className="size-4 text-primary" />
            Quick Command Palette
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Search design systems and craft rules (Cmd+K)
          </DialogDescription>
        </DialogHeader>

        <div className="relative px-4">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-7 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            data-slot="command-search-input"
            type="text"
            placeholder="Search design systems or craft rules..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-10 border-border/70 bg-input/20 pr-4 pl-9 text-sm focus-visible:ring-1 focus-visible:ring-primary"
            autoFocus
          />
        </div>

        <ScrollArea
          className="max-h-80"
          viewportClassName="px-4 pb-4 space-y-4"
        >
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
                  <div className="px-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
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
                            "flex w-full cursor-pointer items-center justify-between rounded-lg p-2.5 text-left text-sm transition-colors",
                            "hover:bg-muted/70 focus-visible:bg-muted/70 focus-visible:outline-none",
                            isActive &&
                              "border-l-2 border-primary bg-primary/10"
                          )}
                          onClick={() => handleSelectSystem(ds.id)}
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <div
                              className="flex size-4 shrink-0 items-center justify-center rounded-full border border-border text-[10px]"
                              style={{
                                backgroundColor:
                                  ds.swatches?.primary ?? "var(--primary)",
                              }}
                            />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 truncate font-medium text-foreground">
                                <span>{ds.name}</span>
                                <Badge
                                  variant="outline"
                                  className="h-4 px-1.5 py-0 text-[10px]"
                                >
                                  {ds.category}
                                </Badge>
                              </div>
                              <p className="max-w-sm truncate text-xs text-muted-foreground">
                                {ds.description}
                              </p>
                            </div>
                          </div>
                          {isActive && (
                            <Badge
                              variant="default"
                              className="shrink-0 gap-1 text-xs"
                            >
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
                  <div className="px-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
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
                            "flex w-full cursor-pointer items-center justify-between rounded-lg p-2.5 text-left text-sm transition-colors",
                            "hover:bg-muted/70 focus-visible:bg-muted/70 focus-visible:outline-none",
                            isActive &&
                              "border-l-2 border-secondary bg-secondary/40"
                          )}
                          onClick={() => handleToggleRule(cr.id)}
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <RuleIcon className="size-4 shrink-0 text-muted-foreground" />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 truncate font-medium text-foreground">
                                <span>{cr.name}</span>
                                <Badge
                                  variant="outline"
                                  className="h-4 px-1.5 py-0 text-[10px]"
                                >
                                  {cr.category}
                                </Badge>
                              </div>
                              <p className="max-w-sm truncate text-xs text-muted-foreground">
                                {cr.description}
                              </p>
                            </div>
                          </div>
                          {isActive && (
                            <Badge
                              variant="secondary"
                              className="shrink-0 gap-1 text-xs"
                            >
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
        </ScrollArea>

        <div className="flex items-center justify-between border-t border-border/40 bg-muted/20 px-4 py-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px]">
                ↵
              </kbd>{" "}
              Select
            </span>
            <span>
              <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px]">
                Esc
              </kbd>{" "}
              Close
            </span>
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
