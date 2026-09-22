import { useState } from "react"
import { useComposer } from "../../hooks/useComposer"
import type { TargetFramework, CssEngine } from "../../lib/composer/composer-types"
import { Layers, Monitor, Paintbrush, Plus, X } from "lucide-react"

export function Layer3Constraints() {
  const { config, updateLayer } = useComposer()
  const {
    targetFramework,
    cssEngine,
    viewport,
    strictHardRules,
  } = config.layer3AuthoritativeConstraints

  const [newRule, setNewRule] = useState("")

  const handleFrameworkChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateLayer("layer3AuthoritativeConstraints", {
      targetFramework: e.target.value as TargetFramework,
    })
  }

  const handleCssEngineChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateLayer("layer3AuthoritativeConstraints", {
      cssEngine: e.target.value as CssEngine,
    })
  }

  const handleViewportChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateLayer("layer3AuthoritativeConstraints", {
      viewport: e.target.value as "responsive" | "desktop-only" | "mobile-only",
    })
  }

  const handleAddRule = () => {
    const trimmed = newRule.trim()
    if (!trimmed) return
    if (strictHardRules.includes(trimmed)) {
      setNewRule("")
      return
    }
    updateLayer("layer3AuthoritativeConstraints", {
      strictHardRules: [...strictHardRules, trimmed],
    })
    setNewRule("")
  }

  const handleRemoveRule = (indexToRemove: number) => {
    updateLayer("layer3AuthoritativeConstraints", {
      strictHardRules: strictHardRules.filter((_, idx) => idx !== indexToRemove),
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleAddRule()
    }
  }

  return (
    <div data-slot="layer3-constraints-panel" className="space-y-4 py-2">
      {/* Framework & CSS Selectors Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Framework Selection */}
        <div className="space-y-1.5">
          <label
            htmlFor="framework-select"
            className="flex items-center gap-1.5 text-xs font-medium text-foreground"
          >
            <Layers className="size-3.5 text-primary" />
            <span>Framework</span>
          </label>
          <select
            id="framework-select"
            data-slot="l3-framework-select"
            value={targetFramework}
            onChange={handleFrameworkChange}
            className="w-full h-8 px-2.5 rounded-lg border border-border/70 bg-input/20 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
          >
            <option value="react">React 19</option>
            <option value="nextjs">Next.js (App Router)</option>
            <option value="vite">Vite + React</option>
            <option value="html-vanilla">HTML Vanilla</option>
            <option value="vue">Vue 3</option>
            <option value="svelte">Svelte 5</option>
          </select>
        </div>

        {/* CSS Engine Selection */}
        <div className="space-y-1.5">
          <label
            htmlFor="css-engine-select"
            className="flex items-center gap-1.5 text-xs font-medium text-foreground"
          >
            <Paintbrush className="size-3.5 text-primary" />
            <span>CSS Engine</span>
          </label>
          <select
            id="css-engine-select"
            data-slot="l3-css-engine-select"
            value={cssEngine}
            onChange={handleCssEngineChange}
            className="w-full h-8 px-2.5 rounded-lg border border-border/70 bg-input/20 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
          >
            <option value="tailwind-v4">Tailwind CSS v4</option>
            <option value="tailwind-v3">Tailwind CSS v3</option>
            <option value="css-modules">CSS Modules</option>
            <option value="vanilla-css">Vanilla CSS</option>
          </select>
        </div>

        {/* Viewport Selection */}
        <div className="space-y-1.5">
          <label
            htmlFor="viewport-select"
            className="flex items-center gap-1.5 text-xs font-medium text-foreground"
          >
            <Monitor className="size-3.5 text-primary" />
            <span>Viewport</span>
          </label>
          <select
            id="viewport-select"
            data-slot="l3-viewport-select"
            value={viewport}
            onChange={handleViewportChange}
            className="w-full h-8 px-2.5 rounded-lg border border-border/70 bg-input/20 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
          >
            <option value="responsive">Responsive (Mobile + Desktop)</option>
            <option value="desktop-only">Desktop Only (1280px+)</option>
            <option value="mobile-only">Mobile Only (390px)</option>
          </select>
        </div>
      </div>

      {/* Strict Hard Rules Section */}
      <div className="space-y-2 pt-1 border-t border-border/50">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-foreground">
            Strict Overriding Hard Rules
          </span>
          <span className="text-[11px] text-muted-foreground">
            Supersedes all agent assumptions
          </span>
        </div>

        {/* Input bar */}
        <div className="flex gap-2">
          <input
            data-slot="l3-hard-rule-input"
            type="text"
            placeholder="e.g. No external font imports, Zero animations..."
            value={newRule}
            onChange={(e) => setNewRule(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 h-8 px-3 rounded-lg border border-border/70 bg-input/20 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <button
            type="button"
            data-slot="l3-add-hard-rule-btn"
            onClick={handleAddRule}
            className="inline-flex items-center gap-1 px-3 h-8 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors cursor-pointer"
          >
            <Plus className="size-3.5" />
            <span>Add</span>
          </button>
        </div>

        {/* Hard rules chips list */}
        {strictHardRules.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {strictHardRules.map((rule, idx) => (
              <span
                key={`${rule}-${idx}`}
                data-slot="l3-hard-rule-item"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-border/80 bg-muted/40 text-xs text-foreground"
              >
                <span>{rule}</span>
                <button
                  type="button"
                  data-slot="l3-remove-hard-rule-btn"
                  onClick={() => handleRemoveRule(idx)}
                  className="text-muted-foreground hover:text-destructive cursor-pointer transition-colors p-0.5 rounded"
                  aria-label={`Remove rule: ${rule}`}
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
