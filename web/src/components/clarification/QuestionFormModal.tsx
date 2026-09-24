import { useState, useMemo, useCallback } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog"
import { Button } from "../ui/button"
import { Textarea } from "../ui/textarea"
import { Badge } from "../ui/badge"
import { ScrollArea } from "../ui/scroll-area"
import { QuestionFieldRenderer } from "./QuestionFieldRenderer"
import { questionFormParser } from "../../lib/clarification/question-form-parser"
import type {
  QuestionFormAST,
  ClarificationAnswerEntry,
} from "../../lib/clarification/question-form-types"
import { useComposer } from "../../hooks/useComposer"
import {
  HelpCircle,
  Code,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
} from "lucide-react"

export interface QuestionFormModalProps {
  readonly open?: boolean
  readonly onOpenChange?: (open: boolean) => void
  readonly initialRawText?: string
  readonly onAnswersSubmitted?: (
    answers: readonly ClarificationAnswerEntry[]
  ) => void
}

function getInitialAnswers(
  ast: QuestionFormAST | null,
  clarificationAnswers: readonly ClarificationAnswerEntry[]
): Record<string, string[]> {
  if (!ast) return {}

  const existingMap = new Map<string, readonly string[]>()
  for (const a of clarificationAnswers) {
    existingMap.set(a.questionId, a.selectedValues)
  }

  const initialAnswers: Record<string, string[]> = {}
  for (const q of ast.questions) {
    if (existingMap.has(q.id)) {
      initialAnswers[q.id] = [...(existingMap.get(q.id) ?? [])]
    } else if (q.options && q.options.length > 0) {
      const defaultCheckedOptions = q.options.filter((o) => o.defaultChecked)
      if (defaultCheckedOptions.length > 0) {
        if (q.type === "radio") {
          initialAnswers[q.id] = [defaultCheckedOptions[0].value]
        } else {
          initialAnswers[q.id] = defaultCheckedOptions.map((o) => o.value)
        }
      } else {
        initialAnswers[q.id] = []
      }
    } else {
      initialAnswers[q.id] = []
    }
  }

  return initialAnswers
}

export function QuestionFormModal({
  open = false,
  onOpenChange,
  initialRawText,
  onAnswersSubmitted,
}: QuestionFormModalProps) {
  const {
    rawAiResponse,
    setRawAiResponse,
    config,
    updateLayer,
    submitClarificationAnswers,
  } = useComposer()

  const [rawText, setRawText] = useState<string>(
    () => initialRawText ?? rawAiResponse ?? ""
  )
  const [prevInitialRawText, setPrevInitialRawText] = useState<
    string | undefined
  >(initialRawText)
  if (initialRawText !== prevInitialRawText) {
    setPrevInitialRawText(initialRawText)
    if (initialRawText !== undefined && initialRawText !== rawText) {
      setRawText(initialRawText)
    }
  }

  const [activeTab, setActiveTab] = useState<"form" | "raw">("form")
  const [validationError, setValidationError] = useState<string | null>(null)

  // Parse raw text to QuestionFormAST
  const parsedAst: QuestionFormAST | null = useMemo(() => {
    return questionFormParser.parseForm(rawText)
  }, [rawText])

  const clarificationAnswers =
    config.layer9BriefAndClarification.clarificationAnswers

  const [answers, setAnswers] = useState<Record<string, string[]>>(() =>
    getInitialAnswers(parsedAst, clarificationAnswers)
  )
  const [prevParsedAst, setPrevParsedAst] = useState<QuestionFormAST | null>(
    parsedAst
  )
  const [prevOpen, setPrevOpen] = useState(open)

  if (parsedAst !== prevParsedAst || (open && !prevOpen)) {
    setPrevParsedAst(parsedAst)
    setPrevOpen(open)
    setAnswers(getInitialAnswers(parsedAst, clarificationAnswers))
  } else if (open !== prevOpen) {
    setPrevOpen(open)
  }

  const handleFieldChange = useCallback(
    (questionId: string, values: string[]) => {
      setAnswers((prev) => ({
        ...prev,
        [questionId]: values,
      }))
      setValidationError(null)
    },
    []
  )

  const handleResetAnswers = () => {
    if (!parsedAst) return
    const resetMap: Record<string, string[]> = {}
    for (const q of parsedAst.questions) {
      resetMap[q.id] = []
    }
    setAnswers(resetMap)
    setValidationError(null)
  }

  // Validate required questions
  const isSubmitDisabled = useMemo(() => {
    if (!parsedAst || parsedAst.questions.length === 0) return true

    for (const q of parsedAst.questions) {
      if (q.required) {
        const val = answers[q.id]
        if (!val || val.length === 0) return true
        if ((q.type === "text" || q.type === "textarea") && !val[0]?.trim()) {
          return true
        }
      }
    }
    return false
  }, [parsedAst, answers])

  const handleSubmit = () => {
    if (!parsedAst) return

    // Final validation check
    for (const q of parsedAst.questions) {
      if (q.required) {
        const val = answers[q.id]
        if (
          !val ||
          val.length === 0 ||
          ((q.type === "text" || q.type === "textarea") && !val[0]?.trim())
        ) {
          setValidationError(`Question "${q.label}" is required.`)
          return
        }
      }
    }

    const entries: ClarificationAnswerEntry[] = parsedAst.questions.map(
      (q) => ({
        questionId: q.id,
        questionLabel: q.label,
        selectedValues: answers[q.id] ?? [],
      })
    )

    // Save answers into Layer 9 and advance roundtrip
    if (submitClarificationAnswers) {
      submitClarificationAnswers(entries)
    } else {
      updateLayer("layer9BriefAndClarification", {
        clarificationAnswers: entries,
      })
    }

    // Save raw response
    setRawAiResponse(rawText)

    // Notify callback
    onAnswersSubmitted?.(entries)

    // Close modal
    onOpenChange?.(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-slot="question-form-modal"
        className="flex max-h-[88vh] flex-col gap-0 overflow-hidden border-border/80 bg-card/95 p-0 shadow-2xl backdrop-blur-md sm:max-w-2xl"
      >
        {/* Header */}
        <DialogHeader className="flex flex-row items-center justify-between gap-4 border-b border-border/60 bg-muted/20 p-4">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <HelpCircle className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-sm font-semibold text-foreground">
                {parsedAst
                  ? parsedAst.title
                  : "Interactive AI Clarification Form"}
              </DialogTitle>
              <DialogDescription className="mt-0.5 text-xs text-muted-foreground">
                {parsedAst?.description ??
                  "Paste an AI response containing <question-form> XML to answer interactively."}
              </DialogDescription>
            </div>
          </div>

          {/* Toggle between Form View and Raw Input */}
          <div className="flex shrink-0 items-center gap-1 rounded-lg border border-border/50 bg-input/40 p-1">
            <button
              type="button"
              data-slot="view-tab-form"
              onClick={() => setActiveTab("form")}
              className={`cursor-pointer rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                activeTab === "form"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Sparkles className="size-3" />
                Form View
              </span>
            </button>
            <button
              type="button"
              data-slot="view-tab-raw"
              onClick={() => setActiveTab("raw")}
              className={`cursor-pointer rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                activeTab === "raw"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Code className="size-3" />
                Raw XML
              </span>
            </button>
          </div>
        </DialogHeader>

        {/* Body */}
        <ScrollArea
          className="min-h-0 flex-1"
          viewportClassName="p-4 space-y-4"
        >
          {activeTab === "raw" ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  Paste raw model response containing &lt;question-form&gt; XML:
                </span>
                {parsedAst ? (
                  <Badge
                    variant="outline"
                    className="border-emerald-500/30 text-[10px] text-emerald-500"
                  >
                    Valid XML AST ({parsedAst.questions.length} questions)
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="border-amber-500/30 text-[10px] text-amber-500"
                  >
                    No valid XML detected
                  </Badge>
                )}
              </div>
              <Textarea
                data-slot="raw-ai-textarea"
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="<question-form id='brief-qa' title='Clarifications'>&#10;  <question id='q1' type='radio'>...&#10;</question-form>"
                className="min-h-[16rem] bg-background/50 font-mono text-xs leading-relaxed"
              />
            </div>
          ) : (
            <>
              {parsedAst ? (
                <div className="space-y-3.5">
                  {parsedAst.questions.map((q) => (
                    <QuestionFieldRenderer
                      key={q.id}
                      question={q}
                      value={answers[q.id] ?? []}
                      onChange={(vals) => handleFieldChange(q.id, vals)}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center space-y-3 rounded-xl border border-dashed border-border/70 bg-card/20 p-8 text-center">
                  <div className="rounded-full bg-amber-500/10 p-3 text-amber-500">
                    <AlertTriangle className="size-6" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-foreground">
                      No valid &lt;question-form&gt; XML detected
                    </h4>
                    <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                      Paste the raw text response from Claude, Cursor, or
                      ChatGPT containing a &lt;question-form&gt; XML tag.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveTab("raw")}
                    className="mt-2 text-xs"
                  >
                    Open Raw XML Editor
                  </Button>
                </div>
              )}
            </>
          )}

          {validationError && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-2.5 text-xs text-destructive">
              <AlertTriangle className="size-4 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <DialogFooter className="flex items-center justify-between gap-2 border-t border-border/60 bg-muted/20 p-3.5 sm:justify-between">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleResetAnswers}
              disabled={!parsedAst || Object.keys(answers).length === 0}
              className="cursor-pointer gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="size-3.5" />
              Reset
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange?.(false)}
              className="cursor-pointer text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              data-slot="submit-answers-btn"
              size="sm"
              disabled={isSubmitDisabled}
              onClick={handleSubmit}
              className="cursor-pointer gap-1.5 bg-primary text-xs text-primary-foreground shadow-xs hover:bg-primary/90 disabled:cursor-not-allowed"
            >
              <CheckCircle2 className="size-3.5" />
              Submit Answers to Layer 9
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
