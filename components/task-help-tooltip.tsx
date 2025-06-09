"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { HelpCircle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog"

export function TaskHelpTooltip() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button variant="ghost" size="icon" onClick={() => setOpen(true)}>
        <HelpCircle className="h-5 w-5" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>How to Edit Tasks</DialogTitle>
            <DialogDescription>Here's how to edit and manage your tasks</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <h3 className="font-medium">Quick Edit Task Name</h3>
              <p className="text-sm text-muted-foreground">
                Click the pencil icon next to any task name to quickly edit it.
              </p>
              <div className="border rounded-md p-3 flex items-center gap-2 bg-muted/50">
                <span>Task Name</span>
                <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full">
                  <span className="sr-only">Edit</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-pencil"
                  >
                    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                    <path d="m15 5 4 4" />
                  </svg>
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium">Edit Task Details</h3>
              <p className="text-sm text-muted-foreground">
                Click the "Edit" button to open the full task editor dialog.
              </p>
              <div className="border rounded-md p-3 flex items-center gap-2 bg-muted/50">
                <Button variant="outline" size="sm" className="flex items-center gap-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-edit"
                  >
                    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                    <path d="m15 5 4 4" />
                  </svg>
                  <span>Edit</span>
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium">More Options</h3>
              <p className="text-sm text-muted-foreground">
                Click the three dots menu for additional options like delete.
              </p>
              <div className="border rounded-md p-3 flex items-center gap-2 bg-muted/50">
                <Button variant="ghost" size="icon">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-more-horizontal"
                  >
                    <circle cx="12" cy="12" r="1" />
                    <circle cx="19" cy="12" r="1" />
                    <circle cx="5" cy="12" r="1" />
                  </svg>
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium">Keyboard Shortcuts</h3>
              <p className="text-sm text-muted-foreground">
                When editing a task name, press Enter to save or Escape to cancel.
              </p>
            </div>
          </div>

          <DialogClose asChild>
            <Button type="button">Got it</Button>
          </DialogClose>
        </DialogContent>
      </Dialog>
    </>
  )
}
