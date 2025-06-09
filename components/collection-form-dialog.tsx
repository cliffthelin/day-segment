"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { useCollections } from "@/hooks/use-collections"
import type { Collection } from "@/types"

interface CollectionFormDialogProps {
  isOpen: boolean
  onClose: () => void
  collection?: Collection
  onSuccess?: () => void
}

const COLLECTION_COLORS = [
  { name: "Blue", value: "#3b82f6" },
  { name: "Green", value: "#10b981" },
  { name: "Purple", value: "#8b5cf6" },
  { name: "Pink", value: "#ec4899" },
  { name: "Amber", value: "#f59e0b" },
  { name: "Red", value: "#ef4444" },
  { name: "Slate", value: "#64748b" },
  { name: "Teal", value: "#14b8a6" },
]

const COLLECTION_ICONS = [
  { name: "Folder", value: "folder" },
  { name: "Calendar", value: "calendar" },
  { name: "Star", value: "star" },
  { name: "Heart", value: "heart" },
  { name: "Home", value: "home" },
  { name: "Work", value: "briefcase" },
  { name: "Book", value: "book" },
  { name: "Settings", value: "settings" },
]

export function CollectionFormDialog({ isOpen, onClose, collection, onSuccess }: CollectionFormDialogProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [isRecurring, setIsRecurring] = useState(false)
  const [color, setColor] = useState("#3b82f6")
  const [icon, setIcon] = useState("folder")
  const [isLoading, setIsLoading] = useState(false)
  const { addCollection, updateCollection } = useCollections()
  const { toast } = useToast()

  // Set form values when editing an existing collection
  useEffect(() => {
    if (collection) {
      setName(collection.name)
      setDescription(collection.description || "")
      setIsRecurring(collection.isRecurring)
      setColor(collection.color || "#3b82f6")
      setIcon(collection.icon || "folder")
    } else {
      // Reset form for new collection
      setName("")
      setDescription("")
      setIsRecurring(false)
      setColor("#3b82f6")
      setIcon("folder")
    }
  }, [collection, isOpen])

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a collection name",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      if (collection) {
        // Update existing collection
        const result = await updateCollection(collection.id, {
          name,
          description,
          isRecurring,
          color,
          icon,
        })

        if (result.success) {
          toast({
            title: "Collection updated",
            description: "Your collection has been updated successfully",
          })
          if (onSuccess) {
            onSuccess()
          }
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to update collection",
            variant: "destructive",
          })
        }
      } else {
        // Create new collection
        const result = await addCollection({
          name,
          description,
          isRecurring,
          color,
          icon,
        })

        if (result.success) {
          toast({
            title: "Collection created",
            description: "Your collection has been created successfully",
          })
          if (onSuccess) {
            onSuccess()
          }
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to create collection",
            variant: "destructive",
          })
        }
      }

      onClose()
    } catch (error) {
      console.error("Error saving collection:", error)
      toast({
        title: "Error",
        description: "There was an error saving your collection",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{collection ? "Edit Collection" : "Create Collection"}</DialogTitle>
          <DialogDescription>
            {collection ? "Update your collection details below." : "Fill in the details for your new collection."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Collection name" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Collection description"
            />
          </div>
          <div className="grid gap-2">
            <Label>Collection Type</Label>
            <div className="flex items-center justify-between">
              <span className="text-sm">Recurring Collection</span>
              <Switch checked={isRecurring} onCheckedChange={setIsRecurring} />
            </div>
            <p className="text-sm text-muted-foreground">
              {isRecurring
                ? "Tasks in this collection will repeat regularly."
                : "Tasks in this collection will be completed once."}
            </p>
          </div>
          <div className="grid gap-2">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {COLLECTION_COLORS.map((colorOption) => (
                <button
                  key={colorOption.value}
                  type="button"
                  className={`w-8 h-8 rounded-full ${color === colorOption.value ? "ring-2 ring-offset-2 ring-primary" : ""}`}
                  style={{ backgroundColor: colorOption.value }}
                  onClick={() => setColor(colorOption.value)}
                  title={colorOption.name}
                />
              ))}
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Icon</Label>
            <div className="flex flex-wrap gap-2">
              {COLLECTION_ICONS.map((iconOption) => (
                <button
                  key={iconOption.value}
                  type="button"
                  className={`w-10 h-10 rounded-md flex items-center justify-center ${
                    icon === iconOption.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                  onClick={() => setIcon(iconOption.value)}
                  title={iconOption.name}
                >
                  {iconOption.value === "folder" && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="lucide lucide-folder"
                    >
                      <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
                    </svg>
                  )}
                  {iconOption.value === "calendar" && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="lucide lucide-calendar"
                    >
                      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                      <line x1="16" x2="16" y1="2" y2="6" />
                      <line x1="8" x2="8" y1="2" y2="6" />
                      <line x1="3" x2="21" y1="10" y2="10" />
                    </svg>
                  )}
                  {iconOption.value === "star" && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="lucide lucide-star"
                    >
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  )}
                  {iconOption.value === "heart" && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="lucide lucide-heart"
                    >
                      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                    </svg>
                  )}
                  {iconOption.value === "home" && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="lucide lucide-home"
                    >
                      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                      <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                  )}
                  {iconOption.value === "briefcase" && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="lucide lucide-briefcase"
                    >
                      <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
                      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                    </svg>
                  )}
                  {iconOption.value === "book" && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="lucide lucide-book"
                    >
                      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
                    </svg>
                  )}
                  {iconOption.value === "settings" && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="lucide lucide-settings"
                    >
                      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? (
              <>
                <span className="animate-spin mr-2">⟳</span>
                {collection ? "Updating..." : "Creating..."}
              </>
            ) : collection ? (
              "Update Collection"
            ) : (
              "Create Collection"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
