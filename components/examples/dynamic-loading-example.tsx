"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { dynamicImport } from "@/lib/dynamic-import"
import { InteractiveExample } from "@/components/interactive-example"

// Dynamically import the heavy component
const HeavyDataVisualization = dynamicImport(() => import("@/components/examples/heavy-data-visualization"), {
  ssr: false, // Don't render on server
  loading: () => <HeavyComponentSkeleton />, // Show skeleton while loading
  displayName: "DynamicHeavyDataVisualization",
})

// Loading skeleton
function HeavyComponentSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-[180px] w-full rounded-md" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  )
}

export function DynamicLoadingExample() {
  const [isLoaded, setIsLoaded] = useState(false)

  return (
    <InteractiveExample
      title="Dynamic Component Loading"
      description="This example demonstrates how to dynamically load heavy components only when needed."
    >
      <Card>
        <CardHeader>
          <CardTitle>Dynamic Loading Demo</CardTitle>
          <CardDescription>
            Heavy components can be loaded on-demand to improve initial page load performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoaded ? (
            <HeavyDataVisualization />
          ) : (
            <div className="flex flex-col items-center justify-center p-6 border border-dashed rounded-md">
              <p className="mb-4 text-center text-muted-foreground">
                This component will only be loaded when you click the button below.
                <br />
                <span className="text-xs">Check the Network tab in DevTools to see the chunk being loaded.</span>
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={() => setIsLoaded(true)} disabled={isLoaded} className="w-full">
            {isLoaded ? "Component Loaded" : "Load Heavy Component"}
          </Button>
        </CardFooter>
      </Card>
    </InteractiveExample>
  )
}
