import { useState, useEffect, useCallback, useMemo } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs"
import { ScrollArea } from "../ui/scroll-area"
import { Badge } from "../ui/badge"
import { Button } from "../ui/button"
import { ColorSwatchBar } from "../cockpit/ColorSwatchBar"
import { useCatalog } from "../../hooks/useCatalog"
import { useComposer } from "../../hooks/useComposer"
import type {
  DesignSystemBundle,
  DesignSystemCatalogEntry,
} from "../../lib/catalog/catalog-types"
import {
  Sparkles as SparklesIcon,
  Check as CheckIcon,
  Copy as CopyIcon,
  Code as CodeIcon,
  Type as TypeIcon,
  Layers as LayersIcon,
  Loader2 as Loader2Icon,
  Eye as EyeIcon,
  ExternalLink as ExternalLinkIcon,
} from "lucide-react"
import { buildPreviewHtml } from "../../lib/catalog/preview-utils"

export interface DesignSystemPreviewModalProps {
  readonly systemId?: string | null
  readonly open?: boolean
  readonly onOpenChange?: (open: boolean) => void
}

export function DesignSystemPreviewModal({
  systemId,
  open,
  onOpenChange,
}: DesignSystemPreviewModalProps) {
  const catalogContext = useCatalog()
  const composer = useComposer()

  const activeId = systemId ?? catalogContext.previewSystemId
  const isControlled = open !== undefined
  const isOpen = isControlled ? open : Boolean(activeId)

  const [bundle, setBundle] = useState<DesignSystemBundle | null>(null)
  const [isLoadingBundle, setIsLoadingBundle] = useState<boolean>(false)
  const [copiedTokens, setCopiedTokens] = useState<boolean>(false)
  const [copiedHtml, setCopiedHtml] = useState<boolean>(false)
  const [componentViewMode, setComponentViewMode] = useState<"preview" | "code">(
    "preview"
  )

  const activeSystem: DesignSystemCatalogEntry | null =
    catalogContext.catalog?.designSystems.find((ds) => ds.id === activeId) ??
    null

  const rawHtml = bundle?.componentsHtml
  const tokensCss = bundle?.tokensCss
  const previewHtml = useMemo(() => {
    if (!rawHtml) return ""
    return buildPreviewHtml(rawHtml, tokensCss)
  }, [rawHtml, tokensCss])

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        catalogContext.setPreviewSystemId(null)
      }
      onOpenChange?.(nextOpen)
    },
    [catalogContext, onOpenChange]
  )

  useEffect(() => {
    let isMounted = true
    if (isOpen && activeId && catalogContext.catalogService) {
      Promise.resolve().then(() => {
        if (isMounted) {
          setIsLoadingBundle(true)
        }
      })
      catalogContext.catalogService
        .fetchDesignSystemBundle(activeId)
        .then((data) => {
          if (isMounted) {
            setBundle(data)
            setIsLoadingBundle(false)
          }
        })
        .catch((err) => {
          console.warn("Failed to load design system bundle:", err)
          if (isMounted) {
            setBundle(null)
            setIsLoadingBundle(false)
          }
        })
    }

    return () => {
      isMounted = false
    }
  }, [isOpen, activeId, catalogContext.catalogService])

  const isSelected =
    Boolean(activeId) &&
    composer.config.layer5BrandContract.selectedSystemId === activeId

  const handleSelectSystem = async () => {
    if (activeId) {
      await composer.selectDesignSystem(activeId)
      handleOpenChange(false)
    }
  }

  const handleCopyTokens = async () => {
    const tokensText =
      bundle?.tokensCss ||
      activeSystem?.tokenSummary.previewDeclarations.join("\n") ||
      ""
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(tokensText)
      setCopiedTokens(true)
      setTimeout(() => setCopiedTokens(false), 2000)
    }
  }

  const handleCopyHtml = async () => {
    if (!bundle?.componentsHtml) return
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(bundle.componentsHtml)
      setCopiedHtml(true)
      setTimeout(() => setCopiedHtml(false), 2000)
    }
  }

  const handleOpenInNewTab = () => {
    if (!previewHtml || typeof window === "undefined") return
    if (
      typeof URL !== "undefined" &&
      URL.createObjectURL &&
      typeof Blob !== "undefined"
    ) {
      const blob = new Blob([previewHtml], { type: "text/html" })
      const url = URL.createObjectURL(blob)
      window.open(url, "_blank")
    } else {
      const win = window.open("", "_blank")
      win?.document.write(previewHtml)
      win?.document.close()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        data-slot="design-system-preview-modal"
        className="flex max-h-[90vh] max-w-4xl flex-col overflow-hidden border border-border bg-background/95 p-0 shadow-2xl backdrop-blur-md sm:max-w-4xl"
      >
        {/* Header */}
        <DialogHeader className="border-b border-border/60 p-6 pb-4">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div className="min-w-0 space-y-1.5">
              <div className="flex items-center gap-2.5">
                <DialogTitle className="truncate text-xl font-bold tracking-tight text-foreground">
                  {activeSystem?.name ?? "Design System Preview"}
                </DialogTitle>
                {activeSystem && (
                  <Badge variant="outline" className="px-2 py-0.5 text-xs">
                    {activeSystem.category}
                  </Badge>
                )}
                {isSelected && (
                  <Badge variant="default" className="gap-1 text-xs">
                    <CheckIcon className="size-3" />
                    Active Brand
                  </Badge>
                )}
              </div>
              <DialogDescription className="line-clamp-2 max-w-xl text-xs text-muted-foreground">
                {activeSystem?.description}
              </DialogDescription>
            </div>

            {/* Actions */}
            <div className="flex shrink-0 items-center gap-2">
              <Button
                type="button"
                data-slot="modal-select-system-button"
                variant={isSelected ? "outline" : "default"}
                size="sm"
                onClick={handleSelectSystem}
                className="h-8 cursor-pointer gap-1.5 text-xs font-medium"
              >
                {isSelected ? (
                  <>
                    <CheckIcon className="size-3.5" />
                    <span>Brand Active</span>
                  </>
                ) : (
                  <>
                    <SparklesIcon className="size-3.5" />
                    <span>Use System</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Color Swatch Bar in Header */}
          {activeSystem && (
            <div className="pt-3">
              <ColorSwatchBar
                swatches={activeSystem.swatches}
                showLabels
                size="sm"
              />
            </div>
          )}
        </DialogHeader>

        {/* Tabbed Content */}
        <ScrollArea className="min-h-0 flex-1" viewportClassName="p-6 pt-4">
          <Tabs defaultValue="tokens" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger
                value="tokens"
                data-slot="tab-trigger-tokens"
                className="cursor-pointer gap-1.5"
              >
                <CodeIcon className="size-3.5" />
                <span>Tokens CSS</span>
              </TabsTrigger>
              <TabsTrigger
                value="typography"
                data-slot="tab-trigger-typography"
                className="cursor-pointer gap-1.5"
              >
                <TypeIcon className="size-3.5" />
                <span>Typography</span>
              </TabsTrigger>
              <TabsTrigger
                value="components"
                data-slot="tab-trigger-components"
                className="cursor-pointer gap-1.5"
              >
                <LayersIcon className="size-3.5" />
                <span>Components HTML</span>
              </TabsTrigger>
            </TabsList>

            {/* Tokens Tab */}
            <TabsContent
              value="tokens"
              data-slot="tab-content-tokens"
              className="space-y-3"
            >
              <div className="flex items-center justify-between pb-1 text-xs text-muted-foreground">
                <div className="flex items-center gap-3">
                  <span>
                    Total Variables:{" "}
                    <strong className="font-mono text-foreground">
                      {activeSystem?.tokenSummary.totalCssVariables ?? 0}
                    </strong>
                  </span>
                  <span>•</span>
                  <span>
                    Condensed:{" "}
                    <strong className="font-mono text-foreground">
                      {activeSystem?.tokenSummary.condensedCssVariablesCount ??
                        0}
                    </strong>
                  </span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCopyTokens}
                  className="h-7 cursor-pointer gap-1.5 text-xs"
                >
                  {copiedTokens ? (
                    <>
                      <CheckIcon className="size-3 text-emerald-500" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <CopyIcon className="size-3" />
                      <span>Copy CSS</span>
                    </>
                  )}
                </Button>
              </div>

              {isLoadingBundle ? (
                <div className="flex items-center justify-center gap-2 p-12 text-xs text-muted-foreground">
                  <Loader2Icon className="size-4 animate-spin text-primary" />
                  <span>Loading design system tokens...</span>
                </div>
              ) : (
                <pre
                  data-slot="tokens-css-preview"
                  className="max-h-80 overflow-x-auto rounded-xl border border-border/70 bg-muted/40 p-4 font-mono text-xs leading-relaxed text-foreground/90 select-text"
                >
                  {bundle?.tokensCss ||
                    (activeSystem?.tokenSummary.previewDeclarations &&
                    activeSystem.tokenSummary.previewDeclarations.length > 0
                      ? `:root {\n  ${activeSystem.tokenSummary.previewDeclarations.join(";\n  ")};\n}`
                      : "/* No tokens.css found */")}
                </pre>
              )}
            </TabsContent>

            {/* Typography Tab */}
            <TabsContent
              value="typography"
              data-slot="tab-content-typography"
              className="space-y-4"
            >
              <div className="space-y-4 rounded-xl border border-border/60 bg-muted/20 p-4">
                <div className="space-y-1">
                  <div className="font-mono text-[11px] tracking-wider text-muted-foreground uppercase">
                    Display Heading
                  </div>
                  <div className="text-3xl font-extrabold tracking-tight text-foreground">
                    Designed for High Craft
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="font-mono text-[11px] tracking-wider text-muted-foreground uppercase">
                    Subheading (H2)
                  </div>
                  <div className="text-xl font-semibold tracking-tight text-foreground/90">
                    Deterministic 9-Layer Prompt Composition
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="font-mono text-[11px] tracking-wider text-muted-foreground uppercase">
                    Body Text
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Open Studio decouples prompt synthesis from agent execution,
                    eliminating spawn buffer limits and daemon crashes while
                    retaining pristine brand guidelines and CSS variables.
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="font-mono text-[11px] tracking-wider text-muted-foreground uppercase">
                    Monospace / Code
                  </div>
                  <code className="block rounded bg-muted px-2 py-1 font-mono text-xs text-foreground">
                    const activeSystem = &quot;{activeSystem?.id ?? "unknown"}
                    &quot;;
                  </code>
                </div>
              </div>
            </TabsContent>

            {/* Components HTML Tab */}
            <TabsContent
              value="components"
              data-slot="tab-content-components"
              className="space-y-3"
            >
              {isLoadingBundle ? (
                <div className="flex items-center justify-center gap-2 p-12 text-xs text-muted-foreground">
                  <Loader2Icon className="size-4 animate-spin text-primary" />
                  <span>Loading component UI preview...</span>
                </div>
              ) : bundle?.componentsHtml ? (
                <div className="space-y-3">
                  {/* Toolbar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-1 text-xs">
                    {/* View Mode Toggle */}
                    <div
                      data-slot="component-view-mode-toggle"
                      className="flex items-center gap-1 rounded-lg border border-border/60 bg-muted/40 p-1"
                    >
                      <Button
                        type="button"
                        variant={
                          componentViewMode === "preview" ? "secondary" : "ghost"
                        }
                        size="sm"
                        data-slot="btn-component-view-preview"
                        onClick={() => setComponentViewMode("preview")}
                        className="h-6.5 cursor-pointer gap-1.5 px-2.5 text-xs font-medium"
                      >
                        <EyeIcon className="size-3.5" />
                        <span>UI Preview</span>
                      </Button>
                      <Button
                        type="button"
                        variant={
                          componentViewMode === "code" ? "secondary" : "ghost"
                        }
                        size="sm"
                        data-slot="btn-component-view-code"
                        onClick={() => setComponentViewMode("code")}
                        className="h-6.5 cursor-pointer gap-1.5 px-2.5 text-xs font-medium"
                      >
                        <CodeIcon className="size-3.5" />
                        <span>HTML Code</span>
                      </Button>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        data-slot="btn-copy-html"
                        onClick={handleCopyHtml}
                        className="h-7 cursor-pointer gap-1.5 text-xs"
                      >
                        {copiedHtml ? (
                          <>
                            <CheckIcon className="size-3 text-emerald-500" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <CopyIcon className="size-3" />
                            <span>Copy HTML</span>
                          </>
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        data-slot="btn-open-new-tab"
                        onClick={handleOpenInNewTab}
                        title="Open preview in new tab"
                        className="h-7 cursor-pointer gap-1.5 text-xs"
                      >
                        <ExternalLinkIcon className="size-3.5" />
                        <span>Open in New Tab</span>
                      </Button>
                    </div>
                  </div>

                  {/* Viewport: Preview or Code */}
                  {componentViewMode === "preview" ? (
                    <div className="relative h-[480px] w-full overflow-hidden rounded-xl border border-border/70 bg-card shadow-inner">
                      <iframe
                        data-slot="components-html-iframe"
                        title={`${activeSystem?.name ?? "Component"} UI Preview`}
                        srcDoc={previewHtml}
                        sandbox="allow-scripts allow-same-origin"
                        className="h-full w-full border-0 bg-transparent"
                      >
                        {bundle.componentsHtml}
                      </iframe>
                    </div>
                  ) : (
                    <pre
                      data-slot="components-html-preview"
                      className="max-h-[480px] overflow-x-auto rounded-xl border border-border/70 bg-muted/40 p-4 font-mono text-xs leading-relaxed text-foreground/90 select-text"
                    >
                      {bundle.componentsHtml}
                    </pre>
                  )}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border/80 p-6 py-12 text-center text-xs text-muted-foreground">
                  No component HTML fixtures indexed for this design system.
                </div>
              )}
            </TabsContent>
          </Tabs>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
