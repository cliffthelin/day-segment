"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { calculateStreakData } from "@/lib/task-analytics"
import { Flame } from "lucide-react"

interface TaskStreakTrackerProps {
  taskCompletions: any[]
  tasks: any[]
}

export function TaskStreakTracker({ taskCompletions = [], tasks = [] }: TaskStreakTrackerProps) {
  const [sortBy, setSortBy] = useState<"current" | "max" | "name">("current")

  const streakData = useMemo(() => {
    if (!Array.isArray(taskCompletions) || !Array.isArray(tasks)) {
      return []
    }

    const data = calculateStreakData(taskCompletions, tasks)

    // Convert to array and sort
    return Object.entries(data)
      .map(([taskId, info]: [string, any]) => ({
        taskId,
        ...info,
      }))
      .sort((a, b) => {
        if (sortBy === "current") return b.currentStreak - a.currentStreak
        if (sortBy === "max") return b.maxStreak - a.maxStreak
        return (a.taskName || "").localeCompare(b.taskName || "")
      })
      .slice(0, 10) // Show top 10
  }, [taskCompletions, tasks, sortBy])

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Task Streaks</CardTitle>
            <CardDescription>Your current and longest completion streaks</CardDescription>
          </div>
          <div className="w-[180px]">
            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current">Current Streak</SelectItem>
                <SelectItem value="max">Max Streak</SelectItem>
                <SelectItem value="name">Task Name</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {streakData.length > 0 ? (
          <div className="space-y-4">
            {streakData.map((streak) => (
              <div key={streak.taskId} className="flex items-center justify-between border-b pb-2">
                <div className="flex-1 truncate mr-4">
                  <span className="font-medium">{streak.taskName || "Unnamed Task"}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-center">
                    <span className="text-xs text-muted-foreground">Current</span>
                    <Badge variant={streak.currentStreak > 0 ? "default" : "outline"} className="flex gap-1">
                      <Flame
                        className={`h-3 w-3 ${streak.currentStreak > 0 ? "text-amber-400" : "text-muted-foreground"}`}
                      />
                      {streak.currentStreak}
                    </Badge>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-xs text-muted-foreground">Best</span>
                    <Badge variant="secondary" className="flex gap-1">
                      <Flame className="h-3 w-3 text-amber-500" />
                      {streak.maxStreak}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex h-[200px] items-center justify-center">
            <p className="text-muted-foreground">No streak data available.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
