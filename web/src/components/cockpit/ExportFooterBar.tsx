import { useState, useCallback, useRef, useEffect } from "react"
import { useComposer } from "../../hooks/useComposer"
import { claudeCodeExporter } from "../../lib/export/claude-code-exporter"
import { cursorExporter } from "../../lib/export/cursor-exporter"
import { cn } from "cn"
import {
  Download as DownloadIcon,
  Copy as CopyIcon,
  Check as CheckIcon,
  ChevronDown as ChevronDownIcon,
  FileCode as FileCodeIcon,
  Archive as ArchiveIcon,
} from "lucide-react"

export interface ExportFooterBarProps {
  readonly onCopy?: () => void
  readonly onDownload?: (filename: string) => void
  readonly className?: string
}

export interface ExportDownloadOption {
  readonly id: string
  readonly filename: string
  readonly label: string
  readonly description: string
  readonly mimeType: string
  readonly dataSlot: string
  readonly getContent: () => string
}

export function ExportFooterBar({
  onCopy,
  onDownload,
  className,
}: ExportFooterBarProps) {
  const { config, compiledPrompt, getExportOutput, agentTarget, activeTurn } =
    useComposer()
  const [isCopied, setIsCopied] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close dropdown on click outside
  useEffect(() => {
    if (!isOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isOpen])

  const handleCopy = useCallback(async () => {
    try {
      const exportPkg = getExportOutput()
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(exportPkg.primaryClipboardText)
      }
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
      onCopy?.()
    } catch (err) {
      console.warn("Failed to copy export prompt:", err)
    }
  }, [getExportOutput, onCopy])

  const downloadFile = useCallback(
    (filename: string, content: string, mimeType: string) => {
      try {
        const blob = new Blob([content], { type: mimeType })
        if (
          typeof URL !== "undefined" &&
          typeof URL.createObjectURL === "function"
        ) {
          const url = URL.createObjectURL(blob)
          const a = document.createElement("a")
          a.href = url
          a.download = filename
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          if (typeof URL.revokeObjectURL === "function") {
            URL.revokeObjectURL(url)
          }
        }
        onDownload?.(filename)
      } catch (err) {
        console.warn(`Failed to download ${filename}:`, err)
      }
    },
    [onDownload]
  )

  // Standard export files available
  const downloadOptions: ExportDownloadOption[] = [
    {
      id: "claude-md",
      filename: "CLAUDE.md",
      label: "CLAUDE.md",
      description: "Root instructions file for Claude Code CLI",
      mimeType: "text/markdown",
      dataSlot: "download-claude-md",
      getContent: () => {
        const pkg = claudeCodeExporter.formatExport(compiledPrompt, config)
        return (
          pkg.downloadableFiles.find((f) => f.filename === "CLAUDE.md")
            ?.content || compiledPrompt.fullPrompt
        )
      },
    },
    {
      id: "cursorrules",
      filename: ".cursorrules",
      label: ".cursorrules",
      description: "Legacy rule file for Cursor IDE",
      mimeType: "text/plain",
      dataSlot: "download-cursorrules",
      getContent: () => {
        const pkg = cursorExporter.formatExport(compiledPrompt, config)
        return (
          pkg.downloadableFiles.find((f) => f.filename === ".cursorrules")
            ?.content || compiledPrompt.systemPromptBlock
        )
      },
    },
    {
      id: "cursor-mdc",
      filename: ".cursor/rules/open-studio.mdc",
      label: ".cursor/rules/open-studio.mdc",
      description: "Modern modular rule file for Cursor 0.45+",
      mimeType: "text/markdown",
      dataSlot: "download-cursor-mdc",
      getContent: () => {
        const pkg = cursorExporter.formatExport(compiledPrompt, config)
        return (
          pkg.downloadableFiles.find(
            (f) => f.filename === ".cursor/rules/open-studio.mdc"
          )?.content || compiledPrompt.systemPromptBlock
        )
      },
    },
    {
      id: "prompt-xml",
      filename: "prompt.xml",
      label: "prompt.xml",
      description: "Unified XML system prompt containing all 9 layers",
      mimeType: "application/xml",
      dataSlot: "download-prompt-xml",
      getContent: () => compiledPrompt.fullPrompt,
    },
  ]

  const handleSelectOption = (opt: ExportDownloadOption) => {
    const content = opt.getContent()
    downloadFile(opt.filename, content, opt.mimeType)
    setIsOpen(false)
  }

  const handleDownloadAll = () => {
    downloadOptions.forEach((opt) => {
      const content = opt.getContent()
      downloadFile(opt.filename, content, opt.mimeType)
    })
    setIsOpen(false)
  }

  return (
    <div
      data-slot="export-footer-bar"
      className={cn(
        "flex shrink-0 items-center justify-between gap-3 border-t border-border/70 bg-card/60 p-3 backdrop-blur-md select-none",
        className
      )}
    >
      {/* Target Agent Indicator */}
      <div className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
        <span className="size-2 shrink-0 rounded-full bg-primary/70" />
        <span className="truncate">
          Ready for{" "}
          <strong className="text-foreground capitalize">
            {agentTarget.replace("-", " ")}
          </strong>
        </span>
      </div>

      {/* Buttons */}
      <div className="relative flex shrink-0 items-center gap-2" ref={menuRef}>
        {/* Download Dropdown Trigger */}
        <button
          type="button"
          data-slot="export-download-dropdown"
          onClick={() => setIsOpen((prev) => !prev)}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border/70 bg-input/20 px-3 py-1.5 text-xs font-medium text-foreground shadow-xs transition-all hover:bg-input/40"
          title="Download artifact files"
        >
          <DownloadIcon className="size-3.5 text-muted-foreground" />
          <span>Export</span>
          <ChevronDownIcon
            className={cn(
              "size-3 text-muted-foreground transition-transform",
              isOpen && "rotate-180"
            )}
          />
        </button>

        {/* Dropdown Menu Popup */}
        {isOpen && (
          <div
            data-slot="export-download-menu"
            className="absolute right-0 bottom-full z-50 mb-2 flex w-72 animate-in flex-col gap-1 rounded-xl border border-border/80 bg-popover/95 p-1.5 text-xs shadow-xl backdrop-blur-md duration-150 zoom-in-95 fade-in"
          >
            <div className="px-2 py-1 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
              Download Artifacts
            </div>

            {downloadOptions.map((opt) => (
              <button
                key={opt.id}
                type="button"
                data-slot={opt.dataSlot}
                onClick={() => handleSelectOption(opt)}
                className="flex w-full cursor-pointer items-start gap-2.5 rounded-lg px-2.5 py-1.5 text-left transition-colors hover:bg-muted/70"
              >
                <FileCodeIcon className="mt-0.5 size-4 shrink-0 text-primary" />
                <div className="flex min-w-0 flex-col">
                  <span className="font-mono text-xs font-medium text-foreground">
                    {opt.label}
                  </span>
                  <span className="truncate text-[11px] text-muted-foreground">
                    {opt.description}
                  </span>
                </div>
              </button>
            ))}

            <div className="my-0.5 h-px bg-border/50" />

            <button
              type="button"
              data-slot="download-all-files"
              onClick={handleDownloadAll}
              className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 text-left font-medium text-primary transition-colors hover:bg-primary/15"
            >
              <ArchiveIcon className="size-3.5 shrink-0" />
              <span>Download All (4 files)</span>
            </button>
          </div>
        )}

        {/* Primary Copy Button */}
        <button
          type="button"
          data-slot="export-copy-btn"
          onClick={handleCopy}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-xs transition-all hover:bg-primary/90"
        >
          {isCopied ? (
            <>
              <CheckIcon className="size-3.5" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <CopyIcon className="size-3.5" />
              <span>
                {activeTurn === "turn1_discovery"
                  ? "Copy Turn 1 Discovery Prompt"
                  : "Copy Turn 2 Execution Prompt"}
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
