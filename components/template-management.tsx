"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Plus, Search, Edit, Trash2, Copy, Tag, CheckSquare, LayoutList, Repeat, Clock, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useTaskTemplates } from "@/hooks/use-task-templates"
import { useCategories } from "@/hooks/use-categories"
import { useSegments } from "@/hooks/use-dexie-store"
import type { TaskTemplate, SubtaskTemplate } from "@/lib/db"
import { cn } from "@/lib/utils"

export function TemplateManagement() {
  const router = useRouter()
  const { templates, isLoading, createTemplate, updateTemplate, deleteTemplate, createTaskFromTemplate } =
    useTaskTemplates()
  const { categories } = useCategories()
  const [segments] = useSegments()

  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<TaskTemplate | null>(null)

  // Form state for creating/editing templates
  const [formData, setFormData] = useState<{
    name: string
    description: string
    type: "standard" | "tally" | "subtasks"
    isRecurring: boolean
    preferredSegment?: string
    categoryId?: string
    subtasks: SubtaskTemplate[]
  }>({
    name: "",
    description: "",
    type: "standard",
    isRecurring: true,
    preferredSegment: "any",
    categoryId: undefined,
    subtasks: [],
  })

  // Reset form when dialog closes
  useEffect(() => {
    if (!showCreateDialog && !showEditDialog) {
      setFormData({
        name: "",
        description: "",
        type: "standard",
        isRecurring: true,
        preferredSegment: "any",
        categoryId: undefined,
        subtasks: [],
      })
    }
  }, [showCreateDialog, showEditDialog])

  // Set form data when editing a template
  useEffect(() => {
    if (selectedTemplate && showEditDialog) {
      setFormData({
        name: selectedTemplate.name,
        description: selectedTemplate.description || "",
        type: selectedTemplate.type || "standard",
        isRecurring: selectedTemplate.isRecurring,
        preferredSegment: selectedTemplate.preferredSegment || "any",
        categoryId: selectedTemplate.categoryId,
        subtasks: selectedTemplate.subtasks || [],
      })
    }
  }, [selectedTemplate, showEditDialog])

  // Filter templates based on search query and filters
  const filteredTemplates = templates.filter((template) => {
    // Search query filter
    const matchesSearch =
      searchQuery === "" ||
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (template.description && template.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (template.tags && template.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase())))

    // Category filter
    const matchesCategory =
      categoryFilter === "all" ||
      (categoryFilter === "uncategorized" && !template.categoryId) ||
      template.categoryId === categoryFilter

    // Type filter
    const matchesType = typeFilter === "all" || template.type === typeFilter

    return matchesSearch && matchesCategory && matchesType
  })

  // Sort templates by most recently used
  const sortedTemplates = [...filteredTemplates].sort((a, b) => {
    // First by usage count (descending)
    if (b.usageCount !== a.usageCount) {
      return b.usageCount - a.usageCount
    }
    // Then by creation date (most recent first)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Handle switch changes
  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }))
  }

  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Add a new subtask to the form
  const addSubtask = () => {
    setFormData((prev) => ({
      ...prev,
      subtasks: [
        ...prev.subtasks,
        {
          id: `temp-${Date.now()}`,
          name: "",
          description: "",
          order: prev.subtasks.length,
        },
      ],
    }))
  }

  // Update a subtask in the form
  const updateSubtask = (index: number, field: string, value: string) => {
    setFormData((prev) => {
      const updatedSubtasks = [...prev.subtasks]
      updatedSubtasks[index] = { ...updatedSubtasks[index], [field]: value }
      return { ...prev, subtasks: updatedSubtasks }
    })
  }

  // Remove a subtask from the form
  const removeSubtask = (index: number) => {
    setFormData((prev) => {
      const updatedSubtasks = prev.subtasks.filter((_, i) => i !== index)
      // Update order of remaining subtasks
      updatedSubtasks.forEach((subtask, i) => {
        subtask.order = i
      })
      return { ...prev, subtasks: updatedSubtasks }
    })
  }

  // Handle template creation
  const handleCreateTemplate = async () => {
    // Validate form
    if (!formData.name.trim()) {
      return
    }

    // Create template
    await createTemplate({
      name: formData.name,
      description: formData.description,
      type: formData.type,
      isRecurring: formData.isRecurring,
      preferredSegment: formData.preferredSegment === "any" ? undefined : formData.preferredSegment,
      categoryId: formData.categoryId,
      subtasks: formData.type === "subtasks" ? formData.subtasks : undefined,
    })

    setShowCreateDialog(false)
  }

  // Handle template update
  const handleUpdateTemplate = async () => {
    if (!selectedTemplate || !formData.name.trim()) {
      return
    }

    await updateTemplate(selectedTemplate.id, {
      name: formData.name,
      description: formData.description,
      type: formData.type,
      isRecurring: formData.isRecurring,
      preferredSegment: formData.preferredSegment === "any" ? undefined : formData.preferredSegment,
      categoryId: formData.categoryId,
      subtasks: formData.type === "subtasks" ? formData.subtasks : undefined,
    })

    setShowEditDialog(false)
  }

  // Handle template deletion
  const handleDeleteTemplate = async () => {
    if (!selectedTemplate) {
      return
    }

    await deleteTemplate(selectedTemplate.id)
    setShowDeleteDialog(false)
  }

  // Handle creating a task from a template
  const handleCreateTaskFromTemplate = async (templateId: string) => {
    const result = await createTaskFromTemplate(templateId)
    if (result.success) {
      router.push("/tasks")
    }
  }

  // Get category name by ID
  const getCategoryName = (categoryId?: string) => {
    if (!categoryId) return "Uncategorized"
    const category = categories.find((c) => c.id === categoryId)
    return category ? category.name : "Uncategorized"
  }

  // Get segment name by ID
  const getSegmentName = (segmentId?: string) => {
    if (!segmentId || segmentId === "any") return "Any segment"
    const segment = segments?.find((s) => s.id === segmentId)
    return segment ? segment.name : "Any segment"
  }

  // Get template type display name
  const getTemplateTypeName = (type?: string) => {
    switch (type) {
      case "standard":
        return "Standard Task"
      case "tally":
        return "Tally Task"
      case "subtasks":
        return "Task with Subtasks"
      default:
        return "Standard Task"
    }
  }

  // Get template type icon
  const getTemplateTypeIcon = (type?: string) => {
    switch (type) {
      case "standard":
        return <CheckSquare className="h-4 w-4" />
      case "tally":
        return <LayoutList className="h-4 w-4" />
      case "subtasks":
        return <FileText className="h-4 w-4" />
      default:
        return <CheckSquare className="h-4 w-4" />
    }
  }

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading templates...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Task Templates</h2>
          <p className="text-muted-foreground">Create and manage reusable task templates.</p>
        </div>

        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Template
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <Select value={categoryFilter} onValueChange={(value) => setCategoryFilter(value)}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="uncategorized">Uncategorized</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value)}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="standard">Standard Tasks</SelectItem>
            <SelectItem value="tally">Tally Tasks</SelectItem>
            <SelectItem value="subtasks">Tasks with Subtasks</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {sortedTemplates.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 border rounded-lg p-6 text-center">
          <div className="mb-4 p-3 rounded-full bg-muted">
            <FileText className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-2">No templates found</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery || categoryFilter !== "all" || typeFilter !== "all"
              ? "Try adjusting your search or filters."
              : "Create your first template to get started."}
          </p>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Template
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedTemplates.map((template) => (
            <Card key={template.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="line-clamp-1">{template.name}</CardTitle>
                    <CardDescription className="line-clamp-1">{getTemplateTypeName(template.type)}</CardDescription>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSelectedTemplate(template)
                        setShowEditDialog(true)
                      }}
                    >
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSelectedTemplate(template)
                        setShowDeleteDialog(true)
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="space-y-3">
                  {template.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{template.description}</p>
                  )}

                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="flex items-center gap-1">
                      {getTemplateTypeIcon(template.type)}
                      <span>{getTemplateTypeName(template.type)}</span>
                    </Badge>

                    {template.isRecurring && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Repeat className="h-3 w-3" />
                        <span>Recurring</span>
                      </Badge>
                    )}

                    {template.preferredSegment && template.preferredSegment !== "any" && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{getSegmentName(template.preferredSegment)}</span>
                      </Badge>
                    )}

                    {template.categoryId && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Tag className="h-3 w-3" />
                        <span>{getCategoryName(template.categoryId)}</span>
                      </Badge>
                    )}
                  </div>

                  {template.type === "subtasks" && template.subtasks && template.subtasks.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-medium mb-1">Subtasks:</p>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        {template.subtasks.slice(0, 3).map((subtask) => (
                          <li key={subtask.id} className="line-clamp-1">
                            • {subtask.name}
                          </li>
                        ))}
                        {template.subtasks.length > 3 && (
                          <li className="text-xs text-muted-foreground">+ {template.subtasks.length - 3} more</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <div className="flex justify-between items-center w-full">
                  <div className="text-xs text-muted-foreground">Used {template.usageCount || 0} times</div>
                  <Button variant="default" size="sm" onClick={() => handleCreateTaskFromTemplate(template.id)}>
                    <Copy className="mr-2 h-3 w-3" />
                    Use Template
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Create Template Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create Template</DialogTitle>
            <DialogDescription>Create a reusable task template for common activities.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Template Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="Enter template name"
                value={formData.name}
                onChange={handleInputChange}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Enter template description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="type">Task Type</Label>
                <Select value={formData.type} onValueChange={(value) => handleSelectChange("type", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select task type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard Task</SelectItem>
                    <SelectItem value="tally">Tally Task</SelectItem>
                    <SelectItem value="subtasks">Task with Subtasks</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="category">Category (Optional)</Label>
                <Select
                  value={formData.categoryId || ""}
                  onValueChange={(value) => handleSelectChange("categoryId", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Uncategorized</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="segment">Preferred Segment (Optional)</Label>
                <Select
                  value={formData.preferredSegment || "any"}
                  onValueChange={(value) => handleSelectChange("preferredSegment", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select segment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any segment</SelectItem>
                    {segments?.map((segment) => (
                      <SelectItem key={segment.id} value={segment.id}>
                        {segment.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2 pt-6">
                <Switch
                  id="isRecurring"
                  checked={formData.isRecurring}
                  onCheckedChange={(checked) => handleSwitchChange("isRecurring", checked)}
                />
                <Label htmlFor="isRecurring">Recurring Task</Label>
              </div>
            </div>

            {formData.type === "subtasks" && (
              <div className="space-y-4 mt-2">
                <div className="flex items-center justify-between">
                  <Label>Subtasks</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addSubtask}>
                    <Plus className="h-3 w-3 mr-1" /> Add Subtask
                  </Button>
                </div>

                {formData.subtasks.length === 0 ? (
                  <div className="text-center py-4 border rounded-md bg-muted/20">
                    <p className="text-sm text-muted-foreground">No subtasks added yet</p>
                  </div>
                ) : (
                  <ScrollArea className={cn("pr-3", formData.subtasks.length > 3 && "h-[200px]")}>
                    <div className="space-y-3">
                      {formData.subtasks.map((subtask, index) => (
                        <div key={subtask.id} className="flex gap-2 items-start">
                          <div className="flex-1 space-y-2">
                            <Input
                              placeholder="Subtask name"
                              value={subtask.name}
                              onChange={(e) => updateSubtask(index, "name", e.target.value)}
                            />
                            <Input
                              placeholder="Description (optional)"
                              value={subtask.description || ""}
                              onChange={(e) => updateSubtask(index, "description", e.target.value)}
                            />
                          </div>
                          <Button type="button" variant="ghost" size="icon" onClick={() => removeSubtask(index)}>
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Remove</span>
                          </Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTemplate}>Create Template</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Template Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Template</DialogTitle>
            <DialogDescription>Update your task template.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Template Name</Label>
              <Input
                id="edit-name"
                name="name"
                placeholder="Enter template name"
                value={formData.name}
                onChange={handleInputChange}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description (Optional)</Label>
              <Textarea
                id="edit-description"
                name="description"
                placeholder="Enter template description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-type">Task Type</Label>
                <Select value={formData.type} onValueChange={(value) => handleSelectChange("type", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select task type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard Task</SelectItem>
                    <SelectItem value="tally">Tally Task</SelectItem>
                    <SelectItem value="subtasks">Task with Subtasks</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-category">Category (Optional)</Label>
                <Select
                  value={formData.categoryId || ""}
                  onValueChange={(value) => handleSelectChange("categoryId", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Uncategorized</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-segment">Preferred Segment (Optional)</Label>
                <Select
                  value={formData.preferredSegment || "any"}
                  onValueChange={(value) => handleSelectChange("preferredSegment", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select segment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any segment</SelectItem>
                    {segments?.map((segment) => (
                      <SelectItem key={segment.id} value={segment.id}>
                        {segment.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2 pt-6">
                <Switch
                  id="edit-isRecurring"
                  checked={formData.isRecurring}
                  onCheckedChange={(checked) => handleSwitchChange("isRecurring", checked)}
                />
                <Label htmlFor="edit-isRecurring">Recurring Task</Label>
              </div>
            </div>

            {formData.type === "subtasks" && (
              <div className="space-y-4 mt-2">
                <div className="flex items-center justify-between">
                  <Label>Subtasks</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addSubtask}>
                    <Plus className="h-3 w-3 mr-1" /> Add Subtask
                  </Button>
                </div>

                {formData.subtasks.length === 0 ? (
                  <div className="text-center py-4 border rounded-md bg-muted/20">
                    <p className="text-sm text-muted-foreground">No subtasks added yet</p>
                  </div>
                ) : (
                  <ScrollArea className={cn("pr-3", formData.subtasks.length > 3 && "h-[200px]")}>
                    <div className="space-y-3">
                      {formData.subtasks.map((subtask, index) => (
                        <div key={subtask.id} className="flex gap-2 items-start">
                          <div className="flex-1 space-y-2">
                            <Input
                              placeholder="Subtask name"
                              value={subtask.name}
                              onChange={(e) => updateSubtask(index, "name", e.target.value)}
                            />
                            <Input
                              placeholder="Description (optional)"
                              value={subtask.description || ""}
                              onChange={(e) => updateSubtask(index, "description", e.target.value)}
                            />
                          </div>
                          <Button type="button" variant="ghost" size="icon" onClick={() => removeSubtask(index)}>
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Remove</span>
                          </Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateTemplate}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Template Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Template</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this template? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <p className="font-medium">{selectedTemplate?.name}</p>
            {selectedTemplate?.description && (
              <p className="text-sm text-muted-foreground mt-1">{selectedTemplate.description}</p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteTemplate}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
