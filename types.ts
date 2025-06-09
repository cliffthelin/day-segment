export type TaskStatus = "todo" | "started" | "completed"

export type TaskType = "standard" | "tally" | "subtasks" | "stopwatch" | "timer" | "alarm"

export interface Task {
  id: string
  name: string
  description?: string
  status: TaskStatus
  priority?: "low" | "medium" | "high"
  dueDate?: string
  createdAt: string
  startedAt?: string
  completedAt?: string
  type?: TaskType
  tallyTimestamps?: string[]
  isRecurring: boolean
  preferredSegment?: string
  segmentStartTime?: string
  hasSubtasks?: boolean
  subtaskCount?: number
  completedSubtaskCount?: number
  categoryId?: string
  templateId?: string
  timerDuration?: number // Duration in minutes for timer type
  alarmTime?: string // Time for alarm type
}

export interface Subtask {
  id: string
  taskId: string
  name: string
  description?: string
  isCompleted: boolean
  completedAt?: string
  createdAt: string
  order: number
  type?: TaskType // Added type to subtasks
  timerDuration?: number // Duration in minutes for timer type
  alarmTime?: string // Time for alarm type
}

export interface Category {
  id: string
  name: string
  color: string
  icon?: string
  description?: string
  isDefault?: boolean
  createdAt: string
}

export interface Collection {
  id: string
  name: string
  description?: string
  isRecurring: boolean
  icon?: string
  color?: string
  createdAt: string
  updatedAt?: string
}

export interface TaskCollection {
  id: string
  taskId: string
  collectionId: string
  createdAt: string
}

export interface TaskTemplate {
  id: string
  name: string
  description?: string
  type?: TaskType
  isRecurring: boolean
  preferredSegment?: string
  segmentStartTime?: string
  categoryId?: string
  subtasks?: SubtaskTemplate[]
  createdAt: string
  updatedAt?: string
  usageCount: number
  icon?: string
  color?: string
  tags?: string[]
  timerDuration?: number
  alarmTime?: string
}

export interface SubtaskTemplate {
  id: string
  name: string
  description?: string
  order: number
  type?: TaskType
  timerDuration?: number
  alarmTime?: string
}
