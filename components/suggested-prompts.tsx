"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { db } from "@/lib/db"
import { useToast } from "@/components/ui/use-toast"
import { CheckCircle, RefreshCw, Lightbulb, Sparkles } from "lucide-react"
import { addNewSuggestedPrompt } from "@/lib/prompt-utils"

// Define the SuggestedPrompt interface
interface SuggestedPrompt {
  id?: number
  text: string
  category: string
  isCompleted: boolean
  dateAdded: string
}

// Categories and their colors
const categories = {
  Tasks: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  "Check-ins": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  Voice: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  Segments: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  Data: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  General: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
}

export function SuggestedPrompts() {
  const [activePrompts, setActivePrompts] = useState<SuggestedPrompt[]>([])
  const [completedPrompts, setCompletedPrompts] = useState<SuggestedPrompt[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("active")
  const { toast } = useToast()

  // Load prompts from database
  useEffect(() => {
    const loadPrompts = async () => {
      try {
        setIsLoading(true)

        // Check if the suggestedPrompts table exists
        if (!db.tables.some((table) => table.name === "suggestedPrompts")) {
          console.log("suggestedPrompts table not available yet")
          setTimeout(loadPrompts, 1000) // Try again in 1 second
          return
        }

        // Get all prompts and filter in memory
        const allPrompts = await db.table("suggestedPrompts").toArray()

        // Filter active and completed prompts
        const active = allPrompts.filter((p) => p.isCompleted === false)

        // Sort completed prompts by date (newest first)
        const completed = allPrompts
          .filter((p) => p.isCompleted === true)
          .sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime())

        setActivePrompts(active)
        setCompletedPrompts(completed)

        // If no active prompts, generate some
        if (active.length === 0) {
          await generateNewPrompts()
        }
      } catch (error) {
        console.error("Error loading prompts:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadPrompts()
  }, [])

  // Mark a prompt as completed
  const markAsCompleted = async (promptId: number) => {
    try {
      // Find the prompt
      const prompt = activePrompts.find((p) => p.id === promptId)
      if (!prompt) return

      // Update in database
      await db.table("suggestedPrompts").update(promptId, {
        isCompleted: true,
      })

      // Update state
      setActivePrompts((prev) => prev.filter((p) => p.id !== promptId))
      setCompletedPrompts((prev) => [{ ...prompt, isCompleted: true }, ...prev])

      // Generate a new prompt to replace it
      await addNewSuggestedPrompt()

      // Reload active prompts
      const newActivePrompts = await db.table("suggestedPrompts").toArray()
      setActivePrompts(newActivePrompts.filter((p) => !p.isCompleted))

      toast({
        title: "Prompt completed",
        description: "Great job! A new suggestion has been added.",
      })
    } catch (error) {
      console.error("Error marking prompt as completed:", error)
      toast({
        title: "Error",
        description: "There was a problem marking the prompt as completed.",
        variant: "destructive",
      })
    }
  }

  // Generate new prompts (refresh all)
  const generateNewPrompts = async () => {
    try {
      setIsLoading(true)

      // Clear active prompts
      const activeIds = activePrompts.map((p) => p.id).filter(Boolean) as number[]

      // Mark all as completed
      for (const id of activeIds) {
        await db.table("suggestedPrompts").update(id, { isCompleted: true })
      }

      // Move to completed
      const nowCompleted = activePrompts.map((p) => ({ ...p, isCompleted: true }))
      setCompletedPrompts((prev) => [...nowCompleted, ...prev])

      // Clear active prompts
      setActivePrompts([])

      // Generate 5 new prompts
      for (let i = 0; i < 5; i++) {
        await addNewSuggestedPrompt()
      }

      // Load the new prompts - filter in memory instead of using where clause
      const newPrompts = await db.table("suggestedPrompts").toArray()
      setActivePrompts(newPrompts.filter((p) => !p.isCompleted))

      toast({
        title: "Suggestions refreshed",
        description: "New suggestions have been generated for you.",
      })
    } catch (error) {
      console.error("Error generating new prompts:", error)
      toast({
        title: "Error refreshing suggestions",
        description: "There was a problem generating new suggestions.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Get category badge
  const getCategoryBadge = (category: string) => {
    const className =
      categories[category as keyof typeof categories] || "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"

    return (
      <Badge className={className} variant="outline">
        {category}
      </Badge>
    )
  }

  return (
    <div className="space-y-6 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold">Suggested Actions</h3>
          <p className="text-muted-foreground">
            Discover new ways to use the app and get the most out of your tracking
          </p>
        </div>
        <Button onClick={generateNewPrompts} disabled={isLoading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh Suggestions
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="active">
            Active Suggestions
            {activePrompts.length > 0 && <Badge className="ml-2">{activePrompts.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed
            {completedPrompts.length > 0 && <Badge className="ml-2">{completedPrompts.length}</Badge>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : activePrompts.length === 0 ? (
            <Card>
              <CardContent className="pt-6 flex flex-col items-center justify-center text-center">
                <Lightbulb className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Active Suggestions</h3>
                <p className="text-muted-foreground max-w-md mb-4">
                  You've completed all the current suggestions. Click the refresh button to generate new ones.
                </p>
                <Button onClick={generateNewPrompts}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Generate New Suggestions
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {activePrompts.map((prompt) => (
                <Card key={prompt.id || prompt.text}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-primary" />
                          {getCategoryBadge(prompt.category)}
                        </div>
                        <p>{prompt.text}</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => prompt.id && markAsCompleted(prompt.id)}>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Mark Done
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed">
          {completedPrompts.length === 0 ? (
            <Card>
              <CardContent className="pt-6 flex flex-col items-center justify-center text-center">
                <CheckCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Completed Suggestions</h3>
                <p className="text-muted-foreground max-w-md">As you complete suggestions, they will appear here.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {completedPrompts.slice(0, 10).map((prompt) => (
                <Card key={prompt.id || prompt.text} className="bg-muted/50">
                  <CardContent className="pt-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-primary" />
                        {getCategoryBadge(prompt.category)}
                      </div>
                      <p className="text-muted-foreground">{prompt.text}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          {completedPrompts.length > 10 && (
            <div className="text-center mt-4 text-sm text-muted-foreground">
              Showing 10 of {completedPrompts.length} completed suggestions
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
