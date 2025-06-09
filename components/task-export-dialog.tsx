"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { TaskExport } from "./task-export"
import { useState } from "react"

export function TaskExportDialog() {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Export Tasks</DialogTitle>
          <DialogDescription>Export your tasks in various formats for backup or analysis.</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <TaskExport />
        </div>
      </DialogContent>
    </Dialog>
  )
}
