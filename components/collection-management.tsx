"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Folder, Plus, Edit, Trash2, Calendar, RefreshCw, MoreHorizontal, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { useCollections } from "@/hooks/use-collections"
import { CollectionFormDialog } from "./collection-form-dialog"
import type { Collection } from "@/types"

export function CollectionManagement() {
  const { collections, isLoading, deleteCollection, getTaskCountByCollection } = useCollections()
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null)
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [taskCounts, setTaskCounts] = useState<Record<string, number>>({})
  const { toast } = useToast()
  const router = useRouter()

  // Fetch task counts for each collection
  useState(() => {
    const fetchTaskCounts = async () => {
      const counts: Record<string, number> = {}
      for (const collection of collections) {
        counts[collection.id] = await getTaskCountByCollection(collection.id)
      }
      setTaskCounts(counts)
    }

    if (collections.length > 0) {
      fetchTaskCounts()
    }
  })

  const handleCreateCollection = () => {
    setSelectedCollection(null)
    setIsFormDialogOpen(true)
  }

  const handleEditCollection = (collection: Collection) => {
    setSelectedCollection(collection)
    setIsFormDialogOpen(true)
  }

  const handleDeleteCollection = (collection: Collection) => {
    setSelectedCollection(collection)
    setIsDeleteDialogOpen(true)
  }

  const confirmDeleteCollection = async () => {
    if (!selectedCollection) return

    try {
      const result = await deleteCollection(selectedCollection.id)

      if (result.success) {
        toast({
          title: "Collection deleted",
          description: "Your collection has been deleted successfully",
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete collection",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting collection:", error)
      toast({
        title: "Error",
        description: "There was an error deleting your collection",
        variant: "destructive",
      })
    } finally {
      setIsDeleteDialogOpen(false)
    }
  }

  const handleViewCollection = (collectionId: string) => {
    router.push(`/collections/${collectionId}`)
  }

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case "folder":
        return <Folder className="h-5 w-5" />
      case "calendar":
        return <Calendar className="h-5 w-5" />
      case "star":
        return (
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
        )
      case "heart":
        return (
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
        )
      case "home":
        return (
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
        )
      case "briefcase":
        return (
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
        )
      case "book":
        return (
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
        )
      case "settings":
        return (
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
        )
      default:
        return <Folder className="h-5 w-5" />
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Collections</h2>
        <Button onClick={handleCreateCollection}>
          <Plus className="mr-2 h-4 w-4" />
          New Collection
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : collections.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-muted">
              <Folder className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-medium">No collections yet</h3>
              <p className="text-sm text-muted-foreground">Create your first collection to organize your tasks</p>
            </div>
            <Button onClick={handleCreateCollection}>
              <Plus className="mr-2 h-4 w-4" />
              Create Collection
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {collections.map((collection) => (
            <Card key={collection.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <div
                      className="p-2 rounded-md"
                      style={{ backgroundColor: collection.color || "#3b82f6", color: "white" }}
                    >
                      {getIconComponent(collection.icon || "folder")}
                    </div>
                    <CardTitle className="text-lg">{collection.name}</CardTitle>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleViewCollection(collection.id)}>
                        <Folder className="mr-2 h-4 w-4" />
                        View Collection
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEditCollection(collection)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Collection
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleDeleteCollection(collection)} className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Collection
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                {collection.description && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{collection.description}</p>
                )}
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="flex items-center gap-1">
                    {collection.isRecurring ? (
                      <>
                        <RefreshCw className="h-3 w-3" /> Recurring
                      </>
                    ) : (
                      <>
                        <Calendar className="h-3 w-3" /> One-time
                      </>
                    )}
                  </Badge>
                  <Badge variant="outline">
                    {taskCounts[collection.id] || 0} task{taskCounts[collection.id] !== 1 ? "s" : ""}
                  </Badge>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" onClick={() => handleViewCollection(collection.id)}>
                  View Collection
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <CollectionFormDialog
        isOpen={isFormDialogOpen}
        onClose={() => setIsFormDialogOpen(false)}
        collection={selectedCollection || undefined}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Collection</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the collection "{selectedCollection?.name}"? This action cannot be undone.
              Tasks in this collection will not be deleted, but they will be removed from this collection.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteCollection} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
