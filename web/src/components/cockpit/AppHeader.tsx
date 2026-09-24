import { useState, useCallback } from "react"
import { useCatalog } from "../../hooks/useCatalog"
import { useComposer } from "../../hooks/useComposer"
import { useTokenCount } from "../../hooks/useTokenCount"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { CommandMenuDialog } from "./CommandMenuDialog"
import {
  Sparkles as SparklesIcon,
  Search as SearchIcon,
  Download as DownloadIcon,
  Check as CheckIcon,
  Palette as PaletteIcon,
  AlertTriangle as AlertTriangleIcon,
} from "lucide-react"
import { cn } from "cn"

export interface AppHeaderProps {
  readonly className?: string
  readonly budgetLimit?: number
  readonly onExport?: () => void
  readonly onOpenCommandMenu?: () => void
}

export function AppHeader({
  className,
  budgetLimit = 8000,
  onExport,
  onOpenCommandMenu,
}: AppHeaderProps) {
  const catalogContext = useCatalog()
  const composer = useComposer()
  const tokenStats = useTokenCount({ budgetLimit })

  const [isCommandMenuOpen, setIsCommandMenuOpen] = useState(false)
  const [isCopied, setIsCopied] = useState(false)

  const handleOpenCommandMenu = useCallback(() => {
    if (onOpenCommandMenu) {
      onOpenCommandMenu()
    } else {
      setIsCommandMenuOpen(true)
    }
  }, [onOpenCommandMenu])

  const handleQuickExport = useCallback(async () => {
    try {
      const exportOutput = composer.getExportOutput()
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(exportOutput.primaryClipboardText)
      }
      setIsCopied(true)
      setTimeout(() => {
        setIsCopied(false)
      }, 2000)
    } catch (err) {
      console.warn("Failed to copy export prompt to clipboard:", err)
    } finally {
      onExport?.()
    }
  }, [composer, onExport])

  const activeSystemId = composer.config.layer5BrandContract.selectedSystemId
  const activeSystem = catalogContext.catalog?.designSystems.find(
    (ds) => ds.id === activeSystemId
  )

  const isMac =
    typeof navigator !== "undefined" &&
    /(Mac|iPhone|iPod|iPad)/i.test(
      navigator.userAgent || navigator.platform || ""
    )
  const shortcutHint = isMac ? "⌘K" : "Ctrl+K"

  return (
    <>
      <header
        data-slot="app-header"
        className={cn(
          "sticky top-0 z-40 flex w-full items-center justify-between gap-4 border-b border-border/70 bg-background/80 px-4 py-2.5 backdrop-blur-md select-none",
          className
        )}
      >
        {/* Left: Brand Identity & Active System Pill */}
        <div className="flex min-w-0 items-center gap-3">
          <div
            data-slot="app-brand-logo"
            className="flex shrink-0 items-center gap-2 text-sm font-semibold tracking-tight text-foreground"
          >
            <div className="flex size-7 items-center justify-center rounded-lg border border-primary/30 bg-primary/15 text-primary shadow-xs">
              <SparklesIcon className="size-4 text-primary" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold tracking-tight">
                Open Studio
              </span>
              <Badge
                variant="outline"
                className="h-4 px-1 py-0 font-mono text-[10px] tracking-wider text-muted-foreground uppercase"
              >
                Cockpit
              </Badge>
            </div>
          </div>

          <div className="h-4 w-px shrink-0 bg-border/60" />

          {/* Active Brand Badge */}
          <button
            type="button"
            data-slot="active-brand-badge"
            onClick={handleOpenCommandMenu}
            className="inline-flex max-w-44 cursor-pointer items-center gap-1.5 truncate rounded-full border border-border/70 bg-input/20 px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            title={
              activeSystem
                ? `Active System: ${activeSystem.name}`
                : "Click to select a design system"
            }
          >
            {activeSystem ? (
              <>
                <div
                  className="size-2.5 shrink-0 rounded-full border border-black/20"
                  style={{
                    backgroundColor:
                      activeSystem.swatches?.primary ?? "var(--primary)",
                  }}
                />
                <span className="truncate font-medium text-foreground">
                  {activeSystem.name}
                </span>
              </>
            ) : (
              <>
                <PaletteIcon className="size-3 shrink-0 text-muted-foreground" />
                <span className="truncate">Select System</span>
              </>
            )}
          </button>
        </div>

        {/* Center: Command Palette Trigger */}
        <div className="hidden max-w-sm flex-1 items-center md:flex">
          <button
            type="button"
            data-slot="command-menu-trigger"
            onClick={handleOpenCommandMenu}
            className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-full border border-border/60 bg-input/15 px-3 py-1.5 text-xs text-muted-foreground shadow-2xs transition-all hover:border-border hover:text-foreground"
          >
            <div className="flex items-center gap-2">
              <SearchIcon className="size-3.5 text-muted-foreground" />
              <span>Search systems &amp; craft rules...</span>
            </div>
            <kbd className="rounded border border-border/60 bg-muted/60 px-1.5 py-0.5 font-mono text-[10px] tracking-tight text-foreground/80">
              {shortcutHint}
            </kbd>
          </button>
        </div>

        {/* Right: Token Gauge & Quick Export Action */}
        <div className="flex shrink-0 items-center gap-3">
          {/* Token Gauge Summary */}
          <div
            data-slot="token-gauge"
            className={cn(
              "flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs transition-colors",
              tokenStats.isOverBudget
                ? "border-destructive/50 bg-destructive/10 text-destructive"
                : "border-border/60 bg-input/15 text-muted-foreground"
            )}
          >
            <div className="flex items-center gap-1.5">
              <span className="font-mono font-semibold text-foreground">
                {tokenStats.totalTokens.toLocaleString()}
              </span>
              <span className="text-[11px] text-muted-foreground">tokens</span>
            </div>

            <div className="h-3 w-px bg-border/60" />

            <span className="font-mono text-[11px]">
              {tokenStats.budgetUsagePercent}%
            </span>

            {tokenStats.isOverBudget && (
              <Badge
                variant="destructive"
                data-slot="token-overbudget"
                className="h-4 gap-0.5 px-1.5 py-0 text-[10px]"
              >
                <AlertTriangleIcon className="size-2.5" />
                Over Budget
              </Badge>
            )}
          </div>

          {/* Quick Export Button */}
          <Button
            type="button"
            size="sm"
            data-slot="quick-export-button"
            onClick={handleQuickExport}
            className={cn(
              "h-8 cursor-pointer gap-1.5 rounded-full px-3 text-xs font-medium transition-all",
              isCopied && "bg-emerald-600 text-white hover:bg-emerald-600"
            )}
          >
            {isCopied ? (
              <>
                <CheckIcon className="size-3.5" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <DownloadIcon className="size-3.5" />
                <span>Export Prompt</span>
              </>
            )}
          </Button>
        </div>
      </header>

      <CommandMenuDialog
        open={isCommandMenuOpen}
        onOpenChange={setIsCommandMenuOpen}
      />
    </>
  )
}
