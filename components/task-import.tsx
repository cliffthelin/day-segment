"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { Upload, FileJson, FileSpreadsheet, Copy, Check, AlertCircle } from "lucide-react"
import {
  importTasksFromFile,
  importTasksFromString,
  getImportTemplate,
  type ImportFormat,
} from "@/lib/task-import-utils"

export function TaskImport() {
  const [importMethod, setImportMethod] = useState<"file" | "paste">("file")
  const [importFormat, setImportFormat] = useState<ImportFormat>("json")
  const [handleDuplicates, setHandleDuplicates] = useState<"skip" | "replace" | "keepBoth">("skip")
  const [importSubtasks, setImportSubtasks] = useState(true)
  const [isImporting, setIsImporting] = useState(false)
  const [pastedContent, setPastedContent] = useState("")
  const [templateCopied, setTemplateCopied] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return

    const file = e.target.files[0]
    await handleImport(file)

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handlePasteImport = async () => {
    if (!pastedContent.trim()) {
      toast({
        title: "No content to import",
        description: "Please paste some content to import",
        variant: "destructive",
      })
      return
    }

    setIsImporting(true)
    try {
      const result = await importTasksFromString(pastedContent, importFormat, {
        handleDuplicates,
        importSubtasks,
      })

      if (result.success) {
        toast({
          title: "Import successful",
          description: `Imported ${result.tasksImported} tasks and ${result.subtasksImported} subtasks. ${
            result.skipped > 0 ? `Skipped ${result.skipped} duplicates.` : ""
          }`,
        })
        setPastedContent("")
      } else {
        toast({
          title: "Import failed",
          description: result.errors.join(". "),
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Import failed",
        description: (error as Error).message,
        variant: "destructive",
      })
    } finally {
      setIsImporting(false)
    }
  }

  const handleImport = async (file?: File) => {
    setIsImporting(true)
    try {
      let result

      if (file) {
        // File import
        result = await importTasksFromFile(file, {
          format: importFormat,
          handleDuplicates,
          importSubtasks,
        })
      } else {
        // Paste import - handled separately
        return
      }

      if (result.success) {
        toast({
          title: "Import successful",
          description: `Imported ${result.tasksImported} tasks and ${result.subtasksImported} subtasks. ${
            result.skipped > 0 ? `Skipped ${result.skipped} duplicates.` : ""
          }`,
        })
      } else {
        toast({
          title: "Import failed",
          description: result.errors.join(". "),
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Import failed",
        description: (error as Error).message,
        variant: "destructive",
      })
    } finally {
      setIsImporting(false)
    }
  }

  const copyTemplate = () => {
    const template = getImportTemplate(importFormat)
    navigator.clipboard.writeText(template)
    setTemplateCopied(true)
    setTimeout(() => setTemplateCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="import" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="import">Import Tasks</TabsTrigger>
          <TabsTrigger value="template">Import Template</TabsTrigger>
        </TabsList>

        <TabsContent value="import" className="space-y-4 pt-4">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant={importMethod === "file" ? "default" : "outline"}
                onClick={() => setImportMethod("file")}
                className="w-full"
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload File
              </Button>
              <Button
                variant={importMethod === "paste" ? "default" : "outline"}
                onClick={() => setImportMethod("paste")}
                className="w-full"
              >
                <Copy className="mr-2 h-4 w-4" />
                Paste Content
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Button
                variant={importFormat === "json" ? "default" : "outline"}
                onClick={() => setImportFormat("json")}
                className="w-full"
                size="sm"
              >
                <FileJson className="mr-2 h-4 w-4" />
                JSON
              </Button>
              <Button
                variant={importFormat === "csv" ? "default" : "outline"}
                onClick={() => setImportFormat("csv")}
                className="w-full"
                size="sm"
              >
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                CSV
              </Button>
            </div>

            {importMethod === "file" ? (
              <div className="space-y-4">
                <div className="border-2 border-dashed rounded-md p-6 text-center">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept={importFormat === "json" ? ".json" : ".csv"}
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="space-y-2">
                    <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                    <div className="text-sm">
                      <Button variant="ghost" onClick={() => fileInputRef.current?.click()}>
                        Click to upload
                      </Button>{" "}
                      or drag and drop
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {importFormat === "json" ? "JSON" : "CSV"} file up to 10MB
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <Textarea
                  placeholder={`Paste your ${importFormat.toUpperCase()} content here...`}
                  value={pastedContent}
                  onChange={(e) => setPastedContent(e.target.value)}
                  className="min-h-[200px] font-mono text-sm"
                />
                <Button onClick={handlePasteImport} disabled={isImporting || !pastedContent.trim()}>
                  {isImporting ? "Importing..." : "Import Content"}
                </Button>
              </div>
            )}

            <div className="space-y-4 pt-4 border-t">
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Handle Duplicates</h4>
                <RadioGroup
                  value={handleDuplicates}
                  onValueChange={(value) => setHandleDuplicates(value as any)}
                  className="flex flex-col space-y-1"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="skip" id="skip" />
                    <Label htmlFor="skip">Skip duplicates</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="replace" id="replace" />
                    <Label htmlFor="replace">Replace duplicates</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="keepBoth" id="keepBoth" />
                    <Label htmlFor="keepBoth">Keep both (rename imports)</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="importSubtasks"
                  checked={importSubtasks}
                  onCheckedChange={(checked) => setImportSubtasks(!!checked)}
                />
                <Label htmlFor="importSubtasks">Import subtasks</Label>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="template" className="space-y-4 pt-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Import Template</h3>
              <Button variant="outline" size="sm" onClick={copyTemplate}>
                {templateCopied ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Template
                  </>
                )}
              </Button>
            </div>

            <div className="bg-muted rounded-md p-4">
              <Tabs defaultValue={importFormat} onValueChange={(v) => setImportFormat(v as ImportFormat)}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="json">JSON Template</TabsTrigger>
                  <TabsTrigger value="csv">CSV Template</TabsTrigger>
                </TabsList>

                <TabsContent value="json" className="pt-4">
                  <pre className="text-xs overflow-auto p-2 bg-background rounded border max-h-[300px]">
                    {getImportTemplate("json")}
                  </pre>
                </TabsContent>

                <TabsContent value="csv" className="pt-4">
                  <pre className="text-xs overflow-auto p-2 bg-background rounded border max-h-[300px] whitespace-pre">
                    {getImportTemplate("csv")}
                  </pre>
                </TabsContent>
              </Tabs>
            </div>

            <div className="bg-amber-100 dark:bg-amber-950/30 text-amber-950 dark:text-amber-100 p-4 rounded-md text-sm flex">
              <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
              <div>
                <p className="font-medium">Import Format Guidelines:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>
                    <strong>JSON</strong>: Must be an array of task objects with at least a "name" property
                  </li>
                  <li>
                    <strong>CSV</strong>: Must include a header row with at least a "Name" column
                  </li>
                  <li>For subtasks in CSV, indent the name with spaces and start with a dash</li>
                  <li>Valid statuses: "todo", "started", "completed"</li>
                  <li>Valid priorities: "low", "medium", "high"</li>
                  <li>Valid types: "standard", "tally", "subtasks"</li>
                </ul>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
