import { useContext } from "react"
import {
  CatalogContext,
  type CatalogContextValue,
} from "../context/catalog-context-def"

export function useCatalog(): CatalogContextValue {
  const context = useContext(CatalogContext)
  if (!context) {
    throw new Error("useCatalog must be used within a CatalogProvider")
  }
  return context
}

export type { CatalogContextValue }
