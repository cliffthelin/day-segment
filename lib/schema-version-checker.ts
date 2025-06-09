"use client"

import { CURRENT_SCHEMA_VERSION } from "./schema-version"

interface DatabaseInfo {
  name: string
  version: number
}

/**
 * Utility to check schema version consistency between code and IndexedDB
 */
export class SchemaVersionChecker {
  /**
   * Get information about all IndexedDB databases in the browser
   */
  static async getAllDatabases(): Promise<DatabaseInfo[]> {
    // Check if indexedDB is available (browser environment)
    if (typeof window === "undefined" || !window.indexedDB) {
      console.warn("IndexedDB not available")
      return []
    }

    return new Promise((resolve) => {
      const databases: DatabaseInfo[] = []

      // Use the modern indexedDB.databases() API if available
      if (indexedDB.databases) {
        indexedDB
          .databases()
          .then((dbs) => {
            resolve(
              dbs.map((db) => ({
                name: db.name || "",
                version: db.version || 0,
              })),
            )
          })
          .catch(() => {
            // Fallback if the API fails
            console.warn("indexedDB.databases() failed, returning empty list")
            resolve([])
          })
      } else {
        // Fallback for browsers that don't support indexedDB.databases()
        console.warn("indexedDB.databases() not supported, returning empty list")
        resolve([])
      }
    })
  }

  /**
   * Get information about a specific database
   */
  static async getDatabaseInfo(dbName: string): Promise<DatabaseInfo | null> {
    const allDbs = await this.getAllDatabases()
    return allDbs.find((db) => db.name === dbName) || null
  }

  /**
   * Check if the current schema version matches the database version
   */
  static async checkVersionConsistency(dbName: string): Promise<{
    isConsistent: boolean
    codeVersion: number
    dbVersion: number | null
    message: string
  }> {
    // Get the database info
    const dbInfo = await this.getDatabaseInfo(dbName)

    if (!dbInfo) {
      return {
        isConsistent: true, // Database doesn't exist yet, so no inconsistency
        codeVersion: CURRENT_SCHEMA_VERSION,
        dbVersion: null,
        message: "Database does not exist yet. It will be created with the current schema version.",
      }
    }

    const isConsistent = dbInfo.version === CURRENT_SCHEMA_VERSION

    return {
      isConsistent,
      codeVersion: CURRENT_SCHEMA_VERSION,
      dbVersion: dbInfo.version,
      message: isConsistent
        ? `Schema version is consistent (version ${CURRENT_SCHEMA_VERSION})`
        : `Schema version mismatch! Code: ${CURRENT_SCHEMA_VERSION}, Database: ${dbInfo.version}`,
    }
  }

  /**
   * Delete a database (use with caution!)
   */
  static async deleteDatabase(dbName: string): Promise<{ success: boolean; message: string }> {
    return new Promise((resolve) => {
      if (typeof window === "undefined" || !window.indexedDB) {
        resolve({ success: false, message: "IndexedDB not available" })
        return
      }

      const request = indexedDB.deleteDatabase(dbName)

      request.onsuccess = () => {
        resolve({
          success: true,
          message: `Database "${dbName}" successfully deleted`,
        })
      }

      request.onerror = () => {
        resolve({
          success: false,
          message: `Failed to delete database "${dbName}"`,
        })
      }

      request.onblocked = () => {
        resolve({
          success: false,
          message: `Database "${dbName}" deletion blocked. Please close all tabs using this database.`,
        })
      }
    })
  }
}
