"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import { useCheckInMetrics } from "@/hooks/use-dexie-store"
import { ScrollArea } from "@/components/ui/scroll-area"

export function CheckInMetricsSettings() {
  const [metrics, setMetrics, isLoading] = useCheckInMetrics()
  const [editedMetrics, setEditedMetrics] = useState<any[]>([])
  const { toast } = useToast()

  useEffect(() => {
    if (metrics && !isLoading) {
      setEditedMetrics([...metrics])
    }
  }, [metrics, isLoading])

  const handleNameChange = (index: number, name: string) => {
    const newMetrics = [...editedMetrics]
    newMetrics[index].name = name
    setEditedMetrics(newMetrics)
  }

  const handleDescriptionChange = (index: number, description: string) => {
    const newMetrics = [...editedMetrics]
    newMetrics[index].description = description
    setEditedMetrics(newMetrics)
  }

  const handleEnabledChange = (index: number, enabled: boolean) => {
    const newMetrics = [...editedMetrics]
    newMetrics[index].enabled = enabled
    setEditedMetrics(newMetrics)
  }

  const handleSave = async () => {
    try {
      await setMetrics(editedMetrics)
      toast({
        title: "Metrics updated",
        description: "Your check-in metrics have been updated successfully.",
      })
    } catch (error) {
      console.error("Error saving metrics:", error)
      toast({
        title: "Update failed",
        description: "There was an error updating your metrics.",
        variant: "destructive",
      })
    }
  }

  const handleAddMetric = () => {
    const newMetric = {
      id: Date.now().toString(),
      name: "New Metric",
      description: "Description for the new metric",
      enabled: true,
      type: "scale",
      min: 1,
      max: 10,
    }
    setEditedMetrics([...editedMetrics, newMetric])
  }

  const handleRemoveMetric = (index: number) => {
    const newMetrics = [...editedMetrics]
    newMetrics.splice(index, 1)
    setEditedMetrics(newMetrics)
  }

  if (isLoading) {
    return <div className="py-6">Loading metrics...</div>
  }

  if (!metrics || metrics.length === 0) {
    return <div className="py-6">No metrics found.</div>
  }

  return (
    <div className="space-y-6 py-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Check-In Metrics</h3>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleAddMetric}>
            Add New Metric
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-6">
              {editedMetrics.map((metric, index) => (
                <div key={metric.id} className="space-y-4 pb-4 border-b">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Metric #{index + 1}</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => handleRemoveMetric(index)}
                    >
                      Remove
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`metric-name-${index}`}>Metric Name</Label>
                      <Input
                        id={`metric-name-${index}`}
                        value={metric.name}
                        onChange={(e) => handleNameChange(index, e.target.value)}
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id={`metric-enabled-${index}`}
                        checked={metric.enabled}
                        onCheckedChange={(checked) => handleEnabledChange(index, checked)}
                      />
                      <Label htmlFor={`metric-enabled-${index}`}>Enabled</Label>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor={`metric-description-${index}`}>Description</Label>
                    <Input
                      id={`metric-description-${index}`}
                      value={metric.description}
                      onChange={(e) => handleDescriptionChange(index, e.target.value)}
                    />
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
