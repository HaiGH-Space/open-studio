/**
 * Catalog Client Service
 *
 * Implements ICatalogService to load and cache the catalog index and on-demand
 * static assets (DESIGN.md, USAGE.md, tokens.css, components.html, craft rules, skills).
 *
 * Features:
 * - In-memory caching for catalog-index.json and asset text
 * - In-flight promise deduplication to prevent redundant parallel network requests
 * - Condensed CSS custom properties extraction via layer-compilers
 * - Resilient error reporting for missing or failed asset requests
 */

import { condenseCssVariables } from "../composer/layer-compilers"
import type {
  CatalogIndex,
  DesignSystemBundle,
  ICatalogService,
} from "./catalog-types"

export interface CatalogServiceOptions {
  readonly baseUrl?: string
  readonly catalogIndexPath?: string
  readonly fetch?: typeof fetch
}

export class CatalogService implements ICatalogService {
  private readonly baseUrl: string
  private readonly catalogIndexPath: string
  private readonly fetchFn: typeof fetch

  private catalogIndexCache: CatalogIndex | null = null
  private inFlightCatalogPromise: Promise<CatalogIndex> | null = null

  private readonly assetCache = new Map<string, string>()
  private readonly inFlightAssetPromises = new Map<string, Promise<string>>()

  constructor(options?: CatalogServiceOptions) {
    this.baseUrl = options?.baseUrl?.replace(/\/+$/, "") ?? ""
    this.catalogIndexPath = options?.catalogIndexPath ?? "/catalog-index.json"

    if (options?.fetch) {
      this.fetchFn = options.fetch
    } else if (
      typeof globalThis !== "undefined" &&
      typeof globalThis.fetch === "function"
    ) {
      this.fetchFn = globalThis.fetch.bind(globalThis)
    } else {
      this.fetchFn = () => {
        throw new Error(
          "No fetch implementation available in the current environment"
        )
      }
    }
  }

  /**
   * Loads the cached catalog index or fetches it from /catalog-index.json.
   * Deduplicates concurrent requests so only one fetch is triggered.
   */
  async loadCatalog(): Promise<CatalogIndex> {
    if (this.catalogIndexCache !== null) {
      return this.catalogIndexCache
    }

    if (this.inFlightCatalogPromise !== null) {
      return this.inFlightCatalogPromise
    }

    const path = this.catalogIndexPath.startsWith("/")
      ? this.catalogIndexPath
      : `/${this.catalogIndexPath}`
    const url = `${this.baseUrl}${path}`

    this.inFlightCatalogPromise = (async () => {
      try {
        const response = await this.fetchFn(url)
        if (!response.ok) {
          throw new Error(
            `Failed to load catalog index from '${url}': ${response.status} ${response.statusText}`
          )
        }

        const data = (await response.json()) as CatalogIndex
        if (!data || data.schemaVersion !== "open-studio-catalog/v1") {
          throw new Error(
            `Invalid catalog schema version. Expected 'open-studio-catalog/v1', received '${data?.schemaVersion}'`
          )
        }

        this.catalogIndexCache = data
        return data
      } finally {
        this.inFlightCatalogPromise = null
      }
    })()

    return this.inFlightCatalogPromise
  }

  /**
   * Retrieves a raw Markdown, CSS, or HTML text file on demand.
   * Uses in-memory cache and deduplicates in-flight requests.
   */
  async fetchAssetContent(assetRelativePath: string): Promise<string> {
    const cleanPath = assetRelativePath.trim().replace(/^\/+/, "")
    if (!cleanPath) {
      return ""
    }

    if (this.assetCache.has(cleanPath)) {
      return this.assetCache.get(cleanPath)!
    }

    if (this.inFlightAssetPromises.has(cleanPath)) {
      return this.inFlightAssetPromises.get(cleanPath)!
    }

    const url = `${this.baseUrl}/${cleanPath}`

    const promise = (async () => {
      try {
        const response = await this.fetchFn(url)
        if (!response.ok) {
          throw new Error(
            `Failed to fetch asset '${assetRelativePath}': ${response.status} ${response.statusText}`
          )
        }

        const text = await response.text()
        this.assetCache.set(cleanPath, text)
        return text
      } finally {
        this.inFlightAssetPromises.delete(cleanPath)
      }
    })()

    this.inFlightAssetPromises.set(cleanPath, promise)
    return promise
  }

  /**
   * Retrieves full or condensed CSS tokens for a design system.
   */
  async fetchDesignTokens(
    systemId: string,
    mode: "full" | "condensed"
  ): Promise<string> {
    const catalog = await this.loadCatalog()
    const system = catalog.designSystems.find((ds) => ds.id === systemId)

    if (!system) {
      throw new Error(`Design system not found: '${systemId}'`)
    }

    if (!system.assetPaths.tokensCss || !system.availableFiles.hasTokensCss) {
      return ""
    }

    const rawTokens = await this.fetchAssetContent(system.assetPaths.tokensCss)

    if (mode === "condensed") {
      return condenseCssVariables(rawTokens)
    }

    return rawTokens
  }

  /**
   * Retrieves the bundled design system assets for composition.
   * Fetches available assets (usage, designMd, tokensCss, componentsHtml) in parallel.
   */
  async fetchDesignSystemBundle(systemId: string): Promise<DesignSystemBundle> {
    const catalog = await this.loadCatalog()
    const system = catalog.designSystems.find((ds) => ds.id === systemId)

    if (!system) {
      throw new Error(`Design system not found: '${systemId}'`)
    }

    const usagePromise =
      system.assetPaths.usage && system.availableFiles.hasUsage
        ? this.fetchAssetContent(system.assetPaths.usage)
        : Promise.resolve(undefined)

    const designMdPromise =
      system.assetPaths.designMd && system.availableFiles.hasDesignMd
        ? this.fetchAssetContent(system.assetPaths.designMd)
        : Promise.resolve(undefined)

    const tokensCssPromise =
      system.assetPaths.tokensCss && system.availableFiles.hasTokensCss
        ? this.fetchAssetContent(system.assetPaths.tokensCss)
        : Promise.resolve(undefined)

    const componentsHtmlPromise =
      system.assetPaths.componentsHtml &&
      system.availableFiles.hasComponentsHtml
        ? this.fetchAssetContent(system.assetPaths.componentsHtml)
        : Promise.resolve(undefined)

    const [usage, designMd, tokensCss, componentsHtml] = await Promise.all([
      usagePromise,
      designMdPromise,
      tokensCssPromise,
      componentsHtmlPromise,
    ])

    return {
      ...(usage !== undefined ? { usage } : {}),
      ...(designMd !== undefined ? { designMd } : {}),
      ...(tokensCss !== undefined ? { tokensCss } : {}),
      ...(componentsHtml !== undefined ? { componentsHtml } : {}),
    }
  }

  /**
   * Clears the in-memory cache for catalog index and assets.
   */
  clearCache(): void {
    this.catalogIndexCache = null
    this.inFlightCatalogPromise = null
    this.assetCache.clear()
    this.inFlightAssetPromises.clear()
  }

  /**
   * Returns whether a given asset path is currently cached.
   */
  hasAssetCached(assetRelativePath: string): boolean {
    const cleanPath = assetRelativePath.trim().replace(/^\/+/, "")
    return this.assetCache.has(cleanPath)
  }

  /**
   * Synchronously returns the cached catalog index if already loaded, or null.
   */
  getLoadedCatalog(): CatalogIndex | null {
    return this.catalogIndexCache
  }
}

export const catalogService = new CatalogService()
export type { DesignSystemBundle, ICatalogService }
