"use client"

import { useMemo } from "react"
import { TaskCard } from "./task-card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Folder } from "lucide-react"

interface CollectionTaskListProps {
  tasks: any[]
  segments: any[]
  collections: any[]
  onTaskClick: (task: any) => void
  onEditTask: (task: any) => void
  onDeleteTask: (taskId: string) => void
  onArchiveTask?: (taskId: string) => void
}

export function CollectionTaskList({
  tasks,
  segments,
  collections,
  onTaskClick,
  onEditTask,
  onDeleteTask,
  onArchiveTask,
}: CollectionTaskListProps) {
  // Group tasks by collection using useMemo to prevent recalculation on every render
  const { tasksByCollection, collectionIds } = useMemo(() => {
    // Filter for active tasks only
    const activeTasks = tasks.filter((task) => !task.isArchived)

    const grouped: Record<string, any[]> = { "no-collection": [] }

    // Initialize with empty arrays for all collections
    collections.forEach((collection) => {
      grouped[collection.id] = []
    })

    // Group tasks by collection
    activeTasks.forEach((task) => {
      if (task.collectionIds && task.collectionIds.length > 0) {
        task.collectionIds.forEach((collectionId: string) => {
          if (grouped[collectionId]) {
            grouped[collectionId].push(task)
          }
        })
      } else {
        grouped["no-collection"].push(task)
      }
    })

    // Remove empty collections
    Object.keys(grouped).forEach((key) => {
      if (grouped[key].length === 0) {
        delete grouped[key]
      }
    })

    return {
      tasksByCollection: grouped,
      collectionIds: Object.keys(grouped),
    }
  }, [tasks, collections])

  // Get collection name by ID
  const getCollectionName = (collectionId: string) => {
    if (collectionId === "no-collection") return "No Collection"
    const collection = collections.find((c) => c.id === collectionId)
    return collection ? collection.name : "Unknown Collection"
  }

  // Get collection color by ID
  const getCollectionColor = (collectionId: string) => {
    if (collectionId === "no-collection") return "#64748b" // slate-500
    const collection = collections.find((c) => c.id === collectionId)
    return collection?.color || "#64748b"
  }

  if (collectionIds.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground">No active tasks found</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Accordion type="multiple" defaultValue={collectionIds} className="space-y-4">
        {collectionIds.map((collectionId) => (
          <AccordionItem key={collectionId} value={collectionId} className="border rounded-lg overflow-hidden">
            <AccordionTrigger className="px-4 py-2 hover:bg-muted/50">
              <div className="flex items-center gap-2">
                <Folder className="h-5 w-5" style={{ color: getCollectionColor(collectionId) }} />
                <span>{getCollectionName(collectionId)}</span>
                <Badge variant="outline" className="ml-2">
                  {tasksByCollection[collectionId].length}
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pt-2 pb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tasksByCollection[collectionId].map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    segments={segments}
                    onEdit={onEditTask}
                    onDelete={onDeleteTask}
                    onArchive={onArchiveTask}
                    onTaskClick={() => onTaskClick(task)}
                  />
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}
