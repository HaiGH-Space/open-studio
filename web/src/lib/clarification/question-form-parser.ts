/**
 * Robust in-browser/Node parser and serializer for the Open Studio <question-form> XML clarification protocol.
 * Spec reference: SPEC-open-studio.md Section 7.4.
 */

import type {
  ClarificationAnswerEntry,
  IQuestionFormParser,
  QuestionFormAST,
  QuestionNode,
  QuestionOption,
  QuestionType,
} from "./question-form-types"

/**
 * Decodes XML entities into literal strings.
 */
function decodeXmlEntities(text: string): string {
  return text
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) =>
      String.fromCharCode(parseInt(hex, 16))
    )
}

/**
 * Escapes special XML characters in string content and attributes.
 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

/**
 * Parses XML attributes from a tag string (e.g. `id="q1" type="radio" required="true"`).
 */
function parseAttributes(tagAttributeString: string): Record<string, string> {
  const attrs: Record<string, string> = {}
  const attrRegex = /([a-zA-Z0-9_-]+)(?:=(?:"([^"]*)"|'([^']*)'|(\S+)))?/g
  let match: RegExpExecArray | null

  while ((match = attrRegex.exec(tagAttributeString)) !== null) {
    const key = match[1]
    const val = match[2] ?? match[3] ?? match[4] ?? "true"
    attrs[key] = decodeXmlEntities(val)
  }

  return attrs
}

/**
 * Scans raw text response from AI for <question-form> and compiles AST.
 * Returns null if no valid <question-form> with at least one question is found.
 */
export function parseQuestionForm(
  rawAiResponse: string | null | undefined
): QuestionFormAST | null {
  if (!rawAiResponse || typeof rawAiResponse !== "string" || !rawAiResponse.trim()) {
    return null
  }

  // Find <question-form> opening tag and content
  const rootTagRegex = /<question-form\b([^>]*)>([\s\S]*?)(?:<\/question-form>|$)/i
  const rootMatch = rootTagRegex.exec(rawAiResponse)
  if (!rootMatch) {
    return null
  }

  const rootAttrs = parseAttributes(rootMatch[1])
  const rootInnerXml = rootMatch[2]

  const formId = rootAttrs.id?.trim() || "clarification-form"
  let title = rootAttrs.title?.trim()

  // If title was not an attribute, check for a child <title> tag
  if (!title) {
    const titleTagMatch = /<title\b[^>]*>([\s\S]*?)<\/title>/i.exec(rootInnerXml)
    if (titleTagMatch) {
      title = decodeXmlEntities(titleTagMatch[1]).trim()
    }
  }
  if (!title) {
    title = "Clarification Request"
  }

  // Description can be an attribute or child tag
  let description = rootAttrs.description?.trim()
  if (!description) {
    const descTagMatch = /<description\b[^>]*>([\s\S]*?)<\/description>/i.exec(
      rootInnerXml
    )
    if (descTagMatch) {
      description = decodeXmlEntities(descTagMatch[1]).trim()
    }
  }

  // Extract <question> tags
  // Regex handles both properly closed </question> and unclosed questions bounded by next <question or end
  const questionBlockRegex =
    /<question\b([^>]*)>([\s\S]*?)(?:<\/question>|(?=<question\b|<\/question-form>|$))/gi
  const questions: QuestionNode[] = []

  let qMatch: RegExpExecArray | null
  let qIndex = 1

  while ((qMatch = questionBlockRegex.exec(rootInnerXml)) !== null) {
    const qAttrs = parseAttributes(qMatch[1])
    const qContent = qMatch[2]

    const id = qAttrs.id?.trim() || `q-${qIndex}`
    const rawType = qAttrs.type?.toLowerCase()?.trim()

    const required =
      qAttrs.required === "true" ||
      (qAttrs.required !== undefined && qAttrs.required !== "false")

    let placeholder = qAttrs.placeholder?.trim()
    if (!placeholder) {
      const placeholderTagMatch = /<placeholder\b[^>]*>([\s\S]*?)<\/placeholder>/i.exec(
        qContent
      )
      if (placeholderTagMatch) {
        placeholder = decodeXmlEntities(placeholderTagMatch[1]).trim()
      }
    }

    // Extract label
    const labelMatch = /<label\b[^>]*>([\s\S]*?)(?:<\/label>|(?=<option|<placeholder|$))/i.exec(
      qContent
    )
    const label = labelMatch
      ? decodeXmlEntities(labelMatch[1]).trim()
      : `Question ${qIndex}`

    // Extract options
    const optionRegex =
      /<option\b([^>]*)>([\s\S]*?)(?:<\/option>|(?=<option\b|<\/question|$))/gi
    const options: QuestionOption[] = []
    let optMatch: RegExpExecArray | null

    while ((optMatch = optionRegex.exec(qContent)) !== null) {
      const optAttrs = parseAttributes(optMatch[1])
      const optLabel = decodeXmlEntities(optMatch[2]).trim()
      const optValue = optAttrs.value !== undefined ? optAttrs.value : optLabel

      const isChecked =
        optAttrs.checked === "true" ||
        optAttrs.selected === "true" ||
        (optAttrs.checked !== undefined && optAttrs.checked !== "false") ||
        (optAttrs.selected !== undefined && optAttrs.selected !== "false")

      options.push({
        value: optValue,
        label: optLabel,
        ...(isChecked ? { defaultChecked: true } : {}),
      })
    }

    // Determine question type
    let type: QuestionType
    if (
      rawType === "radio" ||
      rawType === "checkbox" ||
      rawType === "text" ||
      rawType === "textarea"
    ) {
      type = rawType
    } else if (options.length > 0) {
      type = "radio"
    } else {
      type = "text"
    }

    const node: QuestionNode = {
      id,
      type,
      label,
      ...(required ? { required: true } : { required: false }),
      ...(placeholder ? { placeholder } : {}),
      ...(options.length > 0 ? { options } : {}),
    }

    questions.push(node)
    qIndex++
  }

  if (questions.length === 0) {
    return null
  }

  return {
    formId,
    title,
    ...(description ? { description } : {}),
    questions,
  }
}

/**
 * Formats user clarification answers into structured XML to be injected into Layer 9.
 */
export function serializeAnswers(
  answers: readonly ClarificationAnswerEntry[]
): string {
  if (!answers || answers.length === 0) {
    return "<clarification-answers />"
  }

  const lines: string[] = ["<clarification-answers>"]

  for (const answer of answers) {
    const escapedId = escapeXml(answer.questionId)
    const escapedLabel = escapeXml(answer.questionLabel)

    if (!answer.selectedValues || answer.selectedValues.length === 0) {
      lines.push(`  <answer id="${escapedId}" question="${escapedLabel}" />`)
    } else {
      lines.push(`  <answer id="${escapedId}" question="${escapedLabel}">`)
      for (const val of answer.selectedValues) {
        lines.push(`    <value>${escapeXml(val)}</value>`)
      }
      lines.push("  </answer>")
    }
  }

  lines.push("</clarification-answers>")
  return lines.join("\n")
}

/**
 * Singleton implementation of IQuestionFormParser.
 */
export const questionFormParser: IQuestionFormParser = {
  parseForm: parseQuestionForm,
  serializeAnswers,
}
