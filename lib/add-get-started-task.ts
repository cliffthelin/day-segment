import { db } from "@/lib/db"

export async function addGetStartedTask() {
  try {
    // Check if the task already exists
    const existingTask = await db.tasks.where("name").equals("Get started").first()

    if (existingTask) {
      console.log("Get started task already exists")
      return
    }

    // Create the task
    const task = {
      id: `get-started-${Date.now()}`,
      name: "Get started",
      description:
        "Here are some suggestions for tasks you might want to track:\n\n" +
        "• Drink water regularly throughout the day\n" +
        "• Take a 5-minute break every hour\n" +
        "• Do a quick stretching routine\n" +
        "• Practice deep breathing for 2 minutes\n" +
        "• Review your daily goals\n" +
        "• Take a short walk\n" +
        "• Check in with your mood and energy levels\n" +
        "• Clear your workspace\n" +
        "• Write down three things you're grateful for\n" +
        "• Plan your next day before finishing work",
      status: "todo",
      priority: "medium",
      createdAt: new Date().toISOString(),
      type: "standard",
      isRecurring: false, // One-time task
    }

    // Add the task to the database
    await db.tasks.add(task)
    console.log("Added Get started task")
  } catch (error) {
    console.error("Error adding Get started task:", error)
  }
}
