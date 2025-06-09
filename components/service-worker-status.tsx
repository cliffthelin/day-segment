"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, Wifi, WifiOff } from "lucide-react"

export function ServiceWorkerStatus() {
  const [status, setStatus] = useState<"loading" | "registered" | "unsupported">("loading")
  const [online, setOnline] = useState(true)

  useEffect(() => {
    // Check if service workers are supported
    if (typeof window !== "undefined") {
      setOnline(navigator.onLine)

      // Listen for online/offline events
      const handleOnline = () => setOnline(true)
      const handleOffline = () => setOnline(false)
      window.addEventListener("online", handleOnline)
      window.addEventListener("offline", handleOffline)

      if ("serviceWorker" in navigator) {
        // Check if a service worker is already active
        navigator.serviceWorker.ready
          .then(() => {
            setStatus("registered")
          })
          .catch(() => {
            // No active service worker
            setStatus("loading")
          })
      } else {
        setStatus("unsupported")
      }

      return () => {
        window.removeEventListener("online", handleOnline)
        window.removeEventListener("offline", handleOffline)
      }
    }
  }, [])

  if (status === "loading") {
    return (
      <Badge variant="outline" className="gap-1">
        <RefreshCw className="h-3 w-3 animate-spin" />
        <span>Initializing...</span>
      </Badge>
    )
  }

  if (status === "unsupported") {
    return (
      <Badge variant="outline" className="gap-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
        <WifiOff className="h-3 w-3" />
        <span>Offline Mode Unavailable</span>
      </Badge>
    )
  }

  return (
    <Badge
      variant="outline"
      className={`gap-1 ${
        online
          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
          : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      }`}
    >
      {online ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
      <span>{online ? "Online" : "Offline Mode Active"}</span>
    </Badge>
  )
}
