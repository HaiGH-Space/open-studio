# Specification: Scenario A (2-Turn External Roundtrip Loop)

**Feature ID:** `turn-roundtrip-loop`  
**Status:** In Review / Specification Ready  
**Reference:** SPEC-open-studio.md Section 7.2, 7.3, 7.4  

---

## 1. Objective

Enable a seamless, zero-daemon, 2-turn external roundtrip prompt workflow in Open Studio, mirroring Open Design's discovery-to-execution mental model:
- **Turn 1 (Discovery & Question Elicitation):** Open Studio generates a prompt containing Layers 1–8 + strict Discovery Directive with an embedded micro-schema, completely omitting Layer 9 (`<clarification-answers>`). Layer 8 contains the user objective, feature requirements, and persistent preferences so the external model has full context. The external model is instructed not to write code yet, but to analyze Layer 8 and return an inline `<question-form>` XML artifact conforming to our micro-schema.
- **Intermission (External Ingestion):** The user pastes the raw AI response containing `<question-form>` into Open Studio's Clarification Zone. The fuzzy XML extractor strips prose and markdown code fences, and the in-browser AST parser validates and renders an interactive question form.
- **Turn 2 (Final Execution & Code Production):** The user answers the form, which packages answers into serialized `<clarification-answers>` strictly in Layer 9 (placed immediately after Layer 8). Open Studio compiles the Turn 2 Execution Prompt (Layers 1–8 + Layer 9 + Execution Mandate). The user copies this prompt back to their coding agent to produce the final codebase.

---

## 2. Tech Stack & Commands

- **Framework:** React 19 + TypeScript (Strict Mode)
- **Styling:** Tailwind CSS v4 + Base UI primitives (`@base-ui/react`) + `cva`
- **Tokenizer:** `gpt-tokenizer` (in-browser BPE estimation)
- **Test Suite:** Vitest with jsdom/happy-dom simulation

```bash
# Run unit & integration tests
pnpm --filter web test

# Run tests in watch mode
pnpm --filter web test -- --watch

# Type check
pnpm --filter web typecheck

# Production static build
pnpm --filter web build
```

---

## 3. Project Structure

```
web/src/
├── lib/
│   ├── composer/
│   │   ├── composer-types.ts      # TurnMode, IPromptComposer contract
│   │   ├── layer-compilers.ts     # Layer 8 (User Brief) & Layer 9 (Clarification Answers)
│   │   └── prompt-composer.ts     # compilePrompt(config, assets, turn) & composeSystemPrompt
│   └── clarification/
│       ├── question-form-types.ts # AST contracts & answer types
│       └── question-form-parser.ts# Micro-schema & legacy AST parser, fuzzy extractor, serializer
├── context/
│   ├── composer-context-def.ts    # RoundtripStep, Context Value interface
│   └── ComposerContext.tsx        # 5-step discrete state machine & fuzzy ingestion
├── components/
│   ├── cockpit/
│   │   ├── RoundtripPhaseHeader.tsx # 3-phase top stepper indicator
│   │   ├── ComposerManager.tsx    # Center column orchestrator
│   │   ├── PromptInspector.tsx    # Turn toggle, Token gauge, Layer breakdown
│   │   └── PromptOutputViewer.tsx # Active turn prompt viewer & copy button
│   └── clarification/
│       ├── ClarificationZone.tsx   # Dropzone, XML ingestion, interactive form
│       ├── QuestionFieldRenderer.tsx # Radio, checkbox, text, textarea inputs
│       └── QuestionFormModal.tsx  # Modal fallback for clarification
tests/
├── prompt-composer.test.ts        # Turn 1 vs Turn 2 compilation & micro-schema tests
├── clarification-loop.test.tsx    # Fuzzy extraction & micro-schema AST parsing tests
├── composer-context.test.tsx      # State machine step transitions tests
└── cockpit-e2e.test.tsx           # Full end-to-end 2-turn roundtrip integration test
```

---

## 4. Code Style & Architecture Conventions

### Turn Mode Contract
```typescript
export type TurnMode = 'turn1_discovery' | 'turn2_execution';

export interface CompiledPromptResult {
  readonly fullPrompt: string;
  readonly systemPromptBlock: string;
  readonly userPromptBlock: string;
  readonly totalTokens: number;
  readonly layerBreakdown: readonly LayerCompilationResult[];
  readonly generatedAt: string;
  readonly turnMode: TurnMode;
}
```

### Discrete State Machine
```typescript
export type RoundtripStep =
  | "STEP_1_CONFIGURING"
  | "STEP_1_PROMPT_READY"
  | "AWAITING_AI_RESPONSE"
  | "CLARIFICATION_ACTIVE"
  | "STEP_2_PROMPT_READY";
```

### Directives
- **Discovery Directive (Turn 1 with Authoritative Micro-Schema):**
```xml
<discovery-directive>
  DISCOVERY & QUESTION ELICITATION PROTOCOL:
  - Do NOT write code, scaffold files, or complete the design implementation yet.
  - Analyze the user brief (Layer 8), authoritative constraints, brand contract, and craft requirements.
  - Elicit design clarifications by outputting an inline <question-form> XML artifact conforming EXACTLY to this schema:

  <question-form>
    <field name="field_name" type="select" label="Question Label" options="Option A, Option B, Option C" default="Option A" />
    <field name="another_field" type="text" label="Short text question" placeholder="Brief hint..." />
  </question-form>

  - Focus questions strictly on ambiguities in layout, target audience, visual hierarchy, or interaction density.
</discovery-directive>
```

- **Execution Mandate (Turn 2):**
```xml
<execution-mandate>
  FINAL PRODUCTION DIRECTIVE:
  - All design directions and requirements are finalized in <clarification-answers>.
  - Do NOT ask further questions and do NOT output <question-form>.
  - Proceed immediately to generate the complete production-grade files and implementation code.
</execution-mandate>
```

---

## 5. Layer Boundaries & Precedence

1. **Layer 8: User Objective & Initial Brief:**
   - Always enabled and included in both `turn1_discovery` and `turn2_execution`.
   - Contains: `<objective>...</objective>`, `<requirements>...</requirements>`, `<user-memory-rules>...</user-memory-rules>`.
2. **Layer 9: Clarification Answers:**
   - In `turn1_discovery`: Completely omitted (`enabled: false`, `tokenCount: 0`, omitted from prompt).
   - In `turn2_execution`: Populated with serialized `<clarification-answers>` and placed immediately after Layer 8, right before `<execution-mandate>`.

---

## 6. Testing Strategy

1. **Unit Tests (`prompt-composer.test.ts`):**
   - Verify `turn1_discovery` outputs `<discovery-directive>` containing the micro-schema and includes Layer 8 while completely excluding Layer 9.
   - Verify `turn2_execution` outputs `<execution-mandate>` and includes Layer 9 with `<clarification-answers>`.
   - Verify `composeSystemPrompt` with different turn modes.
2. **Clarification Loop & Fuzzy Ingestion Tests (`clarification-loop.test.tsx`):**
   - Verify `parseAndIngestAiResponse` successfully extracts `<question-form>` wrapped in conversational prose and markdown code blocks (```` ```xml ... ``` ````).
   - Verify parser converts `<field name="..." type="select" ... />` into valid `QuestionNode` with parsed options.
3. **Context & State Machine Tests (`composer-context.test.tsx`):**
   - Verify state transitions across all 5 steps.
   - Test `skipClarification()` transitioning directly to `STEP_2_PROMPT_READY`.
4. **Integration Tests (`cockpit-e2e.test.tsx`):**
   - End-to-end verification: Initial setup -> Turn 1 prompt -> Fuzzy paste XML -> Render form -> Submit -> Turn 2 prompt with Layer 9 answers -> Clipboard copy.

---

## 7. Success Criteria

1. `compilePrompt(config, assets, 'turn1_discovery')` produces Turn 1 prompt with Discovery Directive and micro-schema, including Layer 8 and completely omitting Layer 9.
2. `compilePrompt(config, assets, 'turn2_execution')` produces Turn 2 prompt with Layer 8 and Layer 9 `<clarification-answers>` followed by `<execution-mandate>`.
3. `parseAndIngestAiResponse` extracts XML from fuzzy conversational inputs and parses micro-schema `<field>` tags into valid interactive fields.
4. In `ComposerContext`, `roundtripStep` transitions cleanly through all 5 states.
5. Center column displays `ClarificationZone` during `AWAITING_AI_RESPONSE` and `CLARIFICATION_ACTIVE` with form validation and skip option.
6. Right column toggle switches between Turn 1 and Turn 2 prompts, dynamically updating token counts and clipboard actions.
7. 100% of Vitest tests pass cleanly.
