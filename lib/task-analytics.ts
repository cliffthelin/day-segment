import { formatDateForDB } from "./time-utils"

// Get dates for a specific range
export function getDatesForRange(range: "week" | "month" | "year" | "all") {
  const dates = []
  const today = new Date()
  let daysToInclude = 7

  if (range === "month") {
    daysToInclude = 30
  } else if (range === "year") {
    daysToInclude = 365
  } else if (range === "all") {
    // For "all", we'll just use a large number like 3 years
    daysToInclude = 365 * 3
  }

  for (let i = daysToInclude - 1; i >= 0; i--) {
    const date = new Date()
    date.setDate(today.getDate() - i)
    dates.push(formatDateForDB(date))
  }

  return dates
}

// Format date for display
export function formatDateForDisplay(dateString: string) {
  const date = new Date(dateString)
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  return `${months[date.getMonth()]} ${date.getDate()}`
}

// Calculate completion rate
export function calculateCompletionRate(completions: any[], total: number) {
  if (total === 0) return 0
  return (completions.length / total) * 100
}

// Calculate streak data
export function calculateStreakData(taskCompletions: any[] = [], tasks: any[] = []) {
  if (!Array.isArray(taskCompletions) || !Array.isArray(tasks)) {
    return {}
  }

  // Group completions by date
  const completionsByDate = taskCompletions.reduce((acc, completion) => {
    if (!completion?.date) return acc

    if (!acc[completion.date]) {
      acc[completion.date] = []
    }
    acc[completion.date].push(completion)
    return acc
  }, {})

  // Get all task IDs
  const taskIds = tasks.map((task) => task?.id).filter(Boolean)

  // Calculate current streaks for each task
  const taskStreaks = taskIds.reduce((acc, taskId) => {
    const task = tasks.find((t) => t?.id === taskId)
    if (!task) return acc

    // Sort dates in descending order (most recent first)
    const dates = Object.keys(completionsByDate).sort((a, b) => new Date(b).getTime() - new Date(a).getTime())

    let currentStreak = 0
    let maxStreak = 0
    let lastCompletionDate: Date | null = null

    // Calculate streak
    for (const date of dates) {
      const completionsForDate = completionsByDate[date] || []
      const taskCompletedOnDate = completionsForDate.some((c) => c?.taskId === taskId)

      if (taskCompletedOnDate) {
        const currentDate = new Date(date)

        if (!lastCompletionDate) {
          // First completion
          currentStreak = 1
          lastCompletionDate = currentDate
        } else {
          // Check if this completion is consecutive with the last one
          const dayDiff = Math.floor((lastCompletionDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24))

          if (dayDiff === 1) {
            // Consecutive day
            currentStreak++
            lastCompletionDate = currentDate
          } else if (dayDiff > 1) {
            // Streak broken
            break
          }
        }

        maxStreak = Math.max(maxStreak, currentStreak)
      } else {
        // Streak broken
        break
      }
    }

    acc[taskId] = {
      currentStreak,
      maxStreak,
      taskName: task.name,
    }
    return acc
  }, {})

  return taskStreaks
}

// Calculate completion heatmap data
export function calculateHeatmapData(taskCompletions: any[] = []) {
  if (!Array.isArray(taskCompletions)) {
    return []
  }

  // Initialize heatmap data structure (day of week x hour of day)
  const heatmapData = Array(7)
    .fill(0)
    .map(() => Array(24).fill(0))

  // Populate heatmap data
  taskCompletions.forEach((completion) => {
    if (completion?.time) {
      try {
        const date = new Date(completion.time)
        const dayOfWeek = date.getDay() // 0-6 (Sunday-Saturday)
        const hourOfDay = date.getHours() // 0-23

        heatmapData[dayOfWeek][hourOfDay]++
      } catch (e) {
        // Skip invalid dates
      }
    }
  })

  // Convert to format suitable for visualization
  const formattedData = []
  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < 24; hour++) {
      formattedData.push({
        day: daysOfWeek[day],
        hour: hour,
        value: heatmapData[day][hour],
        dayIndex: day,
      })
    }
  }

  return formattedData
}

// Calculate productivity by segment
export function calculateProductivityBySegment(taskCompletions: any[] = [], segments: any[] = []) {
  if (!Array.isArray(taskCompletions) || !Array.isArray(segments)) {
    return []
  }

  // Initialize data structure
  const segmentData = segments.reduce((acc, segment) => {
    if (!segment?.id) return acc

    acc[segment.id] = {
      name: segment.name || "Unknown",
      color: segment.color || "#cccccc",
      completions: 0,
      totalTasks: 0,
    }
    return acc
  }, {})

  // Count completions by segment
  taskCompletions.forEach((completion) => {
    if (completion?.segmentId && segmentData[completion.segmentId]) {
      segmentData[completion.segmentId].completions++
    }
  })

  // Convert to array format for visualization
  return Object.values(segmentData)
}

// Calculate completion by task type
export function calculateCompletionByTaskType(taskCompletions: any[] = [], tasks: any[] = []) {
  if (!Array.isArray(taskCompletions) || !Array.isArray(tasks)) {
    return []
  }

  // Initialize data structure
  const typeData = {
    standard: { name: "Standard", completions: 0, totalTasks: 0 },
    tally: { name: "Tally", completions: 0, totalTasks: 0 },
    subtasks: { name: "Subtasks", completions: 0, totalTasks: 0 },
  }

  // Count tasks by type
  tasks.forEach((task) => {
    if (!task) return

    const type = task.type || "standard"
    if (typeData[type]) {
      typeData[type].totalTasks++
    }
  })

  // Count completions by type
  taskCompletions.forEach((completion) => {
    if (!completion?.taskId) return

    const task = tasks.find((t) => t?.id === completion.taskId)
    if (task) {
      const type = task.type || "standard"
      if (typeData[type]) {
        typeData[type].completions++
      }
    }
  })

  // Convert to array format for visualization
  return Object.values(typeData)
}
