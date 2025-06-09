"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { TaskImport } from "./task-import"
import { useState } from "react"

export function TaskImportDialog() {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Import Tasks</DialogTitle>
          <DialogDescription>
            Import tasks from JSON or CSV files. You can also paste content directly.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <TaskImport />
        </div>
      </DialogContent>
    </Dialog>
  )
}
