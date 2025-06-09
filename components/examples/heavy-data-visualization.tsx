"use client"

import { useEffect, useState } from "react"
import { Progress } from "@/components/ui/progress"

// Simulate a heavy component with complex data visualization
export default function HeavyDataVisualization() {
  const [data, setData] = useState<number[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Simulate heavy computation and data processing
  useEffect(() => {
    const simulateHeavyComputation = () => {
      // Simulate delay for data processing
      const startTime = Date.now()
      console.log("Heavy component: Starting data processing...")

      // Generate random data
      const newData = Array.from({ length: 24 }, () => Math.floor(Math.random() * 100))

      // Simulate complex calculations
      let sum = 0
      for (let i = 0; i < 1000000; i++) {
        sum += Math.sqrt(i) * Math.sin(i)
      }

      const processingTime = Date.now() - startTime
      console.log(`Heavy component: Data processing complete in ${processingTime}ms`)

      setData(newData)
      setIsLoading(false)
    }

    // Simulate network request
    const timer = setTimeout(simulateHeavyComputation, 800)
    return () => clearTimeout(timer)
  }, [])

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        <p className="text-sm text-muted-foreground">Processing data...</p>
        <Progress value={45} className="h-2" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-24 h-40 gap-1 items-end">
        {data.map((value, index) => (
          <div
            key={index}
            className="bg-primary rounded-t-sm"
            style={{ height: `${value}%` }}
            title={`Hour ${index}: ${value}%`}
          />
        ))}
      </div>
      <div className="text-sm text-center text-muted-foreground">Daily Activity Distribution (24 hours)</div>
    </div>
  )
}
