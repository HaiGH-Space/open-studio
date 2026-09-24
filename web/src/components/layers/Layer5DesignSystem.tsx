import { useComposer } from "../../hooks/useComposer"
import { useCatalog } from "../../hooks/useCatalog"
import { Switch } from "../ui/switch"
import { Palette, FileCode2, BookOpen, Layers, CheckSquare } from "lucide-react"

export function Layer5DesignSystem() {
  const { config, updateLayer } = useComposer()
  const { catalog } = useCatalog()

  const {
    selectedSystemId,
    tokenMode,
    includeTokensCss,
    includeDesignMd,
    includeUsage,
    includeComponentsHtml,
  } = config.layer5BrandContract

  const activeSystem = catalog?.designSystems.find(
    (sys) => sys.id === selectedSystemId
  )

  const displayName = activeSystem
    ? activeSystem.name
    : selectedSystemId
      ? selectedSystemId
      : "No system selected"

  const handleToggleTokenMode = (checked: boolean) => {
    updateLayer("layer5BrandContract", {
      tokenMode: checked ? "condensed" : "full",
    })
  }

  return (
    <div data-slot="layer5-design-system-panel" className="space-y-4 py-2">
      {/* Active System Banner */}
      <div className="flex items-center justify-between gap-4 rounded-xl border border-border/60 bg-muted/20 p-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Palette className="size-4 text-primary" />
            <span>Active Design System:</span>
            <span
              data-slot="l5-active-system"
              className="font-semibold text-primary"
            >
              {displayName}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {selectedSystemId
              ? `${activeSystem?.category ?? "Curated System"} — Select a different system in the Left Navigator.`
              : "Choose from 153 curated brand packages in the Left Navigator."}
          </p>
        </div>
      </div>

      {/* Token Mode Switch (Condensed vs Full) */}
      <div className="flex items-center justify-between gap-4 rounded-xl border border-border/60 bg-muted/20 p-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <FileCode2 className="size-4 text-primary" />
            <span>
              Token Mode:{" "}
              <span className="font-mono text-xs text-primary capitalize">
                {tokenMode}
              </span>
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {tokenMode === "condensed"
              ? "Condensed :root mode strips internal utility tokens, saving ~65% tokens while preserving colors, radii, and fonts."
              : "Full mode includes all raw CSS variables declarations directly in the prompt."}
          </p>
        </div>
        <Switch
          data-slot="l5-token-mode-switch"
          checked={tokenMode === "condensed"}
          onCheckedChange={handleToggleTokenMode}
          aria-label="Toggle token mode"
        />
      </div>

      {/* Asset Inclusion Checkboxes */}
      <div className="space-y-2 border-t border-border/50 pt-1">
        <div className="text-xs font-medium text-foreground">
          Include Brand Documentation &amp; Blueprints
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {/* tokens.css */}
          <div className="flex items-center justify-between rounded-lg border border-border/60 bg-background/50 p-2.5">
            <div className="flex items-center gap-2 text-xs text-foreground">
              <FileCode2 className="size-3.5 text-primary" />
              <span>tokens.css</span>
            </div>
            <Switch
              data-slot="l5-include-tokens-css"
              size="sm"
              checked={includeTokensCss}
              onCheckedChange={(checked) =>
                updateLayer("layer5BrandContract", {
                  includeTokensCss: checked,
                })
              }
              aria-label="Include tokens.css"
            />
          </div>

          {/* DESIGN.md */}
          <div className="flex items-center justify-between rounded-lg border border-border/60 bg-background/50 p-2.5">
            <div className="flex items-center gap-2 text-xs text-foreground">
              <BookOpen className="size-3.5 text-primary" />
              <span>DESIGN.md</span>
            </div>
            <Switch
              data-slot="l5-include-design-md"
              size="sm"
              checked={includeDesignMd}
              onCheckedChange={(checked) =>
                updateLayer("layer5BrandContract", { includeDesignMd: checked })
              }
              aria-label="Include DESIGN.md"
            />
          </div>

          {/* USAGE.md */}
          <div className="flex items-center justify-between rounded-lg border border-border/60 bg-background/50 p-2.5">
            <div className="flex items-center gap-2 text-xs text-foreground">
              <CheckSquare className="size-3.5 text-primary" />
              <span>USAGE.md</span>
            </div>
            <Switch
              data-slot="l5-include-usage"
              size="sm"
              checked={includeUsage}
              onCheckedChange={(checked) =>
                updateLayer("layer5BrandContract", { includeUsage: checked })
              }
              aria-label="Include USAGE.md"
            />
          </div>

          {/* components.html */}
          <div className="flex items-center justify-between rounded-lg border border-border/60 bg-background/50 p-2.5">
            <div className="flex items-center gap-2 text-xs text-foreground">
              <Layers className="size-3.5 text-primary" />
              <span>components.html</span>
            </div>
            <Switch
              data-slot="l5-include-components-html"
              size="sm"
              checked={includeComponentsHtml}
              onCheckedChange={(checked) =>
                updateLayer("layer5BrandContract", {
                  includeComponentsHtml: checked,
                })
              }
              aria-label="Include components.html"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
