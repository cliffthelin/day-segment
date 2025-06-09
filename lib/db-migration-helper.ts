"use client"

import { db } from "./db"
import { CURRENT_SCHEMA_VERSION } from "./schema-version"

/**
 * Helper functions for database migrations
 */
export const DbMigrationHelper = {
  /**
   * Get the current database version from IndexedDB
   */
  getCurrentDbVersion: async (): Promise<number | null> => {
    if (typeof window === "undefined" || !window.indexedDB) {
      return null
    }

    return new Promise((resolve) => {
      const request = indexedDB.open("daySegmentTracker")

      // We don't actually want to open the database, just check its version
      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        const version = db.version
        db.close()
        resolve(version)
      }

      request.onerror = () => {
        console.error("Error opening database to check version")
        resolve(null)
      }

      // If the database doesn't exist yet
      request.onupgradeneeded = () => {
        const db = (event.target as IDBOpenDBRequest).result
        db.close()
        resolve(null)
      }
    })
  },

  /**
   * Check if a migration is needed
   */
  isMigrationNeeded: async (): Promise<boolean> => {
    const dbVersion = await DbMigrationHelper.getCurrentDbVersion()
    return dbVersion !== null && dbVersion < CURRENT_SCHEMA_VERSION
  },

  /**
   * Log database schema information for debugging
   */
  logSchemaInfo: async (): Promise<void> => {
    if (typeof window === "undefined") return

    try {
      console.group("Database Schema Information")
      console.log("Code Schema Version:", CURRENT_SCHEMA_VERSION)

      const dbVersion = await DbMigrationHelper.getCurrentDbVersion()
      console.log("Database Version:", dbVersion)

      if (dbVersion !== null) {
        if (dbVersion < CURRENT_SCHEMA_VERSION) {
          console.warn("Database needs upgrading")
        } else if (dbVersion > CURRENT_SCHEMA_VERSION) {
          console.error("Database version is ahead of code version!")
        } else {
          console.log("Database version is consistent with code")
        }
      }

      console.groupEnd()
    } catch (error) {
      console.error("Error logging schema info:", error)
    }
  },

  /**
   * Export the database schema as JSON
   */
  exportSchema: async (): Promise<string> => {
    try {
      // Get table names from Dexie
      const tableNames = db.tables.map((table) => table.name)

      // Create a schema object
      const schema: Record<string, string> = {}

      // For each table, get its schema
      for (const tableName of tableNames) {
        const table = db.table(tableName)
        schema[tableName] = table.schema.indexes.map((idx) => idx.name).join(", ")
      }

      return JSON.stringify(
        {
          version: CURRENT_SCHEMA_VERSION,
          tables: schema,
        },
        null,
        2,
      )
    } catch (error) {
      console.error("Error exporting schema:", error)
      return JSON.stringify({ error: "Failed to export schema" })
    }
  },
}

// Add a function to check schema version on app initialization
export const initSchemaVersionCheck = () => {
  if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
    // Log schema info on app initialization in development
    DbMigrationHelper.logSchemaInfo()
  }
}
