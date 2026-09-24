import { useState, useCallback } from "react"
import { useComposer } from "../../hooks/useComposer"
import { QuestionFieldRenderer } from "./QuestionFieldRenderer"
import { Textarea } from "../ui/textarea"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import type {
  ClarificationAnswerEntry,
  QuestionNode,
} from "../../lib/clarification/question-form-types"
import { cn } from "cn"
import {
  Sparkles as SparklesIcon,
  AlertTriangle as AlertTriangleIcon,
  CheckCircle2 as CheckCircleIcon,
  FileQuestion as QuestionIcon,
  ArrowRight as ArrowRightIcon,
  RotateCcw as ResetIcon,
  Plus as PlusIcon,
  Trash2 as TrashIcon,
  Zap as ZapIcon,
  Pencil as EditIcon,
} from "lucide-react"

export interface ClarificationZoneProps {
  readonly className?: string
}

const SAMPLE_AI_RESPONSE = `Here are the design clarification questions based on your requirements:

<question-form id="onboarding-discovery" title="Product Discovery Questions">
  <field name="target_audience" type="select" label="What primary audience should this UI be tailored for?" options="B2B Enterprise, Tech-savvy developers, General consumer, Creator economy" default="Tech-savvy developers" />
  <field name="interaction_density" type="select" label="Preferred layout density & spacing" options="Compact (Linear style) | Comfortable (Stripe style) | Spacious (Apple style)" default="Compact (Linear style)" />
  <field name="slide_count" type="text" label="Estimated screen or card modules count" placeholder="e.g. 3 main dashboards" />
  <field name="special_constraints" type="textarea" label="Any special technical or branding constraints?" placeholder="Describe any micro-interactions or external APIs..." />
</question-form>`

export function ClarificationZone({ className }: ClarificationZoneProps) {
  const {
    roundtripStep,
    setRoundtripStep,
    parsedFormAst,
    isDisobedientAi,
    parseError,
    parseAndIngestAiResponse,
    enterCustomClarifications,
    useSkillDefaultsAndProceed,
    skipClarification,
    submitClarificationAnswers,
  } = useComposer()

  const [pasteInput, setPasteInput] = useState<string>("")
  const [answersMap, setAnswersMap] = useState<Record<string, string[]>>({})
  const [showManualEditor, setShowManualEditor] = useState<boolean>(false)
  const [manualRows, setManualRows] = useState<
    Array<{ key: string; value: string }>
  >([
    { key: "Target Audience", value: "Enterprise power users" },
    { key: "Visual Density", value: "Compact high-density dashboard" },
  ])
  const [manualFreeForm, setManualFreeForm] = useState<string>("")

  // Handle parsing action
  const handleParse = useCallback(() => {
    parseAndIngestAiResponse(pasteInput)
  }, [pasteInput, parseAndIngestAiResponse])

  // Handle field value updates in active clarification form
  const handleFieldChange = useCallback(
    (questionId: string, values: string[]) => {
      setAnswersMap((prev) => ({
        ...prev,
        [questionId]: values,
      }))
    },
    []
  )

  // Submit questions in CLARIFICATION_ACTIVE
  const handleSubmitQuestions = useCallback(() => {
    if (!parsedFormAst) return

    const entries: ClarificationAnswerEntry[] = parsedFormAst.questions.map(
      (q: QuestionNode) => {
        const val = answersMap[q.id]
        let selectedValues: string[] = []
        if (val && val.length > 0) {
          selectedValues = val
        } else if (q.options) {
          const def = q.options.find((o) => o.defaultChecked)
          if (def) selectedValues = [def.value]
        }

        return {
          questionId: q.id,
          questionLabel: q.label,
          selectedValues,
        }
      }
    )

    submitClarificationAnswers(entries)
  }, [parsedFormAst, answersMap, submitClarificationAnswers])

  // Submit manual clarifications
  const handleApplyManualClarifications = useCallback(() => {
    const entries: ClarificationAnswerEntry[] = []

    for (const row of manualRows) {
      if (row.key.trim() && row.value.trim()) {
        entries.push({
          questionId: `manual-${row.key.toLowerCase().replace(/\s+/g, "-")}`,
          questionLabel: row.key.trim(),
          selectedValues: [row.value.trim()],
        })
      }
    }

    if (manualFreeForm.trim()) {
      entries.push({
        questionId: "manual-notes",
        questionLabel: "Custom Clarifications",
        selectedValues: [manualFreeForm.trim()],
      })
    }

    if (entries.length === 0) {
      entries.push({
        questionId: "manual-default",
        questionLabel: "User Specifications",
        selectedValues: ["Proceed with specified requirements"],
      })
    }

    enterCustomClarifications(entries)
  }, [manualRows, manualFreeForm, enterCustomClarifications])

  // Render based on active roundtrip step
  if (
    roundtripStep === "STEP_1_CONFIGURING" ||
    roundtripStep === "STEP_1_PROMPT_READY"
  ) {
    return (
      <div
        data-slot="clarification-zone"
        className={cn(
          "flex flex-col gap-3 rounded-xl border border-border/60 bg-card/40 p-4 shadow-xs sm:p-5",
          className
        )}
      >
        <div className="flex items-center gap-2.5 text-sm font-semibold text-foreground">
          <SparklesIcon className="size-4 text-primary" />
          <span>
            {roundtripStep === "STEP_1_CONFIGURING"
              ? "Turn 1 Discovery Setup"
              : "Turn 1 Discovery Prompt Ready"}
          </span>
        </div>

        <p className="text-xs leading-relaxed text-muted-foreground">
          Copy the generated Turn 1 prompt from the Prompt Inspector panel on
          the right and paste it into Claude, ChatGPT, or Gemini. The external
          AI will analyze your brief and formulate a structured clarification
          questionnaire.
        </p>

        <div className="flex flex-wrap items-center gap-2 pt-2">
          <Button
            size="sm"
            data-slot="advance-to-awaiting-ai-btn"
            onClick={() => setRoundtripStep("AWAITING_AI_RESPONSE")}
            className="cursor-pointer gap-1.5 text-xs"
          >
            <span>I have pasted to AI → Enter AI Response</span>
            <ArrowRightIcon className="size-3.5" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={skipClarification}
            className="cursor-pointer text-xs text-muted-foreground hover:text-foreground"
          >
            Skip Clarification & Go straight to Turn 2
          </Button>
        </div>
      </div>
    )
  }

  if (roundtripStep === "AWAITING_AI_RESPONSE") {
    return (
      <div
        data-slot="clarification-zone"
        className={cn(
          "flex flex-col gap-4 rounded-xl border border-border/60 bg-card/40 p-4 shadow-xs sm:p-5",
          className
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <QuestionIcon className="size-4 text-primary" />
            <span>Paste AI Clarification Response</span>
          </div>

          <Button
            variant="ghost"
            size="xs"
            onClick={() => setPasteInput(SAMPLE_AI_RESPONSE)}
            className="cursor-pointer text-[11px] text-muted-foreground hover:text-foreground"
          >
            Load Sample XML
          </Button>
        </div>

        <Textarea
          data-slot="ai-response-paste-textarea"
          value={pasteInput}
          onChange={(e) => setPasteInput(e.target.value)}
          placeholder={`Paste external model output here (prose, markdown, or <question-form> XML)...\n\nExample:\n<question-form>\n  <field name="target_audience" type="select" label="Target audience?" options="B2B, B2C" />\n</question-form>`}
          rows={6}
          className="min-h-[9rem] bg-background/60 font-mono text-xs"
        />

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            data-slot="parse-questions-btn"
            onClick={handleParse}
            disabled={!pasteInput.trim()}
            className="cursor-pointer gap-1.5 text-xs"
          >
            <CheckCircleIcon className="size-3.5" />
            <span>Parse Questions</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            data-slot="skip-clarification-btn"
            onClick={skipClarification}
            className="cursor-pointer text-xs text-muted-foreground hover:text-foreground"
          >
            Skip Clarification
          </Button>
        </div>

        {/* AI Disobedience Notice & Fallback Escape Hatches */}
        {isDisobedientAi && (
          <div
            data-slot="ai-disobedience-banner"
            className="flex animate-in flex-col gap-2.5 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3.5 fade-in"
          >
            <div className="flex items-start gap-2 text-xs font-medium text-amber-700 dark:text-amber-400">
              <AlertTriangleIcon className="mt-0.5 size-4 shrink-0" />
              <div>
                <p className="font-semibold">
                  No structured question form detected
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {parseError ? `${parseError} ` : ""}
                  The AI returned plain prose, markdown, or code instead of a
                  &lt;question-form&gt; tag. Don't worry—you can easily proceed
                  using either escape hatch below:
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Button
                size="sm"
                variant="outline"
                data-slot="manual-clarifications-btn"
                onClick={() => setShowManualEditor((v) => !v)}
                className="cursor-pointer gap-1.5 border-amber-500/30 text-xs hover:bg-amber-500/20"
              >
                <EditIcon className="size-3" />
                <span>
                  {showManualEditor
                    ? "Hide Manual Editor"
                    : "Enter Custom Clarifications Manually"}
                </span>
              </Button>

              <Button
                size="sm"
                variant="secondary"
                data-slot="use-skill-defaults-btn"
                onClick={useSkillDefaultsAndProceed}
                className="cursor-pointer gap-1.5 text-xs"
              >
                <ZapIcon className="size-3 text-amber-500" />
                <span>Use Skill Defaults & Proceed</span>
              </Button>
            </div>
          </div>
        )}

        {/* Manual Clarification Editor Drawer */}
        {showManualEditor && (
          <div
            data-slot="manual-clarifications-editor"
            className="flex flex-col gap-3 rounded-lg border border-border/80 bg-background/80 p-3.5"
          >
            <div className="flex items-center justify-between text-xs font-semibold">
              <span>Manual Clarifications (Key & Value)</span>
              <button
                type="button"
                onClick={() =>
                  setManualRows((prev) => [...prev, { key: "", value: "" }])
                }
                className="inline-flex cursor-pointer items-center gap-1 text-[11px] text-primary hover:underline"
              >
                <PlusIcon className="size-3" /> Add Item
              </button>
            </div>

            <div className="space-y-2">
              {manualRows.map((row, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Input
                    placeholder="Key (e.g. Audience)"
                    value={row.key}
                    onChange={(e) => {
                      const next = [...manualRows]
                      next[idx].key = e.target.value
                      setManualRows(next)
                    }}
                    className="h-7 w-1/3 text-xs"
                  />
                  <Input
                    placeholder="Value (e.g. B2B Founders)"
                    value={row.value}
                    onChange={(e) => {
                      const next = [...manualRows]
                      next[idx].value = e.target.value
                      setManualRows(next)
                    }}
                    className="h-7 flex-1 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setManualRows(manualRows.filter((_, i) => i !== idx))
                    }
                    className="cursor-pointer p-1 text-muted-foreground hover:text-destructive"
                  >
                    <TrashIcon className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <Textarea
              placeholder="Or write free-form clarification notes here..."
              value={manualFreeForm}
              onChange={(e) => setManualFreeForm(e.target.value)}
              rows={2}
              className="text-xs"
            />

            <Button
              size="sm"
              data-slot="apply-manual-clarifications-btn"
              onClick={handleApplyManualClarifications}
              className="cursor-pointer gap-1.5 self-start text-xs"
            >
              <CheckCircleIcon className="size-3.5" />
              <span>Apply Clarifications & Generate Turn 2 Prompt</span>
            </Button>
          </div>
        )}
      </div>
    )
  }

  if (roundtripStep === "CLARIFICATION_ACTIVE" && parsedFormAst) {
    return (
      <div
        data-slot="clarification-zone"
        className={cn(
          "flex flex-col gap-4 rounded-xl border border-border/60 bg-card/40 p-4 shadow-xs sm:p-5",
          className
        )}
      >
        <div className="flex items-center justify-between gap-2 border-b border-border/50 pb-3">
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              {parsedFormAst.title || "Clarification Questions"}
            </h3>
            {parsedFormAst.description && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                {parsedFormAst.description}
              </p>
            )}
          </div>

          <Button
            variant="ghost"
            size="xs"
            onClick={() => setRoundtripStep("AWAITING_AI_RESPONSE")}
            className="cursor-pointer text-[11px] text-muted-foreground hover:text-foreground"
          >
            <ResetIcon className="mr-1 size-3" />
            Repaste
          </Button>
        </div>

        {/* Dynamic Fields */}
        <div className="space-y-3">
          {parsedFormAst.questions.map((question: QuestionNode) => {
            const currentValue =
              answersMap[question.id] ??
              (question.options?.find((o) => o.defaultChecked)?.value
                ? [question.options.find((o) => o.defaultChecked)!.value]
                : [])

            return (
              <QuestionFieldRenderer
                key={question.id}
                question={question}
                value={currentValue}
                onChange={(vals) => handleFieldChange(question.id, vals)}
              />
            )
          })}
        </div>

        {/* Submit Questions to Turn 2 */}
        <div className="flex flex-wrap items-center gap-2 pt-2">
          <Button
            size="sm"
            data-slot="submit-clarifications-btn"
            onClick={handleSubmitQuestions}
            className="cursor-pointer gap-1.5 text-xs font-medium"
          >
            <span>Generate Turn 2 Execution Prompt</span>
            <ArrowRightIcon className="size-3.5" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={useSkillDefaultsAndProceed}
            className="cursor-pointer text-xs text-muted-foreground hover:text-foreground"
          >
            Use Skill Defaults Instead
          </Button>
        </div>
      </div>
    )
  }

  // In STEP_2_PROMPT_READY, show a compact confirmation card with option to re-clarify
  if (roundtripStep === "STEP_2_PROMPT_READY") {
    return (
      <div
        data-slot="clarification-zone"
        className={cn(
          "flex items-center justify-between gap-3 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3.5 shadow-xs sm:p-4",
          className
        )}
      >
        <div className="flex items-center gap-2.5">
          <CheckCircleIcon className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <div>
            <div className="text-xs font-semibold text-foreground">
              Turn 2 Execution Prompt Compiled
            </div>
            <div className="text-[11px] text-muted-foreground">
              Clarification answers incorporated with full brand tokens
              re-injected.
            </div>
          </div>
        </div>

        <Button
          variant="outline"
          size="xs"
          onClick={() => setRoundtripStep("AWAITING_AI_RESPONSE")}
          className="shrink-0 cursor-pointer text-[11px]"
        >
          Re-open Clarifications
        </Button>
      </div>
    )
  }

  return null
}
