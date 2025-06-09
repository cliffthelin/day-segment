"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Clock, CheckSquare, BarChart3, Bell, Shield } from "lucide-react"
import { db } from "@/lib/db"

export function WelcomeModal() {
  const [open, setOpen] = useState(false)
  const [dontShowAgain, setDontShowAgain] = useState(false)
  const [activeTab, setActiveTab] = useState("welcome")

  useEffect(() => {
    const checkWelcomeStatus = async () => {
      try {
        // Check if the user has seen the welcome modal
        const welcomeSetting = await db.settings.get("welcomeModalShown")

        if (!welcomeSetting || !welcomeSetting.value) {
          setOpen(true)
        }
      } catch (error) {
        console.error("Error checking welcome modal status:", error)
      }
    }

    checkWelcomeStatus()
  }, [])

  const handleClose = async () => {
    if (dontShowAgain) {
      try {
        // Save the user's preference
        await db.settings.put({ key: "welcomeModalShown", value: true })
      } catch (error) {
        console.error("Error saving welcome modal preference:", error)
      }
    }
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Welcome to Day Segment Tracker</DialogTitle>
          <DialogDescription>
            Track your day in segments, monitor your well-being, and build better habits
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid grid-cols-6 mb-4">
            <TabsTrigger value="welcome">Welcome</TabsTrigger>
            <TabsTrigger value="segments">Segments</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="privacy">Privacy</TabsTrigger>
          </TabsList>

          <TabsContent value="welcome" className="space-y-4">
            <div className="flex items-center gap-4 p-4 border rounded-md bg-muted/50">
              <div className="bg-primary/10 p-3 rounded-full">
                <Clock className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="font-medium text-lg">Track Your Day in Segments</h3>
                <p className="text-muted-foreground">
                  Divide your day into meaningful segments and track your well-being throughout each one.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 border rounded-md bg-muted/50">
              <div className="bg-primary/10 p-3 rounded-full">
                <CheckSquare className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="font-medium text-lg">Manage Tasks Effectively</h3>
                <p className="text-muted-foreground">
                  Create and track tasks with our drag-and-drop board. Monitor progress and completion.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 border rounded-md bg-muted/50">
              <div className="bg-primary/10 p-3 rounded-full">
                <BarChart3 className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="font-medium text-lg">Visualize Your Progress</h3>
                <p className="text-muted-foreground">
                  Generate reports and insights about your productivity, mood, and task completion patterns.
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="segments" className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-medium text-lg">Day Segments</h3>
              <p>
                Your day is divided into color-coded segments like "Morning Routine", "Afternoon", and "Evening". Each
                segment represents a distinct part of your day with its own focus and energy level.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
                <div className="p-3 rounded-md" style={{ backgroundColor: "#FFD166", color: "#000" }}>
                  <div className="font-bold">Morning Routine</div>
                  <div className="text-sm">7:00 - 8:00</div>
                </div>
                <div className="p-3 rounded-md" style={{ backgroundColor: "#06D6A0", color: "#000" }}>
                  <div className="font-bold">Morning</div>
                  <div className="text-sm">8:00 - 12:00</div>
                </div>
                <div className="p-3 rounded-md" style={{ backgroundColor: "#EF476F", color: "#fff" }}>
                  <div className="font-bold">Lunch Routine</div>
                  <div className="text-sm">12:00 - 13:00</div>
                </div>
                <div className="p-3 rounded-md" style={{ backgroundColor: "#118AB2", color: "#fff" }}>
                  <div className="font-bold">Afternoon</div>
                  <div className="text-sm">13:00 - 17:00</div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium text-lg">Check-ins</h3>
              <p>
                At the beginning of each segment, you'll be prompted to check in. Rate your energy, mood, focus,
                productivity, and stress levels to track how you feel throughout the day.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="tasks" className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-medium text-lg">Task Board</h3>
              <p>
                The Task Board helps you organize your tasks into three columns: To Do, Started, and Completed. Drag and
                drop tasks between columns to update their status.
              </p>
              <div className="grid grid-cols-3 gap-2 mt-4">
                <div className="p-3 rounded-md bg-muted">
                  <div className="font-bold">To Do</div>
                  <div className="text-sm text-muted-foreground">Tasks not yet started</div>
                </div>
                <div className="p-3 rounded-md bg-muted">
                  <div className="font-bold">Started</div>
                  <div className="text-sm text-muted-foreground">Tasks in progress</div>
                </div>
                <div className="p-3 rounded-md bg-muted">
                  <div className="font-bold">Completed</div>
                  <div className="text-sm text-muted-foreground">Finished tasks</div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium text-lg">Task Types</h3>
              <p>Create two types of tasks:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  <strong>Checkbox Tasks:</strong> One-time tasks that you complete once per day
                </li>
                <li>
                  <strong>Tally Tasks:</strong> Tasks that you can complete multiple times per day
                </li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium text-lg">Timers</h3>
              <p>
                Use the Timers feature to track time spent on specific tasks. Choose between a stopwatch or countdown
                timer.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-medium text-lg">Check-in Metrics</h3>
              <p>
                View charts showing how your energy, mood, focus, productivity, and stress levels change over time.
                Identify patterns and trends to optimize your day.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium text-lg">Task Completion Patterns</h3>
              <p>
                Analyze when and how often you complete tasks. See which segments of the day are most productive for
                you.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-medium text-lg">Customize Your Experience</h3>
              <p>In the Settings page, you can:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Customize your day segments and their colors</li>
                <li>Configure check-in metrics</li>
                <li>Change the app's appearance</li>
                <li>Set up notifications</li>
                <li>Backup and restore your data</li>
              </ul>
            </div>

            <div className="flex items-center gap-4 p-4 border rounded-md bg-muted/50">
              <div className="bg-primary/10 p-3 rounded-full">
                <Bell className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="font-medium text-lg">Notifications</h3>
                <p className="text-muted-foreground">
                  Enable notifications to get reminders about segment changes, check-ins, and pending tasks.
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="privacy" className="space-y-4">
            <div className="space-y-4">
              <h3 className="font-medium text-lg">Your data is stored exclusively on your device</h3>

              <div className="p-4 border rounded-md bg-blue-50 dark:bg-blue-950 text-blue-800 dark:text-blue-200">
                <p className="mb-3">
                  This app uses IndexedDB, a browser-based database that keeps all your information locally on your
                  device. No data is ever sent to any external servers.
                </p>

                <div className="p-3 bg-yellow-50 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-md">
                  <p className="font-medium">Browser storage limitations:</p>
                  <p>
                    Browser storage can be cleared if you clear your browser data or use private/incognito mode. We
                    recommend regularly exporting your data as a backup.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 border rounded-md bg-muted/50">
                <div className="bg-primary/10 p-3 rounded-full">
                  <Shield className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-lg">Complete Privacy</h3>
                  <p className="text-muted-foreground">
                    Your data never leaves your device. You have complete control over your information.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 mt-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="dont-show"
              checked={dontShowAgain}
              onCheckedChange={(checked) => setDontShowAgain(!!checked)}
            />
            <Label htmlFor="dont-show">Don't show this again</Label>
          </div>
          <Button onClick={handleClose}>Get Started</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
