import { useState } from "react"
import { useComposer } from "../../hooks/useComposer"
import { UserCheck, ShieldAlert, Plus, X } from "lucide-react"

export function Layer8UserRules() {
  const { config, updateLayer } = useComposer()
  const { persistentDirectives, negativeConstraints } = config.layer8UserMemory

  const [newDirective, setNewDirective] = useState("")
  const [newNegative, setNewNegative] = useState("")

  const handleAddDirective = () => {
    const trimmed = newDirective.trim()
    if (!trimmed) return
    if (persistentDirectives.includes(trimmed)) {
      setNewDirective("")
      return
    }
    updateLayer("layer8UserMemory", {
      persistentDirectives: [...persistentDirectives, trimmed],
    })
    setNewDirective("")
  }

  const handleRemoveDirective = (indexToRemove: number) => {
    updateLayer("layer8UserMemory", {
      persistentDirectives: persistentDirectives.filter(
        (_, idx) => idx !== indexToRemove
      ),
    })
  }

  const handleAddNegative = () => {
    const trimmed = newNegative.trim()
    if (!trimmed) return
    if (negativeConstraints.includes(trimmed)) {
      setNewNegative("")
      return
    }
    updateLayer("layer8UserMemory", {
      negativeConstraints: [...negativeConstraints, trimmed],
    })
    setNewNegative("")
  }

  const handleRemoveNegative = (indexToRemove: number) => {
    updateLayer("layer8UserMemory", {
      negativeConstraints: negativeConstraints.filter(
        (_, idx) => idx !== indexToRemove
      ),
    })
  }

  return (
    <div data-slot="layer8-user-rules-panel" className="space-y-4 py-2">
      {/* Persistent Directives (Always Enforce) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-xs font-medium text-foreground">
            <UserCheck className="size-3.5 text-primary" />
            <span>Persistent Directives (Always Enforce)</span>
          </span>
          <span className="text-[11px] text-muted-foreground">
            Stored in LocalStorage across sessions
          </span>
        </div>

        <div className="flex gap-2">
          <input
            data-slot="l8-directive-input"
            type="text"
            placeholder="e.g. Always use Lucide React icons, Prefer single-file components..."
            value={newDirective}
            onChange={(e) => setNewDirective(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                handleAddDirective()
              }
            }}
            className="flex-1 h-8 px-3 rounded-lg border border-border/70 bg-input/20 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <button
            type="button"
            data-slot="l8-add-directive-btn"
            onClick={handleAddDirective}
            className="inline-flex items-center gap-1 px-3 h-8 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors cursor-pointer"
          >
            <Plus className="size-3.5" />
            <span>Add</span>
          </button>
        </div>

        {persistentDirectives.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {persistentDirectives.map((dir, idx) => (
              <span
                key={`${dir}-${idx}`}
                data-slot="l8-directive-item"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-border/80 bg-muted/40 text-xs text-foreground"
              >
                <span>{dir}</span>
                <button
                  type="button"
                  data-slot="l8-remove-directive-btn"
                  onClick={() => handleRemoveDirective(idx)}
                  className="text-muted-foreground hover:text-destructive cursor-pointer transition-colors p-0.5 rounded"
                  aria-label={`Remove directive: ${dir}`}
                >
                  <X className="size-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Negative Constraints (Never Do) */}
      <div className="space-y-2 pt-2 border-t border-border/50">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-xs font-medium text-foreground">
            <ShieldAlert className="size-3.5 text-destructive" />
            <span>Negative Constraints (&quot;Never Do&quot;)</span>
          </span>
          <span className="text-[11px] text-muted-foreground">
            Explicitly forbids specific anti-patterns
          </span>
        </div>

        <div className="flex gap-2">
          <input
            data-slot="l8-negative-input"
            type="text"
            placeholder="e.g. Never use purple gradient text, No floating modal popups..."
            value={newNegative}
            onChange={(e) => setNewNegative(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                handleAddNegative()
              }
            }}
            className="flex-1 h-8 px-3 rounded-lg border border-border/70 bg-input/20 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <button
            type="button"
            data-slot="l8-add-negative-btn"
            onClick={handleAddNegative}
            className="inline-flex items-center gap-1 px-3 h-8 rounded-lg bg-destructive/15 text-destructive border border-destructive/30 hover:bg-destructive/25 text-xs font-medium transition-colors cursor-pointer"
          >
            <Plus className="size-3.5" />
            <span>Add</span>
          </button>
        </div>

        {negativeConstraints.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {negativeConstraints.map((neg, idx) => (
              <span
                key={`${neg}-${idx}`}
                data-slot="l8-negative-item"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-destructive/20 bg-destructive/5 text-xs text-destructive dark:text-destructive-foreground"
              >
                <span>{neg}</span>
                <button
                  type="button"
                  data-slot="l8-remove-negative-btn"
                  onClick={() => handleRemoveNegative(idx)}
                  className="text-muted-foreground hover:text-destructive cursor-pointer transition-colors p-0.5 rounded"
                  aria-label={`Remove negative constraint: ${neg}`}
                >
                  <X className="size-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
