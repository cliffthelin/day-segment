"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { improveTranscription } from "@/lib/transcription-utils"

export function TranscriptionDemo() {
  const [rawText, setRawText] = useState("")
  const [processedText, setProcessedText] = useState("")
  const [options, setOptions] = useState({
    fixCapitalization: true,
    fixPunctuation: true,
    replaceCommonWords: true,
    removeFillerWords: false,
    smartFormatting: true,
  })

  const handleProcess = () => {
    const improved = improveTranscription(rawText, options)
    setProcessedText(improved)
  }

  const handleOptionChange = (option: keyof typeof options) => {
    setOptions((prev) => ({
      ...prev,
      [option]: !prev[option],
    }))
  }

  const exampleTexts = [
    "i'm gonna go to the store and get some stuff cause i need it for tonight",
    "um so basically i was thinking that maybe we could like try to implement that new feature you know the one we talked about yesterday",
    "the meeting is scheduled for january 15 at 2 30 pm and we need to discuss the twenty five percent increase in sales",
    "i dunno if we should go with option a or option b theyre both kinda good",
  ]

  const loadExample = (index: number) => {
    setRawText(exampleTexts[index])
    setProcessedText("")
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Transcription Improvement Demo</CardTitle>
        <CardDescription>See how our post-processing improves transcription accuracy</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="raw-text">Raw Transcription</Label>
          <Textarea
            id="raw-text"
            placeholder="Enter or paste raw transcription text here..."
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            className="min-h-[100px]"
          />
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => loadExample(0)}>
              Example 1
            </Button>
            <Button variant="outline" size="sm" onClick={() => loadExample(1)}>
              Example 2
            </Button>
            <Button variant="outline" size="sm" onClick={() => loadExample(2)}>
              Example 3
            </Button>
            <Button variant="outline" size="sm" onClick={() => loadExample(3)}>
              Example 4
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Switch
                id="fix-capitalization"
                checked={options.fixCapitalization}
                onCheckedChange={() => handleOptionChange("fixCapitalization")}
              />
              <Label htmlFor="fix-capitalization">Fix capitalization</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="fix-punctuation"
                checked={options.fixPunctuation}
                onCheckedChange={() => handleOptionChange("fixPunctuation")}
              />
              <Label htmlFor="fix-punctuation">Fix punctuation</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="replace-common-words"
                checked={options.replaceCommonWords}
                onCheckedChange={() => handleOptionChange("replaceCommonWords")}
              />
              <Label htmlFor="replace-common-words">Replace common words</Label>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Switch
                id="remove-filler-words"
                checked={options.removeFillerWords}
                onCheckedChange={() => handleOptionChange("removeFillerWords")}
              />
              <Label htmlFor="remove-filler-words">Remove filler words</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="smart-formatting"
                checked={options.smartFormatting}
                onCheckedChange={() => handleOptionChange("smartFormatting")}
              />
              <Label htmlFor="smart-formatting">Smart formatting</Label>
            </div>
          </div>
        </div>

        <Button onClick={handleProcess} className="w-full">
          Process Transcription
        </Button>

        {processedText && (
          <div className="space-y-2">
            <Label htmlFor="processed-text">Improved Transcription</Label>
            <Textarea id="processed-text" value={processedText} readOnly className="min-h-[100px] bg-muted/50" />
          </div>
        )}
      </CardContent>
      <CardFooter className="text-sm text-muted-foreground">
        The transcription improvement system applies various techniques to enhance the accuracy and readability of
        speech-to-text output.
      </CardFooter>
    </Card>
  )
}
