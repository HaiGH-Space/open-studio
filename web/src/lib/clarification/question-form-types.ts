/**
 * TypeScript AST and contract types for Open Studio <question-form> clarification protocol.
 * Conforms to SPEC-open-studio.md Section 7.4.
 */

export type QuestionType = "select" | "radio" | "checkbox" | "text" | "textarea"

export interface ManualClarificationItem {
  readonly key: string
  readonly value: string
}

export interface QuestionOption {
  readonly value: string
  readonly label: string
  readonly defaultChecked?: boolean
}

export interface QuestionNode {
  readonly id: string
  readonly type: QuestionType
  readonly label: string
  readonly required?: boolean
  readonly placeholder?: string
  readonly options?: readonly QuestionOption[]
}

export interface QuestionFormAST {
  readonly formId: string
  readonly title: string
  readonly description?: string
  readonly questions: readonly QuestionNode[]
}

export interface ClarificationAnswerEntry {
  readonly questionId: string
  readonly questionLabel: string
  readonly selectedValues: readonly string[]
}

export interface IQuestionFormParser {
  /** Scans raw text response from AI for <question-form> and compiles AST */
  parseForm(rawAiResponse: string | null | undefined): QuestionFormAST | null

  /** Formats user answers into XML to be appended to Layer 9 */
  serializeAnswers(answers: readonly ClarificationAnswerEntry[]): string
}
