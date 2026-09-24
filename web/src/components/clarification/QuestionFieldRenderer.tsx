import React from "react"
import { Input } from "../ui/input"
import { Textarea } from "../ui/textarea"
import type {
  QuestionNode,
  QuestionOption,
} from "../../lib/clarification/question-form-types"
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

  const handleTextChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
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
          className="flex items-center gap-1.5 text-xs leading-snug font-semibold text-foreground"
        >
          <span>{label}</span>
          {required && (
            <span
              className="font-mono text-xs text-destructive"
              title="Required field"
            >
              *
            </span>
          )}
        </label>
        <span className="rounded bg-muted/40 px-1.5 py-0.5 font-mono text-[10px] tracking-wider text-muted-foreground/80 uppercase">
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
                  "flex cursor-pointer items-center gap-2.5 rounded-lg border p-2 text-xs transition-all",
                  isChecked
                    ? "border-primary/60 bg-primary/10 font-medium text-foreground"
                    : "border-border/50 bg-background/40 text-muted-foreground hover:bg-muted/30 hover:text-foreground",
                  disabled && "cursor-not-allowed opacity-50"
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
                  className="size-3.5 cursor-pointer text-primary accent-primary disabled:cursor-not-allowed"
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
            className="h-8 w-full cursor-pointer rounded-lg border border-border/60 bg-background/80 px-2.5 text-xs text-foreground focus:ring-1 focus:ring-primary focus:outline-hidden"
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
                  "flex cursor-pointer items-center gap-2.5 rounded-lg border p-2 text-xs transition-all",
                  isChecked
                    ? "border-primary/60 bg-primary/10 font-medium text-foreground"
                    : "border-border/50 bg-background/40 text-muted-foreground hover:bg-muted/30 hover:text-foreground",
                  disabled && "cursor-not-allowed opacity-50"
                )}
              >
                <input
                  type="checkbox"
                  id={optionId}
                  name={`question-${id}`}
                  value={opt.value}
                  checked={isChecked}
                  disabled={disabled}
                  onChange={(e) =>
                    handleCheckboxChange(opt.value, e.target.checked)
                  }
                  className="size-3.5 cursor-pointer rounded text-primary accent-primary disabled:cursor-not-allowed"
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
            className="h-8 text-xs"
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
            className="min-h-[4.5rem] text-xs"
          />
        </div>
      )}
    </div>
  )
}
