"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Check, X } from "lucide-react"
import { db } from "@/lib/db"
import { useToast } from "@/components/ui/use-toast"

interface InlineTaskEditorProps {
  task: any
  onSave: (updatedTask: any) => void
  onCancel: () => void
}

export function InlineTaskEditor({ task, onSave, onCancel }: InlineTaskEditorProps) {
  const [taskName, setTaskName] = useState(task.name)
  const inputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    // Focus the input when the component mounts
    if (inputRef.current) {
      inputRef.current.focus()
      // Select all text
      inputRef.current.setSelectionRange(0, taskName.length)
    }
  }, [taskName.length])

  const handleSave = async () => {
    if (!taskName.trim()) {
      toast({
        title: "Error",
        description: "Task name cannot be empty",
        variant: "destructive",
      })
      return
    }

    try {
      const updatedTask = { ...task, name: taskName.trim() }
      await db.tasks.update(task.id, { name: taskName.trim() })
      onSave(updatedTask)
    } catch (error) {
      console.error("Error updating task:", error)
      toast({
        title: "Error",
        description: "Failed to update task",
        variant: "destructive",
      })
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleSave()
    } else if (e.key === "Escape") {
      e.preventDefault()
      onCancel()
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        ref={inputRef}
        value={taskName}
        onChange={(e) => setTaskName(e.target.value)}
        onKeyDown={handleKeyDown}
        className="flex-grow"
      />
      <Button variant="ghost" size="icon" onClick={handleSave}>
        <Check className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" onClick={onCancel}>
        <X className="h-4 w-4" />
      </Button>
    </div>
  )
}
