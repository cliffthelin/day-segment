"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { WifiOff, Home, RefreshCw } from "lucide-react"

export default function OfflinePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <div className="max-w-md space-y-6">
        <div className="p-6 bg-muted rounded-full mx-auto w-24 h-24 flex items-center justify-center">
          <WifiOff className="h-12 w-12 text-muted-foreground" />
        </div>

        <h1 className="text-3xl font-bold tracking-tight">You're offline</h1>

        <p className="text-muted-foreground">
          The Day Segment Tracker app requires an internet connection for some features. However, you can still access
          previously loaded content.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <Button asChild variant="outline" size="lg" className="gap-2">
            <Link href="/">
              <Home className="h-4 w-4" />
              <span>Go to Home</span>
            </Link>
          </Button>

          <Button
            size="lg"
            className="gap-2"
            onClick={() => {
              if (typeof window !== "undefined") {
                window.location.reload()
              }
            }}
          >
            <RefreshCw className="h-4 w-4" />
            <span>Try Again</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
