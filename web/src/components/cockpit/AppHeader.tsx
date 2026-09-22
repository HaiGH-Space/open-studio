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
    /(Mac|iPhone|iPod|iPad)/i.test(navigator.userAgent || navigator.platform || "")
  const shortcutHint = isMac ? "⌘K" : "Ctrl+K"

  return (
    <>
      <header
        data-slot="app-header"
        className={cn(
          "sticky top-0 z-40 w-full border-b border-border/70 bg-background/80 backdrop-blur-md px-4 py-2.5 flex items-center justify-between gap-4 select-none",
          className
        )}
      >
        {/* Left: Brand Identity & Active System Pill */}
        <div className="flex items-center gap-3 min-w-0">
          <div
            data-slot="app-brand-logo"
            className="flex items-center gap-2 font-semibold tracking-tight text-foreground text-sm shrink-0"
          >
            <div className="size-7 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center text-primary shadow-xs">
              <SparklesIcon className="size-4 text-primary" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm tracking-tight">Open Studio</span>
              <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 uppercase font-mono tracking-wider text-muted-foreground">
                Cockpit
              </Badge>
            </div>
          </div>

          <div className="h-4 w-px bg-border/60 shrink-0" />

          {/* Active Brand Badge */}
          <button
            type="button"
            data-slot="active-brand-badge"
            onClick={handleOpenCommandMenu}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border border-border/70 bg-input/20 hover:bg-muted transition-colors cursor-pointer text-muted-foreground hover:text-foreground truncate max-w-44"
            title={activeSystem ? `Active System: ${activeSystem.name}` : "Click to select a design system"}
          >
            {activeSystem ? (
              <>
                <div
                  className="size-2.5 rounded-full shrink-0 border border-black/20"
                  style={{
                    backgroundColor: activeSystem.swatches?.primary ?? "var(--primary)",
                  }}
                />
                <span className="truncate text-foreground font-medium">{activeSystem.name}</span>
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
        <div className="flex-1 max-w-sm hidden md:flex items-center">
          <button
            type="button"
            data-slot="command-menu-trigger"
            onClick={handleOpenCommandMenu}
            className="w-full flex items-center justify-between gap-2 px-3 py-1.5 rounded-full border border-border/60 bg-input/15 text-xs text-muted-foreground hover:text-foreground hover:border-border transition-all cursor-pointer shadow-2xs"
          >
            <div className="flex items-center gap-2">
              <SearchIcon className="size-3.5 text-muted-foreground" />
              <span>Search systems &amp; craft rules...</span>
            </div>
            <kbd className="px-1.5 py-0.5 rounded bg-muted/60 border border-border/60 text-[10px] font-mono tracking-tight text-foreground/80">
              {shortcutHint}
            </kbd>
          </button>
        </div>

        {/* Right: Token Gauge & Quick Export Action */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Token Gauge Summary */}
          <div
            data-slot="token-gauge"
            className={cn(
              "flex items-center gap-2 px-2.5 py-1 rounded-full border text-xs transition-colors",
              tokenStats.isOverBudget
                ? "border-destructive/50 bg-destructive/10 text-destructive"
                : "border-border/60 bg-input/15 text-muted-foreground"
            )}
          >
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-foreground font-mono">
                {tokenStats.totalTokens.toLocaleString()}
              </span>
              <span className="text-[11px] text-muted-foreground">tokens</span>
            </div>

            <div className="h-3 w-px bg-border/60" />

            <span className="text-[11px] font-mono">
              {tokenStats.budgetUsagePercent}%
            </span>

            {tokenStats.isOverBudget && (
              <Badge
                variant="destructive"
                data-slot="token-overbudget"
                className="text-[10px] py-0 px-1.5 h-4 gap-0.5"
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
              "gap-1.5 font-medium transition-all text-xs h-8 px-3 rounded-full cursor-pointer",
              isCopied && "bg-emerald-600 hover:bg-emerald-600 text-white"
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
