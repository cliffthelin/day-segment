import { Suspense } from "react"
import SettingsClient from "./client"

export const metadata = {
  title: "Settings | Day Segment Tracker",
  description: "Configure your Day Segment Tracker settings",
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading settings...</div>}>
      <SettingsClient />
    </Suspense>
  )
}
