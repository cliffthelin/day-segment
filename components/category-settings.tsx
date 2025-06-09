"use client"

import { CategoryManager } from "@/components/category-manager"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tag } from "lucide-react"

export function CategorySettings() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Tag className="mr-2 h-5 w-5" />
          Task Categories
        </CardTitle>
        <CardDescription>
          Create and manage categories to organize your tasks. Categories help you group related tasks and filter your
          task list.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <CategoryManager />
      </CardContent>
    </Card>
  )
}
