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

export function Layer9BriefClarification({ className }: Layer9BriefClarificationProps) {
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
    <div data-slot="layer-9-brief-clarification" className={`space-y-5 ${className ?? ""}`}>
      {/* Section 1: User Objective */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label
            htmlFor="layer9-objective"
            className="text-xs font-semibold text-foreground flex items-center gap-1.5"
          >
            <FileText className="size-3.5 text-primary" />
            <span>User Objective &amp; Goal</span>
          </label>
          <span className="text-[11px] text-muted-foreground font-mono">
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
          className="text-xs min-h-[5rem] bg-card/40 border-border/70 placeholder:text-muted-foreground/60 leading-relaxed"
        />
      </div>

      {/* Section 2: Feature Requirements Checklist */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <label
            htmlFor="layer9-new-feature"
            className="text-xs font-semibold text-foreground flex items-center gap-1.5"
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
            className="text-xs h-8 bg-card/40 border-border/70"
          />
          <Button
            type="button"
            data-slot="layer9-add-feature-btn"
            size="sm"
            onClick={handleAddFeature}
            disabled={!newFeatureText.trim()}
            className="h-8 px-2.5 text-xs gap-1 cursor-pointer bg-primary/20 text-primary hover:bg-primary/30 border border-primary/40 shrink-0"
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
                className="flex items-center justify-between gap-2 p-2 rounded-lg bg-card/50 border border-border/50 text-xs text-foreground group transition-colors"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="size-1.5 rounded-full bg-primary/80 shrink-0" />
                  <span className="truncate">{feature}</span>
                </div>
                <button
                  type="button"
                  data-slot={`layer9-remove-feature-${idx}`}
                  onClick={() => handleRemoveFeature(idx)}
                  className="text-muted-foreground hover:text-destructive opacity-70 group-hover:opacity-100 transition-opacity p-1 cursor-pointer"
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
        className="rounded-xl border border-border/70 bg-card/30 p-3.5 space-y-3"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-primary/10 text-primary">
              <HelpCircle className="size-4" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-foreground">
                Clarification Loop
              </h4>
              <p className="text-[11px] text-muted-foreground">
                Answer AI-generated &lt;question-form&gt; XML blocks to resolve UI ambiguities
              </p>
            </div>
          </div>

          <Button
            type="button"
            data-slot="paste-ai-response-btn"
            size="sm"
            onClick={() => setIsModalOpen(true)}
            className="text-xs h-7 px-2.5 gap-1.5 cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Sparkles className="size-3" />
            <span>Paste AI Response</span>
          </Button>
        </div>

        {/* Answers Summary */}
        {answers.length > 0 ? (
          <div
            data-slot="clarification-answers-summary"
            className="space-y-2 pt-2 border-t border-border/50"
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <CheckCircle2 className="size-3.5 text-emerald-400" />
                <span>Answered Questions ({answers.length})</span>
              </span>
              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsModalOpen(true)}
                  className="h-6 px-2 text-[11px] text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <ExternalLink className="size-3 mr-1" />
                  Edit Form
                </Button>
                <Button
                  type="button"
                  data-slot="clear-clarification-btn"
                  variant="ghost"
                  size="sm"
                  onClick={clearClarificationAnswers}
                  className="h-6 px-2 text-[11px] text-destructive hover:bg-destructive/15 cursor-pointer"
                >
                  <RotateCcw className="size-3 mr-1" />
                  Clear
                </Button>
              </div>
            </div>

            <div className="space-y-1.5">
              {answers.map((ans) => (
                <div
                  key={ans.questionId}
                  className="p-2 rounded-lg bg-background/50 border border-border/50 text-xs space-y-1"
                >
                  <div className="font-medium text-foreground text-[11px]">
                    {ans.questionLabel}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {ans.selectedValues.length > 0 ? (
                      ans.selectedValues.map((v) => (
                        <Badge
                          key={v}
                          variant="secondary"
                          className="text-[10px] py-0 px-1.5 font-normal bg-primary/10 text-primary border-primary/20"
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
          <div className="p-3 rounded-lg border border-dashed border-border/60 bg-background/20 text-center text-[11px] text-muted-foreground">
            No clarification answers yet. When an AI agent returns a &lt;question-form&gt; block, paste it here to answer interactively.
          </div>
        )}
      </div>

      {/* Modal Dialog */}
      <QuestionFormModal open={isModalOpen} onOpenChange={setIsModalOpen} />
    </div>
  )
}
