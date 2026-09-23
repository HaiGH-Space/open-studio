import React from "react"
import { Input } from "../ui/input"
import { Textarea } from "../ui/textarea"
import type { QuestionNode, QuestionOption } from "../../lib/clarification/question-form-types"
import { cn } from "cn"

export interface QuestionFieldRendererProps {
  readonly question: QuestionNode
  readonly value: readonly string[]
  readonly onChange: (values: string[]) => void
  readonly disabled?: boolean
}

export function QuestionFieldRenderer({
  question,
  value,
  onChange,
  disabled = false,
}: QuestionFieldRendererProps) {
  const { id, type, label, required, placeholder, options = [] } = question

  const handleRadioChange = (optValue: string) => {
    if (disabled) return
    onChange([optValue])
  }

  const handleCheckboxChange = (optValue: string, checked: boolean) => {
    if (disabled) return
    if (checked) {
      if (!value.includes(optValue)) {
        onChange([...value, optValue])
      }
    } else {
      onChange(value.filter((v) => v !== optValue))
    }
  }

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (disabled) return
    onChange([e.target.value])
  }

  return (
    <div
      data-slot={`question-field-${id}`}
      className="flex flex-col gap-2 rounded-xl border border-border/60 bg-card/30 p-3.5 transition-colors"
    >
      {/* Label and required indicator */}
      <div className="flex items-center justify-between gap-2">
        <label
          htmlFor={`q-${id}`}
          className="text-xs font-semibold text-foreground leading-snug flex items-center gap-1.5"
        >
          <span>{label}</span>
          {required && (
            <span className="text-destructive font-mono text-xs" title="Required field">
              *
            </span>
          )}
        </label>
        <span className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground/80 px-1.5 py-0.5 rounded bg-muted/40">
          {type}
        </span>
      </div>

      {/* Field Input based on QuestionType */}
      {(type === "radio" || (type === "select" && options.length <= 4)) && (
        <div className="space-y-1.5 pt-1">
          {options.map((opt: QuestionOption) => {
            const isChecked = value.includes(opt.value)
            const optionId = `q-${id}-opt-${opt.value}`
            return (
              <label
                key={opt.value}
                htmlFor={optionId}
                className={cn(
                  "flex items-center gap-2.5 p-2 rounded-lg border text-xs cursor-pointer transition-all",
                  isChecked
                    ? "border-primary/60 bg-primary/10 text-foreground font-medium"
                    : "border-border/50 bg-background/40 hover:bg-muted/30 text-muted-foreground hover:text-foreground",
                  disabled && "opacity-50 cursor-not-allowed"
                )}
              >
                <input
                  type="radio"
                  id={optionId}
                  name={`question-${id}`}
                  value={opt.value}
                  checked={isChecked}
                  disabled={disabled}
                  onChange={() => handleRadioChange(opt.value)}
                  className="size-3.5 text-primary accent-primary cursor-pointer disabled:cursor-not-allowed"
                />
                <span className="flex-1">{opt.label}</span>
              </label>
            )
          })}
        </div>
      )}

      {type === "select" && options.length > 4 && (
        <div className="pt-1">
          <select
            id={`q-${id}`}
            value={value[0] ?? ""}
            disabled={disabled}
            onChange={(e) => handleRadioChange(e.target.value)}
            className="w-full text-xs h-8 px-2.5 rounded-lg border border-border/60 bg-background/80 text-foreground cursor-pointer focus:outline-hidden focus:ring-1 focus:ring-primary"
          >
            <option value="" disabled>
              Select an option...
            </option>
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {type === "checkbox" && (
        <div className="space-y-1.5 pt-1">
          {options.map((opt: QuestionOption) => {
            const isChecked = value.includes(opt.value)
            const optionId = `q-${id}-opt-${opt.value}`
            return (
              <label
                key={opt.value}
                htmlFor={optionId}
                className={cn(
                  "flex items-center gap-2.5 p-2 rounded-lg border text-xs cursor-pointer transition-all",
                  isChecked
                    ? "border-primary/60 bg-primary/10 text-foreground font-medium"
                    : "border-border/50 bg-background/40 hover:bg-muted/30 text-muted-foreground hover:text-foreground",
                  disabled && "opacity-50 cursor-not-allowed"
                )}
              >
                <input
                  type="checkbox"
                  id={optionId}
                  name={`question-${id}`}
                  value={opt.value}
                  checked={isChecked}
                  disabled={disabled}
                  onChange={(e) => handleCheckboxChange(opt.value, e.target.checked)}
                  className="size-3.5 text-primary rounded accent-primary cursor-pointer disabled:cursor-not-allowed"
                />
                <span className="flex-1">{opt.label}</span>
              </label>
            )
          })}
        </div>
      )}

      {type === "text" && (
        <div className="pt-1">
          <Input
            id={`q-${id}`}
            type="text"
            value={value[0] ?? ""}
            placeholder={placeholder ?? "Enter answer..."}
            disabled={disabled}
            onChange={handleTextChange}
            className="text-xs h-8"
          />
        </div>
      )}

      {type === "textarea" && (
        <div className="pt-1">
          <Textarea
            id={`q-${id}`}
            value={value[0] ?? ""}
            placeholder={placeholder ?? "Enter detailed answer..."}
            disabled={disabled}
            onChange={handleTextChange}
            rows={3}
            className="text-xs min-h-[4.5rem]"
          />
        </div>
      )}
    </div>
  )
}
