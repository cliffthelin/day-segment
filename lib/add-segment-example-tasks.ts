import { db } from "@/lib/db"

// Function to add example tasks for each segment
export async function addSegmentExampleTasks() {
  try {
    // Check if we've already added example tasks
    const exampleTasksAdded = await db.settings.get("segmentExampleTasksAdded")
    if (exampleTasksAdded?.value === true) {
      console.log("Segment example tasks already added, skipping...")
      return
    }

    console.log("Adding example tasks for segments...")

    // Get all segments
    const segments = await db.segments.toArray()
    if (!segments || segments.length === 0) {
      console.log("No segments found, skipping example task creation")
      return
    }

    // Create a map of segment names to IDs for easier lookup
    const segmentMap = new Map()
    segments.forEach((segment) => {
      segmentMap.set(segment.name.toLowerCase(), {
        id: segment.id,
        startTime: segment.startTime,
        color: segment.color,
      })
    })

    // 1. Morning Segment - Standard Task
    if (segmentMap.has("morning")) {
      const morningSegment = segmentMap.get("morning")
      const morningTask = {
        id: `morning-example-${Date.now()}`,
        name: "Morning Stretch Routine",
        description:
          "A quick 5-minute morning stretch routine to energize your day.\n\n" +
          "1. Neck rolls (30 seconds)\n" +
          "2. Shoulder circles (30 seconds)\n" +
          "3. Side stretches (1 minute)\n" +
          "4. Forward folds (1 minute)\n" +
          "5. Gentle twists (1 minute)\n" +
          "6. Deep breathing (1 minute)\n\n" +
          "This simple routine helps wake up your body and mind, improves circulation, and prepares you for the day ahead.",
        status: "todo",
        createdAt: new Date().toISOString(),
        type: "standard",
        isRecurring: true,
        preferredSegment: morningSegment.id,
        segmentStartTime: morningSegment.startTime,
        hasSubtasks: false,
      }
      await db.tasks.add(morningTask)
      console.log("Added Morning example task")
    }

    // 2. Work Segment - Timer Task
    if (segmentMap.has("work")) {
      const workSegment = segmentMap.get("work")
      const workTask = {
        id: `work-example-${Date.now()}`,
        name: "Deep Work Session",
        description:
          "A focused work session using the Pomodoro technique.\n\n" +
          "• Work intensely for 25 minutes\n" +
          "• Take a 5-minute break\n" +
          "• Repeat 4 times, then take a longer 15-30 minute break\n\n" +
          "During deep work sessions:\n" +
          "- Turn off notifications\n" +
          "- Close email and messaging apps\n" +
          "- Focus on a single task or project\n" +
          "- Track your progress and insights\n\n" +
          "This technique helps maintain high concentration and productivity while preventing burnout.",
        status: "todo",
        createdAt: new Date().toISOString(),
        type: "standard", // Using standard since we don't have a specific timer type
        isRecurring: true,
        preferredSegment: workSegment.id,
        segmentStartTime: workSegment.startTime,
        hasSubtasks: false,
      }
      await db.tasks.add(workTask)
      console.log("Added Work example task")
    }

    // 3. Lunch Segment - Tally Task
    if (segmentMap.has("lunch")) {
      const lunchSegment = segmentMap.get("lunch")
      const lunchTask = {
        id: `lunch-example-${Date.now()}`,
        name: "Drink Water",
        description:
          "Track your water intake during lunch break.\n\n" +
          "Goal: Drink at least 2 glasses of water during your lunch break.\n\n" +
          "Benefits of proper hydration:\n" +
          "• Improves digestion\n" +
          "• Enhances mental clarity\n" +
          "• Reduces afternoon fatigue\n" +
          "• Helps regulate body temperature\n\n" +
          "Click the task to increment your water count each time you finish a glass.",
        status: "todo",
        createdAt: new Date().toISOString(),
        type: "tally",
        tallyTimestamps: [],
        isRecurring: true,
        preferredSegment: lunchSegment.id,
        segmentStartTime: lunchSegment.startTime,
        hasSubtasks: false,
      }
      await db.tasks.add(lunchTask)
      console.log("Added Lunch example task")
    }

    // 4. Afternoon Segment - Subtasks
    if (segmentMap.has("afternoon")) {
      const afternoonSegment = segmentMap.get("afternoon")
      const afternoonTask = {
        id: `afternoon-example-${Date.now()}`,
        name: "Daily Review & Planning",
        description:
          "End your workday with a structured review and planning session.\n\n" +
          "This practice helps you:\n" +
          "• Close open loops from today\n" +
          "• Celebrate accomplishments\n" +
          "• Prepare for tomorrow\n" +
          "• Transition from work to personal time\n\n" +
          "Complete each subtask in order for an effective daily wrap-up routine.",
        status: "todo",
        createdAt: new Date().toISOString(),
        type: "subtasks",
        isRecurring: true,
        preferredSegment: afternoonSegment.id,
        segmentStartTime: afternoonSegment.startTime,
        hasSubtasks: true,
        subtaskCount: 4,
        completedSubtaskCount: 0,
      }

      // Add the task and get its ID
      const taskId = await db.tasks.add(afternoonTask)

      // Create subtasks
      const subtasks = [
        {
          id: `afternoon-subtask-1-${Date.now()}`,
          taskId,
          name: "Review today's accomplishments",
          description: "List 3 things you completed or made progress on today",
          isCompleted: false,
          createdAt: new Date().toISOString(),
          order: 0,
        },
        {
          id: `afternoon-subtask-2-${Date.now()}`,
          taskId,
          name: "Process inbox and notes",
          description: "Clear email inbox, organize notes, and file any important documents",
          isCompleted: false,
          createdAt: new Date().toISOString(),
          order: 1,
        },
        {
          id: `afternoon-subtask-3-${Date.now()}`,
          taskId,
          name: "Plan tomorrow's priorities",
          description: "Identify 1-3 most important tasks for tomorrow",
          isCompleted: false,
          createdAt: new Date().toISOString(),
          order: 2,
        },
        {
          id: `afternoon-subtask-4-${Date.now()}`,
          taskId,
          name: "Clear workspace and mentally disconnect",
          description: "Tidy desk, close apps, and set an intention for your evening",
          isCompleted: false,
          createdAt: new Date().toISOString(),
          order: 3,
        },
      ]

      // Add the subtasks
      await db.subtasks.bulkAdd(subtasks)
      console.log("Added Afternoon example task with subtasks")
    }

    // 5. Evening Segment - Standard Task
    if (segmentMap.has("evening")) {
      const eveningSegment = segmentMap.get("evening")
      const eveningTask = {
        id: `evening-example-${Date.now()}`,
        name: "Evening Reflection",
        description:
          "Take 10 minutes for an evening reflection to process your day.\n\n" +
          "Reflection questions:\n" +
          "• What went well today?\n" +
          "• What challenged me today?\n" +
          "• What did I learn?\n" +
          "• What am I grateful for?\n" +
          "• What would I like to improve tomorrow?\n\n" +
          "This practice helps build self-awareness, process emotions, and improve wellbeing over time.",
        status: "todo",
        createdAt: new Date().toISOString(),
        type: "standard",
        isRecurring: true,
        preferredSegment: eveningSegment.id,
        segmentStartTime: eveningSegment.startTime,
        hasSubtasks: false,
      }
      await db.tasks.add(eveningTask)
      console.log("Added Evening example task")
    }

    // 6. Night Segment - Standard Task
    if (segmentMap.has("night")) {
      const nightSegment = segmentMap.get("night")
      const nightTask = {
        id: `night-example-${Date.now()}`,
        name: "Wind-Down Routine",
        description:
          "A calming routine to prepare your mind and body for restful sleep.\n\n" +
          "Recommended activities (choose 2-3):\n" +
          "• Dim lights 1-2 hours before bed\n" +
          "• Avoid screens 30-60 minutes before sleep\n" +
          "• Light stretching or gentle yoga\n" +
          "• Reading (preferably physical books)\n" +
          "• Journaling\n" +
          "• Meditation or deep breathing\n" +
          "• Herbal tea (non-caffeinated)\n\n" +
          "A consistent wind-down routine signals to your body that it's time to sleep, improving sleep quality and making it easier to fall asleep.",
        status: "todo",
        createdAt: new Date().toISOString(),
        type: "standard",
        isRecurring: true,
        preferredSegment: nightSegment.id,
        segmentStartTime: nightSegment.startTime,
        hasSubtasks: false,
      }
      await db.tasks.add(nightTask)
      console.log("Added Night example task")
    }

    // Mark that we've added example tasks
    await db.settings.put({ key: "segmentExampleTasksAdded", value: true })
    console.log("Completed adding segment example tasks")
  } catch (error) {
    console.error("Error adding segment example tasks:", error)
  }
}
