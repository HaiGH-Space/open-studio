import { useState, useEffect, useCallback, useMemo, type ReactNode } from "react"
import { cn } from "cn"
import {
  Copy as CopyIcon,
  Check as CheckIcon,
  AlertCircle as AlertCircleIcon,
  FileCode as FileCodeIcon,
  WrapText as WrapTextIcon,
} from "lucide-react"

export interface PromptOutputViewerProps {
  readonly content: string
  readonly secondaryContent?: string
  readonly format?: string
  readonly onCopy?: (text: string) => void
  readonly className?: string
}

export function PromptOutputViewer({
  content,
  secondaryContent,
  format = "claude-code",
  onCopy,
  className,
}: PromptOutputViewerProps) {
  const [toast, setToast] = useState<{
    type: "success" | "error"
    message: string
  } | null>(null)
  const [wrapLines, setWrapLines] = useState(true)

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 2000)
    return () => clearTimeout(timer)
  }, [toast])

  const copyToClipboard = useCallback(
    async (text: string, label = "Prompt") => {
      try {
        if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(text)
          setToast({ type: "success", message: `Copied ${label} to clipboard!` })
          onCopy?.(text)
        } else {
          throw new Error("Clipboard API unavailable")
        }
      } catch {
        setToast({ type: "error", message: `Failed to copy ${label} to clipboard` })
      }
    },
    [onCopy]
  )

  const lineCount = useMemo(() => {
    if (!content) return 0
    return content.split("\n").length
  }, [content])

  // Simple tokenized syntax rendering for XML & Markdown
  const renderedLines = useMemo(() => {
    if (!content) return null
    return content.split("\n").map((line, idx) => {
      const trimmed = line.trim()
      let styledContent: ReactNode = line

      if (trimmed.startsWith("<!--") && trimmed.endsWith("-->")) {
        styledContent = <span className="text-muted-foreground/60 italic">{line}</span>
      } else if (trimmed.startsWith("<") && (trimmed.endsWith(">") || trimmed.includes(">"))) {
        // XML opening / closing / directives
        styledContent = (
          <span>
            {line.split(/(<\/?[a-zA-Z0-9_\-:]+(?:\s+[^>]+)?>)/g).map((part, pIdx) => {
              if (part.startsWith("<") && part.endsWith(">")) {
                const isClosing = part.startsWith("</")
                return (
                  <span
                    key={pIdx}
                    className={cn(
                      "font-semibold",
                      isClosing ? "text-indigo-400/80" : "text-primary"
                    )}
                  >
                    {part}
                  </span>
                )
              }
              return <span key={pIdx}>{part}</span>
            })}
          </span>
        )
      } else if (trimmed.startsWith("#")) {
        styledContent = <span className="text-sky-400 font-semibold">{line}</span>
      } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        styledContent = (
          <span>
            <span className="text-amber-400 font-bold">{line.slice(0, line.indexOf("-") + 1 || line.indexOf("*") + 1)}</span>
            {line.slice((line.indexOf("-") + 1 || line.indexOf("*") + 1))}
          </span>
        )
      }

      return (
        <div key={idx} className="table-row leading-relaxed hover:bg-muted/10">
          <span className="table-cell pr-3 select-none text-right font-mono text-[10px] text-muted-foreground/40 w-8">
            {idx + 1}
          </span>
          <span className="table-cell select-text break-all">{styledContent}</span>
        </div>
      )
    })
  }, [content])

  return (
    <div
      data-slot="prompt-output-viewer"
      className={cn(
        "relative flex flex-col flex-1 min-h-0 bg-card/40 border border-border/60 rounded-xl overflow-hidden shadow-xs",
        className
      )}
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/50 bg-background/50 backdrop-blur-xs select-none shrink-0 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <FileCodeIcon className="size-3.5 text-primary shrink-0" />
          <span className="font-semibold text-xs text-foreground truncate">
            Compiled Prompt
          </span>
          <span
            data-slot="prompt-metrics"
            className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-muted/60 text-muted-foreground shrink-0"
          >
            {lineCount} lines · {content.length.toLocaleString()} chars
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Wrap Toggle */}
          <button
            type="button"
            onClick={() => setWrapLines((prev) => !prev)}
            className={cn(
              "p-1 rounded-md text-xs border border-border/40 transition-colors cursor-pointer",
              wrapLines
                ? "bg-primary/10 text-primary border-primary/30"
                : "text-muted-foreground hover:bg-muted/40"
            )}
            title={wrapLines ? "Disable word wrap" : "Enable word wrap"}
          >
            <WrapTextIcon className="size-3.5" />
          </button>

          {/* Secondary Copy Button (e.g. Cursor User Task) */}
          {secondaryContent && secondaryContent.trim().length > 0 && (
            <button
              type="button"
              data-slot="copy-secondary-btn"
              onClick={() => copyToClipboard(secondaryContent, "User Task")}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-border/70 bg-input/20 hover:bg-input/40 text-xs font-medium text-foreground transition-all cursor-pointer"
              title="Copy User Task for dual clipboard"
            >
              <CopyIcon className="size-3 text-muted-foreground" />
              <span>Copy User Task</span>
            </button>
          )}

          {/* Primary Copy Button */}
          <button
            type="button"
            data-slot="copy-prompt-btn"
            onClick={() => copyToClipboard(content, format === "cursor" ? "System Rules" : "Prompt")}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-primary/40 bg-primary/15 hover:bg-primary/25 text-xs font-semibold text-primary transition-all cursor-pointer shadow-xs"
          >
            {toast?.type === "success" ? (
              <>
                <CheckIcon className="size-3 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <CopyIcon className="size-3" />
                <span>{format === "cursor" ? "Copy Rules" : "Copy Prompt"}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Code Viewer Body */}
      <div
        className={cn(
          "flex-1 overflow-auto p-3 font-mono text-[11px] text-foreground/90 select-text bg-muted/5",
          wrapLines ? "whitespace-pre-wrap break-words" : "whitespace-pre overflow-x-auto"
        )}
      >
        <div className="table w-full font-mono">{renderedLines}</div>
      </div>

      {/* Floating Toast Notification */}
      {toast && (
        <div
          data-slot="copy-toast"
          role="status"
          aria-live="polite"
          className={cn(
            "absolute bottom-3 right-3 z-30 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border shadow-lg text-xs font-medium backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-200",
            toast.type === "success"
              ? "bg-emerald-950/90 text-emerald-200 border-emerald-500/40"
              : "bg-destructive/90 text-destructive-foreground border-destructive/40"
          )}
        >
          {toast.type === "success" ? (
            <CheckIcon className="size-3.5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircleIcon className="size-3.5 text-destructive-foreground shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  )
}
