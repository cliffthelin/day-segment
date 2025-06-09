/**
 * Formats a time string based on the user's preferred time format
 * @param timeString Time string in 24-hour format (HH:MM)
 * @param format The preferred format: "12h" for 12-hour format with AM/PM or "24h" for 24-hour format
 * @returns Formatted time string
 */
export function formatTimeString(timeString: string, format: "12h" | "24h" = "12h"): string {
  if (!timeString) return ""

  // Parse the time string (expected format: "HH:MM")
  const [hoursStr, minutesStr] = timeString.split(":")
  const hours = Number.parseInt(hoursStr, 10)
  const minutes = Number.parseInt(minutesStr, 10)

  if (isNaN(hours) || isNaN(minutes)) {
    return timeString // Return original if parsing fails
  }

  if (format === "24h") {
    // 24-hour format (military time)
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`
  } else {
    // 12-hour format (standard time with AM/PM)
    const period = hours >= 12 ? "PM" : "AM"
    const displayHours = hours % 12 || 12 // Convert 0 to 12 for 12 AM
    return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`
  }
}

/**
 * Formats a Date object based on the user's preferred time format
 * @param date Date object to format
 * @param format The preferred format: "12h" for 12-hour format with AM/PM or "24h" for 24-hour format
 * @returns Formatted time string
 */
export function formatTime(date: Date, format: "12h" | "24h" = "12h"): string {
  if (format === "24h") {
    // 24-hour format (military time)
    return `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`
  } else {
    // 12-hour format (standard time with AM/PM)
    const hours = date.getHours()
    const period = hours >= 12 ? "PM" : "AM"
    const displayHours = hours % 12 || 12 // Convert 0 to 12 for 12 AM
    return `${displayHours}:${date.getMinutes().toString().padStart(2, "0")} ${period}`
  }
}
