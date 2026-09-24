import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from "react"
import { cn } from "cn"
import { ScrollArea } from "../ui/scroll-area"
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
        if (
          typeof navigator !== "undefined" &&
          navigator.clipboard?.writeText
        ) {
          await navigator.clipboard.writeText(text)
          setToast({
            type: "success",
            message: `Copied ${label} to clipboard!`,
          })
          onCopy?.(text)
        } else {
          throw new Error("Clipboard API unavailable")
        }
      } catch {
        setToast({
          type: "error",
          message: `Failed to copy ${label} to clipboard`,
        })
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
        styledContent = (
          <span className="text-muted-foreground/60 italic">{line}</span>
        )
      } else if (
        trimmed.startsWith("<") &&
        (trimmed.endsWith(">") || trimmed.includes(">"))
      ) {
        // XML opening / closing / directives
        styledContent = (
          <span>
            {line
              .split(/(<\/?[a-zA-Z0-9_\-:]+(?:\s+[^>]+)?>)/g)
              .map((part, pIdx) => {
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
        styledContent = (
          <span className="font-semibold text-sky-400">{line}</span>
        )
      } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        styledContent = (
          <span>
            <span className="font-bold text-amber-400">
              {line.slice(0, line.indexOf("-") + 1 || line.indexOf("*") + 1)}
            </span>
            {line.slice(line.indexOf("-") + 1 || line.indexOf("*") + 1)}
          </span>
        )
      }

      return (
        <div key={idx} className="table-row leading-relaxed hover:bg-muted/10">
          <span className="table-cell w-8 pr-3 text-right font-mono text-[10px] text-muted-foreground/40 select-none">
            {idx + 1}
          </span>
          <span className="table-cell break-all select-text">
            {styledContent}
          </span>
        </div>
      )
    })
  }, [content])

  return (
    <div
      data-slot="prompt-output-viewer"
      className={cn(
        "relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border/60 bg-card/40 shadow-xs",
        className
      )}
    >
      {/* Header Bar */}
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border/50 bg-background/50 px-3 py-2 backdrop-blur-xs select-none">
        <div className="flex min-w-0 items-center gap-2">
          <FileCodeIcon className="size-3.5 shrink-0 text-primary" />
          <span className="truncate text-xs font-semibold text-foreground">
            Compiled Prompt
          </span>
          <span
            data-slot="prompt-metrics"
            className="shrink-0 rounded bg-muted/60 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
          >
            {lineCount} lines · {content.length.toLocaleString()} chars
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex shrink-0 items-center gap-1.5">
          {/* Wrap Toggle */}
          <button
            type="button"
            onClick={() => setWrapLines((prev) => !prev)}
            className={cn(
              "cursor-pointer rounded-md border border-border/40 p-1 text-xs transition-colors",
              wrapLines
                ? "border-primary/30 bg-primary/10 text-primary"
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
              className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-border/70 bg-input/20 px-2 py-1 text-xs font-medium text-foreground transition-all hover:bg-input/40"
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
            onClick={() =>
              copyToClipboard(
                content,
                format === "cursor" ? "System Rules" : "Prompt"
              )
            }
            className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-primary/40 bg-primary/15 px-2.5 py-1 text-xs font-semibold text-primary shadow-xs transition-all hover:bg-primary/25"
          >
            {toast?.type === "success" ? (
              <>
                <CheckIcon className="size-3 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <CopyIcon className="size-3" />
                <span>
                  {format === "cursor" ? "Copy Rules" : "Copy Prompt"}
                </span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Code Viewer Body */}
      <ScrollArea
        className="min-h-0 flex-1 bg-muted/5"
        orientation={wrapLines ? "vertical" : "both"}
        viewportClassName={cn(
          "p-3 font-mono text-[11px] text-foreground/90 select-text",
          wrapLines ? "break-words whitespace-pre-wrap" : "whitespace-pre"
        )}
      >
        <div className="table w-full font-mono">{renderedLines}</div>
      </ScrollArea>

      {/* Floating Toast Notification */}
      {toast && (
        <div
          data-slot="copy-toast"
          role="status"
          aria-live="polite"
          className={cn(
            "absolute right-3 bottom-3 z-30 inline-flex animate-in items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium shadow-lg backdrop-blur-md duration-200 fade-in slide-in-from-bottom-2",
            toast.type === "success"
              ? "border-emerald-500/40 bg-emerald-950/90 text-emerald-200"
              : "text-destructive-foreground border-destructive/40 bg-destructive/90"
          )}
        >
          {toast.type === "success" ? (
            <CheckIcon className="size-3.5 shrink-0 text-emerald-400" />
          ) : (
            <AlertCircleIcon className="text-destructive-foreground size-3.5 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  )
}
