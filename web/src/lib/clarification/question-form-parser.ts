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
 * Pre-sanitizes raw XML string before parsing:
 * 1. Auto-escapes unescaped ampersands in attributes or text (e.g. "Design & UX" -> "Design &amp; UX").
 * 2. Normalizes single quotes in attributes (e.g. options='A, B' -> options="A, B").
 * 3. Handles self-closing tag discrepancies for <field ...> without explicit closing tag or slash.
 */
export function preSanitizeXml(rawXml: string): string {
  if (!rawXml) return ""

  // 1. Auto-escape unescaped ampersands not part of valid XML entities
  let sanitized = rawXml.replace(
    /&(?!(?:amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);)/g,
    "&amp;"
  )

  // 2. Normalize single quotes in attributes inside tag brackets
  sanitized = sanitized.replace(/<[^>]+>/g, (tag) => {
    return tag.replace(/([a-zA-Z0-9_-]+)='([^']*)'/g, '$1="$2"')
  })

  // 3. Handle self-closing tag discrepancies for <field ...> tags
  sanitized = sanitized.replace(
    /<field\b([^>/]*?)(?<!\/)>(?!\s*<\/field>)(?=\s*(?:<field\b|<\/question-form>|$))/gi,
    '<field$1 />'
  )

  return sanitized
}

/**
 * Loosely maps common LLM hallucinated field types to canonical QuestionType.
 * radio, dropdown, choice, single-select -> select
 * multiline, paragraph, longtext -> textarea
 * string, input -> text
 * checkbox, multi, multiselect -> checkbox
 */
export function normalizeQuestionType(
  rawType: string | undefined,
  hasOptions: boolean = false
): QuestionType {
  const t = rawType?.toLowerCase()?.trim()
  switch (t) {
    case "select":
    case "radio":
    case "dropdown":
    case "choice":
    case "single-select":
      return "select"
    case "checkbox":
    case "multi":
    case "multiselect":
      return "checkbox"
    case "textarea":
    case "multiline":
    case "paragraph":
    case "longtext":
      return "textarea"
    case "text":
    case "string":
    case "input":
      return "text"
    default:
      return hasOptions ? "select" : "text"
  }
}

/**
 * Parses comma-, pipe- (|), or semicolon-separated options strings safely, trimming whitespace.
 */
export function parseDelimitedOptions(
  optionsStr?: string,
  defaultValue?: string
): QuestionOption[] {
  if (!optionsStr || typeof optionsStr !== "string") return []

  const tokens = optionsStr
    .split(/[,|;]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)

  const trimmedDefault = defaultValue?.trim()

  return tokens.map((tok) => ({
    value: tok,
    label: tok,
    ...(trimmedDefault &&
    (trimmedDefault === tok || trimmedDefault.toLowerCase() === tok.toLowerCase())
      ? { defaultChecked: true }
      : {}),
  }))
}

/**
 * Scans raw text response from AI for <question-form> and compiles AST.
 * Supports both:
 * 1. <field name="..." type="select|text" label="..." options="..." default="..." /> (Micro-schema)
 * 2. <question id="..." type="..."> <label>...</label> <option>...</option> </question> (Legacy)
 * Returns null if no valid <question-form> with at least one question is found.
 */
export function parseQuestionForm(
  rawAiResponse: string | null | undefined
): QuestionFormAST | null {
  if (!rawAiResponse || typeof rawAiResponse !== "string" || !rawAiResponse.trim()) {
    return null
  }

  const sanitized = preSanitizeXml(rawAiResponse)

  // Find <question-form> opening tag and content
  const rootTagRegex = /<question-form\b([^>]*)>([\s\S]*?)(?:<\/question-form>|$)/i
  const rootMatch = rootTagRegex.exec(sanitized)
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

  const questions: QuestionNode[] = []
  let qIndex = 1

  // Extract <field ...> and <question ...> tags
  const tagBlockRegex =
    /<(field|question)\b([^>]*?)(?:\/>|>([\s\S]*?)<\/\1>|>([\s\S]*?)(?=<field\b|<question\b|<\/question-form>|$))/gi

  let match: RegExpExecArray | null
  while ((match = tagBlockRegex.exec(rootInnerXml)) !== null) {
    const tagAttrs = parseAttributes(match[2])
    const innerContent = match[3] ?? match[4] ?? ""

    const id = tagAttrs.id?.trim() || tagAttrs.name?.trim() || `q-${qIndex}`
    const rawType = tagAttrs.type?.toLowerCase()?.trim()

    const required =
      tagAttrs.required === "true" ||
      (tagAttrs.required !== undefined && tagAttrs.required !== "false")

    let placeholder = tagAttrs.placeholder?.trim()
    if (!placeholder && innerContent) {
      const placeholderTagMatch = /<placeholder\b[^>]*>([\s\S]*?)<\/placeholder>/i.exec(
        innerContent
      )
      if (placeholderTagMatch) {
        placeholder = decodeXmlEntities(placeholderTagMatch[1]).trim()
      }
    }

    // Extract label
    let label = tagAttrs.label?.trim()
    if (!label && innerContent) {
      const labelMatch = /<label\b[^>]*>([\s\S]*?)(?:<\/label>|(?=<option|<placeholder|$))/i.exec(
        innerContent
      )
      if (labelMatch) {
        label = decodeXmlEntities(labelMatch[1]).trim()
      }
    }
    if (!label) {
      label = `Question ${qIndex}`
    }

    // Extract options
    let options: QuestionOption[] = []
    if (tagAttrs.options) {
      options = parseDelimitedOptions(
        tagAttrs.options,
        tagAttrs.default ?? tagAttrs.value
      )
    } else if (innerContent) {
      const optionRegex =
        /<option\b([^>]*)>([\s\S]*?)(?:<\/option>|(?=<option\b|<\/question|$))/gi
      let optMatch: RegExpExecArray | null

      while ((optMatch = optionRegex.exec(innerContent)) !== null) {
        const optAttrs = parseAttributes(optMatch[1])
        const optLabel = decodeXmlEntities(optMatch[2]).trim()
        const optValue = optAttrs.value !== undefined ? optAttrs.value : optLabel

        const isChecked =
          optAttrs.checked === "true" ||
          optAttrs.selected === "true" ||
          (optAttrs.checked !== undefined && optAttrs.checked !== "false") ||
          (optAttrs.selected !== undefined && optAttrs.selected !== "false") ||
          (tagAttrs.default &&
            (tagAttrs.default === optValue || tagAttrs.default === optLabel))

        options.push({
          value: optValue,
          label: optLabel,
          ...(isChecked ? { defaultChecked: true } : {}),
        })
      }
    }

    const type = normalizeQuestionType(rawType, options.length > 0)

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
