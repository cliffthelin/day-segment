"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/components/ui/use-toast"
import { FileJson, FileSpreadsheet, FileText, FileDown, Download } from "lucide-react"
import { exportTasks, type ExportFormat } from "@/lib/task-export-utils"

export function TaskExport() {
  const [exportFormat, setExportFormat] = useState<ExportFormat>("csv")
  const [filterByStatus, setFilterByStatus] = useState<"all" | "completed" | "inProgress" | "todo">("all")
  const [includeDescription, setIncludeDescription] = useState(true)
  const [includeMetadata, setIncludeMetadata] = useState(true)
  const [includeSubtasks, setIncludeSubtasks] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const { toast } = useToast()

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const result = await exportTasks({
        format: exportFormat,
        includeDescription,
        includeMetadata,
        includeSubtasks,
        filterByStatus,
      })

      if (result.success) {
        toast({
          title: "Export successful",
          description: `${result.count} tasks exported to ${result.filename}`,
        })
      } else {
        toast({
          title: "Export failed",
          description: result.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Export failed",
        description: (error as Error).message,
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card
          className={`p-4 cursor-pointer ${exportFormat === "csv" ? "border-primary bg-primary/10" : ""}`}
          onClick={() => setExportFormat("csv")}
        >
          <div className="flex flex-col items-center justify-center text-center">
            <FileSpreadsheet className="h-8 w-8 mb-2" />
            <span className="text-sm font-medium">CSV</span>
            <span className="text-xs text-muted-foreground">Spreadsheet</span>
          </div>
        </Card>

        <Card
          className={`p-4 cursor-pointer ${exportFormat === "json" ? "border-primary bg-primary/10" : ""}`}
          onClick={() => setExportFormat("json")}
        >
          <div className="flex flex-col items-center justify-center text-center">
            <FileJson className="h-8 w-8 mb-2" />
            <span className="text-sm font-medium">JSON</span>
            <span className="text-xs text-muted-foreground">Data</span>
          </div>
        </Card>

        <Card
          className={`p-4 cursor-pointer ${exportFormat === "markdown" ? "border-primary bg-primary/10" : ""}`}
          onClick={() => setExportFormat("markdown")}
        >
          <div className="flex flex-col items-center justify-center text-center">
            <FileText className="h-8 w-8 mb-2" />
            <span className="text-sm font-medium">Markdown</span>
            <span className="text-xs text-muted-foreground">Documentation</span>
          </div>
        </Card>

        <Card
          className={`p-4 cursor-pointer ${exportFormat === "txt" ? "border-primary bg-primary/10" : ""}`}
          onClick={() => setExportFormat("txt")}
        >
          <div className="flex flex-col items-center justify-center text-center">
            <FileDown className="h-8 w-8 mb-2" />
            <span className="text-sm font-medium">Text</span>
            <span className="text-xs text-muted-foreground">Plain text</span>
          </div>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Filter by Status</h4>
          <RadioGroup
            value={filterByStatus}
            onValueChange={(value) => setFilterByStatus(value as any)}
            className="flex flex-col space-y-1"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="all" id="all" />
              <Label htmlFor="all">All tasks</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="completed" id="completed" />
              <Label htmlFor="completed">Completed tasks only</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="inProgress" id="inProgress" />
              <Label htmlFor="inProgress">In-progress tasks only</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="todo" id="todo" />
              <Label htmlFor="todo">To-do tasks only</Label>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-medium">Include in Export</h4>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeDescription"
                checked={includeDescription}
                onCheckedChange={(checked) => setIncludeDescription(!!checked)}
              />
              <Label htmlFor="includeDescription">Include descriptions</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeMetadata"
                checked={includeMetadata}
                onCheckedChange={(checked) => setIncludeMetadata(!!checked)}
              />
              <Label htmlFor="includeMetadata">Include metadata (dates, priorities, etc.)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeSubtasks"
                checked={includeSubtasks}
                onCheckedChange={(checked) => setIncludeSubtasks(!!checked)}
              />
              <Label htmlFor="includeSubtasks">Include subtasks</Label>
            </div>
          </div>
        </div>
      </div>

      <Button onClick={handleExport} disabled={isExporting} className="w-full">
        <Download className="mr-2 h-4 w-4" />
        {isExporting ? "Exporting..." : "Export Tasks"}
      </Button>
    </div>
  )
}
