"use client"
import { TemplateManagement } from "@/components/template-management"
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card"
import { TemplateImportDialog } from "@/components/template-import-dialog"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useState } from "react"

export default function TemplatesPage() {
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Task Templates</h1>
            <div className="flex gap-2">
              <TemplateImportDialog />
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Template
              </Button>
            </div>
          </div>
          <CardDescription>Create and manage reusable templates for common tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <TemplateManagement />
        </CardContent>
      </Card>
    </div>
  )
}
