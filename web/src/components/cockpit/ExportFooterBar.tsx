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
  const { config, compiledPrompt, getExportOutput, agentTarget } = useComposer()
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
        if (typeof URL !== "undefined" && typeof URL.createObjectURL === "function") {
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
          pkg.downloadableFiles.find((f) => f.filename === "CLAUDE.md")?.content ||
          compiledPrompt.fullPrompt
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
          pkg.downloadableFiles.find((f) => f.filename === ".cursorrules")?.content ||
          compiledPrompt.systemPromptBlock
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
        "p-3 border-t border-border/70 bg-card/60 backdrop-blur-md flex items-center justify-between gap-3 shrink-0 select-none",
        className
      )}
    >
      {/* Target Agent Indicator */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground min-w-0">
        <span className="size-2 rounded-full bg-primary/70 shrink-0" />
        <span className="truncate">
          Ready for{" "}
          <strong className="text-foreground capitalize">
            {agentTarget.replace("-", " ")}
          </strong>
        </span>
      </div>

      {/* Buttons */}
      <div className="flex items-center gap-2 shrink-0 relative" ref={menuRef}>
        {/* Download Dropdown Trigger */}
        <button
          type="button"
          data-slot="export-download-dropdown"
          onClick={() => setIsOpen((prev) => !prev)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/70 bg-input/20 hover:bg-input/40 text-xs font-medium text-foreground transition-all cursor-pointer shadow-xs"
          title="Download artifact files"
        >
          <DownloadIcon className="size-3.5 text-muted-foreground" />
          <span>Export</span>
          <ChevronDownIcon className={cn("size-3 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
        </button>

        {/* Dropdown Menu Popup */}
        {isOpen && (
          <div
            data-slot="export-download-menu"
            className="absolute bottom-full right-0 mb-2 w-72 rounded-xl border border-border/80 bg-popover/95 backdrop-blur-md p-1.5 shadow-xl z-50 flex flex-col gap-1 text-xs animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="px-2 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Download Artifacts
            </div>

            {downloadOptions.map((opt) => (
              <button
                key={opt.id}
                type="button"
                data-slot={opt.dataSlot}
                onClick={() => handleSelectOption(opt)}
                className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-muted/70 flex items-start gap-2.5 transition-colors cursor-pointer"
              >
                <FileCodeIcon className="size-4 text-primary shrink-0 mt-0.5" />
                <div className="flex flex-col min-w-0">
                  <span className="font-medium text-foreground font-mono text-xs">
                    {opt.label}
                  </span>
                  <span className="text-[11px] text-muted-foreground truncate">
                    {opt.description}
                  </span>
                </div>
              </button>
            ))}

            <div className="h-px bg-border/50 my-0.5" />

            <button
              type="button"
              data-slot="download-all-files"
              onClick={handleDownloadAll}
              className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-primary/15 text-primary flex items-center gap-2 transition-colors cursor-pointer font-medium"
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
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold shadow-xs transition-all cursor-pointer"
        >
          {isCopied ? (
            <>
              <CheckIcon className="size-3.5" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <CopyIcon className="size-3.5" />
              <span>Copy Prompt</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
