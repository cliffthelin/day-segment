"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp } from "lucide-react"

interface TaskDescriptionProps {
  description: string
}

export function TaskDescription({ description }: TaskDescriptionProps) {
  const [expanded, setExpanded] = useState(false)

  if (!description) return null

  // Function to convert markdown-like syntax to HTML
  const formatDescription = (text: string) => {
    // Replace markdown headings
    let formattedText = text.replace(/^## (.*$)/gm, '<h3 class="text-lg font-bold mt-3 mb-1">$1</h3>')
    formattedText = formattedText.replace(/^# (.*$)/gm, '<h2 class="text-xl font-bold mt-4 mb-2">$1</h2>')

    // Replace bullet points
    formattedText = formattedText.replace(/^• (.*$)/gm, '<li class="ml-4">$1</li>')
    formattedText = formattedText.replace(/^- (.*$)/gm, '<li class="ml-4">$1</li>')

    // Replace newlines with <br> tags
    formattedText = formattedText.replace(/\n/g, "<br>")

    // Wrap lists in <ul> tags (simplified approach)
    formattedText = formattedText.replace(/<li class="ml-4">/g, '</ul><ul class="list-disc my-2"><li class="ml-4">')
    formattedText = formattedText.replace("</ul>", "") // Remove the first closing tag
    formattedText = formattedText + "</ul>" // Add closing tag at the end

    return formattedText
  }

  // Determine if we should show the full description or a preview
  const isLongDescription = description.length > 150
  const displayText = !expanded && isLongDescription ? description.substring(0, 150) + "..." : description

  return (
    <Card className="mt-4">
      <CardContent className="pt-4">
        {isLongDescription && (
          <div className="flex justify-end mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="text-xs flex items-center"
            >
              {expanded ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-1" />
                  Show Less
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-1" />
                  Show More
                </>
              )}
            </Button>
          </div>
        )}

        <div
          className="prose prose-sm dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: formatDescription(displayText) }}
        />
      </CardContent>
    </Card>
  )
}
