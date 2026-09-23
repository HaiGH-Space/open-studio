import React, { act } from "react"
import { createRoot } from "react-dom/client"
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { ComposerProvider } from "../src/context/ComposerContext"
import { CatalogProvider } from "../src/context/CatalogContext"
import { QuestionFieldRenderer } from "../src/components/clarification/QuestionFieldRenderer"
import { QuestionFormModal } from "../src/components/clarification/QuestionFormModal"
import { Layer9BriefClarification } from "../src/components/layers/Layer9BriefClarification"
import { ComposerManager } from "../src/components/cockpit/ComposerManager"
import type { QuestionNode } from "../src/lib/clarification/question-form-types"
import type { ComposerConfig } from "../src/lib/composer/composer-types"
import { createDefaultComposerConfig } from "../src/lib/composer/composer-types"
import type { ICatalogService, CatalogIndex } from "../src/lib/catalog/catalog-types"

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true

/** Sets an input's value using the native setter so React picks up the change. */
function setNativeInputValue(el: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    "value"
  )?.set
  setter?.call(el, value)
  el.dispatchEvent(new Event("input", { bubbles: true }))
  el.dispatchEvent(new Event("change", { bubbles: true }))
}

/** Sets a textarea's value using the native setter so React picks up the change. */
function setNativeTextareaValue(el: HTMLTextAreaElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(
    window.HTMLTextAreaElement.prototype,
    "value"
  )?.set
  setter?.call(el, value)
  el.dispatchEvent(new Event("input", { bubbles: true }))
  el.dispatchEvent(new Event("change", { bubbles: true }))
}

const sampleXml = `
<question-form id="onboarding-flow" title="Onboarding Flow Clarification">
  <description>Please resolve design ambiguities for the new user onboarding flow.</description>
  <question id="theme" type="radio" required="true">
    <label>Preferred color theme?</label>
    <option value="dark" checked="true">Dark</option>
    <option value="light">Light</option>
  </question>
  <question id="auth-methods" type="checkbox">
    <label>Authentication methods supported?</label>
    <option value="oauth-google">Google OAuth</option>
    <option value="passkey" checked="true">Passkeys</option>
    <option value="magic-link">Magic Link</option>
  </question>
  <question id="custom-domain" type="text" placeholder="e.g. app.example.com">
    <label>Custom domain name?</label>
  </question>
  <question id="notes" type="textarea" placeholder="Any additional notes...">
    <label>Extra specifications?</label>
  </question>
</question-form>
`.trim()

const emptyCatalog: CatalogIndex = {
  schemaVersion: "open-studio-catalog/v1",
  generatedAt: "2026-09-22T00:00:00.000Z",
  stats: { totalDesignSystems: 0, totalCraftRules: 0, totalSkills: 0, totalTemplates: 0 },
  taxonomies: { categories: [], tags: [], surfaces: [] },
  designSystems: [],
  craftRules: [],
  skills: [],
  templates: [],
}

function createMockCatalogService(): ICatalogService {
  return {
    loadCatalog: vi.fn().mockResolvedValue(emptyCatalog),
    getLoadedCatalog: vi.fn().mockReturnValue(emptyCatalog),
    fetchDesignTokens: vi.fn().mockResolvedValue(""),
    fetchDesignSystemBundle: vi.fn().mockResolvedValue({ id: "mock", name: "Mock" }),
    fetchAssetContent: vi.fn().mockResolvedValue(""),
    clearCache: vi.fn(),
    hasAssetCached: vi.fn().mockReturnValue(true),
  }
}

describe("Interactive Clarification Loop & Layer 9 (Task 14)", () => {
  let container: HTMLDivElement
  let root: ReturnType<typeof createRoot>
  let mockCatalogService: ICatalogService

  beforeEach(() => {
    container = document.createElement("div")
    document.body.appendChild(container)
    root = createRoot(container)
    mockCatalogService = createMockCatalogService()
  })

  afterEach(() => {
    act(() => {
      root.unmount()
    })
    container.remove()
    document.body.innerHTML = ""
    vi.restoreAllMocks()
  })

  function renderWithProviders(
    ui: React.ReactElement,
    options?: { config?: ComposerConfig }
  ) {
    act(() => {
      root.render(
        <CatalogProvider catalogService={mockCatalogService} autoLoad={false}>
          <ComposerProvider
            catalogService={mockCatalogService}
            initialConfig={options?.config}
            autoPersist={false}
            debounceMs={5}
          >
            {ui}
          </ComposerProvider>
        </CatalogProvider>
      )
    })
  }

  describe("QuestionFieldRenderer", () => {
    it("renders a radio question and notifies onChange on selection", () => {
      const radioQuestion: QuestionNode = {
        id: "theme-choice",
        type: "radio",
        label: "Select your theme",
        required: true,
        options: [
          { value: "light", label: "Light Theme" },
          { value: "dark", label: "Dark Theme" },
        ],
      }
      const handleChange = vi.fn()

      act(() => {
        root.render(
          <QuestionFieldRenderer
            question={radioQuestion}
            value={["light"]}
            onChange={handleChange}
          />
        )
      })

      expect(container.textContent).toContain("Select your theme")
      expect(container.textContent).toContain("Light Theme")
      expect(container.textContent).toContain("Dark Theme")

      // Find the second radio button and click it
      const darkOption = container.querySelector(
        'input[type="radio"][value="dark"]'
      ) as HTMLInputElement
      expect(darkOption).not.toBeNull()

      act(() => {
        darkOption.click()
      })

      expect(handleChange).toHaveBeenCalledWith(["dark"])
    })

    it("renders a checkbox question and handles multi-select toggling", () => {
      const checkboxQuestion: QuestionNode = {
        id: "modules",
        type: "checkbox",
        label: "Select modules",
        options: [
          { value: "analytics", label: "Analytics" },
          { value: "billing", label: "Billing" },
          { value: "users", label: "User Management" },
        ],
      }
      const handleChange = vi.fn()

      act(() => {
        root.render(
          <QuestionFieldRenderer
            question={checkboxQuestion}
            value={["analytics"]}
            onChange={handleChange}
          />
        )
      })

      const billingInput = container.querySelector(
        'input[type="checkbox"][value="billing"]'
      ) as HTMLInputElement
      expect(billingInput).not.toBeNull()
      expect(billingInput.checked).toBe(false)

      // Check billing
      act(() => {
        billingInput.click()
      })
      expect(handleChange).toHaveBeenCalledWith(["analytics", "billing"])

      // Uncheck analytics
      const analyticsInput = container.querySelector(
        'input[type="checkbox"][value="analytics"]'
      ) as HTMLInputElement
      expect(analyticsInput.checked).toBe(true)

      act(() => {
        analyticsInput.click()
      })
      expect(handleChange).toHaveBeenCalledWith([])
    })

    it("renders a text input and updates value on change", () => {
      const textQuestion: QuestionNode = {
        id: "app-name",
        type: "text",
        label: "Application Name",
        placeholder: "e.g. Open Studio",
        required: true,
      }
      const handleChange = vi.fn()

      act(() => {
        root.render(
          <QuestionFieldRenderer
            question={textQuestion}
            value={["My App"]}
            onChange={handleChange}
          />
        )
      })

      const input = container.querySelector('input[type="text"]') as HTMLInputElement
      expect(input).not.toBeNull()
      expect(input.value).toBe("My App")
      expect(input.placeholder).toBe("e.g. Open Studio")

      act(() => {
        setNativeInputValue(input, "Updated App")
      })

      expect(handleChange).toHaveBeenCalledWith(["Updated App"])
    })

    it("renders a textarea input and updates value on change", () => {
      const textareaQuestion: QuestionNode = {
        id: "details",
        type: "textarea",
        label: "Additional Details",
        placeholder: "Describe specs...",
      }
      const handleChange = vi.fn()

      act(() => {
        root.render(
          <QuestionFieldRenderer
            question={textareaQuestion}
            value={["Initial details"]}
            onChange={handleChange}
          />
        )
      })

      const textarea = container.querySelector("textarea") as HTMLTextAreaElement
      expect(textarea).not.toBeNull()
      expect(textarea.value).toBe("Initial details")

      act(() => {
        setNativeTextareaValue(textarea, "New multi-line details")
      })

      expect(handleChange).toHaveBeenCalledWith(["New multi-line details"])
    })
  })

  describe("QuestionFormModal", () => {
    it("parses valid XML and pre-populates defaultChecked options", () => {
      renderWithProviders(
        <QuestionFormModal open={true} initialRawText={sampleXml} />
      )

      expect(document.body.textContent).toContain("Onboarding Flow Clarification")
      expect(document.body.textContent).toContain("Please resolve design ambiguities")
      expect(document.body.textContent).toContain("Preferred color theme?")
      expect(document.body.textContent).toContain("Authentication methods supported?")

      // Check pre-selected options
      const darkRadio = document.body.querySelector(
        'input[type="radio"][value="dark"]'
      ) as HTMLInputElement
      expect(darkRadio?.checked).toBe(true)

      const passkeyCheck = document.body.querySelector(
        'input[type="checkbox"][value="passkey"]'
      ) as HTMLInputElement
      expect(passkeyCheck?.checked).toBe(true)
    })

    it("shows error warning when pasted text has no <question-form> XML", () => {
      renderWithProviders(
        <QuestionFormModal open={true} initialRawText="Here is some text without XML." />
      )

      expect(document.body.textContent).toContain("No valid <question-form> XML detected")
      const submitBtn = document.body.querySelector(
        'button[data-slot="submit-answers-btn"]'
      ) as HTMLButtonElement
      expect(submitBtn?.disabled).toBe(true)
    })

    it("validates required questions and submits completed answers", () => {
      const onSubmitted = vi.fn()
      renderWithProviders(
        <QuestionFormModal
          open={true}
          initialRawText={sampleXml}
          onAnswersSubmitted={onSubmitted}
        />
      )

      // Fill in custom domain text
      const domainInput = document.body.querySelector(
        'input[placeholder="e.g. app.example.com"]'
      ) as HTMLInputElement
      expect(domainInput).not.toBeNull()

      act(() => {
        setNativeInputValue(domainInput, "studio.internal")
      })

      // Submit
      const submitBtn = document.body.querySelector(
        'button[data-slot="submit-answers-btn"]'
      ) as HTMLButtonElement
      expect(submitBtn).not.toBeNull()
      expect(submitBtn.disabled).toBe(false)

      act(() => {
        submitBtn.click()
      })

      expect(onSubmitted).toHaveBeenCalledTimes(1)
      const submittedAnswers = onSubmitted.mock.calls[0][0]
      expect(submittedAnswers.length).toBeGreaterThanOrEqual(3)

      const themeAnswer = submittedAnswers.find((a: any) => a.questionId === "theme")
      expect(themeAnswer.selectedValues).toEqual(["dark"])

      const domainAnswer = submittedAnswers.find((a: any) => a.questionId === "custom-domain")
      expect(domainAnswer.selectedValues).toEqual(["studio.internal"])
    })
  })

  describe("Layer9BriefClarification", () => {
    it("renders user objective textarea and handles text updates", () => {
      const config = createDefaultComposerConfig()
      renderWithProviders(<Layer9BriefClarification />, { config })

      const objectiveTextarea = container.querySelector(
        'textarea[data-slot="layer9-objective-input"]'
      ) as HTMLTextAreaElement
      expect(objectiveTextarea).not.toBeNull()

      act(() => {
        objectiveTextarea.value = "Build an admin billing portal"
        objectiveTextarea.dispatchEvent(new Event("input", { bubbles: true }))
        objectiveTextarea.dispatchEvent(new Event("change", { bubbles: true }))
      })

      expect(objectiveTextarea.value).toBe("Build an admin billing portal")
    })

    it("allows adding and removing feature requirements checklist items", () => {
      const config = createDefaultComposerConfig()
      renderWithProviders(<Layer9BriefClarification />, { config })

      const featureInput = container.querySelector(
        'input[data-slot="layer9-feature-input"]'
      ) as HTMLInputElement
      const addBtn = container.querySelector(
        'button[data-slot="layer9-add-feature-btn"]'
      ) as HTMLButtonElement

      expect(featureInput).not.toBeNull()
      expect(addBtn).not.toBeNull()

      // Add feature 1
      act(() => {
        setNativeInputValue(featureInput, "Export CSV statements")
      })

      act(() => {
        addBtn.click()
      })

      expect(container.textContent).toContain("Export CSV statements")

      // Add feature 2
      act(() => {
        setNativeInputValue(featureInput, "Webhook event logs")
      })

      act(() => {
        addBtn.click()
      })

      expect(container.textContent).toContain("Webhook event logs")

      // Remove feature 1
      const removeBtn = container.querySelector(
        'button[data-slot="layer9-remove-feature-0"]'
      ) as HTMLButtonElement
      expect(removeBtn).not.toBeNull()

      act(() => {
        removeBtn.click()
      })

      expect(container.textContent).not.toContain("Export CSV statements")
      expect(container.textContent).toContain("Webhook event logs")
    })

    it("renders answered questions summary and clears answers on request", () => {
      const config: ComposerConfig = {
        ...createDefaultComposerConfig(),
        layer9BriefAndClarification: {
          userObjective: "Test app",
          featureRequirements: ["Feature A"],
          clarificationAnswers: [
            {
              questionId: "q1",
              questionLabel: "Color Scheme",
              selectedValues: ["Dark Mode"],
            },
          ],
        },
      }

      renderWithProviders(<Layer9BriefClarification />, { config })

      expect(container.textContent).toContain("Color Scheme")
      expect(container.textContent).toContain("Dark Mode")

      const clearBtn = container.querySelector(
        'button[data-slot="clear-clarification-btn"]'
      ) as HTMLButtonElement
      expect(clearBtn).not.toBeNull()

      act(() => {
        clearBtn.click()
      })

      expect(container.textContent).not.toContain("Color Scheme")
    })

    it("opens QuestionFormModal when Paste AI Response button is clicked", () => {
      renderWithProviders(<Layer9BriefClarification />)

      const pasteBtn = container.querySelector(
        'button[data-slot="paste-ai-response-btn"]'
      ) as HTMLButtonElement
      expect(pasteBtn).not.toBeNull()

      act(() => {
        pasteBtn.click()
      })

      expect(document.body.querySelector('[data-slot="question-form-modal"]')).not.toBeNull()
    })
  })

  describe("ComposerManager L9 Integration", () => {
    it("renders L9 accordion item in ComposerManager", () => {
      renderWithProviders(<ComposerManager />)

      const l9Item = container.querySelector('[data-slot="layer-accordion-l9"]')
      expect(l9Item).not.toBeNull()
      expect(l9Item?.textContent).toContain("L9: Brief & Clarification")
    })
  })
})
