"use client"

import { useState, useEffect } from "react"
import { Download, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { db } from "@/lib/db"
import { useToast } from "@/components/ui/use-toast"

interface TranscriptionExportProps {
  onClose?: () => void
}

export function TranscriptionExport({ onClose }: TranscriptionExportProps) {
  const [startDate, setStartDate] = useState<Date>(new Date())
  const [endDate, setEndDate] = useState<Date>(new Date())
  const [format, setFormat] = useState<"txt" | "json" | "csv">("txt")
  const [includeMetadata, setIncludeMetadata] = useState(true)
  const [includeNotes, setIncludeNotes] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [transcriptionCount, setTranscriptionCount] = useState(0)
  const { toast } = useToast()
  const [includeAudio, setIncludeAudio] = useState(false)

  // Get count of transcriptions
  useEffect(() => {
    const fetchTranscriptionCount = async () => {
      try {
        const checkIns = await db.checkIns.where("isVoiceCheckIn").equals(true).toArray()
        const withTranscriptions = checkIns.filter((c) => c.transcription && c.transcription.trim() !== "")
        setTranscriptionCount(withTranscriptions.length)
      } catch (error) {
        console.error("Error fetching transcription count:", error)
      }
    }

    fetchTranscriptionCount()
  }, [])

  const handleExport = async () => {
    try {
      setIsLoading(true)

      // Format dates for DB query
      const startDateStr = format(startDate, "yyyy-MM-dd")
      const endDateStr = format(endDate, "yyyy-MM-dd")

      // Get all voice check-ins with transcriptions in the date range
      const checkIns = await db.checkIns
        .where("isVoiceCheckIn")
        .equals(true)
        .and((c) => c.date >= startDateStr && c.date <= endDateStr && c.transcription && c.transcription.trim() !== "")
        .toArray()

      if (checkIns.length === 0) {
        toast({
          title: "No transcriptions found",
          description: "There are no transcriptions in the selected date range.",
          variant: "destructive",
        })
        return
      }

      if (includeAudio && format === "zip") {
        // Show a message that this feature is coming soon
        toast({
          title: "Coming Soon",
          description: "Batch audio export will be available in a future update.",
          variant: "default",
        })
      }

      let content: string
      let mimeType: string
      let fileExtension: string

      if (format === "txt") {
        content = checkIns
          .map((c) => {
            let text = ""

            if (includeMetadata) {
              text += `Date: ${c.date}\n`
              text += `Time: ${c.time}\n`
              text += `Segment: ${c.segmentName}\n`
            }

            text += `\n${c.transcription}\n`

            if (includeNotes && c.voiceNotes) {
              text += `\nNotes: ${c.voiceNotes}\n`
            }

            text += "\n---\n\n"
            return text
          })
          .join("")

        mimeType = "text/plain"
        fileExtension = "txt"
      } else if (format === "json") {
        const jsonData = checkIns.map((c) => {
          const data: any = {
            transcription: c.transcription,
          }

          if (includeMetadata) {
            data.date = c.date
            data.time = c.time
            data.segment = c.segmentName
          }

          if (includeNotes && c.voiceNotes) {
            data.notes = c.voiceNotes
          }

          return data
        })

        content = JSON.stringify(jsonData, null, 2)
        mimeType = "application/json"
        fileExtension = "json"
      } else {
        // csv
        let headers = ["Transcription"]
        if (includeMetadata) {
          headers = ["Date", "Time", "Segment", ...headers]
        }
        if (includeNotes) {
          headers.push("Notes")
        }

        content = headers.join(",") + "\n"

        content += checkIns
          .map((c) => {
            const row = []

            if (includeMetadata) {
              row.push(`"${c.date}"`, `"${c.time}"`, `"${c.segmentName.replace(/"/g, '""')}"`)
            }

            row.push(`"${c.transcription.replace(/"/g, '""')}"`)

            if (includeNotes) {
              row.push(`"${(c.voiceNotes || "").replace(/"/g, '""')}"`)
            }

            return row.join(",")
          })
          .join("\n")

        mimeType = "text/csv"
        fileExtension = "csv"
      }

      // Create a blob and download link
      const blob = new Blob([content], { type: mimeType })
      const url = URL.createObjectURL(blob)

      const a = document.createElement("a")
      a.href = url
      a.download = `transcriptions-${startDateStr}-to-${endDateStr}.${fileExtension}`
      document.body.appendChild(a)
      a.click()

      // Clean up
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: "Success",
        description: `Exported ${checkIns.length} transcriptions successfully.`,
      })

      if (onClose) {
        onClose()
      }
    } catch (error) {
      console.error("Error exporting transcriptions:", error)
      toast({
        title: "Error",
        description: "Failed to export transcriptions",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium">Export Transcriptions</h3>
        <p className="text-sm text-muted-foreground">Export your voice check-in transcriptions as a file.</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Start Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left">
                <Calendar className="mr-2 h-4 w-4" />
                {format(startDate, "PPP")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <CalendarComponent
                mode="single"
                selected={startDate}
                onSelect={(date) => date && setStartDate(date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label>End Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left">
                <Calendar className="mr-2 h-4 w-4" />
                {format(endDate, "PPP")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <CalendarComponent
                mode="single"
                selected={endDate}
                onSelect={(date) => date && setEndDate(date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Export Format</Label>
        <RadioGroup value={format} onValueChange={(value) => setFormat(value as any)} className="flex space-x-4">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="txt" id="txt" />
            <Label htmlFor="txt">Text</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="json" id="json" />
            <Label htmlFor="json">JSON</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="csv" id="csv" />
            <Label htmlFor="csv">CSV</Label>
          </div>
        </RadioGroup>
      </div>

      <div className="space-y-2">
        <Label>Options</Label>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="include-metadata"
              checked={includeMetadata}
              onCheckedChange={(checked) => setIncludeMetadata(!!checked)}
            />
            <Label htmlFor="include-metadata">Include date, time, and segment</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="include-notes"
              checked={includeNotes}
              onCheckedChange={(checked) => setIncludeNotes(!!checked)}
            />
            <Label htmlFor="include-notes">Include notes</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="include-audio"
              checked={includeAudio}
              onCheckedChange={(checked) => setIncludeAudio(!!checked)}
            />
            <Label htmlFor="include-audio">Include audio recordings (ZIP format)</Label>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleExport} disabled={isLoading || transcriptionCount === 0}>
          <Download className="mr-2 h-4 w-4" />
          Export {transcriptionCount > 0 ? `(${transcriptionCount})` : ""}
        </Button>
      </div>
    </div>
  )
}
