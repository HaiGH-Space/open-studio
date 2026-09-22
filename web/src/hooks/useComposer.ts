import { useContext } from "react"
import {
  ComposerContext,
  type ComposerContextValue,
  type ActiveAgentTarget,
  type ExportOutput,
} from "../context/composer-context-def"

export function useComposer(): ComposerContextValue {
  const context = useContext(ComposerContext)
  if (!context) {
    throw new Error("useComposer must be used within a ComposerProvider")
  }
  return context
}

export type { ComposerContextValue, ActiveAgentTarget, ExportOutput }
