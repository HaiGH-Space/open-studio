import { useState } from "react"
import { useComposer } from "../../hooks/useComposer"
import { useCatalog } from "../../hooks/useCatalog"
import { Sparkles, Plus, X, Check } from "lucide-react"
import { cn } from "cn"

const FALLBACK_CRAFT_RULES = [
  { id: "anti-ai-slop", name: "Anti-AI-Slop Discipline" },
  { id: "accessibility-contrast", name: "Accessibility & WCAG Contrast" },
]

export function Layer6CraftRules() {
  const { config, updateLayer, toggleCraftRule } = useComposer()
  const { catalog } = useCatalog()

  const { selectedRuleIds, customCraftDirectives } = config.layer6CraftRules
  const [newDirective, setNewDirective] = useState("")

  const craftRulesList =
    catalog?.craftRules && catalog.craftRules.length > 0
      ? catalog.craftRules
      : FALLBACK_CRAFT_RULES

  const handleAddDirective = () => {
    const trimmed = newDirective.trim()
    if (!trimmed) return
    if (customCraftDirectives.includes(trimmed)) {
      setNewDirective("")
      return
    }
    updateLayer("layer6CraftRules", {
      customCraftDirectives: [...customCraftDirectives, trimmed],
    })
    setNewDirective("")
  }

  const handleRemoveDirective = (indexToRemove: number) => {
    updateLayer("layer6CraftRules", {
      customCraftDirectives: customCraftDirectives.filter(
        (_, idx) => idx !== indexToRemove
      ),
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleAddDirective()
    }
  }

  return (
    <div data-slot="layer6-craft-rules-panel" className="space-y-4 py-2">
      {/* Recommended Rules Chip Grid */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-xs font-medium text-foreground">
            <Sparkles className="size-3.5 text-primary" />
            <span>Recommended Craft Rulebooks</span>
          </span>
          <span className="text-[11px] text-muted-foreground">
            {selectedRuleIds.length} rule{selectedRuleIds.length === 1 ? "" : "s"} active
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {craftRulesList.map((rule) => {
            const isSelected = selectedRuleIds.includes(rule.id)
            return (
              <button
                key={rule.id}
                type="button"
                data-slot="l6-craft-rule-chip"
                data-rule-id={rule.id}
                onClick={() => toggleCraftRule(rule.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all cursor-pointer select-none",
                  isSelected
                    ? "border-primary bg-primary/15 text-primary"
                    : "border-border/70 bg-input/20 text-muted-foreground hover:bg-input/40 hover:text-foreground"
                )}
              >
                {isSelected && <Check className="size-3 shrink-0" />}
                <span>{rule.name}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Custom Craft Directives Section */}
      <div className="space-y-2 pt-2 border-t border-border/50">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-foreground">
            Custom Craft Directives
          </span>
          <span className="text-[11px] text-muted-foreground">
            Project-specific visual guidelines
          </span>
        </div>

        <div className="flex gap-2">
          <input
            data-slot="l6-directive-input"
            type="text"
            placeholder="e.g. Always use 8px grid spacing, Never use generic gradients..."
            value={newDirective}
            onChange={(e) => setNewDirective(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 h-8 px-3 rounded-lg border border-border/70 bg-input/20 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <button
            type="button"
            data-slot="l6-add-directive-btn"
            onClick={handleAddDirective}
            className="inline-flex items-center gap-1 px-3 h-8 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors cursor-pointer"
          >
            <Plus className="size-3.5" />
            <span>Add</span>
          </button>
        </div>

        {customCraftDirectives.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {customCraftDirectives.map((dir, idx) => (
              <span
                key={`${dir}-${idx}`}
                data-slot="l6-directive-item"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-border/80 bg-muted/40 text-xs text-foreground"
              >
                <span>{dir}</span>
                <button
                  type="button"
                  data-slot="l6-remove-directive-btn"
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
    </div>
  )
}
