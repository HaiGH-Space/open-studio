import { useState } from "react"
import { useComposer } from "../../hooks/useComposer"
import { Textarea } from "../ui/textarea"
import { Input } from "../ui/input"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { QuestionFormModal } from "../clarification/QuestionFormModal"
import {
  FileText,
  ListChecks,
  HelpCircle,
  Plus,
  Trash2,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  ExternalLink,
} from "lucide-react"

export interface Layer9BriefClarificationProps {
  readonly className?: string
}

export function Layer9BriefClarification({
  className,
}: Layer9BriefClarificationProps) {
  const {
    config,
    setUserObjective,
    setFeatureRequirements,
    clearClarificationAnswers,
  } = useComposer()

  const [newFeatureText, setNewFeatureText] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)

  const brief = config.layer9BriefAndClarification
  const objective = brief.userObjective
  const features = brief.featureRequirements
  const answers = brief.clarificationAnswers

  const handleAddFeature = () => {
    const trimmed = newFeatureText.trim()
    if (!trimmed) return
    setFeatureRequirements([...features, trimmed])
    setNewFeatureText("")
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleAddFeature()
    }
  }

  const handleRemoveFeature = (index: number) => {
    setFeatureRequirements(features.filter((_, idx) => idx !== index))
  }

  return (
    <div
      data-slot="layer-9-brief-clarification"
      className={`space-y-5 ${className ?? ""}`}
    >
      {/* Section 1: User Objective */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label
            htmlFor="layer9-objective"
            className="flex items-center gap-1.5 text-xs font-semibold text-foreground"
          >
            <FileText className="size-3.5 text-primary" />
            <span>User Objective &amp; Goal</span>
          </label>
          <span className="font-mono text-[11px] text-muted-foreground">
            {objective.length} chars
          </span>
        </div>
        <Textarea
          id="layer9-objective"
          data-slot="layer9-objective-input"
          value={objective}
          onChange={(e) => setUserObjective(e.target.value)}
          placeholder="Describe your user goal, the primary problem being solved, key user persona, and required visual tone..."
          rows={3}
          className="min-h-[5rem] border-border/70 bg-card/40 text-xs leading-relaxed placeholder:text-muted-foreground/60"
        />
      </div>

      {/* Section 2: Feature Requirements Checklist */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <label
            htmlFor="layer9-new-feature"
            className="flex items-center gap-1.5 text-xs font-semibold text-foreground"
          >
            <ListChecks className="size-3.5 text-primary" />
            <span>Feature Checklist ({features.length})</span>
          </label>
          <span className="text-[11px] text-muted-foreground">
            Included in &lt;requirements&gt;
          </span>
        </div>

        {/* Input to add feature */}
        <div className="flex items-center gap-2">
          <Input
            id="layer9-new-feature"
            data-slot="layer9-feature-input"
            value={newFeatureText}
            onChange={(e) => setNewFeatureText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add specific feature requirement..."
            className="h-8 border-border/70 bg-card/40 text-xs"
          />
          <Button
            type="button"
            data-slot="layer9-add-feature-btn"
            size="sm"
            onClick={handleAddFeature}
            disabled={!newFeatureText.trim()}
            className="h-8 shrink-0 cursor-pointer gap-1 border border-primary/40 bg-primary/20 px-2.5 text-xs text-primary hover:bg-primary/30"
          >
            <Plus className="size-3.5" />
            <span>Add</span>
          </Button>
        </div>

        {/* Feature List */}
        {features.length > 0 && (
          <div data-slot="layer9-feature-list" className="space-y-1.5 pt-1">
            {features.map((feature, idx) => (
              <div
                key={`${idx}-${feature}`}
                className="group flex items-center justify-between gap-2 rounded-lg border border-border/50 bg-card/50 p-2 text-xs text-foreground transition-colors"
              >
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <span className="size-1.5 shrink-0 rounded-full bg-primary/80" />
                  <span className="truncate">{feature}</span>
                </div>
                <button
                  type="button"
                  data-slot={`layer9-remove-feature-${idx}`}
                  onClick={() => handleRemoveFeature(idx)}
                  className="cursor-pointer p-1 text-muted-foreground opacity-70 transition-opacity group-hover:opacity-100 hover:text-destructive"
                  title="Remove feature"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 3: Interactive Clarification Loop */}
      <div
        data-slot="layer9-clarification-section"
        className="space-y-3 rounded-xl border border-border/70 bg-card/30 p-3.5"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-md bg-primary/10 p-1.5 text-primary">
              <HelpCircle className="size-4" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-foreground">
                Clarification Loop
              </h4>
              <p className="text-[11px] text-muted-foreground">
                Answer AI-generated &lt;question-form&gt; XML blocks to resolve
                UI ambiguities
              </p>
            </div>
          </div>

          <Button
            type="button"
            data-slot="paste-ai-response-btn"
            size="sm"
            onClick={() => setIsModalOpen(true)}
            className="h-7 cursor-pointer gap-1.5 bg-primary px-2.5 text-xs text-primary-foreground hover:bg-primary/90"
          >
            <Sparkles className="size-3" />
            <span>Paste AI Response</span>
          </Button>
        </div>

        {/* Answers Summary */}
        {answers.length > 0 ? (
          <div
            data-slot="clarification-answers-summary"
            className="space-y-2 border-t border-border/50 pt-2"
          >
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 font-semibold text-foreground">
                <CheckCircle2 className="size-3.5 text-emerald-400" />
                <span>Answered Questions ({answers.length})</span>
              </span>
              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsModalOpen(true)}
                  className="h-6 cursor-pointer px-2 text-[11px] text-muted-foreground hover:text-foreground"
                >
                  <ExternalLink className="mr-1 size-3" />
                  Edit Form
                </Button>
                <Button
                  type="button"
                  data-slot="clear-clarification-btn"
                  variant="ghost"
                  size="sm"
                  onClick={clearClarificationAnswers}
                  className="h-6 cursor-pointer px-2 text-[11px] text-destructive hover:bg-destructive/15"
                >
                  <RotateCcw className="mr-1 size-3" />
                  Clear
                </Button>
              </div>
            </div>

            <div className="space-y-1.5">
              {answers.map((ans) => (
                <div
                  key={ans.questionId}
                  className="space-y-1 rounded-lg border border-border/50 bg-background/50 p-2 text-xs"
                >
                  <div className="text-[11px] font-medium text-foreground">
                    {ans.questionLabel}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {ans.selectedValues.length > 0 ? (
                      ans.selectedValues.map((v) => (
                        <Badge
                          key={v}
                          variant="secondary"
                          className="border-primary/20 bg-primary/10 px-1.5 py-0 text-[10px] font-normal text-primary"
                        >
                          {v}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-[10px] text-muted-foreground italic">
                        (No value selected)
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border/60 bg-background/20 p-3 text-center text-[11px] text-muted-foreground">
            No clarification answers yet. When an AI agent returns a
            &lt;question-form&gt; block, paste it here to answer interactively.
          </div>
        )}
      </div>

      {/* Modal Dialog */}
      <QuestionFormModal open={isModalOpen} onOpenChange={setIsModalOpen} />
    </div>
  )
}
