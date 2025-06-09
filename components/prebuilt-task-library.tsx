"use client"

import { useState, useEffect } from "react"
import { db } from "@/lib/db"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Clock, ListChecks, Plus, Search, Tag, Filter } from "lucide-react"
import { prebuiltTasks } from "@/lib/prebuilt-tasks"

export function PrebuiltTaskLibrary() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedType, setSelectedType] = useState("all")
  const [filteredTasks, setFilteredTasks] = useState(prebuiltTasks)
  const [addingTaskId, setAddingTaskId] = useState<string | null>(null)
  const [addedTasks, setAddedTasks] = useState<Set<string>>(new Set())

  // Filter tasks based on search query, category, and type
  useEffect(() => {
    let filtered = [...prebuiltTasks]

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (task) => task.name.toLowerCase().includes(query) || task.description.toLowerCase().includes(query),
      )
    }

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter((task) => task.category === selectedCategory)
    }

    // Filter by type
    if (selectedType !== "all") {
      filtered = filtered.filter((task) => task.type === selectedType)
    }

    setFilteredTasks(filtered)
  }, [searchQuery, selectedCategory, selectedType])

  // Add a task to the user's task list
  const addTaskToList = async (task) => {
    setAddingTaskId(task.id)

    try {
      // Create the task in the database
      const newTaskId = await db.tasks.add({
        name: task.name,
        description: task.description,
        status: "todo",
        type: task.type,
        isRecurring: task.isRecurring || false,
        preferredSegmentTime: task.preferredSegmentTime || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      // If it has subtasks, add them
      if (task.subtasks && task.subtasks.length > 0) {
        const subtasks = task.subtasks.map((subtask) => ({
          taskId: newTaskId,
          name: subtask,
          completed: false,
          createdAt: new Date(),
        }))

        await db.subtasks.bulkAdd(subtasks)

        // Update the task to indicate it has subtasks
        await db.tasks.update(newTaskId, {
          hasSubtasks: true,
          subtaskCount: subtasks.length,
          completedSubtaskCount: 0,
        })
      }

      // Mark as added
      setAddedTasks((prev) => new Set([...prev, task.id]))
    } catch (error) {
      console.error("Error adding task:", error)
    } finally {
      setAddingTaskId(null)
    }
  }

  // Get unique categories for the filter
  const categories = ["all", ...new Set(prebuiltTasks.map((task) => task.category))]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search tasks..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <div className="relative">
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 pr-8 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="all">All Categories</option>
                {categories
                  .filter((c) => c !== "all")
                  .map((category) => (
                    <option key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </option>
                  ))}
              </select>
              <Tag className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>

            <div className="relative">
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 pr-8 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
              >
                <option value="all">All Types</option>
                <option value="standard">Standard</option>
                <option value="tally">Tally</option>
                <option value="subtasks">Subtasks</option>
              </select>
              <Filter className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="text-sm text-muted-foreground">
          Showing {filteredTasks.length} of {prebuiltTasks.length} tasks
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTasks.map((task) => (
          <Card key={task.id} className="flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{task.name}</CardTitle>
                <Badge variant={task.type === "standard" ? "default" : task.type === "tally" ? "secondary" : "outline"}>
                  {task.type === "standard" && <CheckCircle className="h-3 w-3 mr-1" />}
                  {task.type === "tally" ? "Tally" : task.type === "subtasks" ? "Subtasks" : "Standard"}
                </Badge>
              </div>
              <CardDescription className="text-xs mt-1">
                {task.category.charAt(0).toUpperCase() + task.category.slice(1)}
                {task.isRecurring && (
                  <span className="ml-2 inline-flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    Recurring
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-4 flex-grow">
              <p className="text-sm">{task.description}</p>

              {task.subtasks && task.subtasks.length > 0 && (
                <div className="mt-3">
                  <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground mb-1">
                    <ListChecks className="h-3 w-3" />
                    <span>Subtasks ({task.subtasks.length})</span>
                  </div>
                  <ul className="text-xs space-y-1 pl-5 list-disc">
                    {task.subtasks.slice(0, 3).map((subtask, index) => (
                      <li key={index}>{subtask}</li>
                    ))}
                    {task.subtasks.length > 3 && (
                      <li className="text-muted-foreground">+{task.subtasks.length - 3} more</li>
                    )}
                  </ul>
                </div>
              )}
            </CardContent>
            <CardFooter className="pt-0">
              <Button
                className="w-full"
                size="sm"
                variant={addedTasks.has(task.id) ? "outline" : "default"}
                onClick={() => addTaskToList(task)}
                disabled={addingTaskId === task.id}
              >
                {addingTaskId === task.id ? (
                  <span className="flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Adding...
                  </span>
                ) : addedTasks.has(task.id) ? (
                  <span className="flex items-center">
                    <CheckCircle className="mr-1 h-4 w-4" />
                    Added
                  </span>
                ) : (
                  <span className="flex items-center">
                    <Plus className="mr-1 h-4 w-4" />
                    Add to My Tasks
                  </span>
                )}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {filteredTasks.length === 0 && (
        <div className="text-center py-12">
          <p className="text-lg font-medium">No tasks found</p>
          <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters or search query</p>
        </div>
      )}
    </div>
  )
}
