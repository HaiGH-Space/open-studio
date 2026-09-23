import React from "react"
import { cn } from "cn"
import type { LayerCompilationResult } from "../../lib/composer/composer-types"

export interface LayerTokenStackedBarProps {
  readonly breakdown?: readonly LayerCompilationResult[]
  readonly totalTokens?: number
  readonly showLegend?: boolean
  readonly className?: string
}

export const LAYER_COLOR_MAP: Record<
  number,
  { bg: string; text: string; border: string; badge: string }
> = {
  1: { bg: "bg-rose-500", text: "text-rose-400", border: "border-rose-500/30", badge: "bg-rose-500/15" },
  2: { bg: "bg-amber-500", text: "text-amber-400", border: "border-amber-500/30", badge: "bg-amber-500/15" },
  3: { bg: "bg-orange-500", text: "text-orange-400", border: "border-orange-500/30", badge: "bg-orange-500/15" },
  4: { bg: "bg-lime-500", text: "text-lime-400", border: "border-lime-500/30", badge: "bg-lime-500/15" },
  5: { bg: "bg-emerald-500", text: "text-emerald-400", border: "border-emerald-500/30", badge: "bg-emerald-500/15" },
  6: { bg: "bg-cyan-500", text: "text-cyan-400", border: "border-cyan-500/30", badge: "bg-cyan-500/15" },
  7: { bg: "bg-sky-500", text: "text-sky-400", border: "border-sky-500/30", badge: "bg-sky-500/15" },
  8: { bg: "bg-indigo-500", text: "text-indigo-400", border: "border-indigo-500/30", badge: "bg-indigo-500/15" },
  9: { bg: "bg-fuchsia-500", text: "text-fuchsia-400", border: "border-fuchsia-500/30", badge: "bg-fuchsia-500/15" },
}

export function LayerTokenStackedBar({
  breakdown = [],
  totalTokens,
  showLegend = false,
  className,
}: LayerTokenStackedBarProps) {
  const sumTokens = breakdown.reduce((acc, l) => acc + (l.tokenCount || 0), 0)
  const effectiveTotal = typeof totalTokens === "number" ? totalTokens : sumTokens

  // Only layers with positive token counts
  const activeSegments = breakdown
    .filter((layer) => layer.tokenCount > 0)
    .map((layer) => {
      const pct =
        effectiveTotal > 0
          ? Math.round((layer.tokenCount / effectiveTotal) * 1000) / 10
          : 0
      return {
        ...layer,
        pct,
        color: LAYER_COLOR_MAP[layer.layerIndex] ?? {
          bg: "bg-primary",
          text: "text-primary",
          border: "border-primary/30",
          badge: "bg-primary/15",
        },
      }
    })

  return (
    <div
      data-slot="layer-token-stacked-bar"
      className={cn("w-full flex flex-col gap-1.5 select-none", className)}
    >
      {/* Horizontal Stacked Bar */}
      <div className="w-full h-2 rounded-full overflow-hidden flex bg-muted/40 border border-border/40 p-[1px]">
        {effectiveTotal === 0 || activeSegments.length === 0 ? (
          <div
            data-slot="stacked-bar-empty"
            className="w-full h-full bg-muted/30 rounded-full"
            title="0 tokens"
          />
        ) : (
          activeSegments.map((seg) => (
            <div
              key={seg.layerIndex}
              data-slot={`stacked-bar-segment-${seg.layerIndex}`}
              className={cn("h-full first:rounded-l-full last:rounded-r-full transition-all duration-300", seg.color.bg)}
              style={{ width: `${seg.pct}%` }}
              title={`L${seg.layerIndex} ${seg.layerName}: ${seg.tokenCount.toLocaleString()} tokens (${seg.pct}%)`}
            />
          ))
        )}
      </div>

      {/* Optional Legend */}
      {showLegend && activeSegments.length > 0 && (
        <div
          data-slot="stacked-bar-legend"
          className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-[11px] text-muted-foreground"
        >
          {activeSegments.map((seg) => (
            <div
              key={seg.layerIndex}
              className="inline-flex items-center gap-1.5"
            >
              <span className={cn("size-2 rounded-full shrink-0", seg.color.bg)} />
              <span className="font-medium text-foreground/80 truncate max-w-36">
                L{seg.layerIndex} {seg.layerName}
              </span>
              <span className="font-mono text-[10px] text-muted-foreground">
                {seg.tokenCount.toLocaleString()} ({seg.pct}%)
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
