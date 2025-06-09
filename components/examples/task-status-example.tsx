"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function TaskStatusExample() {
  const [tasks, setTasks] = useState([
    { id: "1", name: "Design homepage", status: "todo" },
    { id: "2", name: "Update API documentation", status: "started" },
    { id: "3", name: "Fix login bug", status: "completed" },
  ])

  const [activeFilter, setActiveFilter] = useState("all")

  const changeStatus = (taskId: string, newStatus: string) => {
    setTasks(tasks.map((task) => (task.id === taskId ? { ...task, status: newStatus } : task)))
  }

  const filteredTasks = activeFilter === "all" ? tasks : tasks.filter((task) => task.status === activeFilter)

  return (
    <div className="space-y-3">
      <div className="flex space-x-2">
        {["all", "todo", "started", "completed"].map((filter) => (
          <Button
            key={filter}
            variant={activeFilter === filter ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveFilter(filter)}
            className="text-xs px-2 py-1 h-7"
          >
            {filter.charAt(0).toUpperCase() + filter.slice(1)}
          </Button>
        ))}
      </div>

      <div className="space-y-2">
        {filteredTasks.map((task) => (
          <Card key={task.id} className="p-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">{task.name}</span>
              <Select value={task.status} onValueChange={(value) => changeStatus(task.id, value)}>
                <SelectTrigger className="w-24 h-7 text-xs">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="started">Started</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>
        ))}
      </div>

      {filteredTasks.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-2">No tasks match the selected filter</p>
      )}
    </div>
  )
}
