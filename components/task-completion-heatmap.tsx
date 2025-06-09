"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { calculateHeatmapData } from "@/lib/task-analytics"
import { ResponsiveContainer, Tooltip, XAxis, YAxis, ScatterChart, Scatter, Cell } from "recharts"

interface TaskCompletionHeatmapProps {
  taskCompletions: any[]
}

export function TaskCompletionHeatmap({ taskCompletions = [] }: TaskCompletionHeatmapProps) {
  const [timeRange, setTimeRange] = useState<"week" | "month" | "year" | "all">("month")

  // Filter completions by time range
  const filteredCompletions = Array.isArray(taskCompletions)
    ? taskCompletions.filter((completion) => {
        if (!completion?.date) return false
        if (timeRange === "all") return true

        try {
          const completionDate = new Date(completion.date)
          const today = new Date()
          const diffTime = Math.abs(today.getTime() - completionDate.getTime())
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

          if (timeRange === "week") return diffDays <= 7
          if (timeRange === "month") return diffDays <= 30
          if (timeRange === "year") return diffDays <= 365
        } catch (e) {
          return false
        }

        return true
      })
    : []

  // Calculate heatmap data
  const heatmapData = calculateHeatmapData(filteredCompletions)

  // Find the maximum value for color scaling
  const maxValue = Math.max(...heatmapData.map((d) => d.value), 1)

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-background border rounded-md shadow-md p-2 text-sm">
          <p className="font-medium">{data.day}</p>
          <p>{`${data.hour}:00 - ${data.hour + 1}:00`}</p>
          <p className="font-medium">{`${data.value} task${data.value !== 1 ? "s" : ""} completed`}</p>
        </div>
      )
    }
    return null
  }

  // Custom color scale
  const getColor = (value: number) => {
    if (value === 0) return "#f1f5f9" // Very light color for zero

    const intensity = Math.min(value / (maxValue || 1), 1)
    return `rgba(14, 165, 233, ${0.2 + intensity * 0.8})` // Scale from light to dark blue
  }

  return (
    <Card className="col-span-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Task Completion Heatmap</CardTitle>
            <CardDescription>When you're most productive during the week</CardDescription>
          </div>
          <div className="w-[180px]">
            <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Last 7 days</SelectItem>
                <SelectItem value="month">Last 30 days</SelectItem>
                <SelectItem value="year">Last 365 days</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] w-full">
          {heatmapData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 70 }}>
                <XAxis
                  type="number"
                  dataKey="hour"
                  name="Hour"
                  domain={[0, 23]}
                  tickCount={24}
                  tick={{ fontSize: 12 }}
                  label={{ value: "Hour of Day", position: "insideBottom", offset: -10 }}
                />
                <YAxis type="category" dataKey="day" name="Day" tick={{ fontSize: 12 }} width={80} />
                <Tooltip content={<CustomTooltip />} />
                <Scatter data={heatmapData} shape="square">
                  {heatmapData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getColor(entry.value)} stroke="#e2e8f0" strokeWidth={1} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center">
              <p className="text-muted-foreground">No task completion data available.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
