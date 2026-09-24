import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import {
  STORAGE_KEYS,
  createPersistence,
  getTheme,
  setTheme,
  getUserMemory,
  setUserMemory,
  getUserDirectives,
  setUserDirectives,
  getNegativeConstraints,
  setNegativeConstraints,
  clearUserMemory,
  getDraftBrief,
  setDraftBrief,
  clearDraftBrief,
  createSafeStorage,
  type StorageAdapter,
} from "../src/lib/storage/persistence"
import type {
  Layer8UserMemoryConfig,
  Layer9BriefAndClarificationConfig,
} from "../src/lib/composer/composer-types"

describe("Storage Persistence", () => {
  let mockStorageStore: Record<string, string>
  let mockStorage: StorageAdapter

  beforeEach(() => {
    mockStorageStore = {}
    mockStorage = {
      getItem: vi.fn((key: string) => mockStorageStore[key] ?? null),
      setItem: vi.fn((key: string, value: string) => {
        mockStorageStore[key] = value
      }),
      removeItem: vi.fn((key: string) => {
        delete mockStorageStore[key]
      }),
      clear: vi.fn(() => {
        mockStorageStore = {}
      }),
    }
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe("Theme Persistence", () => {
    it("reads and writes theme accurately", () => {
      const persistence = createPersistence(mockStorage)

      expect(persistence.getTheme()).toBeNull()

      const saved = persistence.setTheme("dark")
      expect(saved).toBe(true)
      expect(mockStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEYS.THEME,
        "dark"
      )
      expect(persistence.getTheme()).toBe("dark")

      persistence.setTheme("light")
      expect(persistence.getTheme()).toBe("light")

      persistence.setTheme("system")
      expect(persistence.getTheme()).toBe("system")
    })

    it("returns null for invalid or corrupted theme value", () => {
      mockStorageStore[STORAGE_KEYS.THEME] = "neon-cyberpunk-invalid"
      const persistence = createPersistence(mockStorage)
      expect(persistence.getTheme()).toBeNull()
    })

    it("allows clearing theme", () => {
      const persistence = createPersistence(mockStorage)
      persistence.setTheme("dark")
      persistence.clearTheme()
      expect(persistence.getTheme()).toBeNull()
    })
  })

  describe("User Memory (Layer 8) Persistence", () => {
    const sampleMemory: Layer8UserMemoryConfig = {
      enabled: true,
      persistentDirectives: [
        "Always use semantically correct HTML elements",
        "Prefer CSS Grid for card layouts",
      ],
      negativeConstraints: [
        "Never use purple-to-blue gradients",
        "Never use generic lorem ipsum text",
      ],
    }

    it("stores and retrieves complete Layer8UserMemoryConfig", () => {
      const persistence = createPersistence(mockStorage)

      expect(persistence.getUserMemory()).toBeNull()

      const saved = persistence.setUserMemory(sampleMemory)
      expect(saved).toBe(true)

      const retrieved = persistence.getUserMemory()
      expect(retrieved).toEqual(sampleMemory)
    })

    it("supports individual directive and constraint helpers", () => {
      const persistence = createPersistence(mockStorage)

      persistence.setUserDirectives(["Rule 1", "Rule 2"])
      expect(persistence.getUserDirectives()).toEqual(["Rule 1", "Rule 2"])

      persistence.setNegativeConstraints(["No red", "No comic sans"])
      expect(persistence.getNegativeConstraints()).toEqual([
        "No red",
        "No comic sans",
      ])

      // When retrieving full memory, both are preserved
      const memory = persistence.getUserMemory()
      expect(memory?.persistentDirectives).toEqual(["Rule 1", "Rule 2"])
      expect(memory?.negativeConstraints).toEqual(["No red", "No comic sans"])
    })

    it("handles corrupted or invalid JSON gracefully", () => {
      mockStorageStore[STORAGE_KEYS.USER_MEMORY] = "{not-valid-json::"
      const persistence = createPersistence(mockStorage)

      expect(persistence.getUserMemory()).toBeNull()
      expect(persistence.getUserDirectives()).toEqual([])
      expect(persistence.getNegativeConstraints()).toEqual([])
    })

    it("handles non-object JSON gracefully", () => {
      mockStorageStore[STORAGE_KEYS.USER_MEMORY] = '"just-a-string"'
      const persistence = createPersistence(mockStorage)

      expect(persistence.getUserMemory()).toBeNull()
    })

    it("allows clearing user memory", () => {
      const persistence = createPersistence(mockStorage)
      persistence.setUserMemory(sampleMemory)
      expect(persistence.getUserMemory()).not.toBeNull()

      persistence.clearUserMemory()
      expect(persistence.getUserMemory()).toBeNull()
    })
  })

  describe("Draft Brief (Layer 9) Auto-Save", () => {
    const sampleBrief: Layer9BriefAndClarificationConfig = {
      userObjective:
        "Build a high-converting pricing page for an AI developer tool",
      featureRequirements: [
        "Interactive monthly/annual billing toggle",
        "Feature comparison table",
        "FAQ accordion",
      ],
      clarificationAnswers: [
        {
          questionId: "tech-stack",
          questionLabel: "What tech stack do you prefer?",
          selectedValues: ["react", "tailwind-v4"],
        },
      ],
    }

    it("stores and retrieves draft brief", () => {
      const persistence = createPersistence(mockStorage)

      expect(persistence.getDraftBrief()).toBeNull()

      const saved = persistence.setDraftBrief(sampleBrief)
      expect(saved).toBe(true)

      const retrieved = persistence.getDraftBrief()
      expect(retrieved).toEqual(sampleBrief)
    })

    it("allows partial update to draft brief while preserving existing fields", () => {
      const persistence = createPersistence(mockStorage)
      persistence.setDraftBrief(sampleBrief)

      persistence.setDraftBrief({
        userObjective: "Updated objective",
      })

      const retrieved = persistence.getDraftBrief()
      expect(retrieved?.userObjective).toBe("Updated objective")
      expect(retrieved?.featureRequirements).toEqual(
        sampleBrief.featureRequirements
      )
      expect(retrieved?.clarificationAnswers).toEqual(
        sampleBrief.clarificationAnswers
      )
    })

    it("handles corrupted draft brief JSON gracefully", () => {
      mockStorageStore[STORAGE_KEYS.DRAFT_BRIEF] = "invalid-json"
      const persistence = createPersistence(mockStorage)
      expect(persistence.getDraftBrief()).toBeNull()
    })

    it("allows clearing draft brief", () => {
      const persistence = createPersistence(mockStorage)
      persistence.setDraftBrief(sampleBrief)
      persistence.clearDraftBrief()
      expect(persistence.getDraftBrief()).toBeNull()
    })
  })

  describe("Error Resilience & Edge Cases", () => {
    it("handles storage quota exceeded errors gracefully by using in-memory fallback", () => {
      const failingStorage: StorageAdapter = {
        getItem: vi.fn(() => null),
        setItem: vi.fn(() => {
          const err = new Error("QuotaExceededError: storage is full")
          err.name = "QuotaExceededError"
          throw err
        }),
        removeItem: vi.fn(),
        clear: vi.fn(),
      }

      const safeStorage = createSafeStorage(failingStorage)
      const persistence = createPersistence(safeStorage)

      // Should not throw, should fall back to memory
      expect(() => {
        persistence.setTheme("dark")
      }).not.toThrow()

      // The value should still be retrievable from the memory fallback
      expect(persistence.getTheme()).toBe("dark")
    })

    it("handles SecurityError when localStorage is blocked (e.g. sandbox/iframe)", () => {
      const securityThrowingStorage: StorageAdapter = {
        getItem: vi.fn(() => {
          throw new Error("SecurityError: Access is denied")
        }),
        setItem: vi.fn(() => {
          throw new Error("SecurityError: Access is denied")
        }),
        removeItem: vi.fn(() => {
          throw new Error("SecurityError: Access is denied")
        }),
        clear: vi.fn(() => {
          throw new Error("SecurityError: Access is denied")
        }),
      }

      const safeStorage = createSafeStorage(securityThrowingStorage)
      const persistence = createPersistence(safeStorage)

      expect(() => persistence.getTheme()).not.toThrow()
      expect(persistence.getTheme()).toBeNull()

      expect(() => persistence.setTheme("light")).not.toThrow()
      expect(persistence.getTheme()).toBe("light")
    })

    it("operates seamlessly in non-browser environment without window.localStorage", () => {
      // In Node environment, createSafeStorage() with no adapter defaults to memory
      const safeStorage = createSafeStorage(null)
      const persistence = createPersistence(safeStorage)

      expect(persistence.getTheme()).toBeNull()
      persistence.setTheme("dark")
      expect(persistence.getTheme()).toBe("dark")

      persistence.setUserDirectives(["Directives in memory"])
      expect(persistence.getUserDirectives()).toEqual(["Directives in memory"])
    })
  })

  describe("Default Singleton Functions", () => {
    it("default module exports function correctly", () => {
      // Test default singleton functions
      setTheme("dark")
      expect(getTheme()).toBe("dark")

      setUserMemory({
        enabled: true,
        persistentDirectives: ["Global directive"],
        negativeConstraints: ["Global constraint"],
      })
      expect(getUserMemory()?.persistentDirectives).toEqual([
        "Global directive",
      ])

      setUserDirectives(["Test directive"])
      expect(getUserDirectives()).toEqual(["Test directive"])

      setNegativeConstraints(["Test constraint"])
      expect(getNegativeConstraints()).toEqual(["Test constraint"])

      setDraftBrief({ userObjective: "Global objective" })
      expect(getDraftBrief()?.userObjective).toBe("Global objective")

      clearUserMemory()
      clearDraftBrief()
    })
  })
})
