"use client"

import { useEffect } from "react"

export function SwRegister() {
  useEffect(() => {
    // Check if we're in the v0 preview environment
    const isV0Preview =
      typeof window !== "undefined" &&
      (window.location.hostname.includes("vusercontent.net") || window.location.hostname.includes("vercel.app"))

    // Only register service worker in production and if the browser supports it
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      !isV0Preview && // Skip registration in v0 preview
      window.location.hostname !== "localhost"
    ) {
      // Register the service worker
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("Service Worker registered with scope:", registration.scope)
        })
        .catch((err) => {
          console.error("Service Worker registration failed:", err)
          // Don't throw an error, just log it - this prevents the app from breaking
        })
    } else {
      // Provide more specific logging
      if (isV0Preview) {
        console.log("Service Worker not registered: v0 preview environment doesn't support service workers")
      } else if (window.location.hostname === "localhost") {
        console.log("Service Worker not registered: development environment")
      } else if (!("serviceWorker" in navigator)) {
        console.log("Service Worker not registered: browser doesn't support service workers")
      } else {
        console.log("Service Worker not registered: unknown reason")
      }
    }
  }, [])

  return null
}
