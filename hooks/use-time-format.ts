"use client"

import { useEffect, useState } from "react"
import { useSetting } from "./use-dexie-store"

/**
 * Hook to access the current time format preference
 * @returns The current time format: "12h" for 12-hour format with AM/PM or "24h" for 24-hour format
 */
export function useTimeFormat() {
  const [timeFormat, setTimeFormat] = useSetting("timeFormat", "12h")
  const [mounted, setMounted] = useState(false)

  // Ensure we're mounted before returning the time format
  useEffect(() => {
    setMounted(true)
  }, [])

  return {
    timeFormat: mounted ? timeFormat : "12h",
    setTimeFormat,
    is24Hour: timeFormat === "24h",
    is12Hour: timeFormat === "12h",
  }
}
