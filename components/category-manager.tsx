"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/components/ui/use-toast"
import { useCategories } from "@/hooks/use-categories"
import type { Category } from "@/lib/db"
import { Plus, Edit, Trash2, MoreHorizontal, Tag, Briefcase, User, Heart, Home, Book } from "lucide-react"

// List of available icons
const AVAILABLE_ICONS = [
  { name: "briefcase", component: <Briefcase className="h-4 w-4" /> },
  { name: "user", component: <User className="h-4 w-4" /> },
  { name: "heart", component: <Heart className="h-4 w-4" /> },
  { name: "home", component: <Home className="h-4 w-4" /> },
  { name: "book", component: <Book className="h-4 w-4" /> },
  { name: "tag", component: <Tag className="h-4 w-4" /> },
]

// List of available colors
const AVAILABLE_COLORS = [
  { name: "Blue", value: "#3b82f6" },
  { name: "Purple", value: "#8b5cf6" },
  { name: "Green", value: "#10b981" },
  { name: "Amber", value: "#f59e0b" },
  { name: "Pink", value: "#ec4899" },
  { name: "Red", value: "#ef4444" },
  { name: "Indigo", value: "#6366f1" },
  { name: "Teal", value: "#14b8a6" },
  { name: "Orange", value: "#f97316" },
  { name: "Slate", value: "#64748b" },
]

export function CategoryManager() {
  const { categories, isLoading, addCategory, updateCategory, deleteCategory, getTaskCountByCategory } = useCategories()
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [newCategory, setNewCategory] = useState({
    name: "",
    color: "#3b82f6",
    icon: "tag",
    description: "",
  })
  const [editedCategory, setEditedCategory] = useState({
    name: "",
    color: "",
    icon: "",
    description: "",
  })
  const [categoryTaskCounts, setCategoryTaskCounts] = useState<Record<string, number>>({})
  const { toast } = useToast()

  // Load task counts for each category
  useEffect(() => {
    if (categories.length > 0) {
      const loadTaskCounts = async () => {
        const counts: Record<string, number> = {}
        for (const category of categories) {
          counts[category.id] = await getTaskCountByCategory(category.id)
        }
        setCategoryTaskCounts(counts)
      }
      loadTaskCounts()
    }
  }, [categories, getTaskCountByCategory])

  const handleAddCategory = async () => {
    if (!newCategory.name.trim()) {
      toast({
        title: "Category name required",
        description: "Please enter a name for the category",
        variant: "destructive",
      })
      return
    }

    // Check if a category with this name already exists
    const existingCategory = categories.find((cat) => cat.name.toLowerCase() === newCategory.name.trim().toLowerCase())

    if (existingCategory) {
      toast({
        title: "Category already exists",
        description: `A category named "${newCategory.name}" already exists`,
        variant: "destructive",
      })
      return
    }

    const result = await addCategory({
      name: newCategory.name.trim(),
      color: newCategory.color,
      icon: newCategory.icon,
      description: newCategory.description.trim(),
      isDefault: false,
    })

    if (result.success) {
      toast({
        title: "Category added",
        description: `Category "${newCategory.name}" has been added`,
      })
      setIsAddDialogOpen(false)
      setNewCategory({
        name: "",
        color: "#3b82f6",
        icon: "tag",
        description: "",
      })
    } else {
      toast({
        title: "Failed to add category",
        description: result.error ? `Error: ${result.error.message}` : "An error occurred while adding the category",
        variant: "destructive",
      })
    }
  }

  const handleEditCategory = async () => {
    if (!selectedCategory) return

    if (!editedCategory.name.trim()) {
      toast({
        title: "Category name required",
        description: "Please enter a name for the category",
        variant: "destructive",
      })
      return
    }

    const result = await updateCategory(selectedCategory.id, {
      name: editedCategory.name.trim(),
      color: editedCategory.color,
      icon: editedCategory.icon,
      description: editedCategory.description.trim(),
    })

    if (result.success) {
      toast({
        title: "Category updated",
        description: `Category "${editedCategory.name}" has been updated`,
      })
      setIsEditDialogOpen(false)
      setSelectedCategory(null)
    } else {
      toast({
        title: "Failed to update category",
        description: "An error occurred while updating the category",
        variant: "destructive",
      })
    }
  }

  const handleDeleteCategory = async () => {
    if (!selectedCategory) return

    const result = await deleteCategory(selectedCategory.id)

    if (result.success) {
      toast({
        title: "Category deleted",
        description: `Category "${selectedCategory.name}" has been deleted`,
      })
      setIsDeleteDialogOpen(false)
      setSelectedCategory(null)
    } else {
      toast({
        title: "Failed to delete category",
        description: "An error occurred while deleting the category",
        variant: "destructive",
      })
    }
  }

  const openEditDialog = (category: Category) => {
    setSelectedCategory(category)
    setEditedCategory({
      name: category.name,
      color: category.color,
      icon: category.icon || "tag",
      description: category.description || "",
    })
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (category: Category) => {
    setSelectedCategory(category)
    setIsDeleteDialogOpen(true)
  }

  const getIconComponent = (iconName: string) => {
    const icon = AVAILABLE_ICONS.find((i) => i.name === iconName)
    return icon ? icon.component : <Tag className="h-4 w-4" />
  }

  if (isLoading) {
    return <div className="text-center py-4">Loading categories...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Categories</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Category</DialogTitle>
              <DialogDescription>Create a new category to organize your tasks</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  placeholder="e.g., Work, Personal, Health"
                />
              </div>
              <div className="grid gap-2">
                <Label>Color</Label>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_COLORS.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      className={`w-8 h-8 rounded-full ${
                        newCategory.color === color.value ? "ring-2 ring-offset-2 ring-primary" : ""
                      }`}
                      style={{ backgroundColor: color.value }}
                      onClick={() => setNewCategory({ ...newCategory, color: color.value })}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Icon</Label>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_ICONS.map((icon) => (
                    <button
                      key={icon.name}
                      type="button"
                      className={`w-8 h-8 rounded-full flex items-center justify-center border ${
                        newCategory.icon === icon.name
                          ? "bg-primary text-primary-foreground"
                          : "bg-background hover:bg-muted"
                      }`}
                      onClick={() => setNewCategory({ ...newCategory, icon: icon.name })}
                      title={icon.name}
                    >
                      {icon.component}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={newCategory.description}
                  onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                  placeholder="Brief description of this category"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddCategory}>Add Category</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {categories.length === 0 ? (
        <div className="text-center py-8 border rounded-md bg-muted/50">
          <Tag className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
          <h3 className="text-lg font-medium">No Categories Yet</h3>
          <p className="text-sm text-muted-foreground mb-4">Create categories to organize your tasks</p>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Your First Category
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <div
              key={category.id}
              className="border rounded-md p-4 relative group hover:shadow-sm transition-shadow"
              style={{ borderLeftWidth: "4px", borderLeftColor: category.color }}
            >
              <div className="absolute top-2 right-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openEditDialog(category)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => openDeleteDialog(category)}
                      disabled={category.isDefault}
                      className={category.isDefault ? "text-muted-foreground" : "text-destructive"}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex items-center mb-2">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center mr-2"
                  style={{ backgroundColor: category.color }}
                >
                  {getIconComponent(category.icon || "tag")}
                </div>
                <h3 className="font-medium">{category.name}</h3>
                {category.isDefault && <span className="ml-2 text-xs bg-muted px-2 py-0.5 rounded-full">Default</span>}
              </div>

              {category.description && <p className="text-sm text-muted-foreground mb-2">{category.description}</p>}

              <div className="text-xs text-muted-foreground mt-2">
                {categoryTaskCounts[category.id] || 0} tasks in this category
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Category Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>Update category details</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={editedCategory.name}
                onChange={(e) => setEditedCategory({ ...editedCategory, name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    className={`w-8 h-8 rounded-full ${
                      editedCategory.color === color.value ? "ring-2 ring-offset-2 ring-primary" : ""
                    }`}
                    style={{ backgroundColor: color.value }}
                    onClick={() => setEditedCategory({ ...editedCategory, color: color.value })}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Icon</Label>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_ICONS.map((icon) => (
                  <button
                    key={icon.name}
                    type="button"
                    className={`w-8 h-8 rounded-full flex items-center justify-center border ${
                      editedCategory.icon === icon.name
                        ? "bg-primary text-primary-foreground"
                        : "bg-background hover:bg-muted"
                    }`}
                    onClick={() => setEditedCategory({ ...editedCategory, icon: icon.name })}
                    title={icon.name}
                  >
                    {icon.component}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description (Optional)</Label>
              <Textarea
                id="edit-description"
                value={editedCategory.description}
                onChange={(e) => setEditedCategory({ ...editedCategory, description: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditCategory}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Category Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the category "{selectedCategory?.name}". Tasks in this category will not be deleted, but
              they will no longer be associated with any category.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCategory} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
