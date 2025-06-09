"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle, Database, RefreshCw, Trash2 } from "lucide-react"
import { SchemaVersionChecker } from "@/lib/schema-version-checker"
import { CURRENT_SCHEMA_VERSION } from "@/lib/schema-version"

interface VersionCheckResult {
  isConsistent: boolean
  codeVersion: number
  dbVersion: number | null
  message: string
}

export function SchemaVersionCheckerComponent() {
  const [checkResult, setCheckResult] = useState<VersionCheckResult | null>(null)
  const [isChecking, setIsChecking] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteResult, setDeleteResult] = useState<{ success: boolean; message: string } | null>(null)
  const dbName = "daySegmentTracker"

  const checkVersion = async () => {
    setIsChecking(true)
    try {
      const result = await SchemaVersionChecker.checkVersionConsistency(dbName)
      setCheckResult(result)
    } catch (error) {
      console.error("Error checking schema version:", error)
      setCheckResult({
        isConsistent: false,
        codeVersion: CURRENT_SCHEMA_VERSION,
        dbVersion: null,
        message: `Error checking schema version: ${error instanceof Error ? error.message : String(error)}`,
      })
    } finally {
      setIsChecking(false)
    }
  }

  const deleteDb = async () => {
    if (
      window.confirm(
        `Are you sure you want to delete the database "${dbName}"? This will delete ALL your data and cannot be undone.`,
      )
    ) {
      setIsDeleting(true)
      try {
        const result = await SchemaVersionChecker.deleteDatabase(dbName)
        setDeleteResult(result)
        if (result.success) {
          // Clear the check result since the database no longer exists
          setCheckResult(null)
        }
      } catch (error) {
        console.error("Error deleting database:", error)
        setDeleteResult({
          success: false,
          message: `Error deleting database: ${error instanceof Error ? error.message : String(error)}`,
        })
      } finally {
        setIsDeleting(false)
      }
    }
  }

  useEffect(() => {
    // Check version on component mount
    checkVersion()
  }, [])

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Schema Version Checker
        </CardTitle>
        <CardDescription>Verify database schema version consistency</CardDescription>
      </CardHeader>
      <CardContent>
        {checkResult ? (
          <>
            <div className="mb-4">
              <p className="text-sm font-medium mb-1">Database Name:</p>
              <p className="text-sm">{dbName}</p>
            </div>
            <div className="mb-4">
              <p className="text-sm font-medium mb-1">Code Schema Version:</p>
              <p className="text-sm">{checkResult.codeVersion}</p>
            </div>
            <div className="mb-4">
              <p className="text-sm font-medium mb-1">Database Version:</p>
              <p className="text-sm">{checkResult.dbVersion !== null ? checkResult.dbVersion : "Not created yet"}</p>
            </div>

            {checkResult.isConsistent ? (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800">Consistent</AlertTitle>
                <AlertDescription className="text-green-700">{checkResult.message}</AlertDescription>
              </Alert>
            ) : (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Version Mismatch</AlertTitle>
                <AlertDescription>
                  {checkResult.message}
                  <div className="mt-2">
                    <p className="text-sm">
                      This can happen if you've updated the schema version in your code but the browser still has an
                      older or newer version.
                    </p>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {!checkResult.isConsistent &&
              checkResult.dbVersion !== null &&
              checkResult.dbVersion > checkResult.codeVersion && (
                <Alert className="mt-4 bg-yellow-50 border-yellow-200">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <AlertTitle className="text-yellow-800">Database Ahead of Code</AlertTitle>
                  <AlertDescription className="text-yellow-700">
                    Your database version is higher than your code version. This usually means you've previously used a
                    newer version of the application.
                    <div className="mt-2">
                      <p className="text-sm">Options:</p>
                      <ul className="list-disc list-inside text-sm mt-1">
                        <li>Update your code to use the latest schema version</li>
                        <li>Delete the database (will lose all data)</li>
                      </ul>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

            {!checkResult.isConsistent &&
              checkResult.dbVersion !== null &&
              checkResult.dbVersion < checkResult.codeVersion && (
                <Alert className="mt-4 bg-blue-50 border-blue-200">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <AlertTitle className="text-blue-800">Database Behind Code</AlertTitle>
                  <AlertDescription className="text-blue-700">
                    Your database version is lower than your code version. The database should upgrade automatically
                    when you reload the page.
                    <div className="mt-2">
                      <p className="text-sm">If you're still seeing this message after reloading, try:</p>
                      <ul className="list-disc list-inside text-sm mt-1">
                        <li>Closing all tabs of this application</li>
                        <li>Clearing browser cache</li>
                        <li>Deleting the database (will lose all data)</li>
                      </ul>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
          </>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-gray-500">Checking schema version...</p>
          </div>
        )}

        {deleteResult && (
          <Alert
            className={`mt-4 ${deleteResult.success ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}
          >
            <AlertCircle className={`h-4 w-4 ${deleteResult.success ? "text-green-600" : "text-red-600"}`} />
            <AlertTitle className={deleteResult.success ? "text-green-800" : "text-red-800"}>
              {deleteResult.success ? "Database Deleted" : "Delete Failed"}
            </AlertTitle>
            <AlertDescription className={deleteResult.success ? "text-green-700" : "text-red-700"}>
              {deleteResult.message}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={checkVersion} disabled={isChecking} className="flex items-center gap-1">
          <RefreshCw className={`h-4 w-4 ${isChecking ? "animate-spin" : ""}`} />
          {isChecking ? "Checking..." : "Refresh"}
        </Button>
        <Button
          variant="destructive"
          onClick={deleteDb}
          disabled={isDeleting || !checkResult?.dbVersion}
          className="flex items-center gap-1"
        >
          <Trash2 className="h-4 w-4" />
          {isDeleting ? "Deleting..." : "Delete Database"}
        </Button>
      </CardFooter>
    </Card>
  )
}
