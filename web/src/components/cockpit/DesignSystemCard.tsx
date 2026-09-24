import type { DesignSystemCatalogEntry } from "../../lib/catalog/catalog-types"
import { Badge } from "../ui/badge"
import { Button } from "../ui/button"
import { ColorSwatchBar } from "./ColorSwatchBar"
import { Check as CheckIcon, Eye as EyeIcon } from "lucide-react"
import { cn } from "cn"

export interface DesignSystemCardProps {
  readonly system: DesignSystemCatalogEntry
  readonly isSelected?: boolean
  readonly onSelect?: (systemId: string) => void
  readonly onPreview?: (systemId: string) => void
  readonly className?: string
}

export function DesignSystemCard({
  system,
  isSelected = false,
  onSelect,
  onPreview,
  className,
}: DesignSystemCardProps) {
  const { name, category, description, tags, tokenSummary, swatches } = system

  return (
    <div
      data-slot="design-system-card"
      data-system-id={system.id}
      className={cn(
        "group relative flex flex-col justify-between rounded-xl border p-3.5 transition-all duration-150 select-none",
        isSelected
          ? "border-primary bg-primary/5 shadow-xs ring-1 ring-primary/40"
          : "border-border/70 bg-card/60 hover:border-border hover:bg-card/90 hover:shadow-2xs",
        className
      )}
    >
      <div className="space-y-2.5">
        {/* Header: Name, Category & Swatches */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold tracking-tight text-foreground">
              {name}
            </h3>
            <span className="text-[11px] text-muted-foreground">
              {category}
            </span>
          </div>

          <Badge
            variant="outline"
            className="h-4 shrink-0 px-1.5 py-0 text-[10px] font-medium"
          >
            {tokenSummary.totalCssVariables} tokens
          </Badge>
        </div>

        {/* Description */}
        <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
          {description}
        </p>

        {/* Color Swatch Bar */}
        <div className="pt-0.5">
          <ColorSwatchBar swatches={swatches} size="sm" />
        </div>

        {/* Tags */}
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-0.5">
            {tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded border border-border/40 bg-muted/60 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
              >
                {tag}
              </span>
            ))}
            {tags.length > 3 && (
              <span className="self-center text-[10px] text-muted-foreground/70">
                +{tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="mt-2 flex items-center justify-between gap-2 border-t border-border/40 pt-3">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          data-slot="preview-system-button"
          onClick={() => onPreview?.(system.id)}
          className="h-7 cursor-pointer gap-1.5 px-2.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <EyeIcon className="size-3" />
          <span>Preview</span>
        </Button>

        <Button
          type="button"
          variant={isSelected ? "default" : "outline"}
          size="sm"
          data-slot="select-system-button"
          onClick={() => onSelect?.(system.id)}
          className={cn(
            "h-7 cursor-pointer gap-1 px-3 text-xs font-medium",
            isSelected &&
              "bg-primary text-primary-foreground hover:bg-primary/90"
          )}
        >
          {isSelected ? (
            <>
              <CheckIcon className="size-3" />
              <span>Active</span>
            </>
          ) : (
            <span>Select</span>
          )}
        </Button>
      </div>
    </div>
  )
}
