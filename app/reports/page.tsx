"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useSegments, useTasks, useCheckIns, useTaskCompletions, useTimerSessions } from "@/hooks/use-dexie-store"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from "recharts"

export default function Reports() {
  const [segments] = useSegments()
  const [tasks] = useTasks()
  const [checkInHistory] = useCheckIns()
  const [taskCompletions] = useTaskCompletions()
  const [timerSessions] = useTimerSessions()

  const [selectedMetric, setSelectedMetric] = useState("energy")
  const [selectedTask, setSelectedTask] = useState("")
  const [timeRange, setTimeRange] = useState("week")
  const [chartData, setChartData] = useState([])
  const [taskData, setTaskData] = useState([])
  const [segmentData, setSegmentData] = useState([])
  const [completionData, setCompletionData] = useState([])

  // Get dates for the selected time range
  const getDatesForRange = () => {
    const dates = []
    const today = new Date()
    let daysToInclude = 7

    if (timeRange === "month") {
      daysToInclude = 30
    } else if (timeRange === "year") {
      daysToInclude = 365
    }

    for (let i = daysToInclude - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(today.getDate() - i)
      dates.push(date.toISOString().split("T")[0])
    }

    return dates
  }

  // Format date manually without date-fns
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    return `${months[date.getMonth()]} ${date.getDate()}`
  }

  // Prepare data for check-in metrics chart
  useEffect(() => {
    const dates = getDatesForRange()
    const data = []

    dates.forEach((date) => {
      const dayCheckIns = Array.isArray(checkInHistory)
        ? checkInHistory.filter((checkin) => checkin && checkin.date === date)
        : []

      if (dayCheckIns.length > 0) {
        // Calculate average for the selected metric on this day
        const sum = dayCheckIns.reduce((total, checkin) => {
          const metricValue = checkin[selectedMetric]
          return total + (typeof metricValue === "number" ? metricValue : 0)
        }, 0)
        const average = sum / dayCheckIns.length

        data.push({
          date,
          value: average,
          formattedDate: formatDate(date),
        })
      } else {
        data.push({
          date,
          value: null,
          formattedDate: formatDate(date),
        })
      }
    })

    setChartData(data)
  }, [checkInHistory, selectedMetric, timeRange])

  // Prepare data for task completion
  useEffect(() => {
    if (!selectedTask) {
      setTaskData([])
      setSegmentData([])
      setCompletionData([])
      return
    }

    const dates = getDatesForRange()
    const data = []

    // Ensure segments is an array
    const segmentsArray = Array.isArray(segments) ? segments : []
    const taskCompletionsArray = Array.isArray(taskCompletions) ? taskCompletions : []

    dates.forEach((date) => {
      const dayCompletions = taskCompletionsArray.filter(
        (completion) => completion && completion.date === date && completion.taskId === selectedTask,
      )

      // Group completions by segment
      const segmentCounts = {}
      segmentsArray.forEach((segment) => {
        if (segment && segment.id) {
          segmentCounts[segment.id] = 0
        }
      })

      dayCompletions.forEach((completion) => {
        if (completion && completion.segmentId && segmentCounts[completion.segmentId] !== undefined) {
          segmentCounts[completion.segmentId]++
        }
      })

      data.push({
        date,
        formattedDate: formatDate(date),
        total: dayCompletions.length,
        ...segmentCounts,
      })
    })

    setTaskData(data)

    // Prepare segment distribution data
    const segmentCounts = {}
    segmentsArray.forEach((segment) => {
      if (segment && segment.id) {
        segmentCounts[segment.id] = 0
      }
    })

    // Count completions by segment
    taskCompletionsArray
      .filter((completion) => completion && completion.taskId === selectedTask)
      .forEach((completion) => {
        if (completion && completion.segmentId && segmentCounts[completion.segmentId] !== undefined) {
          segmentCounts[completion.segmentId]++
        }
      })

    // Convert to array format for chart
    const segmentDistribution = segmentsArray
      .filter((segment) => segment && segment.id && segment.name)
      .map((segment) => ({
        name: segment.name,
        value: segmentCounts[segment.id] || 0,
      }))

    setSegmentData(segmentDistribution)

    // Prepare completion data for pie chart
    const totalCompletions = taskCompletionsArray.filter(
      (completion) => completion && completion.taskId === selectedTask,
    ).length
    const partialCompletions = taskCompletionsArray.filter(
      (completion) => completion && completion.taskId === selectedTask && completion.isPartial,
    ).length

    const completionRate = totalCompletions > 0 ? ((totalCompletions - partialCompletions) / totalCompletions) * 100 : 0
    const partialRate = totalCompletions > 0 ? (partialCompletions / totalCompletions) * 100 : 0

    const completionDistribution = [
      { name: "Completed", value: completionRate },
      { name: "Partial", value: partialRate },
    ]

    setCompletionData(completionDistribution)
  }, [selectedTask, segments, taskCompletions, timeRange])

  // Get metric name
  const getMetricName = (metricId) => {
    const metrics = [
      { id: "energy", name: "Energy Level" },
      { id: "mood", name: "Mood" },
      { id: "focus", name: "Focus" },
      { id: "productivity", name: "Productivity" },
      { id: "stress", name: "Stress Level" },
    ]

    const metric = metrics.find((m) => m.id === metricId)
    return metric ? metric.name : metricId
  }

  // Colors for the charts
  const colors = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#0088fe"]

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid gap-6">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">Visualize your check-in metrics and task completion patterns.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <Label>Time Range</Label>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger>
                <SelectValue placeholder="Select time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Last 7 days</SelectItem>
                <SelectItem value="month">Last 30 days</SelectItem>
                <SelectItem value="year">Last 365 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Tabs defaultValue="check-ins">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="check-ins">Check-in Metrics</TabsTrigger>
            <TabsTrigger value="tasks">Task Completions</TabsTrigger>
          </TabsList>

          <TabsContent value="check-ins">
            <Card>
              <CardHeader>
                <CardTitle>Check-in Metrics Over Time</CardTitle>
                <CardDescription>Track how your metrics change over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <Label>Metric</Label>
                  <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select metric" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="energy">Energy Level</SelectItem>
                      <SelectItem value="mood">Mood</SelectItem>
                      <SelectItem value="focus">Focus</SelectItem>
                      <SelectItem value="productivity">Productivity</SelectItem>
                      <SelectItem value="stress">Stress Level</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="h-[300px] w-full">
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={chartData}
                        margin={{
                          top: 20,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="formattedDate" />
                        <YAxis domain={[0, 10]} />
                        <Tooltip
                          formatter={(value) => (value !== null ? value.toFixed(1) : "No data")}
                          labelFormatter={(label) => `Date: ${label}`}
                        />
                        <Legend />
                        <Bar
                          dataKey="value"
                          name={getMetricName(selectedMetric)}
                          fill={colors[0]}
                          isAnimationActive={false}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <p className="text-muted-foreground">
                        No check-in data available. Complete check-ins to see your metrics.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tasks">
            <Card>
              <CardHeader>
                <CardTitle>Task Completion Patterns</CardTitle>
                <CardDescription>Analyze when and how often you complete tasks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <Label>Task</Label>
                  <Select value={selectedTask} onValueChange={setSelectedTask}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select task" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.isArray(tasks) &&
                        tasks.map((task) =>
                          task && task.id && task.name ? (
                            <SelectItem key={task.id} value={task.id}>
                              {task.name}
                            </SelectItem>
                          ) : null,
                        )}
                    </SelectContent>
                  </Select>
                </div>

                {selectedTask ? (
                  <div className="space-y-8">
                    <div className="h-[300px] w-full">
                      {taskData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={taskData}
                            margin={{
                              top: 20,
                              right: 30,
                              left: 20,
                              bottom: 5,
                            }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="formattedDate" />
                            <YAxis allowDecimals={false} />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="total" name="Total Completions" fill={colors[0]} isAnimationActive={false} />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <p className="text-muted-foreground">No task completion data available.</p>
                        </div>
                      )}
                    </div>

                    <div>
                      <h3 className="text-lg font-medium mb-2">Segment Distribution</h3>
                      <div className="h-[300px] w-full">
                        {segmentData.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={segmentData}
                              margin={{
                                top: 20,
                                right: 30,
                                left: 20,
                                bottom: 5,
                              }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="name" />
                              <YAxis allowDecimals={false} />
                              <Tooltip />
                              <Bar dataKey="value" name="Completions" isAnimationActive={false}>
                                {segmentData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <p className="text-muted-foreground">No segment distribution data available.</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium mb-2">Completion Rate</h3>
                      <div className="h-[300px] w-full">
                        {completionData.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                dataKey="value"
                                data={completionData}
                                cx="50%"
                                cy="50%"
                                outerRadius={80}
                                fill="#8884d8"
                                label
                              >
                                {completionData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                                ))}
                              </Pie>
                              <Tooltip formatter={(value, name) => `${name}: ${value.toFixed(1)}%`} />
                              <Legend />
                            </PieChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <p className="text-muted-foreground">No completion rate data available.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex h-[300px] items-center justify-center">
                    <p className="text-muted-foreground">Select a task to view completion patterns.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
