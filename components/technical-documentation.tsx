"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export function TechnicalDocumentation() {
  const [activeTab, setActiveTab] = useState("overview")

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4">
        <h2 className="text-2xl font-bold tracking-tight">Technical Documentation</h2>
        <p className="text-muted-foreground">
          This page provides comprehensive technical documentation for the Day Segment Tracker application.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="architecture">Architecture</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="components">Components</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="api">API Reference</TabsTrigger>
        </TabsList>

        <ScrollArea className="h-[600px] rounded-md border p-4">
          <TabsContent value="overview" className="space-y-4">
            <h3 className="text-xl font-semibold">Application Overview</h3>
            <p>
              Day Segment Tracker is a Progressive Web Application (PWA) designed to help users track their daily
              activities, manage tasks, and reflect on their productivity through various metrics and check-ins.
            </p>

            <h4 className="text-lg font-medium mt-4">Core Technologies</h4>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Framework:</strong> Next.js 14 with App Router
              </li>
              <li>
                <strong>UI Library:</strong> React 18 with Tailwind CSS and shadcn/ui components
              </li>
              <li>
                <strong>Database:</strong> IndexedDB via Dexie.js for client-side storage
              </li>
              <li>
                <strong>State Management:</strong> React Hooks and Context API
              </li>
              <li>
                <strong>PWA Features:</strong> Service Worker, Web Push Notifications, Offline Support
              </li>
              <li>
                <strong>Audio Processing:</strong> Web Audio API and MediaRecorder API
              </li>
            </ul>

            <h4 className="text-lg font-medium mt-4">Key Features</h4>
            <ul className="list-disc pl-6 space-y-2">
              <li>Day segmentation with customizable time blocks</li>
              <li>Task management with recurring tasks support</li>
              <li>Voice check-ins with transcription</li>
              <li>Emotion analysis for audio check-ins</li>
              <li>Productivity metrics and reporting</li>
              <li>Customizable notifications and sounds</li>
              <li>Data export and backup capabilities</li>
              <li>Full offline functionality</li>
            </ul>
          </TabsContent>

          <TabsContent value="architecture" className="space-y-4">
            <h3 className="text-xl font-semibold">Application Architecture</h3>
            <p>
              The application follows a client-side architecture with all data stored locally in the user's browser.
              It's built as a Progressive Web App (PWA) to provide an app-like experience with offline capabilities.
            </p>

            <h4 className="text-lg font-medium mt-4">Directory Structure</h4>
            <pre className="bg-muted p-4 rounded-md overflow-x-auto">
              {`/app                   # Next.js App Router pages
  /dashboard            # Dashboard page
  /reports              # Reports page
  /settings             # Settings page
  /tasks                # Tasks page
  /timers               # Timers page
  layout.tsx            # Root layout with providers
  page.tsx              # Home page
/components             # React components
  /ui                   # UI components (shadcn/ui)
  feature-specific      # Feature-specific components
/hooks                  # Custom React hooks
/lib                    # Utility functions and services
  db.ts                 # Database schema and connection
  export-utils.ts       # Data export utilities
  emotion-analysis.ts   # Emotion analysis logic
  time-utils.ts         # Time-related utilities
/public                 # Static assets
  /sounds               # Sound files
  /icons                # App icons
  manifest.json         # PWA manifest
  sw.js                 # Service Worker`}
            </pre>

            <h4 className="text-lg font-medium mt-4">Data Flow</h4>
            <p>The application uses a unidirectional data flow pattern:</p>
            <ol className="list-decimal pl-6 space-y-2">
              <li>User interactions trigger component events</li>
              <li>Events call database operations via hooks</li>
              <li>Database updates trigger UI re-renders</li>
              <li>Components re-render with updated data</li>
            </ol>

            <h4 className="text-lg font-medium mt-4">Client-Side Rendering</h4>
            <p>
              Most components use the 'use client' directive to ensure they're rendered on the client side, as they
              require access to browser APIs like IndexedDB, localStorage, and the Web Audio API.
            </p>
          </TabsContent>

          <TabsContent value="database" className="space-y-4">
            <h3 className="text-xl font-semibold">Database Schema</h3>
            <p>
              The application uses Dexie.js, a wrapper around IndexedDB, for client-side data storage. The database
              schema is defined in <code>lib/db.ts</code>.
            </p>

            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="segments">
                <AccordionTrigger>Segments Table</AccordionTrigger>
                <AccordionContent>
                  <p className="mb-2">Stores information about day segments:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>
                      <code>id</code>: Unique identifier (auto-incremented)
                    </li>
                    <li>
                      <code>name</code>: Segment name
                    </li>
                    <li>
                      <code>startTime</code>: Start time in minutes from midnight
                    </li>
                    <li>
                      <code>endTime</code>: End time in minutes from midnight
                    </li>
                    <li>
                      <code>color</code>: Segment color
                    </li>
                    <li>
                      <code>order</code>: Display order
                    </li>
                  </ul>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="tasks">
                <AccordionTrigger>Tasks Table</AccordionTrigger>
                <AccordionContent>
                  <p className="mb-2">Stores user tasks:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>
                      <code>id</code>: Unique identifier (auto-incremented)
                    </li>
                    <li>
                      <code>title</code>: Task title
                    </li>
                    <li>
                      <code>description</code>: Task description
                    </li>
                    <li>
                      <code>completed</code>: Completion status
                    </li>
                    <li>
                      <code>createdAt</code>: Creation timestamp
                    </li>
                    <li>
                      <code>dueDate</code>: Due date (optional)
                    </li>
                    <li>
                      <code>priority</code>: Task priority
                    </li>
                    <li>
                      <code>recurring</code>: Recurring pattern (daily, weekly, etc.)
                    </li>
                    <li>
                      <code>lastCompleted</code>: Last completion timestamp
                    </li>
                  </ul>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="checkIns">
                <AccordionTrigger>Check-Ins Table</AccordionTrigger>
                <AccordionContent>
                  <p className="mb-2">Stores user check-ins:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>
                      <code>id</code>: Unique identifier (auto-incremented)
                    </li>
                    <li>
                      <code>timestamp</code>: Check-in timestamp
                    </li>
                    <li>
                      <code>segmentId</code>: Associated segment ID
                    </li>
                    <li>
                      <code>notes</code>: User notes
                    </li>
                    <li>
                      <code>metrics</code>: Productivity metrics
                    </li>
                    <li>
                      <code>audioUrl</code>: URL to audio recording (optional)
                    </li>
                    <li>
                      <code>transcription</code>: Audio transcription (optional)
                    </li>
                    <li>
                      <code>emotionAnalysis</code>: Emotion analysis results (optional)
                    </li>
                  </ul>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="settings">
                <AccordionTrigger>Settings Table</AccordionTrigger>
                <AccordionContent>
                  <p className="mb-2">Stores user preferences:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>
                      <code>id</code>: Setting key
                    </li>
                    <li>
                      <code>value</code>: Setting value (JSON stringified)
                    </li>
                  </ul>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="taskTime">
                <AccordionTrigger>Task Time Table</AccordionTrigger>
                <AccordionContent>
                  <p className="mb-2">Stores time tracking for tasks:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>
                      <code>id</code>: Unique identifier (auto-incremented)
                    </li>
                    <li>
                      <code>taskId</code>: Associated task ID
                    </li>
                    <li>
                      <code>startTime</code>: Start timestamp
                    </li>
                    <li>
                      <code>endTime</code>: End timestamp
                    </li>
                    <li>
                      <code>duration</code>: Duration in milliseconds
                    </li>
                    <li>
                      <code>date</code>: Date of the time entry
                    </li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <h4 className="text-lg font-medium mt-4">Database Migrations</h4>
            <p>
              The application includes a migration system in <code>lib/db-migration.ts</code> to handle schema updates.
              Each version upgrade has a corresponding migration function that transforms the data as needed.
            </p>
          </TabsContent>

          <TabsContent value="components" className="space-y-4">
            <h3 className="text-xl font-semibold">Component Architecture</h3>
            <p>
              The application uses a component-based architecture with React functional components and hooks. Components
              are organized by feature and reusability.
            </p>

            <h4 className="text-lg font-medium mt-4">Core Components</h4>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="layout">
                <AccordionTrigger>Layout Components</AccordionTrigger>
                <AccordionContent>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>
                      <code>Header</code>: Main application header
                    </li>
                    <li>
                      <code>FooterMenu</code>: Navigation menu at the bottom
                    </li>
                    <li>
                      <code>ThemeProvider</code>: Manages theme state
                    </li>
                  </ul>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="segments">
                <AccordionTrigger>Segment Components</AccordionTrigger>
                <AccordionContent>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>
                      <code>SegmentSettings</code>: Manages segment configuration
                    </li>
                    <li>
                      <code>ColorPreview</code>: Color selection for segments
                    </li>
                  </ul>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="tasks">
                <AccordionTrigger>Task Components</AccordionTrigger>
                <AccordionContent>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>
                      <code>TaskBoard</code>: Displays and manages tasks
                    </li>
                    <li>
                      <code>TaskCard</code>: Individual task display
                    </li>
                    <li>
                      <code>TaskDialog</code>: Task creation/editing form
                    </li>
                  </ul>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="checkins">
                <AccordionTrigger>Check-In Components</AccordionTrigger>
                <AccordionContent>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>
                      <code>CheckInForm</code>: Form for manual check-ins
                    </li>
                    <li>
                      <code>VoiceCheckIn</code>: Audio recording check-in
                    </li>
                    <li>
                      <code>SpeechToText</code>: Transcription component
                    </li>
                  </ul>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="settings">
                <AccordionTrigger>Settings Components</AccordionTrigger>
                <AccordionContent>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>
                      <code>GeneralSettings</code>: Basic app settings
                    </li>
                    <li>
                      <code>SoundSettings</code>: Audio notification settings
                    </li>
                    <li>
                      <code>NotificationSettings</code>: Push notification settings
                    </li>
                    <li>
                      <code>EmotionSettings</code>: Emotion analysis configuration
                    </li>
                    <li>
                      <code>DataManagementSettings</code>: Data import/export
                    </li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <h4 className="text-lg font-medium mt-4">Custom Hooks</h4>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <code>useDexieStore</code>: Database access hook
              </li>
              <li>
                <code>useLocalStorage</code>: Local storage management
              </li>
              <li>
                <code>useTimeFormat</code>: Time formatting utilities
              </li>
              <li>
                <code>useNotificationSettings</code>: Notification preferences
              </li>
              <li>
                <code>useSystemTheme</code>: System theme detection
              </li>
            </ul>
          </TabsContent>

          <TabsContent value="features" className="space-y-4">
            <h3 className="text-xl font-semibold">Feature Implementation</h3>

            <h4 className="text-lg font-medium">Voice Check-Ins</h4>
            <p className="mb-4">
              Voice check-ins use the MediaRecorder API to capture audio from the user's microphone. The audio is stored
              as a Blob and can be played back, transcribed, and analyzed for emotional content.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Recording: <code>components/sound-recorder.tsx</code>
              </li>
              <li>
                Transcription: <code>components/speech-to-text.tsx</code>
              </li>
              <li>
                Emotion Analysis: <code>lib/emotion-analysis.ts</code>
              </li>
            </ul>

            <h4 className="text-lg font-medium mt-4">Task Management</h4>
            <p className="mb-4">
              Tasks can be one-time or recurring, with support for different recurrence patterns. The system
              automatically resets recurring tasks based on their schedule.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Task CRUD: <code>components/task-dialog.tsx</code>
              </li>
              <li>
                Task Display: <code>components/task-board.tsx</code>
              </li>
              <li>
                Time Tracking: <code>app/timers/page.tsx</code>
              </li>
            </ul>

            <h4 className="text-lg font-medium mt-4">Notifications</h4>
            <p className="mb-4">
              The app uses the Web Notifications API for alerts and reminders. Notifications can be scheduled for
              specific times or triggered by events.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Notification Service: <code>lib/notification-service.ts</code>
              </li>
              <li>
                Settings: <code>components/notification-settings.tsx</code>
              </li>
            </ul>

            <h4 className="text-lg font-medium mt-4">Data Export/Import</h4>
            <p className="mb-4">
              Users can export their data in JSON format for backup or analysis. The system also supports importing data
              from previous exports.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Export Utilities: <code>lib/export-utils.ts</code>
              </li>
              <li>
                Import/Export UI: <code>components/data-management-settings.tsx</code>
              </li>
            </ul>

            <h4 className="text-lg font-medium mt-4">PWA Features</h4>
            <p className="mb-4">
              The application is a Progressive Web App with offline support, installability, and background sync.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Service Worker: <code>public/sw.js</code>
              </li>
              <li>
                Manifest: <code>public/manifest.json</code>
              </li>
              <li>
                Installer: <code>components/pwa-installer.tsx</code>
              </li>
            </ul>
          </TabsContent>

          <TabsContent value="api" className="space-y-4">
            <h3 className="text-xl font-semibold">API Reference</h3>
            <p>This section documents the key functions and utilities available in the application.</p>

            <h4 className="text-lg font-medium mt-4">Database API</h4>
            <pre className="bg-muted p-4 rounded-md overflow-x-auto">
              {`// Get all segments
const segments = await db.segments.toArray()

// Add a new task
const taskId = await db.tasks.add({
  title: "Task name",
  description: "Task description",
  completed: false,
  createdAt: new Date(),
  priority: "medium",
  recurring: null
})

// Update a check-in
await db.checkIns.update(id, {
  notes: "Updated notes"
})

// Delete a task
await db.tasks.delete(taskId)

// Get tasks for today
const today = new Date()
const tasks = await db.tasks
  .where("dueDate")
  .equals(formatDateString(today))
  .toArray()`}
            </pre>

            <h4 className="text-lg font-medium mt-4">Time Utilities</h4>
            <pre className="bg-muted p-4 rounded-md overflow-x-auto">
              {`// Format minutes to HH:MM
formatMinutesToTime(540) // "09:00"

// Get current time in minutes
getCurrentTimeInMinutes() // e.g., 970 for 16:10

// Format milliseconds to MM:SS
formatMilliseconds(65000) // "01:05"

// Check if time is within segment
isTimeInSegment(segment, new Date()) // true/false`}
            </pre>

            <h4 className="text-lg font-medium mt-4">Notification API</h4>
            <pre className="bg-muted p-4 rounded-md overflow-x-auto">
              {`// Schedule a notification
scheduleNotification({
  title: "Reminder",
  body: "Time to check in",
  time: new Date(Date.now() + 3600000), // 1 hour from now
  sound: "default.mp3"
})

// Cancel all notifications
cancelAllNotifications()

// Request permission
requestNotificationPermission()`}
            </pre>

            <h4 className="text-lg font-medium mt-4">Emotion Analysis API</h4>
            <pre className="bg-muted p-4 rounded-md overflow-x-auto">
              {`// Analyze text for emotions
const result = analyzeEmotion("I'm feeling really happy today")
// Returns: { 
//   primaryEmotion: "joy", 
//   confidence: 0.85,
//   emotions: { joy: 0.85, sadness: 0.05, ... } 
// }`}
            </pre>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  )
}
