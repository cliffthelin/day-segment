"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Wifi, WifiOff } from "lucide-react"

export function PwaStatus() {
  const [isOnline, setIsOnline] = useState(true)
  const [isPwaSupported, setIsPwaSupported] = useState(false)

  useEffect(() => {
    // Check if we're online
    setIsOnline(navigator.onLine)

    // Listen for online/offline events
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    // Check if PWA is supported (service workers available and not in v0 preview)
    const isV0Preview =
      window.location.hostname.includes("vusercontent.net") || window.location.hostname.includes("vercel.app")

    setIsPwaSupported("serviceWorker" in navigator && !isV0Preview)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  if (!isPwaSupported) {
    return null // Don't show anything in unsupported environments
  }

  return (
    <Badge variant={isOnline ? "outline" : "destructive"} className="ml-2 flex items-center gap-1">
      {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
      {isOnline ? "Online" : "Offline"}
    </Badge>
  )
}
