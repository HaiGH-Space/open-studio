import { useState } from "react"
import { useComposer } from "../../hooks/useComposer"
import type {
  TargetFramework,
  CssEngine,
} from "../../lib/composer/composer-types"
import { Layers, Monitor, Paintbrush, Plus, X } from "lucide-react"
import { Label } from "../ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select"

const FRAMEWORK_ITEMS = [
  { value: "react", label: "React 19" },
  { value: "nextjs", label: "Next.js (App Router)" },
  { value: "vite", label: "Vite + React" },
  { value: "html-vanilla", label: "HTML Vanilla" },
  { value: "vue", label: "Vue 3" },
  { value: "svelte", label: "Svelte 5" },
]

const CSS_ENGINE_ITEMS = [
  { value: "tailwind-v4", label: "Tailwind CSS v4" },
  { value: "tailwind-v3", label: "Tailwind CSS v3" },
  { value: "css-modules", label: "CSS Modules" },
  { value: "vanilla-css", label: "Vanilla CSS" },
]

const VIEWPORT_ITEMS = [
  { value: "responsive", label: "Responsive (Mobile + Desktop)" },
  { value: "desktop-only", label: "Desktop Only (1280px+)" },
  { value: "mobile-only", label: "Mobile Only (390px)" },
]

export function Layer3Constraints() {
  const { config, updateLayer } = useComposer()
  const { targetFramework, cssEngine, viewport, strictHardRules } =
    config.layer3AuthoritativeConstraints

  const [newRule, setNewRule] = useState("")

  const handleFrameworkChange = (val: string | null) => {
    if (val) {
      updateLayer("layer3AuthoritativeConstraints", {
        targetFramework: val as TargetFramework,
      })
    }
  }

  const handleCssEngineChange = (val: string | null) => {
    if (val) {
      updateLayer("layer3AuthoritativeConstraints", {
        cssEngine: val as CssEngine,
      })
    }
  }

  const handleViewportChange = (val: string | null) => {
    if (val) {
      updateLayer("layer3AuthoritativeConstraints", {
        viewport: val as "responsive" | "desktop-only" | "mobile-only",
      })
    }
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
      strictHardRules: strictHardRules.filter(
        (_, idx) => idx !== indexToRemove
      ),
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
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {/* Framework Selection */}
        <div className="relative space-y-1.5">
          <Label
            htmlFor="framework-select"
            className="flex cursor-pointer items-center gap-1.5 text-xs font-medium text-foreground"
          >
            <Layers className="size-3.5 text-primary" />
            <span>Framework</span>
          </Label>
          <select
            id="framework-select-native"
            data-slot="l3-framework-select"
            tabIndex={-1}
            aria-hidden="true"
            value={targetFramework}
            onChange={(e) => handleFrameworkChange(e.target.value)}
            className="sr-only"
          >
            {FRAMEWORK_ITEMS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          <Select
            items={FRAMEWORK_ITEMS}
            value={targetFramework}
            onValueChange={handleFrameworkChange}
          >
            <SelectTrigger
              id="framework-select"
              data-slot="l3-framework-trigger"
              size="sm"
              className="w-full cursor-pointer rounded-lg border-border/70 bg-input/20 text-xs"
            >
              <SelectValue placeholder="Select framework" />
            </SelectTrigger>
            <SelectContent>
              {FRAMEWORK_ITEMS.map((item) => (
                <SelectItem
                  key={item.value}
                  value={item.value}
                  className="py-1.5 text-xs"
                >
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* CSS Engine Selection */}
        <div className="relative space-y-1.5">
          <Label
            htmlFor="css-engine-select"
            className="flex cursor-pointer items-center gap-1.5 text-xs font-medium text-foreground"
          >
            <Paintbrush className="size-3.5 text-primary" />
            <span>CSS Engine</span>
          </Label>
          <select
            id="css-engine-select-native"
            data-slot="l3-css-engine-select"
            tabIndex={-1}
            aria-hidden="true"
            value={cssEngine}
            onChange={(e) => handleCssEngineChange(e.target.value)}
            className="sr-only"
          >
            {CSS_ENGINE_ITEMS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          <Select
            items={CSS_ENGINE_ITEMS}
            value={cssEngine}
            onValueChange={handleCssEngineChange}
          >
            <SelectTrigger
              id="css-engine-select"
              data-slot="l3-css-engine-trigger"
              size="sm"
              className="w-full cursor-pointer rounded-lg border-border/70 bg-input/20 text-xs"
            >
              <SelectValue placeholder="Select CSS engine" />
            </SelectTrigger>
            <SelectContent>
              {CSS_ENGINE_ITEMS.map((item) => (
                <SelectItem
                  key={item.value}
                  value={item.value}
                  className="py-1.5 text-xs"
                >
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Viewport Selection */}
        <div className="relative space-y-1.5">
          <Label
            htmlFor="viewport-select"
            className="flex cursor-pointer items-center gap-1.5 text-xs font-medium text-foreground"
          >
            <Monitor className="size-3.5 text-primary" />
            <span>Viewport</span>
          </Label>
          <select
            id="viewport-select-native"
            data-slot="l3-viewport-select"
            tabIndex={-1}
            aria-hidden="true"
            value={viewport}
            onChange={(e) => handleViewportChange(e.target.value)}
            className="sr-only"
          >
            {VIEWPORT_ITEMS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          <Select
            items={VIEWPORT_ITEMS}
            value={viewport}
            onValueChange={handleViewportChange}
          >
            <SelectTrigger
              id="viewport-select"
              data-slot="l3-viewport-trigger"
              size="sm"
              className="w-full cursor-pointer rounded-lg border-border/70 bg-input/20 text-xs"
            >
              <SelectValue placeholder="Select viewport" />
            </SelectTrigger>
            <SelectContent>
              {VIEWPORT_ITEMS.map((item) => (
                <SelectItem
                  key={item.value}
                  value={item.value}
                  className="py-1.5 text-xs"
                >
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Strict Hard Rules Section */}
      <div className="space-y-2 border-t border-border/50 pt-1">
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
            className="h-8 flex-1 rounded-lg border border-border/70 bg-input/20 px-3 text-xs text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-primary focus:outline-none"
          />
          <button
            type="button"
            data-slot="l3-add-hard-rule-btn"
            onClick={handleAddRule}
            className="inline-flex h-8 cursor-pointer items-center gap-1 rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
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
                className="inline-flex items-center gap-1 rounded-md border border-border/80 bg-muted/40 px-2.5 py-1 text-xs text-foreground"
              >
                <span>{rule}</span>
                <button
                  type="button"
                  data-slot="l3-remove-hard-rule-btn"
                  onClick={() => handleRemoveRule(idx)}
                  className="cursor-pointer rounded p-0.5 text-muted-foreground transition-colors hover:text-destructive"
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
