import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  type ReactNode,
  type Dispatch,
  type SetStateAction,
} from "react"
import {
  createDefaultComposerConfig,
  type ComposerConfig,
  type ComposerAssets,
  type CompiledPromptResult,
} from "../lib/composer/composer-types"
import { promptComposer } from "../lib/composer/prompt-composer"
import {
  catalogService as defaultCatalogService,
  type ICatalogService,
} from "../lib/catalog/catalog-service"
import {
  getUserMemory,
  setUserMemory,
  getDraftBrief,
  setDraftBrief,
} from "../lib/storage/persistence"
import {
  exportPrompt,
  type AgentExportPackage,
} from "../lib/export"
import type { ClarificationAnswerEntry } from "../lib/clarification/question-form-types"
import {
  ComposerContext,
  type ComposerContextValue,
  type ActiveAgentTarget,
  type ExportOutput,
} from "./composer-context-def"

export interface ComposerProviderProps {
  readonly children: ReactNode
  readonly catalogService?: ICatalogService
  readonly initialConfig?: ComposerConfig
  readonly initialAssets?: ComposerAssets
  readonly autoPersist?: boolean
  readonly debounceMs?: number
}

export function ComposerProvider({
  children,
  catalogService = defaultCatalogService,
  initialConfig,
  initialAssets,
  autoPersist = true,
  debounceMs = 100,
}: ComposerProviderProps) {
  // Compute initial config, restoring from persistence if requested
  const getInitialConfig = (): ComposerConfig => {
    if (initialConfig) return initialConfig
    const base = createDefaultComposerConfig()
    if (autoPersist) {
      const savedMemory = getUserMemory()
      const savedBrief = getDraftBrief()
      return {
        ...base,
        layer8UserMemory: savedMemory ?? base.layer8UserMemory,
        layer9BriefAndClarification: savedBrief
          ? {
              ...base.layer9BriefAndClarification,
              ...savedBrief,
            }
          : base.layer9BriefAndClarification,
      }
    }
    return base
  }

  const [config, setConfigState] = useState<ComposerConfig>(getInitialConfig)
  const [assets, setAssetsState] = useState<ComposerAssets>(initialAssets ?? {})
  const [agentTarget, setAgentTarget] = useState<ActiveAgentTarget>("generic-llm")
  const [rawAiResponse, setRawAiResponse] = useState<string>("")
  const [clarificationHistory] = useState<readonly string[]>([])

  // Mutable refs to enable synchronous reads inside compileNow and update handlers
  const currentConfigRef = useRef<ComposerConfig>(config)
  const currentAssetsRef = useRef<ComposerAssets>(assets)
  const lastCompiledConfigRef = useRef<ComposerConfig>(config)
  const lastCompiledAssetsRef = useRef<ComposerAssets>(assets)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isInitialMount = useRef<boolean>(true)

  // Synchronous config and assets updaters that keep refs in sync immediately
  const setConfig: Dispatch<SetStateAction<ComposerConfig>> = useCallback(
    (action) => {
      setConfigState((prev) => {
        const next = typeof action === "function" ? action(prev) : action
        currentConfigRef.current = next
        return next
      })
    },
    []
  )

  const setAssets: Dispatch<SetStateAction<ComposerAssets>> = useCallback(
    (action) => {
      setAssetsState((prev) => {
        const next = typeof action === "function" ? action(prev) : action
        currentAssetsRef.current = next
        return next
      })
    },
    []
  )

  // Immediately compile initial state using initial values
  const [compiledPrompt, setCompiledPrompt] = useState<CompiledPromptResult>(() =>
    promptComposer.compile(config, assets)
  )
  const [isDebouncing, setIsDebouncing] = useState<boolean>(false)

  // Synchronous compilation helper
  const compileNow = useCallback((overrideConfig?: ComposerConfig) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
      debounceTimerRef.current = null
    }
    const configToCompile = overrideConfig ?? currentConfigRef.current
    const assetsToCompile = currentAssetsRef.current
    const result = promptComposer.compile(configToCompile, assetsToCompile)
    lastCompiledConfigRef.current = configToCompile
    lastCompiledAssetsRef.current = assetsToCompile
    setCompiledPrompt(result)
    setIsDebouncing(false)
  }, [])

  // Schedule debounced recompilation on config or assets changes
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }

    // If current state has already been compiled (e.g. by compileNow()), skip debounce
    if (
      config === lastCompiledConfigRef.current &&
      assets === lastCompiledAssetsRef.current
    ) {
      return
    }

    setIsDebouncing(true)
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    debounceTimerRef.current = setTimeout(() => {
      compileNow()
    }, debounceMs)

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [config, assets, debounceMs, compileNow])

  // Auto-persist Layer 8 & 9 to localStorage
  useEffect(() => {
    if (!autoPersist) return
    setUserMemory(config.layer8UserMemory)
  }, [config.layer8UserMemory, autoPersist])

  useEffect(() => {
    if (!autoPersist) return
    setDraftBrief(config.layer9BriefAndClarification)
  }, [config.layer9BriefAndClarification, autoPersist])

  // Fine-grained layer update
  const updateLayer = useCallback(
    <K extends keyof ComposerConfig>(
      layerKey: K,
      patch: Partial<ComposerConfig[K]>
    ) => {
      const next: ComposerConfig = {
        ...currentConfigRef.current,
        [layerKey]: {
          ...currentConfigRef.current[layerKey],
          ...patch,
        },
      }
      currentConfigRef.current = next
      setConfigState(next)
    },
    []
  )

  // Reset config to defaults
  const resetConfig = useCallback(() => {
    const next = createDefaultComposerConfig()
    currentConfigRef.current = next
    currentAssetsRef.current = {}
    setConfigState(next)
    setAssetsState({})
  }, [])

  // Design system selection & bundle asset retrieval
  const selectDesignSystem = useCallback(
    async (systemId: string | undefined) => {
      if (!systemId) {
        updateLayer("layer5BrandContract", {
          selectedSystemId: undefined,
        })
        const nextAssets = { ...currentAssetsRef.current }
        delete nextAssets.designSystem
        currentAssetsRef.current = nextAssets
        setAssetsState(nextAssets)
        return
      }

      updateLayer("layer5BrandContract", {
        selectedSystemId: systemId,
        enabled: true,
      })

      try {
        const bundle = await catalogService.fetchDesignSystemBundle(systemId)
        const nextAssets = {
          ...currentAssetsRef.current,
          designSystem: bundle,
        }
        currentAssetsRef.current = nextAssets
        setAssetsState(nextAssets)
      } catch (err) {
        console.warn(`Failed to fetch design system bundle for '${systemId}':`, err)
      }
    },
    [catalogService, updateLayer]
  )

  // Craft rule toggle & asset retrieval
  const toggleCraftRule = useCallback(
    async (ruleId: string) => {
      const currentRules = currentConfigRef.current.layer6CraftRules.selectedRuleIds
      const isSelected = currentRules.includes(ruleId)

      if (isSelected) {
        updateLayer("layer6CraftRules", {
          selectedRuleIds: currentRules.filter((id) => id !== ruleId),
        })
      } else {
        updateLayer("layer6CraftRules", {
          selectedRuleIds: [...currentRules, ruleId],
        })

        // Fetch markdown asset content if needed
        try {
          const catalog = catalogService.getLoadedCatalog()
          const ruleEntry = catalog?.craftRules.find((r) => r.id === ruleId)
          const assetPath = ruleEntry?.assetPath ?? `data/craft/${ruleId}.md`
          const content = await catalogService.fetchAssetContent(assetPath)

          const nextAssets = {
            ...currentAssetsRef.current,
            craftRules: {
              ...currentAssetsRef.current.craftRules,
              [ruleId]: content,
            },
          }
          currentAssetsRef.current = nextAssets
          setAssetsState(nextAssets)
        } catch (err) {
          console.warn(`Failed to fetch craft rule content for '${ruleId}':`, err)
        }
      }
    },
    [catalogService, updateLayer]
  )

  // Layer 9 helpers
  const setUserObjective = useCallback(
    (userObjective: string) => {
      updateLayer("layer9BriefAndClarification", { userObjective })
    },
    [updateLayer]
  )

  const setFeatureRequirements = useCallback(
    (featureRequirements: readonly string[]) => {
      updateLayer("layer9BriefAndClarification", { featureRequirements })
    },
    [updateLayer]
  )

  const addClarificationAnswer = useCallback(
    (answer: ClarificationAnswerEntry) => {
      const currentAnswers =
        currentConfigRef.current.layer9BriefAndClarification.clarificationAnswers
      const existingIdx = currentAnswers.findIndex(
        (a) => a.questionId === answer.questionId
      )

      let nextAnswers: readonly ClarificationAnswerEntry[]
      if (existingIdx >= 0) {
        nextAnswers = currentAnswers.map((a, idx) =>
          idx === existingIdx ? answer : a
        )
      } else {
        nextAnswers = [...currentAnswers, answer]
      }

      updateLayer("layer9BriefAndClarification", {
        clarificationAnswers: nextAnswers,
      })
    },
    [updateLayer]
  )

  const clearClarificationAnswers = useCallback(() => {
    updateLayer("layer9BriefAndClarification", {
      clarificationAnswers: [],
    })
  }, [updateLayer])

  // Export package generator
  const getExportOutput = useCallback((): ExportOutput => {
    if (agentTarget === "prompt-xml") {
      return {
        format: "prompt-xml",
        primaryClipboardText: compiledPrompt.fullPrompt,
        downloadableFiles: [
          {
            filename: "open-studio-prompt.xml",
            content: compiledPrompt.fullPrompt,
            mimeType: "application/xml",
          },
        ],
      }
    }

    const exportPkg: AgentExportPackage = exportPrompt(
      agentTarget,
      compiledPrompt,
      currentConfigRef.current
    )

    return {
      format: agentTarget,
      primaryClipboardText: exportPkg.primaryClipboardText,
      secondaryClipboardText: exportPkg.secondaryClipboardText,
      downloadableFiles: exportPkg.downloadableFiles,
    }
  }, [agentTarget, compiledPrompt])

  const value: ComposerContextValue = useMemo(
    () => ({
      config,
      assets,
      compiledPrompt,
      isDebouncing,
      agentTarget,
      rawAiResponse,
      clarificationHistory,
      setConfig,
      setAssets,
      updateLayer,
      resetConfig,
      selectDesignSystem,
      toggleCraftRule,
      setUserObjective,
      setFeatureRequirements,
      addClarificationAnswer,
      clearClarificationAnswers,
      setRawAiResponse,
      setAgentTarget,
      compileNow,
      getExportOutput,
    }),
    [
      config,
      assets,
      compiledPrompt,
      isDebouncing,
      agentTarget,
      rawAiResponse,
      clarificationHistory,
      setConfig,
      setAssets,
      updateLayer,
      resetConfig,
      selectDesignSystem,
      toggleCraftRule,
      setUserObjective,
      setFeatureRequirements,
      addClarificationAnswer,
      clearClarificationAnswers,
      compileNow,
      getExportOutput,
    ]
  )

  return (
    <ComposerContext.Provider value={value}>
      {children}
    </ComposerContext.Provider>
  )
}
