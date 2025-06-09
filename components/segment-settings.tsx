"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { useSegments } from "@/hooks/use-dexie-store"
import type { Segment } from "@/lib/db"
import { db } from "@/lib/db"
import { resetSegmentsToDefault } from "@/lib/reset-segments"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { realignTasksToSegments } from "@/lib/segment-utils"

// Color palette organized by categories
const colorPalette = {
  essentials: [
    { name: "Gray", value: "#6B7280" },
    { name: "Slate", value: "#64748B" },
    { name: "Stone", value: "#78716C" },
    { name: "Neutral", value: "#737373" },
  ],
  warm: [
    { name: "Red", value: "#EF4444" },
    { name: "Orange", value: "#F97316" },
    { name: "Amber", value: "#F59E0B" },
    { name: "Yellow", value: "#EAB308" },
  ],
  cool: [
    { name: "Lime", value: "#84CC16" },
    { name: "Green", value: "#22C55E" },
    { name: "Emerald", value: "#10B981" },
    { name: "Teal", value: "#14B8A6" },
  ],
  vibrant: [
    { name: "Cyan", value: "#06B6D4" },
    { name: "Sky", value: "#0EA5E9" },
    { name: "Blue", value: "#3B82F6" },
    { name: "Indigo", value: "#6366F1" },
    { name: "Violet", value: "#8B5CF6" },
    { name: "Purple", value: "#A855F7" },
    { name: "Fuchsia", value: "#D946EF" },
    { name: "Pink", value: "#EC4899" },
    { name: "Rose", value: "#F43F5E" },
  ],
}

// Flatten all colors for easy access
const allColors = Object.values(colorPalette).flat()

export function SegmentSettings() {
  const [segments, setSegments, isLoading] = useSegments()
  const [editedSegments, setEditedSegments] = useState<Segment[]>([])
  const [activeTab, setActiveTab] = useState("essentials")
  const { toast } = useToast()

  useEffect(() => {
    if (segments && !isLoading) {
      setEditedSegments([...segments])
    }
  }, [segments, isLoading])

  const handleNameChange = (index: number, name: string) => {
    const newSegments = [...editedSegments]
    newSegments[index].name = name
    setEditedSegments(newSegments)
  }

  const handleStartTimeChange = (index: number, startTime: string) => {
    const newSegments = [...editedSegments]
    newSegments[index].startTime = startTime
    setEditedSegments(newSegments)
  }

  const handleColorChange = (index: number, color: string) => {
    const newSegments = [...editedSegments]
    newSegments[index].color = color
    setEditedSegments(newSegments)
  }

  const handleSave = async () => {
    try {
      await setSegments(editedSegments)
      toast({
        title: "Segments updated",
        description: "Your day segments have been updated successfully.",
      })

      await realignTasksToSegments(db, editedSegments)
    } catch (error) {
      console.error("Error saving segments:", error)
      toast({
        title: "Update failed",
        description: "There was an error updating your segments.",
        variant: "destructive",
      })
    }
  }

  const handleReset = async () => {
    try {
      const defaultSegments = await resetSegmentsToDefault()
      setEditedSegments([...defaultSegments])
      toast({
        title: "Segments reset",
        description: "Your day segments have been reset to default.",
      })
    } catch (error) {
      console.error("Error resetting segments:", error)
      toast({
        title: "Reset failed",
        description: "There was an error resetting your segments.",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return <div className="py-6">Loading segments...</div>
  }

  if (!segments || segments.length === 0) {
    return <div className="py-6">No segments found. Try resetting to defaults.</div>
  }

  return (
    <div className="space-y-6 py-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Day Segments</h3>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleReset}>
            Reset to Default
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-6">
              {editedSegments.map((segment, index) => (
                <div key={segment.id} className="space-y-4 pb-4 border-b">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`segment-name-${index}`}>Segment Name</Label>
                      <Input
                        id={`segment-name-${index}`}
                        value={segment.name}
                        onChange={(e) => handleNameChange(index, e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`segment-time-${index}`}>Start Time</Label>
                      <Input
                        id={`segment-time-${index}`}
                        type="time"
                        value={segment.startTime}
                        onChange={(e) => handleStartTimeChange(index, e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Segment Color</Label>
                    <Tabs defaultValue="essentials" value={activeTab} onValueChange={setActiveTab}>
                      <TabsList className="grid grid-cols-4 mb-4">
                        <TabsTrigger value="essentials">Essentials</TabsTrigger>
                        <TabsTrigger value="warm">Warm</TabsTrigger>
                        <TabsTrigger value="cool">Cool</TabsTrigger>
                        <TabsTrigger value="vibrant">Vibrant</TabsTrigger>
                      </TabsList>

                      {Object.entries(colorPalette).map(([category, colors]) => (
                        <TabsContent key={category} value={category} className="mt-0">
                          <div className="grid grid-cols-4 gap-2">
                            {colors.map((color) => (
                              <div
                                key={color.value}
                                className={`h-8 rounded-md cursor-pointer border-2 ${
                                  segment.color === color.value ? "border-primary" : "border-transparent"
                                }`}
                                style={{ backgroundColor: color.value }}
                                onClick={() => handleColorChange(index, color.value)}
                                title={color.name}
                              />
                            ))}
                          </div>
                        </TabsContent>
                      ))}
                    </Tabs>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full border" style={{ backgroundColor: segment.color }}></div>
                      <span className="text-sm">
                        {allColors.find((c) => c.value === segment.color)?.name || "Custom"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
