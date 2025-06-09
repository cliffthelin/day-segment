"use client"

import type React from "react"
import { useState } from "react"
import { useTaskTemplates } from "@/hooks/use-task-templates"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"

interface TemplateSelectorProps {
  onSelectTemplate: (templateId: number) => void
  trigger?: React.ReactNode
}

export function TemplateSelector({ onSelectTemplate, trigger }: TemplateSelectorProps) {
  const { templates, isLoading } = useTaskTemplates()
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const filteredTemplates = templates.filter(
    (template) =>
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (template.description && template.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      template.taskData.title.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleSelectTemplate = (templateId: number) => {
    onSelectTemplate(templateId)
    setIsOpen(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger || <Button variant="outline">Use Template</Button>}</DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Select a Template</DialogTitle>
          <DialogDescription>Choose a template to create a new task quickly.</DialogDescription>
        </DialogHeader>

        <div className="relative mb-4">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {isLoading ? (
          <div className="text-center p-4">Loading templates...</div>
        ) : filteredTemplates.length === 0 ? (
          <div className="text-center p-4 text-muted-foreground">
            {searchQuery ? "No templates match your search" : "No templates available"}
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="grid gap-4">
              {filteredTemplates.map((template) => (
                <Card key={template.id} className="cursor-pointer hover:bg-accent/50 transition-colors">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{template.name}</CardTitle>
                    {template.description && (
                      <CardDescription className="text-xs">{template.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="pb-2">
                    <p className="text-sm font-medium">{template.taskData.title}</p>
                    {template.taskData.description && (
                      <p className="text-xs text-muted-foreground mt-1">{template.taskData.description}</p>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Button
                      variant="default"
                      size="sm"
                      className="ml-auto"
                      onClick={() => handleSelectTemplate(template.id!)}
                    >
                      Use Template
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  )
}
