"use client"

import { Button } from "@/components/ui/button"
import { HelpCircle } from "lucide-react"
import { db } from "@/lib/db"
import { useToast } from "@/components/ui/use-toast"

export function ShowWelcomeButton() {
  const { toast } = useToast()

  const handleShowWelcome = async () => {
    try {
      // Reset the welcome modal flag
      await db.settings.put({ key: "welcomeModalShown", value: false })

      // Reload the page to show the welcome modal
      window.location.href = "/dashboard"

      toast({
        title: "Welcome guide activated",
        description: "Redirecting to dashboard to show the welcome guide.",
      })
    } catch (error) {
      console.error("Error showing welcome modal:", error)
      toast({
        title: "Error",
        description: "There was an error showing the welcome guide. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <Button onClick={handleShowWelcome} variant="outline" className="flex items-center gap-2">
      <HelpCircle className="h-4 w-4" />
      Show Welcome Guide
    </Button>
  )
}
