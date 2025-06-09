"use client"

import type React from "react"

import { useState, useRef } from "react"
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
import { Download, Upload } from "lucide-react"
import { exportSettings, downloadSettingsFile, importSettings } from "@/lib/settings-export-import"
import { Progress } from "@/components/ui/progress"

export function SettingsExportImport() {
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleExportSettings = async () => {
    setIsExporting(true)
    try {
      const result = await exportSettings()

      if (result.success && result.data) {
        downloadSettingsFile(result.data)
        toast({
          title: "Settings exported",
          description: "Your settings have been exported successfully.",
        })
      } else {
        toast({
          title: "Export failed",
          description: result.error || "There was an error exporting your settings.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error exporting settings:", error)
      toast({
        title: "Export failed",
        description: "There was an error exporting your settings.",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  const handleImportClick = () => {
    // Trigger the file input click
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Reset the file input
    event.target.value = ""

    // Show import progress
    setIsImporting(true)
    setImportProgress(10)

    try {
      // Simulate progress (in a real app, you might have actual progress updates)
      const progressInterval = setInterval(() => {
        setImportProgress((prev) => {
          const newProgress = prev + 10
          return newProgress < 90 ? newProgress : prev
        })
      }, 200)

      // Import the settings
      const result = await importSettings(file)

      // Clear the progress interval
      clearInterval(progressInterval)
      setImportProgress(100)

      // Show the result
      if (result.success) {
        toast({
          title: "Settings imported",
          description: `Successfully imported ${result.imported} settings. ${
            result.skipped > 0 ? `Skipped ${result.skipped} invalid settings.` : ""
          }`,
        })
      } else {
        toast({
          title: "Import failed",
          description: result.error || "There was an error importing your settings.",
          variant: "destructive",
        })
      }

      // Reset after a delay
      setTimeout(() => {
        setIsImporting(false)
        setImportProgress(0)
      }, 1000)
    } catch (error) {
      console.error("Error importing settings:", error)
      toast({
        title: "Import failed",
        description: "There was an error importing your settings.",
        variant: "destructive",
      })
      setIsImporting(false)
      setImportProgress(0)
    }
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Settings Backup</CardTitle>
        <CardDescription>Export or import your settings for backup or transfer between devices.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium mb-2">Export Settings</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Download all your settings as a JSON file for backup or transfer.
            </p>
            <Button onClick={handleExportSettings} disabled={isExporting} className="w-full">
              <Download className="mr-2 h-4 w-4" />
              {isExporting ? "Exporting..." : "Export Settings"}
            </Button>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-2">Import Settings</h4>
            <p className="text-sm text-muted-foreground mb-4">Restore your settings from a previously exported file.</p>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json"
              className="hidden"
              disabled={isImporting}
            />
            {isImporting ? (
              <div className="space-y-2">
                <Progress value={importProgress} className="h-2 w-full" />
                <p className="text-xs text-center text-muted-foreground">Importing settings...</p>
              </div>
            ) : (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button className="w-full">
                    <Upload className="mr-2 h-4 w-4" />
                    Import Settings
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Import Settings</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will overwrite your current settings with the imported ones. Are you sure you want to
                      continue?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleImportClick}>Continue</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
