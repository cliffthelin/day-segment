"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTasks, useTaskCompletions, useSegments } from "@/hooks/use-dexie-store"
import { TaskCompletionHeatmap } from "@/components/task-completion-heatmap"
import { TaskStreakTracker } from "@/components/task-streak-tracker"
import { SegmentProductivityAnalysis } from "@/components/segment-productivity-analysis"
import { TaskTypeAnalysis } from "@/components/task-type-analysis"
import { Flame, Calendar, TrendingUp, BarChart3 } from "lucide-react"

export function InsightsClient() {
  const [isClient, setIsClient] = useState(false)
  const [tasks = []] = useTasks()
  const [taskCompletions = []] = useTaskCompletions()
  const [segments = []] = useSegments()
  const [activeTab, setActiveTab] = useState("overview")

  // Handle client-side only rendering
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Don't render data-dependent components during SSR
  if (!isClient) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-6">
          <div className="flex flex-col space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Task Insights</h1>
            <p className="text-muted-foreground">Loading insights...</p>
          </div>
        </div>
      </div>
    )
  }

  // Calculate summary statistics
  const totalTasks = Array.isArray(tasks) ? tasks.length : 0
  const completedTasks = Array.isArray(tasks) ? tasks.filter((task) => task?.status === "completed").length : 0
  const totalCompletions = Array.isArray(taskCompletions) ? taskCompletions.length : 0

  // Calculate completion rate
  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

  // Calculate recurring task percentage
  const recurringTasks = Array.isArray(tasks) ? tasks.filter((task) => task?.isRecurring).length : 0
  const recurringPercentage = totalTasks > 0 ? (recurringTasks / totalTasks) * 100 : 0

  // Calculate most productive day
  const completionsByDay = Array(7).fill(0)

  if (Array.isArray(taskCompletions)) {
    taskCompletions.forEach((completion) => {
      if (completion?.date) {
        try {
          const date = new Date(completion.date)
          const day = date.getDay() // 0-6 (Sunday-Saturday)
          completionsByDay[day] = (completionsByDay[day] || 0) + 1
        } catch (e) {
          // Skip invalid dates
        }
      }
    })
  }

  const mostProductiveDay = completionsByDay.indexOf(Math.max(...completionsByDay))
  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid gap-6">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Task Insights</h1>
          <p className="text-muted-foreground">Analyze your task completion patterns and productivity trends</p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalTasks}</div>
              <p className="text-xs text-muted-foreground">
                {completedTasks} completed ({completionRate.toFixed(1)}%)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Completions</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCompletions}</div>
              <p className="text-xs text-muted-foreground">Across all tasks and segments</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recurring Tasks</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{recurringTasks}</div>
              <p className="text-xs text-muted-foreground">{recurringPercentage.toFixed(1)}% of all tasks</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Most Productive Day</CardTitle>
              <Flame className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{daysOfWeek[mostProductiveDay] || "N/A"}</div>
              <p className="text-xs text-muted-foreground">
                {completionsByDay[mostProductiveDay] || 0} task completions
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="streaks">Streaks</TabsTrigger>
            <TabsTrigger value="segments">Segments</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <TaskCompletionHeatmap taskCompletions={Array.isArray(taskCompletions) ? taskCompletions : []} />
              <TaskTypeAnalysis
                taskCompletions={Array.isArray(taskCompletions) ? taskCompletions : []}
                tasks={Array.isArray(tasks) ? tasks : []}
              />
            </div>
          </TabsContent>

          <TabsContent value="streaks" className="space-y-4">
            <TaskStreakTracker
              taskCompletions={Array.isArray(taskCompletions) ? taskCompletions : []}
              tasks={Array.isArray(tasks) ? tasks : []}
            />
          </TabsContent>

          <TabsContent value="segments" className="space-y-4">
            <SegmentProductivityAnalysis
              taskCompletions={Array.isArray(taskCompletions) ? taskCompletions : []}
              segments={Array.isArray(segments) ? segments : []}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
