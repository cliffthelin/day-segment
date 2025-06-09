"use client"

import { useState, useEffect } from "react"
import { Check, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { db } from "@/lib/db"
import { v4 as uuidv4 } from "uuid"
import type { Collection } from "@/types"

interface TaskCollectionsSelectorProps {
  taskId: string
  onChange?: (collectionIds: string[]) => void
}

export function TaskCollectionsSelector({ taskId, onChange }: TaskCollectionsSelectorProps) {
  const [collections, setCollections] = useState<Collection[]>([])
  const [selectedCollections, setSelectedCollections] = useState<Collection[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Fetch all collections and the ones this task belongs to
  useEffect(() => {
    const fetchCollections = async () => {
      try {
        setIsLoading(true)

        // Get all collections
        const allCollections = await db.collections.toArray()

        // Get all task-collection relationships for this task
        const taskCollections = await db.taskCollections.where("taskId").equals(taskId).toArray()
        const selectedCollectionIds = taskCollections.map((tc) => tc.collectionId)

        // Get the selected collections
        const selectedColls = allCollections.filter((c) => selectedCollectionIds.includes(c.id))

        setCollections(allCollections)
        setSelectedCollections(selectedColls)
      } catch (error) {
        console.error("Error fetching collections:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (taskId) {
      fetchCollections()
    }
  }, [taskId])

  const toggleCollection = async (collection: Collection) => {
    try {
      const isSelected = selectedCollections.some((c) => c.id === collection.id)

      if (isSelected) {
        // Remove from selected collections
        const relationship = await db.taskCollections.where({ taskId, collectionId: collection.id }).first()

        if (relationship) {
          await db.taskCollections.delete(relationship.id)
        }

        setSelectedCollections((prev) => prev.filter((c) => c.id !== collection.id))
      } else {
        // Add to selected collections
        await db.taskCollections.add({
          id: `task-collection-${uuidv4()}`,
          taskId,
          collectionId: collection.id,
          createdAt: new Date().toISOString(),
        })

        setSelectedCollections((prev) => [...prev, collection])
      }

      // Notify parent component if onChange is provided
      if (onChange) {
        const newSelectedIds = isSelected
          ? selectedCollections.filter((c) => c.id !== collection.id).map((c) => c.id)
          : [...selectedCollections.map((c) => c.id), collection.id]
        onChange(newSelectedIds)
      }
    } catch (error) {
      console.error("Error toggling collection:", error)
    }
  }

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading collections...</div>
  }

  if (collections.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        No collections available. Create collections to organize your tasks.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 mb-2">
        {selectedCollections.length > 0 ? (
          selectedCollections.map((collection) => (
            <Badge
              key={collection.id}
              variant="outline"
              className="flex items-center gap-1"
              style={{ borderColor: collection.color, color: collection.color }}
            >
              {collection.name}
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 ml-1 p-0 hover:bg-transparent"
                onClick={() => toggleCollection(collection)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))
        ) : (
          <div className="text-sm text-muted-foreground">No collections selected</div>
        )}
      </div>

      <ScrollArea className="h-32 border rounded-md p-2">
        <div className="space-y-1">
          {collections.map((collection) => {
            const isSelected = selectedCollections.some((c) => c.id === collection.id)
            return (
              <Button
                key={collection.id}
                variant="ghost"
                className={`w-full justify-start text-left ${isSelected ? "bg-muted" : ""}`}
                onClick={() => toggleCollection(collection)}
              >
                <div
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: collection.color || "#3b82f6" }}
                ></div>
                <span className="flex-grow">{collection.name}</span>
                {isSelected && <Check className="h-4 w-4 ml-2" />}
              </Button>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}
