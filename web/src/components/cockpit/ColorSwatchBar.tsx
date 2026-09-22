import type { ColorSwatches } from "../../lib/catalog/catalog-types"
import { cn } from "cn"

export interface ColorSwatchBarProps {
  readonly swatches?: ColorSwatches
  readonly className?: string
  readonly size?: "sm" | "default" | "lg"
  readonly showLabels?: boolean
}

interface SwatchDef {
  key: keyof ColorSwatches
  label: string
  value?: string
}

export function ColorSwatchBar({
  swatches,
  className,
  size = "default",
  showLabels = false,
}: ColorSwatchBarProps) {
  const sizeClasses = {
    sm: "size-3 rounded-full border text-[10px]",
    default: "size-4 rounded-full border text-xs",
    lg: "size-5 rounded-full border text-sm",
  }

  const swatchDefs: SwatchDef[] = [
    { key: "primary", label: "Primary", value: swatches?.primary },
    { key: "background", label: "Background", value: swatches?.background },
    { key: "accent", label: "Accent", value: swatches?.accent },
    { key: "foreground", label: "Foreground", value: swatches?.foreground },
    { key: "muted", label: "Muted", value: swatches?.muted },
  ]

  const activeSwatches = swatchDefs.filter((s) => Boolean(s.value))

  if (activeSwatches.length === 0) {
    return (
      <div
        data-slot="color-swatch-bar"
        className={cn("flex items-center gap-1.5", className)}
      >
        <div
          data-slot="swatch-fallback"
          className="flex items-center gap-1 text-[11px] text-muted-foreground/60 italic"
          title="No color swatches defined"
        >
          <div className={cn(sizeClasses[size], "border-border/40 bg-muted/30")} />
          <div className={cn(sizeClasses[size], "border-border/40 bg-muted/20")} />
          <div className={cn(sizeClasses[size], "border-border/40 bg-muted/10")} />
        </div>
      </div>
    )
  }

  return (
    <div
      data-slot="color-swatch-bar"
      className={cn("flex items-center gap-1.5 flex-wrap", className)}
    >
      {activeSwatches.map((item) => (
        <div
          key={item.key}
          data-slot="swatch-item"
          className="flex items-center gap-1 group relative"
          title={`${item.label}: ${item.value}`}
        >
          <div
            className={cn(
              sizeClasses[size],
              "border-black/20 dark:border-white/20 shrink-0 shadow-2xs transition-transform group-hover:scale-110"
            )}
            style={{ backgroundColor: item.value }}
          />
          {showLabels && (
            <span className="text-[11px] text-muted-foreground font-mono">
              {item.label}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}
