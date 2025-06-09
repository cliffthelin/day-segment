"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Download, Upload, Trash2, Database } from "lucide-react"
import { TaskExport } from "./task-export"
import { TaskImport } from "./task-import"
import { SettingsExportImport } from "./settings-export-import"

export function DataManagementSettings({ highlightedSetting }: { highlightedSetting?: string | null }) {
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const { toast } = useToast()

  const handleExportData = async () => {
    setIsExporting(true)
    try {
      // Placeholder for actual export functionality
      await new Promise((resolve) => setTimeout(resolve, 1000))

      toast({
        title: "Data exported",
        description: "Your data has been exported successfully.",
      })
    } catch (error) {
      console.error("Error exporting data:", error)
      toast({
        title: "Export failed",
        description: "There was an error exporting your data.",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  const handleImportData = async () => {
    setIsImporting(true)
    try {
      // Placeholder for actual import functionality
      await new Promise((resolve) => setTimeout(resolve, 1000))

      toast({
        title: "Data imported",
        description: "Your data has been imported successfully.",
      })
    } catch (error) {
      console.error("Error importing data:", error)
      toast({
        title: "Import failed",
        description: "There was an error importing your data.",
        variant: "destructive",
      })
    } finally {
      setIsImporting(false)
    }
  }

  const handleClearData = async () => {
    try {
      // Placeholder for actual data clearing functionality
      await new Promise((resolve) => setTimeout(resolve, 1000))

      toast({
        title: "Data cleared",
        description: "All your data has been cleared successfully.",
      })
    } catch (error) {
      console.error("Error clearing data:", error)
      toast({
        title: "Clear failed",
        description: "There was an error clearing your data.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6 py-6">
      <h3 className="text-lg font-medium">Data Management</h3>

      {/* Settings Export/Import */}
      <div
        className={`transition-all duration-300 ${
          highlightedSetting === "settings-export-import" ? "bg-highlight rounded-lg p-1 -m-1" : ""
        }`}
        id="settings-export-import"
      >
        <SettingsExportImport />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Export All Data</CardTitle>
            <CardDescription>Download all your data as a JSON file for backup or transfer.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleExportData} disabled={isExporting} className="w-full">
              <Download className="mr-2 h-4 w-4" />
              {isExporting ? "Exporting..." : "Export All Data"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Import All Data</CardTitle>
            <CardDescription>Restore your data from a previously exported file.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleImportData} disabled={isImporting} className="w-full">
              <Upload className="mr-2 h-4 w-4" />
              {isImporting ? "Importing..." : "Import All Data"}
            </Button>
          </CardContent>
        </Card>

        {/* Task Export/Import Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Task Import & Export</CardTitle>
            <CardDescription>Import and export your tasks in various formats.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium mb-4">Export Tasks</h4>
                <TaskExport />
              </div>
              <div>
                <h4 className="text-sm font-medium mb-4">Import Tasks</h4>
                <TaskImport />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Danger Zone</CardTitle>
            <CardDescription>These actions cannot be undone. Please proceed with caution.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear All Data
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete all your data including segments,
                    check-ins, tasks, and settings.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearData}>Yes, clear all data</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="w-full">
                  <Database className="mr-2 h-4 w-4" />
                  Reset Database
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset database?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will reset the database structure while attempting to preserve your data. Use this only if
                    you're experiencing technical issues.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction>Reset Database</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
