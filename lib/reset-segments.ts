import { db } from "@/lib/db"

export async function resetSegmentsToDefault() {
  try {
    // Clear existing segments
    await db.segments.clear()

    // Add default segments with the new schedule
    await db.segments.bulkAdd([
      { id: "1", name: "Morning Routine", startTime: "07:00", endTime: "08:00" },
      { id: "2", name: "Morning", startTime: "08:00", endTime: "12:00" },
      { id: "3", name: "Lunch Routine", startTime: "12:00", endTime: "13:00" },
      { id: "4", name: "Afternoon", startTime: "13:00", endTime: "17:00" },
      { id: "5", name: "End of Business Day", startTime: "17:00", endTime: "18:00" },
      { id: "6", name: "Evening", startTime: "18:00", endTime: "22:00" },
      { id: "7", name: "End of Day Routine", startTime: "22:00", endTime: "23:00" },
    ])

    // Update max segments setting
    await db.settings.put({ key: "maxSegments", value: 7 })

    return true
  } catch (error) {
    console.error("Error resetting segments:", error)
    return false
  }
}
