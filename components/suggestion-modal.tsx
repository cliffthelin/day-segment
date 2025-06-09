"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Camera, MessageSquare, Bug, AlertTriangle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface SuggestionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SuggestionModal({ open, onOpenChange }: SuggestionModalProps) {
  const [activeTab, setActiveTab] = useState("screenshot")
  const [description, setDescription] = useState("")
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async () => {
    setIsSubmitting(true)

    // Simulate submission delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // In a real implementation, you would send the data to your backend
    // For now, we'll just show a success toast
    toast({
      title: "Feedback submitted",
      description: "Thank you for your feedback! We'll review it soon.",
    })

    // Reset form and close modal
    setDescription("")
    setIsSubmitting(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Make a Suggestion</DialogTitle>
          <DialogDescription>
            Help us improve the app by sharing your feedback, suggestions, or reporting issues.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="screenshot" className="flex flex-col items-center py-2 px-1">
              <Camera className="h-4 w-4 mb-1" />
              <span className="text-xs">Screenshot</span>
            </TabsTrigger>
            <TabsTrigger value="feedback" className="flex flex-col items-center py-2 px-1">
              <MessageSquare className="h-4 w-4 mb-1" />
              <span className="text-xs">Feedback</span>
            </TabsTrigger>
            <TabsTrigger value="bug" className="flex flex-col items-center py-2 px-1">
              <Bug className="h-4 w-4 mb-1" />
              <span className="text-xs">Bug</span>
            </TabsTrigger>
            <TabsTrigger value="error" className="flex flex-col items-center py-2 px-1">
              <AlertTriangle className="h-4 w-4 mb-1" />
              <span className="text-xs">Error</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="screenshot" className="space-y-4 mt-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium">I'm on the page and want to share a screenshot and description</h3>
              <div className="bg-muted p-4 rounded-md flex flex-col items-center justify-center border border-dashed border-muted-foreground/50 h-32">
                <Camera className="h-8 w-8 text-muted-foreground mb-2" />
                <Button variant="outline" size="sm">
                  Take Screenshot
                </Button>
                <p className="text-xs text-muted-foreground mt-2">(This would capture your current screen)</p>
              </div>
              <Textarea
                placeholder="Describe what you're suggesting or what could be improved..."
                className="min-h-[100px]"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </TabsContent>

          <TabsContent value="feedback" className="space-y-4 mt-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Share general feedback</h3>
              <Textarea
                placeholder="What's on your mind? Share your thoughts, ideas, or suggestions..."
                className="min-h-[150px]"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </TabsContent>

          <TabsContent value="bug" className="space-y-4 mt-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Report a bug with a screenshot</h3>
              <div className="bg-muted p-4 rounded-md flex flex-col items-center justify-center border border-dashed border-muted-foreground/50 h-32">
                <Camera className="h-8 w-8 text-muted-foreground mb-2" />
                <Button variant="outline" size="sm">
                  Take Screenshot
                </Button>
                <p className="text-xs text-muted-foreground mt-2">(This would capture your current screen)</p>
              </div>
              <Textarea
                placeholder="Describe the bug. What happened? What did you expect to happen?"
                className="min-h-[100px]"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </TabsContent>

          <TabsContent value="error" className="space-y-4 mt-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Report an error that you can't show</h3>
              <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-md text-sm">
                <p className="text-red-800 dark:text-red-300">
                  Please provide as much detail as possible about what happened and the steps to reproduce the error.
                </p>
              </div>
              <Textarea
                placeholder="Describe what happened, what you were doing, and any error messages you saw..."
                className="min-h-[150px]"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </TabsContent>
        </Tabs>

        <div className="space-y-2 mt-2">
          <Label htmlFor="email" className="text-sm">
            Your email (optional)
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="your.email@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">If you'd like us to follow up with you about this feedback</p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !description.trim()}>
            {isSubmitting ? "Submitting..." : "Submit Feedback"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
