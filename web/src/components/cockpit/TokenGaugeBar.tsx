import { cn } from "cn"
import { estimateCost } from "../../lib/tokenizer/token-counter"

export type TokenGaugeStatus = "green" | "amber" | "red"

export interface TokenGaugeBarProps {
  readonly tokenCount: number
  readonly modelLimit?: number
  readonly className?: string
  readonly showCost?: boolean
}

function getTokenGaugeStatus(tokens: number): TokenGaugeStatus {
  if (tokens < 30000) return "green"
  if (tokens <= 80000) return "amber"
  return "red"
}

const STATUS_STYLE_MAP: Record<
  TokenGaugeStatus,
  {
    indicatorClass: string
    fillClass: string
    textClass: string
    badgeBg: string
    borderClass: string
  }
> = {
  green: {
    indicatorClass: "bg-emerald-500 text-emerald-400",
    fillClass: "bg-emerald-500",
    textClass: "text-emerald-400",
    badgeBg: "bg-emerald-500/10",
    borderClass: "border-emerald-500/30",
  },
  amber: {
    indicatorClass: "bg-amber-500 text-amber-400",
    fillClass: "bg-amber-500",
    textClass: "text-amber-400",
    badgeBg: "bg-amber-500/10",
    borderClass: "border-amber-500/30",
  },
  red: {
    indicatorClass: "bg-rose-500 text-rose-400",
    fillClass: "bg-rose-500",
    textClass: "text-rose-400",
    badgeBg: "bg-rose-500/10",
    borderClass: "border-rose-500/30",
  },
}

export function TokenGaugeBar({
  tokenCount,
  modelLimit = 128000,
  className,
  showCost = true,
}: TokenGaugeBarProps) {
  const status = getTokenGaugeStatus(tokenCount)
  const styles = STATUS_STYLE_MAP[status]

  const pct =
    modelLimit > 0
      ? Math.min(100, Math.max(0, (tokenCount / modelLimit) * 100))
      : 0
  const formattedPct = Math.round(pct * 10) / 10

  const limitLabel =
    modelLimit >= 1000 ? `${Math.round(modelLimit / 1000)}k` : `${modelLimit}`

  const cost = showCost ? estimateCost(tokenCount) : null

  return (
    <div
      data-slot="token-gauge-bar"
      data-gauge-status={status}
      className={cn("flex w-full flex-col gap-1.5 select-none", className)}
    >
      {/* Metrics Row */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5">
          <span
            data-slot="token-gauge-indicator"
            className={cn(
              "size-2 shrink-0 rounded-full shadow-xs",
              styles.indicatorClass
            )}
          />
          <span className="font-mono text-[11px] font-semibold text-foreground">
            {tokenCount.toLocaleString()}
          </span>
          <span className="text-[11px] text-muted-foreground">
            / {limitLabel} limit
          </span>
          <span
            className={cn(
              "py-0.2 rounded px-1.5 font-mono text-[10px] font-medium",
              styles.badgeBg,
              styles.textClass
            )}
          >
            {formattedPct}%
          </span>
        </div>

        {cost && (
          <div className="font-mono text-[11px] text-muted-foreground">
            ~${cost.inputCost.toFixed(4)}
          </div>
        )}
      </div>

      {/* Progress Bar Track & Fill */}
      <div className="h-1.5 w-full overflow-hidden rounded-full border border-border/30 bg-muted/40">
        <div
          data-slot="token-gauge-fill"
          className={cn(
            "h-full rounded-full transition-all duration-300",
            styles.fillClass
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
