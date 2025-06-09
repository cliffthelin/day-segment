"use client"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { formatTimerTime } from "@/lib/time-utils"

interface ContinueSessionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  previousSession: {
    id: string
    taskName: string
    date: string
    completionValue: number
    duration: number
  } | null
  onContinue: () => void
  onStartFresh: () => void
}

export function ContinueSessionDialog({
  open,
  onOpenChange,
  previousSession,
  onContinue,
  onStartFresh,
}: ContinueSessionDialogProps) {
  if (!previousSession) return null

  const formattedDate = new Date(previousSession.date).toLocaleDateString()
  const completionPercent = Math.round(previousSession.completionValue * 100)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Continue Previous Session?</DialogTitle>
          <DialogDescription>You have a previous incomplete session for this task.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-2">
            <div className="text-sm font-medium">Task:</div>
            <div>{previousSession.taskName}</div>
            <div className="text-sm font-medium">Date:</div>
            <div>{formattedDate}</div>
            <div className="text-sm font-medium">Previous progress:</div>
            <div>{completionPercent}% complete</div>
            <div className="text-sm font-medium">Time spent:</div>
            <div>{formatTimerTime(previousSession.duration)}</div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onStartFresh}>
            Start Fresh
          </Button>
          <Button onClick={onContinue}>Continue Previous</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
