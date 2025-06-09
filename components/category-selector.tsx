"use client"

import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useCategories } from "@/hooks/use-dexie-store"

interface CategorySelectorProps {
  selectedCategories: number[]
  onChange: (categoryIds: number[]) => void
}

export function CategorySelector({ selectedCategories, onChange }: CategorySelectorProps) {
  const { categories, isLoading } = useCategories()

  const handleCategoryChange = (categoryId: number) => {
    if (selectedCategories.includes(categoryId)) {
      onChange(selectedCategories.filter((id) => id !== categoryId))
    } else {
      onChange([...selectedCategories, categoryId])
    }
  }

  if (isLoading) {
    return <div>Loading categories...</div>
  }

  return (
    <ScrollArea className="h-[200px] w-full rounded-md border">
      <div className="p-4 space-y-2">
        {categories?.map((category) => (
          <div key={category.id} className="flex items-center space-x-2">
            <Checkbox
              id={`category-${category.id}`}
              checked={selectedCategories.includes(category.id)}
              onCheckedChange={() => handleCategoryChange(category.id)}
            />
            <Label htmlFor={`category-${category.id}`} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }}></div>
              <span className="capitalize">{category.name}</span>
            </Label>
          </div>
        ))}
        {categories?.length === 0 && (
          <div className="text-center text-muted-foreground py-4">No categories available</div>
        )}
      </div>
    </ScrollArea>
  )
}
