"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { calculateCompletionByTaskType } from "@/lib/task-analytics"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"

interface TaskTypeAnalysisProps {
  taskCompletions: any[]
  tasks: any[]
}

export function TaskTypeAnalysis({ taskCompletions = [], tasks = [] }: TaskTypeAnalysisProps) {
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

  const typeData = calculateCompletionByTaskType(filteredCompletions, tasks)

  // Colors for different task types
  const COLORS = ["#3b82f6", "#10b981", "#8b5cf6"]

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      const completionRate = data.totalTasks > 0 ? ((data.completions / data.totalTasks) * 100).toFixed(1) : "0"

      return (
        <div className="bg-background border rounded-md shadow-md p-2 text-sm">
          <p className="font-medium">{data.name} Tasks</p>
          <p>{`${data.completions} completed out of ${data.totalTasks}`}</p>
          <p>{`Completion rate: ${completionRate}%`}</p>
        </div>
      )
    }
    return null
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Task Type Analysis</CardTitle>
            <CardDescription>Completion rates by task type</CardDescription>
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
        <div className="h-[300px] w-full">
          {Array.isArray(typeData) && typeData.some((d: any) => d.totalTasks > 0) ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={typeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="completions"
                  nameKey="name"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {typeData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center">
              <p className="text-muted-foreground">No task type data available.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
