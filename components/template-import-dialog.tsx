"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { Upload, Copy, AlertCircle, CheckCircle2 } from "lucide-react"
import {
  importTemplatesFromFile,
  importTemplatesFromString,
  getTemplateImportExample,
} from "@/lib/template-import-utils"

export function TemplateImportDialog() {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("file")
  const [pasteContent, setPasteContent] = useState("")
  const [isImporting, setIsImporting] = useState(false)
  const [importResult, setImportResult] = useState<{
    success: boolean
    message: string
    details?: string[]
  } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    await importFile(file)
  }

  const handleFileDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (!file) return

    await importFile(file)
  }

  const importFile = async (file: File) => {
    if (file.type !== "application/json" && !file.name.endsWith(".json")) {
      toast({
        title: "Invalid file type",
        description: "Please upload a JSON file",
        variant: "destructive",
      })
      return
    }

    setIsImporting(true)
    setImportResult(null)

    try {
      const result = await importTemplatesFromFile(file)

      if (result.success && result.templatesImported > 0) {
        setImportResult({
          success: true,
          message: `Successfully imported ${result.templatesImported} template${
            result.templatesImported !== 1 ? "s" : ""
          }${result.skipped > 0 ? ` (${result.skipped} skipped as duplicates)` : ""}`,
        })
      } else {
        setImportResult({
          success: false,
          message: "Failed to import templates",
          details: result.errors,
        })
      }
    } catch (error) {
      setImportResult({
        success: false,
        message: "Error importing templates",
        details: [(error as Error).message],
      })
    } finally {
      setIsImporting(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handlePasteImport = async () => {
    if (!pasteContent.trim()) {
      toast({
        title: "Empty content",
        description: "Please paste some JSON content to import",
        variant: "destructive",
      })
      return
    }

    setIsImporting(true)
    setImportResult(null)

    try {
      const result = await importTemplatesFromString(pasteContent)

      if (result.success && result.templatesImported > 0) {
        setImportResult({
          success: true,
          message: `Successfully imported ${result.templatesImported} template${
            result.templatesImported !== 1 ? "s" : ""
          }${result.skipped > 0 ? ` (${result.skipped} skipped as duplicates)` : ""}`,
        })
        setPasteContent("")
      } else {
        setImportResult({
          success: false,
          message: "Failed to import templates",
          details: result.errors,
        })
      }
    } catch (error) {
      setImportResult({
        success: false,
        message: "Error importing templates",
        details: [(error as Error).message],
      })
    } finally {
      setIsImporting(false)
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }

  const copyExampleToClipboard = () => {
    navigator.clipboard.writeText(getTemplateImportExample())
    toast({
      title: "Copied to clipboard",
      description: "Example template JSON has been copied to your clipboard",
    })
  }

  const resetDialog = () => {
    setImportResult(null)
    setPasteContent("")
    setActiveTab("file")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        setOpen(newOpen)
        if (!newOpen) {
          resetDialog()
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Upload className="mr-2 h-4 w-4" />
          Import Templates
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Import Templates</DialogTitle>
          <DialogDescription>Import task templates from a JSON file or by pasting JSON content.</DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="file">Upload File</TabsTrigger>
            <TabsTrigger value="paste">Paste JSON</TabsTrigger>
          </TabsList>

          <TabsContent value="file" className="mt-4">
            <div
              className="border-2 border-dashed rounded-md p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleFileDrop}
              onDragOver={handleDragOver}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".json,application/json"
                className="hidden"
              />
              <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm font-medium mb-1">Click to upload or drag and drop</p>
              <p className="text-xs text-muted-foreground">JSON files only (.json)</p>
            </div>
          </TabsContent>

          <TabsContent value="paste" className="mt-4 space-y-4">
            <Textarea
              placeholder="Paste JSON template data here..."
              value={pasteContent}
              onChange={(e) => setPasteContent(e.target.value)}
              rows={10}
              className="font-mono text-sm"
            />
            <div className="flex justify-between">
              <Button variant="outline" size="sm" onClick={copyExampleToClipboard}>
                <Copy className="mr-2 h-4 w-4" />
                Copy Example
              </Button>
              <Button size="sm" onClick={handlePasteImport} disabled={isImporting || !pasteContent.trim()}>
                Import
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {importResult && (
          <Alert variant={importResult.success ? "default" : "destructive"} className="mt-4">
            {importResult.success ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            <AlertTitle>{importResult.success ? "Success" : "Error"}</AlertTitle>
            <AlertDescription className="mt-2">
              <p>{importResult.message}</p>
              {importResult.details && importResult.details.length > 0 && (
                <ul className="list-disc list-inside mt-2 text-sm">
                  {importResult.details.map((detail, index) => (
                    <li key={index}>{detail}</li>
                  ))}
                </ul>
              )}
            </AlertDescription>
          </Alert>
        )}

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
          {activeTab === "paste" && (
            <Button onClick={handlePasteImport} disabled={isImporting || !pasteContent.trim()}>
              Import
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
