import { db } from "@/lib/db"

export async function checkSimilarPrompts(promptText: string): Promise<boolean> {
  try {
    // Get all prompts and filter in memory
    const allPrompts = await db.table("suggestedPrompts").toArray()
    const completedPrompts = allPrompts.filter((p) => p.isCompleted === true)

    // Simple similarity check - if the prompt contains similar keywords
    return completedPrompts.some((prompt) => {
      const promptWords = prompt.text.toLowerCase().split(/\s+/)
      const newPromptWords = promptText.toLowerCase().split(/\s+/)

      // Check if there's significant word overlap (more than 50% of words match)
      const commonWords = promptWords.filter(
        (word) => newPromptWords.includes(word) && word.length > 3, // Only count significant words
      )

      return commonWords.length >= Math.min(promptWords.length, newPromptWords.length) * 0.5
    })
  } catch (error) {
    console.error("Error checking similar prompts:", error)
    return false
  }
}

export async function markSimilarPromptsAsCompleted(promptText: string): Promise<void> {
  try {
    // Get all prompts and filter in memory
    const allPrompts = await db.table("suggestedPrompts").toArray()
    const incompletePrompts = allPrompts.filter((p) => p.isCompleted === false)

    // Find similar prompts
    const similarPrompts = incompletePrompts.filter((prompt) => {
      const promptWords = prompt.text.toLowerCase().split(/\s+/)
      const newPromptWords = promptText.toLowerCase().split(/\s+/)

      // Check if there's significant word overlap (more than 50% of words match)
      const commonWords = promptWords.filter(
        (word) => newPromptWords.includes(word) && word.length > 3, // Only count significant words
      )

      return commonWords.length >= Math.min(promptWords.length, newPromptWords.length) * 0.5
    })

    // Mark similar prompts as completed
    for (const prompt of similarPrompts) {
      if (prompt.id) {
        await db.table("suggestedPrompts").update(prompt.id, { isCompleted: true })
      }
    }
  } catch (error) {
    console.error("Error marking similar prompts as completed:", error)
  }
}

export async function addNewSuggestedPrompt(): Promise<void> {
  try {
    // Define categories and potential prompts
    const promptsByCategory = {
      Tasks: [
        "Create a recurring task for daily habits",
        "Set up task categories for better organization",
        "Add priority levels to your tasks",
        "Create a task for your most important goal",
        "Set up a weekly review task",
        "Try using the stopwatch feature for time tracking",
        "Create a task with a specific deadline",
        "Set up a task for your daily planning",
        "Try using task notes for additional context",
        "Create a task with subtasks for complex projects",
      ],
      "Check-ins": [
        "Add a custom metric for tracking your specific goals",
        "Set up regular check-in reminders",
        "Create a check-in routine for mornings and evenings",
        "Track your mood patterns throughout the week",
        "Add notes to your check-ins for more context",
        "Try using the emotion analysis feature for voice check-ins",
        "Compare your metrics across different days",
        "Set up a weekly check-in review",
        "Track your energy levels throughout the day",
        "Use check-ins to identify productivity patterns",
      ],
      Voice: [
        "Try voice check-ins for faster logging",
        "Set up transcription for your voice notes",
        "Create voice reminders for important tasks",
        "Use voice commands for quick task creation",
        "Export your voice transcriptions for review",
        "Try the emotion analysis feature with your voice notes",
        "Record longer reflections for important moments",
        "Use voice check-ins during transitions between tasks",
        "Try different recording settings for better quality",
        "Create a voice journal entry about your progress",
      ],
      Segments: [
        "Customize your day segments to match your schedule",
        "Add color coding to your segments for visual clarity",
        "Create focused work segments in your day",
        "Add break segments to your schedule",
        "Optimize your segment transitions",
        "Try different segment lengths for better productivity",
        "Create a segment specifically for planning",
        "Add a reflection segment at the end of your day",
        "Try using different task types for different segments",
        "Create a custom segment for your most important work",
      ],
      Data: [
        "Export your data for external analysis",
        "Review your weekly productivity patterns",
        "Back up your app data regularly",
        "Analyze which segments are most productive for you",
        "Track your progress on key metrics over time",
        "Try different visualization options for your data",
        "Compare your productivity across different weeks",
        "Look for patterns in your check-in data",
        "Review your completed tasks for the week",
        "Analyze your emotion patterns from voice check-ins",
      ],
    }

    // Get existing prompts to avoid duplicates
    const existingPrompts = await db.table("suggestedPrompts").toArray()
    const existingPromptTexts = existingPrompts.map((p) => p.text)

    // Select a random category
    const categories = Object.keys(promptsByCategory)
    const randomCategory = categories[Math.floor(Math.random() * categories.length)]

    // Select a random prompt from that category that isn't already in the database
    const categoryPrompts = promptsByCategory[randomCategory as keyof typeof promptsByCategory]
    const availablePrompts = categoryPrompts.filter((p) => !existingPromptTexts.includes(p))

    if (availablePrompts.length === 0) {
      // If all prompts in this category are used, try another category
      for (const category of categories) {
        const prompts = promptsByCategory[category as keyof typeof promptsByCategory]
        const available = prompts.filter((p) => !existingPromptTexts.includes(p))

        if (available.length > 0) {
          const randomPrompt = available[Math.floor(Math.random() * available.length)]

          await db.table("suggestedPrompts").add({
            text: randomPrompt,
            category,
            isCompleted: false,
            dateAdded: new Date().toISOString(),
          })

          return
        }
      }

      // If all predefined prompts are used, create a generic one
      await db.table("suggestedPrompts").add({
        text: "Explore a new feature in the app",
        category: "General",
        isCompleted: false,
        dateAdded: new Date().toISOString(),
      })
    } else {
      const randomPrompt = availablePrompts[Math.floor(Math.random() * availablePrompts.length)]

      await db.table("suggestedPrompts").add({
        text: randomPrompt,
        category: randomCategory,
        isCompleted: false, // Fixed: This should be false for new prompts
        dateAdded: new Date().toISOString(),
      })
    }
  } catch (error) {
    console.error("Error adding new suggested prompt:", error)
  }
}
