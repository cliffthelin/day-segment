export function formatTimerTime(milliseconds: number): string {
  const totalSeconds = Math.floor(milliseconds / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  let formattedTime = ""

  if (hours > 0) {
    formattedTime += `${hours.toString().padStart(2, "0")}:`
  }

  formattedTime += `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`

  return formattedTime
}

export function parseTimeToMilliseconds(timeString: string): number {
  const [hoursStr, minutesStr, secondsStr] = timeString.split(":")
  const hours = Number.parseInt(hoursStr, 10)
  const minutes = Number.parseInt(minutesStr, 10)
  const seconds = Number.parseInt(secondsStr, 10)

  if (isNaN(hours) || isNaN(minutes) || isNaN(seconds)) {
    return 0
  }

  return (hours * 3600 + minutes * 60 + seconds) * 1000
}

export function formatDateForDB(date: Date): string {
  return date.toISOString().split("T")[0]
}

export function getCurrentTimeForDB(): string {
  const now = new Date()
  const hours = now.getHours().toString().padStart(2, "0")
  const minutes = now.getMinutes().toString().padStart(2, "0")
  return `${hours}:${minutes}`
}

export function formatTimeForDisplay(date: Date): string {
  const hours = date.getHours()
  const minutes = date.getMinutes()
  const ampm = hours >= 12 ? "PM" : "AM"
  const formattedHours = hours % 12 === 0 ? 12 : hours % 12
  return `${formattedHours}:${minutes.toString().padStart(2, "0")} ${ampm}`
}
