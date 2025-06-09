/**
 * Utility functions for exporting data from the app
 */

import { db, type CheckIn } from "./db"
import { format } from "date-fns"

/**
 * Export formats supported by the app
 */
export type ExportFormat = "txt" | "json" | "csv" | "markdown"

/**
 * Options for exporting transcriptions
 */
export interface TranscriptionExportOptions {
  format: ExportFormat
  includeMetadata: boolean
  includeNotes: boolean
  dateRange?: {
    start: Date
    end: Date
  }
}

/**
 * Default export options
 */
export const defaultExportOptions: TranscriptionExportOptions = {
  format: "txt",
  includeMetadata: true,
  includeNotes: true,
}

/**
 * Export a single transcription as a file
 */
export async function exportTranscription(checkInId: string, options: Partial<TranscriptionExportOptions> = {}) {
  try {
    // Merge with default options
    const exportOptions = { ...defaultExportOptions, ...options }

    // Get the check-in from the database
    const checkIn = await db.checkIns.get(checkInId)
    if (!checkIn || !checkIn.transcription) {
      throw new Error("Transcription not found")
    }

    // Generate the file content based on the format
    const content = generateTranscriptionContent(checkIn, exportOptions)

    // Generate filename
    const date = new Date(checkIn.time)
    const formattedDate = format(date, "yyyy-MM-dd_HH-mm")
    const segmentName = checkIn.segmentName.replace(/\s+/g, "-").toLowerCase()
    const extension = exportOptions.format
    const filename = `transcription_${segmentName}_${formattedDate}.${extension}`

    // Trigger download
    downloadFile(content, filename, getMimeType(exportOptions.format))

    return { success: true, filename }
  } catch (error) {
    console.error("Error exporting transcription:", error)
    return { success: false, error: (error as Error).message }
  }
}

/**
 * Export all transcriptions within a date range
 */
export async function exportAllTranscriptions(options: Partial<TranscriptionExportOptions> = {}) {
  try {
    // Merge with default options
    const exportOptions = { ...defaultExportOptions, ...options }

    // Get all check-ins with transcriptions
    let checkInsCollection = db.checkIns
      .where("isVoiceCheckIn")
      .equals(true)
      .and((checkIn) => Boolean(checkIn.transcription))

    // Apply date range filter if provided
    if (exportOptions.dateRange) {
      const startDate = format(exportOptions.dateRange.start, "yyyy-MM-dd")
      const endDate = format(exportOptions.dateRange.end, "yyyy-MM-dd")

      checkInsCollection = checkInsCollection.and((checkIn) => {
        return checkIn.date >= startDate && checkIn.date <= endDate
      })
    }

    const checkIns = await checkInsCollection.toArray()

    if (checkIns.length === 0) {
      throw new Error("No transcriptions found")
    }

    // Generate content based on format
    let content: string

    if (exportOptions.format === "json") {
      content = generateJsonExport(checkIns, exportOptions)
    } else if (exportOptions.format === "csv") {
      content = generateCsvExport(checkIns, exportOptions)
    } else if (exportOptions.format === "markdown") {
      content = generateMarkdownExport(checkIns, exportOptions)
    } else {
      // Default to text format
      content = generateTextExport(checkIns, exportOptions)
    }

    // Generate filename
    const currentDate = format(new Date(), "yyyy-MM-dd")
    const extension = exportOptions.format
    const filename = `all_transcriptions_${currentDate}.${extension}`

    // Trigger download
    downloadFile(content, filename, getMimeType(exportOptions.format))

    return { success: true, filename, count: checkIns.length }
  } catch (error) {
    console.error("Error exporting all transcriptions:", error)
    return { success: false, error: (error as Error).message }
  }
}

/**
 * Export an audio recording as a file
 */
export async function exportAudioRecording(
  checkInId: string,
): Promise<{ success: boolean; filename?: string; error?: string }> {
  try {
    // Get the check-in from the database
    const checkIn = await db.checkIns.get(checkInId)
    if (!checkIn || !checkIn.voiceRecordingUrl) {
      throw new Error("Audio recording not found")
    }

    // Generate filename
    const date = new Date(checkIn.time)
    const formattedDate = format(date, "yyyy-MM-dd_HH-mm")
    const segmentName = checkIn.segmentName.replace(/\s+/g, "-").toLowerCase()
    const filename = `audio_${segmentName}_${formattedDate}.mp3`

    // Fetch the audio data
    const response = await fetch(checkIn.voiceRecordingUrl)
    if (!response.ok) {
      throw new Error("Failed to fetch audio data")
    }

    // Get the audio blob
    const audioBlob = await response.blob()

    // Trigger download
    downloadFile(audioBlob, filename, "audio/mpeg")

    return { success: true, filename }
  } catch (error) {
    console.error("Error exporting audio recording:", error)
    return { success: false, error: (error as Error).message }
  }
}

/**
 * Generate content for a single transcription based on format
 */
function generateTranscriptionContent(checkIn: CheckIn, options: TranscriptionExportOptions): string {
  switch (options.format) {
    case "json":
      return JSON.stringify(formatCheckInForExport(checkIn, options), null, 2)
    case "csv":
      return generateCsvForSingleCheckIn(checkIn, options)
    case "markdown":
      return generateMarkdownForSingleCheckIn(checkIn, options)
    case "txt":
    default:
      return generateTextForSingleCheckIn(checkIn, options)
  }
}

/**
 * Format a check-in for export, including only the requested data
 */
function formatCheckInForExport(checkIn: CheckIn, options: TranscriptionExportOptions) {
  const result: Record<string, any> = {
    transcription: checkIn.transcription || "",
  }

  if (options.includeMetadata) {
    result.date = checkIn.date
    result.time = checkIn.time
    result.segment = checkIn.segmentName
  }

  if (options.includeNotes && checkIn.voiceNotes) {
    result.notes = checkIn.voiceNotes
  }

  return result
}

/**
 * Generate text format for a single check-in
 */
function generateTextForSingleCheckIn(checkIn: CheckIn, options: TranscriptionExportOptions): string {
  let content = ""

  if (options.includeMetadata) {
    content += `Date: ${checkIn.date}\n`
    content += `Time: ${format(new Date(checkIn.time), "h:mm a")}\n`
    content += `Segment: ${checkIn.segmentName}\n\n`
  }

  content += `Transcription:\n${checkIn.transcription || "No transcription available."}\n\n`

  if (options.includeNotes && checkIn.voiceNotes) {
    content += `Notes:\n${checkIn.voiceNotes}\n`
  }

  return content
}

/**
 * Generate CSV format for a single check-in
 */
function generateCsvForSingleCheckIn(checkIn: CheckIn, options: TranscriptionExportOptions): string {
  const headers = ["Transcription"]
  const values = [escapeCsvValue(checkIn.transcription || "")]

  if (options.includeMetadata) {
    headers.unshift("Segment", "Time", "Date")
    values.unshift(
      escapeCsvValue(checkIn.segmentName),
      escapeCsvValue(format(new Date(checkIn.time), "h:mm a")),
      escapeCsvValue(checkIn.date),
    )
  }

  if (options.includeNotes) {
    headers.push("Notes")
    values.push(escapeCsvValue(checkIn.voiceNotes || ""))
  }

  return `${headers.join(",")}\n${values.join(",")}`
}

/**
 * Generate Markdown format for a single check-in
 */
function generateMarkdownForSingleCheckIn(checkIn: CheckIn, options: TranscriptionExportOptions): string {
  let content = "# Voice Check-in Transcription\n\n"

  if (options.includeMetadata) {
    content += `- **Date:** ${checkIn.date}\n`
    content += `- **Time:** ${format(new Date(checkIn.time), "h:mm a")}\n`
    content += `- **Segment:** ${checkIn.segmentName}\n\n`
  }

  content += `## Transcription\n\n${checkIn.transcription || "No transcription available."}\n\n`

  if (options.includeNotes && checkIn.voiceNotes) {
    content += `## Notes\n\n${checkIn.voiceNotes}\n`
  }

  return content
}

/**
 * Generate text export for multiple check-ins
 */
function generateTextExport(checkIns: CheckIn[], options: TranscriptionExportOptions): string {
  let content = "TRANSCRIPTIONS EXPORT\n"
  content += "====================\n\n"

  checkIns.forEach((checkIn, index) => {
    if (options.includeMetadata) {
      content += `Date: ${checkIn.date}\n`
      content += `Time: ${format(new Date(checkIn.time), "h:mm a")}\n`
      content += `Segment: ${checkIn.segmentName}\n\n`
    }

    content += `Transcription:\n${checkIn.transcription || "No transcription available."}\n\n`

    if (options.includeNotes && checkIn.voiceNotes) {
      content += `Notes:\n${checkIn.voiceNotes}\n`
    }

    if (index < checkIns.length - 1) {
      content += "\n----------------------------\n\n"
    }
  })

  return content
}

/**
 * Generate JSON export for multiple check-ins
 */
function generateJsonExport(checkIns: CheckIn[], options: TranscriptionExportOptions): string {
  const formattedCheckIns = checkIns.map((checkIn) => formatCheckInForExport(checkIn, options))
  return JSON.stringify(formattedCheckIns, null, 2)
}

/**
 * Generate CSV export for multiple check-ins
 */
function generateCsvExport(checkIns: CheckIn[], options: TranscriptionExportOptions): string {
  const headers = ["Transcription"]

  if (options.includeMetadata) {
    headers.unshift("Segment", "Time", "Date")
  }

  if (options.includeNotes) {
    headers.push("Notes")
  }

  let content = headers.join(",") + "\n"

  checkIns.forEach((checkIn) => {
    const values = [escapeCsvValue(checkIn.transcription || "")]

    if (options.includeMetadata) {
      values.unshift(
        escapeCsvValue(checkIn.segmentName),
        escapeCsvValue(format(new Date(checkIn.time), "h:mm a")),
        escapeCsvValue(checkIn.date),
      )
    }

    if (options.includeNotes) {
      values.push(escapeCsvValue(checkIn.voiceNotes || ""))
    }

    content += values.join(",") + "\n"
  })

  return content
}

/**
 * Generate Markdown export for multiple check-ins
 */
function generateMarkdownExport(checkIns: CheckIn[], options: TranscriptionExportOptions): string {
  let content = "# Voice Check-in Transcriptions\n\n"

  checkIns.forEach((checkIn, index) => {
    content += `## Check-in ${index + 1}\n\n`

    if (options.includeMetadata) {
      content += `- **Date:** ${checkIn.date}\n`
      content += `- **Time:** ${format(new Date(checkIn.time), "h:mm a")}\n`
      content += `- **Segment:** ${checkIn.segmentName}\n\n`
    }

    content += `### Transcription\n\n${checkIn.transcription || "No transcription available."}\n\n`

    if (options.includeNotes && checkIn.voiceNotes) {
      content += `### Notes\n\n${checkIn.voiceNotes}\n\n`
    }

    if (index < checkIns.length - 1) {
      content += "---\n\n"
    }
  })

  return content
}

/**
 * Escape a value for CSV format
 */
function escapeCsvValue(value: string): string {
  // If the value contains commas, quotes, or newlines, wrap it in quotes
  if (/[",\n\r]/.test(value)) {
    // Replace any quotes with double quotes
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

/**
 * Get the MIME type for a file format
 */
function getMimeType(format: ExportFormat): string {
  switch (format) {
    case "json":
      return "application/json"
    case "csv":
      return "text/csv"
    case "markdown":
      return "text/markdown"
    case "txt":
    default:
      return "text/plain"
  }
}

/**
 * Trigger a file download
 */
function downloadFile(content: string | Blob, filename: string, mimeType: string): void {
  // Create a blob with the content if it's a string
  const blob = typeof content === "string" ? new Blob([content], { type: mimeType }) : content

  // Create a URL for the blob
  const url = URL.createObjectURL(blob)

  // Create a link element
  const link = document.createElement("a")
  link.href = url
  link.download = filename

  // Append the link to the body
  document.body.appendChild(link)

  // Click the link to trigger the download
  link.click()

  // Clean up
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
