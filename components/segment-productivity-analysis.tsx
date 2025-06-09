"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { calculateProductivityBySegment } from "@/lib/task-analytics"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"

interface SegmentProductivityAnalysisProps {
  taskCompletions: any[]
  segments: any[]
}

export function SegmentProductivityAnalysis({ taskCompletions = [], segments = [] }: SegmentProductivityAnalysisProps) {
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

  const segmentData = calculateProductivityBySegment(filteredCompletions, segments)

  // Sort by number of completions
  const sortedData = Array.isArray(segmentData)
    ? [...segmentData].sort((a: any, b: any) => b.completions - a.completions)
    : []

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-background border rounded-md shadow-md p-2 text-sm">
          <p className="font-medium">{data.name}</p>
          <p>{`${data.completions} task${data.completions !== 1 ? "s" : ""} completed`}</p>
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
            <CardTitle>Segment Productivity</CardTitle>
            <CardDescription>Tasks completed in each segment</CardDescription>
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
          {sortedData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sortedData} layout="vertical" margin={{ top: 20, right: 30, left: 70, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={70} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="completions" radius={[0, 4, 4, 0]}>
                  {sortedData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color || "#3b82f6"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center">
              <p className="text-muted-foreground">No segment productivity data available.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
