"use client"

import { useState } from "react"
import { MoreHorizontal, Download, Trash2, Mic } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { db } from "@/lib/db"
import { useToast } from "@/components/ui/use-toast"
import { exportAudioRecording } from "@/lib/export-utils"

interface TranscriptionActionsProps {
  checkInId: string
  onDelete?: () => void
}

export function TranscriptionActions({ checkInId, onDelete }: TranscriptionActionsProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleExport = async (type: "transcription" | "audio" = "transcription") => {
    try {
      setIsLoading(true)

      if (type === "audio") {
        // Export the audio recording
        const result = await exportAudioRecording(checkInId)

        if (result.success) {
          toast({
            title: "Success",
            description: "Audio recording exported successfully",
          })
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to export audio recording",
            variant: "destructive",
          })
        }
        return
      }

      // Get the check-in
      const checkIn = await db.checkIns.get(checkInId)
      if (!checkIn || !checkIn.transcription) {
        toast({
          title: "Error",
          description: "Transcription not found",
          variant: "destructive",
        })
        return
      }

      // Create a text file
      const text = checkIn.transcription
      const blob = new Blob([text], { type: "text/plain" })
      const url = URL.createObjectURL(blob)

      // Create a download link
      const a = document.createElement("a")
      a.href = url
      a.download = `transcription-${checkIn.date}-${checkIn.segmentName.replace(/\s+/g, "-")}.txt`
      document.body.appendChild(a)
      a.click()

      // Clean up
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: "Success",
        description: "Transcription exported successfully",
      })
    } catch (error) {
      console.error("Error exporting:", error)
      toast({
        title: "Error",
        description: "Failed to export",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    try {
      setIsLoading(true)

      // Update the check-in to remove the transcription
      await db.checkIns.update(checkInId, { transcription: "" })

      toast({
        title: "Success",
        description: "Transcription deleted successfully",
      })

      // Call the onDelete callback if provided
      if (onDelete) {
        onDelete()
      }
    } catch (error) {
      console.error("Error deleting transcription:", error)
      toast({
        title: "Error",
        description: "Failed to delete transcription",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-6 w-6" disabled={isLoading}>
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Actions</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport("transcription")} disabled={isLoading}>
          <Download className="mr-2 h-4 w-4" />
          Export Transcription
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("audio")} disabled={isLoading}>
          <Mic className="mr-2 h-4 w-4" />
          Export Audio
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleDelete} disabled={isLoading} className="text-destructive">
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
