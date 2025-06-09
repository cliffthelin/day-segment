"use client"

import type React from "react"
import { useState } from "react"
import { useTaskTemplates } from "@/hooks/use-task-templates"
import type { Task } from "@/types"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { SaveIcon } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface CreateTemplateFromTaskProps {
  task: Task
  trigger?: React.ReactNode
}

export function CreateTemplateFromTask({ task, trigger }: CreateTemplateFromTaskProps) {
  const { createTemplateFromTask } = useTaskTemplates()
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [templateName, setTemplateName] = useState(task.title)
  const [templateDescription, setTemplateDescription] = useState("")

  const handleCreateTemplate = async () => {
    try {
      if (!templateName) {
        toast({
          title: "Template name required",
          description: "Please provide a name for your template",
          variant: "destructive",
        })
        return
      }

      await createTemplateFromTask(task, templateName, templateDescription)

      toast({
        title: "Template created",
        description: "Your task template has been created successfully",
      })

      setIsOpen(false)
    } catch (error) {
      toast({
        title: "Error creating template",
        description: "There was an error creating your template",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <SaveIcon className="h-4 w-4 mr-2" />
            Save as Template
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save as Template</DialogTitle>
          <DialogDescription>Create a reusable template from this task.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="template-name">Template Name</Label>
            <Input
              id="template-name"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="Weekly Report Template"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="template-description">Template Description (Optional)</Label>
            <Textarea
              id="template-description"
              value={templateDescription}
              onChange={(e) => setTemplateDescription(e.target.value)}
              placeholder="Template for creating weekly reports"
            />
          </div>
          <div className="grid gap-2">
            <Label>Task Details (will be included in template)</Label>
            <div className="bg-muted p-3 rounded-md">
              <p className="font-medium">{task.title}</p>
              {task.description && <p className="text-sm text-muted-foreground mt-1">{task.description}</p>}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreateTemplate}>Create Template</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
