// Service Worker for Day Segment Tracker PWA
// This file will only be used in production environments

// Check if we're in a supported environment
const isSupported =
  !self.location.hostname.includes("vusercontent.net") &&
  !self.location.hostname.includes("vercel.app") &&
  self.location.hostname !== "localhost"

if (!isSupported) {
  console.log("[PWA] Service Worker not running: unsupported environment")
  // Exit early in unsupported environments
  self.addEventListener("install", () => self.skipWaiting())
  self.addEventListener("activate", () => self.clients.claim())
} else {
  // Normal service worker code for supported environments
  const CACHE_NAME = "day-segment-tracker-v1"
  const OFFLINE_URL = "/offline"
  const ASSETS_TO_CACHE = [
    OFFLINE_URL,
    "/",
    "/manifest.json",
    "/icons/icon-192x192.png",
    "/icons/icon-512x512.png",
    "/sounds/bell.mp3",
    "/sounds/chime.mp3",
    "/sounds/default.mp3",
  ]

  // Install event - cache important files
  self.addEventListener("install", (event) => {
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => {
        console.log("[PWA] Caching important resources")
        return cache.addAll(ASSETS_TO_CACHE)
      }),
    )

    // Force the waiting service worker to become the active service worker
    self.skipWaiting()
  })

  // Activate event - clean up old caches
  self.addEventListener("activate", (event) => {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => cacheName.startsWith("day-segment-tracker-") && cacheName !== CACHE_NAME)
            .map((cacheName) => {
              console.log("[PWA] Removing old cache", cacheName)
              return caches.delete(cacheName)
            }),
        )
      }),
    )

    // Claim any clients immediately
    self.clients.claim()
  })

  // Fetch event - network first, fallback to cache
  self.addEventListener("fetch", (event) => {
    // Skip non-GET requests
    if (event.request.method !== "GET") return

    // Skip cross-origin requests
    if (!event.request.url.startsWith(self.location.origin)) return

    // For HTML navigation requests (pages)
    if (event.request.mode === "navigate") {
      event.respondWith(
        fetch(event.request).catch(() => {
          // If network fails, serve the offline page
          return caches.match(OFFLINE_URL)
        }),
      )
      return
    }

    // For other requests, try network first, then cache
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // If valid response, clone and cache it
          if (response && response.status === 200) {
            const responseToCache = response.clone()
            caches.open(CACHE_NAME).then((cache) => {
              // Don't cache API requests
              if (!event.request.url.includes("/api/")) {
                cache.put(event.request, responseToCache)
              }
            })
          }
          return response
        })
        .catch(() => {
          // If network fails, try to serve from cache
          return caches.match(event.request)
        }),
    )
  })

  // Push notification event
  self.addEventListener("push", (event) => {
    if (!event.data) return

    try {
      const data = event.data.json()

      const options = {
        body: data.body || "New notification from Day Segment Tracker",
        icon: "/icons/icon-192x192.png",
        badge: "/icons/badge-72x72.png",
        vibrate: [100, 50, 100],
        data: {
          url: data.url || "/",
        },
      }

      event.waitUntil(self.registration.showNotification(data.title || "Day Segment Tracker", options))
    } catch (err) {
      console.error("[PWA] Push notification error:", err)
    }
  })

  // Notification click event
  self.addEventListener("notificationclick", (event) => {
    event.notification.close()

    event.waitUntil(
      clients.matchAll({ type: "window" }).then((clientList) => {
        // If a tab is already open, focus it
        for (const client of clientList) {
          if (client.url === event.notification.data.url && "focus" in client) {
            return client.focus()
          }
        }

        // Otherwise open a new tab
        if (clients.openWindow) {
          return clients.openWindow(event.notification.data.url)
        }
      }),
    )
  })
}
