import { describe, it, expect } from "vitest"
import {
  parseQuestionForm,
  serializeAnswers,
  questionFormParser,
} from "../src/lib/clarification/question-form-parser"
import type { ClarificationAnswerEntry } from "../src/lib/clarification/question-form-types"

describe("Question Form AST Parser & Answer Serializer", () => {
  describe("parseQuestionForm", () => {
    it("returns null for empty, null, or undefined input", () => {
      expect(parseQuestionForm("")).toBeNull()
      expect(parseQuestionForm(null)).toBeNull()
      expect(parseQuestionForm(undefined)).toBeNull()
      expect(parseQuestionForm("   ")).toBeNull()
    })

    it("returns null when text does not contain <question-form> tag", () => {
      const plainText = "Here is the plan for your application. No questions needed."
      expect(parseQuestionForm(plainText)).toBeNull()
    })

    it("parses valid <question-form> XML into a full QuestionFormAST", () => {
      const xml = `
<question-form id="theme-form" title="Dashboard Configuration" description="Select design details">
  <question id="q1" type="radio" required="true">
    <label>What visual theme should the analytics dashboard prioritize?</label>
    <option value="dark-slate">Dark Slate (Default Linear style)</option>
    <option value="high-contrast-light">High Contrast Light</option>
  </question>
  <question id="q2" type="checkbox">
    <label>Which chart modules should be displayed on first paint?</label>
    <option value="revenue-velocity" checked="true">Revenue Velocity Area Chart</option>
    <option value="latency-p99">P99 Latency Bar Chart</option>
    <option value="live-activity-stream">Live Activity Stream</option>
  </question>
  <question id="q3" type="text" placeholder="e.g. Acme Corp internal analytics">
    <label>What is the brand title or workspace display name?</label>
  </question>
  <question id="q4" type="textarea" placeholder="Describe any edge cases...">
    <label>Additional domain rules</label>
  </question>
</question-form>
`
      const ast = parseQuestionForm(xml)
      expect(ast).not.toBeNull()
      expect(ast?.formId).toBe("theme-form")
      expect(ast?.title).toBe("Dashboard Configuration")
      expect(ast?.description).toBe("Select design details")
      expect(ast?.questions).toHaveLength(4)

      // Question 1 (radio aliased to select)
      const q1 = ast?.questions[0]
      expect(q1?.id).toBe("q1")
      expect(q1?.type).toBe("select")
      expect(q1?.required).toBe(true)
      expect(q1?.label).toBe("What visual theme should the analytics dashboard prioritize?")
      expect(q1?.options).toEqual([
        { value: "dark-slate", label: "Dark Slate (Default Linear style)" },
        { value: "high-contrast-light", label: "High Contrast Light" },
      ])

      // Question 2 (checkbox with checked option)
      const q2 = ast?.questions[1]
      expect(q2?.id).toBe("q2")
      expect(q2?.type).toBe("checkbox")
      expect(q2?.required).toBe(false)
      expect(q2?.label).toBe("Which chart modules should be displayed on first paint?")
      expect(q2?.options).toEqual([
        { value: "revenue-velocity", label: "Revenue Velocity Area Chart", defaultChecked: true },
        { value: "latency-p99", label: "P99 Latency Bar Chart" },
        { value: "live-activity-stream", label: "Live Activity Stream" },
      ])

      // Question 3 (text with placeholder)
      const q3 = ast?.questions[2]
      expect(q3?.id).toBe("q3")
      expect(q3?.type).toBe("text")
      expect(q3?.label).toBe("What is the brand title or workspace display name?")
      expect(q3?.placeholder).toBe("e.g. Acme Corp internal analytics")
      expect(q3?.options).toBeUndefined()

      // Question 4 (textarea)
      const q4 = ast?.questions[3]
      expect(q4?.id).toBe("q4")
      expect(q4?.type).toBe("textarea")
      expect(q4?.label).toBe("Additional domain rules")
      expect(q4?.placeholder).toBe("Describe any edge cases...")
    })

    it("extracts <question-form> embedded in conversational AI markdown responses", () => {
      const response = `
Sure! I would be happy to help you build the analytics view. Before I start coding, please answer these questions:

\`\`\`xml
<question-form id="setup-q" title="Initial Setup">
  <question id="tech" type="radio">
    <label>Choose framework</label>
    <option value="react">React</option>
    <option value="vue">Vue</option>
  </question>
</question-form>
\`\`\`

Let me know once you submit!
`
      const ast = parseQuestionForm(response)
      expect(ast).not.toBeNull()
      expect(ast?.formId).toBe("setup-q")
      expect(ast?.title).toBe("Initial Setup")
      expect(ast?.questions).toHaveLength(1)
      expect(ast?.questions[0].id).toBe("tech")
      expect(ast?.questions[0].options?.[0].value).toBe("react")
    })

    it("handles description provided as a child tag <description>...</description>", () => {
      const xml = `
<question-form id="f1" title="Test Form">
  <description>Detailed explanation in child tag</description>
  <question id="q1" type="text">
    <label>Your Name</label>
  </question>
</question-form>
`
      const ast = parseQuestionForm(xml)
      expect(ast?.description).toBe("Detailed explanation in child tag")
    })

    it("decodes XML entities in labels, options, and placeholders", () => {
      const xml = `
<question-form id="f-ent" title="Q &amp; A Form">
  <question id="q1" type="radio" placeholder="&quot;quotes&quot; &amp; &apos;apostrophes&apos;">
    <label>Pick A &lt; B &amp; C &gt; D</label>
    <option value="opt-1">Rock &amp; Roll</option>
    <option value="opt-2">Price &lt; $50</option>
  </question>
</question-form>
`
      const ast = parseQuestionForm(xml)
      expect(ast?.title).toBe("Q & A Form")
      expect(ast?.questions[0].label).toBe("Pick A < B & C > D")
      expect(ast?.questions[0].placeholder).toBe('"quotes" & \'apostrophes\'')
      expect(ast?.questions[0].options?.[0].label).toBe("Rock & Roll")
      expect(ast?.questions[0].options?.[1].label).toBe("Price < $50")
    })

    it("handles selected='true' attribute as defaultChecked", () => {
      const xml = `
<question-form id="f-sel" title="Selected test">
  <question id="q1" type="checkbox">
    <label>Test selection</label>
    <option value="v1" selected="true">Option 1</option>
    <option value="v2">Option 2</option>
  </question>
</question-form>
`
      const ast = parseQuestionForm(xml)
      expect(ast?.questions[0].options?.[0].defaultChecked).toBe(true)
      expect(ast?.questions[0].options?.[1].defaultChecked).toBeUndefined()
    })

    it("falls back gracefully when missing attributes or IDs", () => {
      const xml = `
<question-form>
  <question>
    <label>Implicit text question with missing id and type</label>
  </question>
</question-form>
`
      const ast = parseQuestionForm(xml)
      expect(ast).not.toBeNull()
      expect(ast?.formId).toBe("clarification-form")
      expect(ast?.title).toBe("Clarification Request")
      expect(ast?.questions).toHaveLength(1)
      expect(ast?.questions[0].id).toBe("q-1")
      expect(ast?.questions[0].type).toBe("text")
    })

    it("infers type='select' when options are present but type is omitted", () => {
      const xml = `
<question-form id="test" title="Infer">
  <question id="q-infer">
    <label>Which color?</label>
    <option value="red">Red</option>
    <option value="blue">Blue</option>
  </question>
</question-form>
`
      const ast = parseQuestionForm(xml)
      expect(ast?.questions[0].type).toBe("select")
    })

    it("handles option value fallback to label text when value attribute is omitted", () => {
      const xml = `
<question-form id="f" title="T">
  <question id="q" type="radio">
    <label>Pick one</label>
    <option>Light Theme</option>
    <option>Dark Theme</option>
  </question>
</question-form>
`
      const ast = parseQuestionForm(xml)
      expect(ast?.questions[0].options?.[0].value).toBe("Light Theme")
      expect(ast?.questions[0].options?.[0].label).toBe("Light Theme")
      expect(ast?.questions[0].options?.[1].value).toBe("Dark Theme")
    })

    it("tolerates unclosed or malformed tags without throwing unhandled exceptions", () => {
      const malformedXml = `
<question-form id="malformed" title="Broken XML">
  <question id="q1" type="radio">
    <label>Unclosed question
    <option value="1">One
  <question id="q2" type="text">
    <label>Second question</label>
</question-form>
`
      expect(() => parseQuestionForm(malformedXml)).not.toThrow()
      const ast = parseQuestionForm(malformedXml)
      expect(ast).not.toBeNull()
      expect(ast?.questions.length).toBeGreaterThan(0)
    })

    it("returns null gracefully if <question-form> tag has no valid questions inside", () => {
      const emptyForm = `<question-form id="empty" title="Nothing"></question-form>`
      const ast = parseQuestionForm(emptyForm)
      expect(ast).toBeNull()
    })

    it("pre-sanitizes unescaped ampersands inside attributes and label tags", () => {
      const xml = `
<question-form id="amp-test" title="Research & Development">
  <field name="f1" type="select" label="UI & UX Strategy" options="Design & Strategy | Engineering & Ops" default="Design & Strategy" />
  <question id="q2" type="text" placeholder="R&D Budget">
    <label>Growth & Innovation</label>
  </question>
</question-form>`

      const ast = parseQuestionForm(xml)
      expect(ast).not.toBeNull()
      expect(ast?.title).toBe("Research & Development")
      expect(ast?.questions[0].label).toBe("UI & UX Strategy")
      expect(ast?.questions[0].options?.[0].label).toBe("Design & Strategy")
      expect(ast?.questions[1].label).toBe("Growth & Innovation")
      expect(ast?.questions[1].placeholder).toBe("R&D Budget")
    })

    it("pre-sanitizes single quotes in attributes", () => {
      const xml = `<question-form id='test-form' title='Single Quotes'><field name='theme' type='select' label='Visual Theme' options='Linear, Notion, Apple' default='Linear' /></question-form>`
      const ast = parseQuestionForm(xml)
      expect(ast).not.toBeNull()
      expect(ast?.formId).toBe("test-form")
      expect(ast?.title).toBe("Single Quotes")
      expect(ast?.questions[0].id).toBe("theme")
      expect(ast?.questions[0].options).toHaveLength(3)
    })

    it("handles self-closing tag discrepancies (<field ...> without trailing slash)", () => {
      const xml = `
<question-form id="unclosed-fields">
  <field name="f1" type="text" label="First Field">
  <field name="f2" type="textarea" label="Second Field" />
</question-form>`

      const ast = parseQuestionForm(xml)
      expect(ast).not.toBeNull()
      expect(ast?.questions).toHaveLength(2)
      expect(ast?.questions[0].id).toBe("f1")
      expect(ast?.questions[1].id).toBe("f2")
    })

    it("loosely aliases common LLM hallucinated field types", () => {
      const xml = `
<question-form id="aliased-types">
  <field name="q_drop" type="dropdown" label="Dropdown" options="A, B" />
  <field name="q_choice" type="choice" label="Choice" options="X, Y" />
  <field name="q_single" type="single-select" label="Single Select" options="1, 2" />
  <field name="q_para" type="paragraph" label="Paragraph" />
  <field name="q_multi" type="multiline" label="Multiline" />
  <field name="q_long" type="longtext" label="Longtext" />
  <field name="q_str" type="string" label="String" />
  <field name="q_inp" type="input" label="Input" />
</question-form>`

      const ast = parseQuestionForm(xml)
      expect(ast).not.toBeNull()
      expect(ast?.questions[0].type).toBe("select")
      expect(ast?.questions[1].type).toBe("select")
      expect(ast?.questions[2].type).toBe("select")
      expect(ast?.questions[3].type).toBe("textarea")
      expect(ast?.questions[4].type).toBe("textarea")
      expect(ast?.questions[5].type).toBe("textarea")
      expect(ast?.questions[6].type).toBe("text")
      expect(ast?.questions[7].type).toBe("text")
    })

    it("parses comma-, pipe- (|), and semicolon-separated delimited options safely", () => {
      const commaXml = `<question-form><field name="f_c" type="select" options="Alpha, Beta, Gamma" default="Beta" /></question-form>`
      const pipeXml = `<question-form><field name="f_p" type="select" options="Compact (Linear) | Comfortable (Stripe) | Spacious (Apple)" default="Compact (Linear)" /></question-form>`
      const semiXml = `<question-form><field name="f_s" type="select" options="Tier 1; Tier 2; Tier 3" default="Tier 3" /></question-form>`

      const astC = parseQuestionForm(commaXml)
      expect(astC?.questions[0].options).toHaveLength(3)
      expect(astC?.questions[0].options?.[1].defaultChecked).toBe(true)

      const astP = parseQuestionForm(pipeXml)
      expect(astP?.questions[0].options).toHaveLength(3)
      expect(astP?.questions[0].options?.[0].label).toBe("Compact (Linear)")
      expect(astP?.questions[0].options?.[0].defaultChecked).toBe(true)

      const astS = parseQuestionForm(semiXml)
      expect(astS?.questions[0].options).toHaveLength(3)
      expect(astS?.questions[0].options?.[2].label).toBe("Tier 3")
      expect(astS?.questions[0].options?.[2].defaultChecked).toBe(true)
    })
  })

  describe("serializeAnswers", () => {
    it("returns empty self-closing tag for empty answers array", () => {
      expect(serializeAnswers([])).toBe("<clarification-answers />")
    })

    it("serializes single radio or text answer entry", () => {
      const answers: ClarificationAnswerEntry[] = [
        {
          questionId: "q1",
          questionLabel: "What visual theme should the analytics dashboard prioritize?",
          selectedValues: ["dark-slate"],
        },
      ]

      const serialized = serializeAnswers(answers)
      expect(serialized).toContain('<clarification-answers>')
      expect(serialized).toContain('</clarification-answers>')
      expect(serialized).toContain(
        '<answer id="q1" question="What visual theme should the analytics dashboard prioritize?">'
      )
      expect(serialized).toContain('<value>dark-slate</value>')
    })

    it("serializes multi-value checkbox answers", () => {
      const answers: ClarificationAnswerEntry[] = [
        {
          questionId: "q2",
          questionLabel: "Which chart modules should be displayed?",
          selectedValues: ["revenue-velocity", "live-activity-stream"],
        },
      ]

      const serialized = serializeAnswers(answers)
      expect(serialized).toContain('<value>revenue-velocity</value>')
      expect(serialized).toContain('<value>live-activity-stream</value>')
    })

    it("escapes special XML characters in answers and question labels", () => {
      const answers: ClarificationAnswerEntry[] = [
        {
          questionId: "q3",
          questionLabel: "Brand & Company <Name>",
          selectedValues: ['Acme "Pro" & <Lite>'],
        },
      ]

      const serialized = serializeAnswers(answers)
      expect(serialized).toContain('question="Brand &amp; Company &lt;Name&gt;"')
      expect(serialized).toContain('<value>Acme &quot;Pro&quot; &amp; &lt;Lite&gt;</value>')
      expect(serialized).not.toContain('<value>Acme "Pro"')
    })

    it("serializes multiple mixed answers in structured XML hierarchy", () => {
      const answers: ClarificationAnswerEntry[] = [
        {
          questionId: "q1",
          questionLabel: "Theme",
          selectedValues: ["dark-mode"],
        },
        {
          questionId: "q2",
          questionLabel: "Features",
          selectedValues: ["charts", "export"],
        },
        {
          questionId: "q3",
          questionLabel: "Optional Notes",
          selectedValues: [],
        },
      ]

      const serialized = serializeAnswers(answers)
      expect(serialized.startsWith("<clarification-answers>")).toBe(true)
      expect(serialized.endsWith("</clarification-answers>")).toBe(true)
      expect(serialized).toContain('<answer id="q1" question="Theme">')
      expect(serialized).toContain('<answer id="q2" question="Features">')
      expect(serialized).toContain('<answer id="q3" question="Optional Notes" />')
    })
  })

  describe("IQuestionFormParser object interface", () => {
    it("implements IQuestionFormParser interface methods correctly", () => {
      expect(typeof questionFormParser.parseForm).toBe("function")
      expect(typeof questionFormParser.serializeAnswers).toBe("function")

      const xml = `<question-form id="test" title="T"><question id="q" type="text"><label>L</label></question></question-form>`
      const ast = questionFormParser.parseForm(xml)
      expect(ast?.title).toBe("T")

      const serialized = questionFormParser.serializeAnswers([])
      expect(serialized).toBe("<clarification-answers />")
    })
  })
})
