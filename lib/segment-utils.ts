import { formatTimeString } from "./format-time"

export function getCurrentSegment(segments, currentTime = new Date()) {
  if (!segments || segments.length === 0) return null

  const currentHour = currentTime.getHours()
  const currentMinute = currentTime.getMinutes()
  const currentTimeString = `${currentHour.toString().padStart(2, "0")}:${currentMinute.toString().padStart(2, "0")}`

  // Sort segments by start time
  const sortedSegments = [...segments].sort((a, b) => {
    return a.startTime.localeCompare(b.startTime)
  })

  // First check for segments that span across midnight
  for (let i = 0; i < sortedSegments.length; i++) {
    const segment = sortedSegments[i]
    // If end time is earlier than start time, it spans across midnight
    if (segment.endTime < segment.startTime) {
      // Check if current time is after start time OR before end time
      if (segment.startTime <= currentTimeString || currentTimeString < segment.endTime) {
        return segment
      }
    }
  }

  // Then check for regular segments (that don't span across midnight)
  for (let i = 0; i < sortedSegments.length; i++) {
    const segment = sortedSegments[i]
    // Only process segments that don't span across midnight
    if (segment.endTime >= segment.startTime) {
      if (segment.startTime <= currentTimeString && currentTimeString < segment.endTime) {
        return segment
      }
    }
  }

  // If no segment contains the current time, return the first segment
  return sortedSegments[0]
}

export function getNextSegmentTime(segments, currentTime) {
  if (!segments || segments.length === 0) return null

  const currentHour = currentTime.getHours()
  const currentMinute = currentTime.getMinutes()
  const currentTimeString = `${currentHour.toString().padStart(2, "0")}:${currentMinute.toString().padStart(2, "0")}`

  // Sort segments by start time
  const sortedSegments = [...segments].sort((a, b) => {
    return a.startTime.localeCompare(b.startTime)
  })

  // Find the next segment that starts after the current time
  for (let i = 0; i < sortedSegments.length; i++) {
    if (sortedSegments[i].startTime > currentTimeString) {
      const [hours, minutes] = sortedSegments[i].startTime.split(":").map(Number)
      const nextTime = new Date(currentTime)
      nextTime.setHours(hours, minutes, 0, 0)
      return nextTime
    }
  }

  // If no segment starts after the current time, the next segment is the first segment tomorrow
  const [hours, minutes] = sortedSegments[0].startTime.split(":").map(Number)
  const nextTime = new Date(currentTime)
  nextTime.setDate(nextTime.getDate() + 1)
  nextTime.setHours(hours, minutes, 0, 0)
  return nextTime
}

export function formatTime(date: Date | string, format: "12h" | "24h" = "12h"): string {
  if (!date) return ""

  if (typeof date === "string") {
    // If it's a time string like "14:30", convert it to the desired format
    if (date.includes(":")) {
      const [hours, minutes] = date.split(":").map(Number)

      if (format === "12h") {
        const period = hours >= 12 ? "PM" : "AM"
        const displayHours = hours % 12 || 12
        return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`
      } else {
        return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`
      }
    }

    // Otherwise, just return the string
    return date
  }

  // Format the date according to the user's preference
  return formatTimeString(date, format)
}

export function getSegmentForTime(segments, timeString) {
  if (!segments || segments.length === 0) return null

  for (const segment of segments) {
    // Handle segments that span across midnight
    if (segment.endTime < segment.startTime) {
      // Check if time is after start time OR before end time
      if (segment.startTime <= timeString || timeString < segment.endTime) {
        return segment
      }
    } else {
      // Handle regular segments
      if (segment.startTime <= timeString && timeString < segment.endTime) {
        return segment
      }
    }
  }

  return null
}

// Add a function to find the best matching segment based on start time
export function findMatchingSegmentByTime(segments: any[], startTime: string): string {
  if (!startTime || !segments || segments.length === 0) {
    return "any"
  }

  // Convert the target start time to minutes for comparison
  const [targetHours, targetMinutes] = startTime.split(":").map(Number)
  const targetTimeInMinutes = targetHours * 60 + targetMinutes

  // Find the segment with the closest start time
  let closestSegment = segments[0]
  let minDifference = Number.POSITIVE_INFINITY

  segments.forEach((segment) => {
    const [segHours, segMinutes] = segment.startTime.split(":").map(Number)
    const segTimeInMinutes = segHours * 60 + segMinutes

    // Calculate the absolute difference in minutes
    let difference = Math.abs(segTimeInMinutes - targetTimeInMinutes)

    // Handle the case where times wrap around midnight
    // For example, 23:00 and 01:00 should be considered 2 hours apart, not 22 hours
    const wrapAroundDifference = 24 * 60 - difference
    if (wrapAroundDifference < difference) {
      difference = wrapAroundDifference
    }

    if (difference < minDifference) {
      minDifference = difference
      closestSegment = segment
    }
  })

  return closestSegment.id
}

// Add a function to realign tasks when segments change
export async function realignTasksToSegments(db: any, segments: any[]): Promise<void> {
  try {
    // Get all tasks with a preferred segment and segment start time
    const tasks = await db.tasks.where("preferredSegment").notEqual("any").toArray()

    for (const task of tasks) {
      if (task.segmentStartTime) {
        // Find the best matching segment based on the stored start time
        const matchingSegmentId = findMatchingSegmentByTime(segments, task.segmentStartTime)

        // Update the task if the segment has changed
        if (matchingSegmentId !== task.preferredSegment) {
          await db.tasks.update(task.id, { preferredSegment: matchingSegmentId })
          console.log(
            `Realigned task "${task.name}" to segment ${matchingSegmentId} based on start time ${task.segmentStartTime}`,
          )
        }
      }
    }
  } catch (error) {
    console.error("Error realigning tasks to segments:", error)
  }
}
