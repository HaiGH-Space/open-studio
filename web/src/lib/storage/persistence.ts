/**
 * Open Studio LocalStorage Persistence Service
 *
 * Provides typed getters and setters for:
 * - Theme preferences (dark | light | system)
 * - User Memory & negative constraints (Layer 8)
 * - Draft brief auto-save (Layer 9)
 *
 * Resilient against:
 * - Non-browser / SSR environments (window is undefined)
 * - SecurityError / sandbox-blocked storage access
 * - QuotaExceededError via graceful in-memory fallback
 * - Malformed / corrupted JSON payloads
 */

import type {
  Layer8UserMemoryConfig,
  Layer9BriefAndClarificationConfig,
} from "../composer/composer-types"

export type Theme = "dark" | "light" | "system"

export const STORAGE_KEYS = {
  THEME: "theme",
  USER_MEMORY: "open-studio:user-memory",
  DRAFT_BRIEF: "open-studio:draft-brief",
} as const

export interface StorageAdapter {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
  clear(): void
}

/**
 * In-memory fallback storage adapter for non-browser or error environments.
 */
export class MemoryStorageAdapter implements StorageAdapter {
  private readonly store = new Map<string, string>()

  getItem(key: string): string | null {
    return this.store.get(key) ?? null
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value)
  }

  removeItem(key: string): void {
    this.store.delete(key)
  }

  clear(): void {
    this.store.clear()
  }
}

/**
 * Safe storage wrapper that intercepts errors (quota, security) and transparently
 * falls back to an in-memory store.
 */
export class SafeStorage implements StorageAdapter {
  private readonly primary: StorageAdapter | null
  private readonly fallback: MemoryStorageAdapter

  constructor(primary?: StorageAdapter | null) {
    if (primary !== undefined) {
      this.primary = primary
    } else {
      this.primary = SafeStorage.detectNativeStorage()
    }
    this.fallback = new MemoryStorageAdapter()
  }

  private static detectNativeStorage(): StorageAdapter | null {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        return window.localStorage
      }
    } catch {
      // Storage access blocked or threw SecurityError
      return null
    }
    return null
  }

  getItem(key: string): string | null {
    if (this.primary) {
      try {
        const val = this.primary.getItem(key)
        if (val !== null) return val
      } catch {
        // Primary failed, fall through to fallback
      }
    }
    return this.fallback.getItem(key)
  }

  setItem(key: string, value: string): void {
    let savedToPrimary = false
    if (this.primary) {
      try {
        this.primary.setItem(key, value)
        savedToPrimary = true
      } catch {
        // QuotaExceededError or SecurityError: primary cannot be written to
        savedToPrimary = false
      }
    }

    // If primary failed or was unavailable, save to memory fallback
    if (!savedToPrimary) {
      this.fallback.setItem(key, value)
    }
  }

  removeItem(key: string): void {
    if (this.primary) {
      try {
        this.primary.removeItem(key)
      } catch {
        // Ignore error
      }
    }
    this.fallback.removeItem(key)
  }

  clear(): void {
    if (this.primary) {
      try {
        this.primary.clear()
      } catch {
        // Ignore error
      }
    }
    this.fallback.clear()
  }
}

export function createSafeStorage(
  adapter?: StorageAdapter | null
): SafeStorage {
  return new SafeStorage(adapter)
}

export interface PersistenceService {
  getTheme(): Theme | null
  setTheme(theme: Theme): boolean
  clearTheme(): boolean

  getUserMemory(): Layer8UserMemoryConfig | null
  setUserMemory(config: Layer8UserMemoryConfig): boolean
  getUserDirectives(): readonly string[]
  setUserDirectives(directives: readonly string[]): boolean
  getNegativeConstraints(): readonly string[]
  setNegativeConstraints(constraints: readonly string[]): boolean
  clearUserMemory(): boolean

  getDraftBrief(): Layer9BriefAndClarificationConfig | null
  setDraftBrief(draft: Partial<Layer9BriefAndClarificationConfig>): boolean
  clearDraftBrief(): boolean
}

export function createPersistence(
  storage?: StorageAdapter | null
): PersistenceService {
  const safeStorage =
    storage instanceof SafeStorage ? storage : new SafeStorage(storage)

  function safeGetJson<T>(key: string): T | null {
    const raw = safeStorage.getItem(key)
    if (!raw) return null
    try {
      return JSON.parse(raw) as T
    } catch {
      return null
    }
  }

  function safeSetJson<T>(key: string, value: T): boolean {
    try {
      const serialized = JSON.stringify(value)
      safeStorage.setItem(key, serialized)
      return true
    } catch {
      return false
    }
  }

  return {
    getTheme(): Theme | null {
      const raw = safeStorage.getItem(STORAGE_KEYS.THEME)
      if (raw === "dark" || raw === "light" || raw === "system") {
        return raw
      }
      return null
    },

    setTheme(theme: Theme): boolean {
      if (theme !== "dark" && theme !== "light" && theme !== "system") {
        return false
      }
      try {
        safeStorage.setItem(STORAGE_KEYS.THEME, theme)
        return true
      } catch {
        return false
      }
    },

    clearTheme(): boolean {
      try {
        safeStorage.removeItem(STORAGE_KEYS.THEME)
        return true
      } catch {
        return false
      }
    },

    getUserMemory(): Layer8UserMemoryConfig | null {
      const data = safeGetJson<unknown>(STORAGE_KEYS.USER_MEMORY)
      if (
        data &&
        typeof data === "object" &&
        !Array.isArray(data) &&
        "enabled" in data &&
        typeof (data as { enabled: unknown }).enabled === "boolean" &&
        "persistentDirectives" in data &&
        Array.isArray(
          (data as { persistentDirectives: unknown }).persistentDirectives
        ) &&
        "negativeConstraints" in data &&
        Array.isArray(
          (data as { negativeConstraints: unknown }).negativeConstraints
        )
      ) {
        return data as Layer8UserMemoryConfig
      }
      return null
    },

    setUserMemory(config: Layer8UserMemoryConfig): boolean {
      return safeSetJson(STORAGE_KEYS.USER_MEMORY, config)
    },

    getUserDirectives(): readonly string[] {
      const memory = this.getUserMemory()
      return memory?.persistentDirectives ?? []
    },

    setUserDirectives(directives: readonly string[]): boolean {
      const current = this.getUserMemory() ?? {
        enabled: true,
        persistentDirectives: [],
        negativeConstraints: [],
      }
      return this.setUserMemory({
        ...current,
        persistentDirectives: directives,
      })
    },

    getNegativeConstraints(): readonly string[] {
      const memory = this.getUserMemory()
      return memory?.negativeConstraints ?? []
    },

    setNegativeConstraints(constraints: readonly string[]): boolean {
      const current = this.getUserMemory() ?? {
        enabled: true,
        persistentDirectives: [],
        negativeConstraints: [],
      }
      return this.setUserMemory({
        ...current,
        negativeConstraints: constraints,
      })
    },

    clearUserMemory(): boolean {
      try {
        safeStorage.removeItem(STORAGE_KEYS.USER_MEMORY)
        return true
      } catch {
        return false
      }
    },

    getDraftBrief(): Layer9BriefAndClarificationConfig | null {
      const data = safeGetJson<unknown>(STORAGE_KEYS.DRAFT_BRIEF)
      if (
        data &&
        typeof data === "object" &&
        !Array.isArray(data) &&
        "userObjective" in data &&
        typeof (data as { userObjective: unknown }).userObjective === "string"
      ) {
        const obj = data as Partial<Layer9BriefAndClarificationConfig>
        return {
          userObjective: obj.userObjective ?? "",
          featureRequirements: Array.isArray(obj.featureRequirements)
            ? obj.featureRequirements
            : [],
          clarificationAnswers: Array.isArray(obj.clarificationAnswers)
            ? obj.clarificationAnswers
            : [],
        }
      }
      return null
    },

    setDraftBrief(draft: Partial<Layer9BriefAndClarificationConfig>): boolean {
      const existing = this.getDraftBrief() ?? {
        userObjective: "",
        featureRequirements: [],
        clarificationAnswers: [],
      }

      const merged: Layer9BriefAndClarificationConfig = {
        userObjective:
          draft.userObjective !== undefined
            ? draft.userObjective
            : existing.userObjective,
        featureRequirements:
          draft.featureRequirements !== undefined
            ? draft.featureRequirements
            : existing.featureRequirements,
        clarificationAnswers:
          draft.clarificationAnswers !== undefined
            ? draft.clarificationAnswers
            : existing.clarificationAnswers,
      }

      return safeSetJson(STORAGE_KEYS.DRAFT_BRIEF, merged)
    },

    clearDraftBrief(): boolean {
      try {
        safeStorage.removeItem(STORAGE_KEYS.DRAFT_BRIEF)
        return true
      } catch {
        return false
      }
    },
  }
}

// Global default singleton instance
const defaultPersistence = createPersistence()

export const getTheme = defaultPersistence.getTheme.bind(defaultPersistence)
export const setTheme = defaultPersistence.setTheme.bind(defaultPersistence)
export const clearTheme = defaultPersistence.clearTheme.bind(defaultPersistence)

export const getUserMemory =
  defaultPersistence.getUserMemory.bind(defaultPersistence)
export const setUserMemory =
  defaultPersistence.setUserMemory.bind(defaultPersistence)
export const getUserDirectives =
  defaultPersistence.getUserDirectives.bind(defaultPersistence)
export const setUserDirectives =
  defaultPersistence.setUserDirectives.bind(defaultPersistence)
export const getNegativeConstraints =
  defaultPersistence.getNegativeConstraints.bind(defaultPersistence)
export const setNegativeConstraints =
  defaultPersistence.setNegativeConstraints.bind(defaultPersistence)
export const clearUserMemory =
  defaultPersistence.clearUserMemory.bind(defaultPersistence)

export const getDraftBrief =
  defaultPersistence.getDraftBrief.bind(defaultPersistence)
export const setDraftBrief =
  defaultPersistence.setDraftBrief.bind(defaultPersistence)
export const clearDraftBrief =
  defaultPersistence.clearDraftBrief.bind(defaultPersistence)
