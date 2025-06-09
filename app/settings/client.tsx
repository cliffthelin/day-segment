"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { GeneralSettings } from "@/components/general-settings"
import { SegmentSettings } from "@/components/segment-settings"
import { CheckInMetricsSettings } from "@/components/check-in-metrics-settings"
import { SoundSettings } from "@/components/sound-settings"
import { NotificationSettings } from "@/components/notification-settings"
import { DataManagementSettings } from "@/components/data-management-settings"
import { EmotionSettings } from "@/components/emotion-settings"
import { TranscriptionSettings } from "@/components/transcription-settings"
import { SuggestedPrompts } from "@/components/suggested-prompts"
import { TechnicalDocumentation } from "@/components/technical-documentation"
import { HelpSection } from "@/components/help-section"
import { BackgroundImageSettings } from "@/components/background-image-settings"
import { CategorySettings } from "@/components/category-settings"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { useMobile } from "@/hooks/use-mobile"
import { SettingsSearch, type SearchableSetting } from "@/components/settings-search"
import { generateSettingsIndex } from "@/lib/settings-search-index"

// Define the settings sections and their subsections
const settingsSections = {
  general: {
    label: "General",
    subsections: {
      preferences: { label: "Preferences", component: GeneralSettings },
      appearance: { label: "Appearance", component: BackgroundImageSettings },
      categories: { label: "Categories", component: CategorySettings },
    },
  },
  segments: {
    label: "Segments",
    subsections: {
      daySegments: { label: "Day Segments", component: SegmentSettings },
      checkInMetrics: { label: "Check-in Metrics", component: CheckInMetricsSettings },
    },
  },
  notifications: {
    label: "Notifications",
    subsections: {
      settings: { label: "Settings", component: NotificationSettings },
      sounds: { label: "Sounds", component: SoundSettings },
    },
  },
  voice: {
    label: "Voice & Audio",
    subsections: {
      emotion: { label: "Emotion Analysis", component: EmotionSettings },
      transcription: { label: "Transcription", component: TranscriptionSettings },
      prompts: { label: "Suggested Prompts", component: SuggestedPrompts },
    },
  },
  data: {
    label: "Data",
    subsections: {
      management: { label: "Data Management", component: DataManagementSettings },
      technical: { label: "Technical", component: TechnicalDocumentation },
    },
  },
  help: {
    label: "Help",
    subsections: {
      documentation: { label: "Documentation", component: HelpSection },
    },
  },
}

export default function SettingsClient() {
  const searchParams = useSearchParams()
  const [activeSection, setActiveSection] = useState("general")
  const [activeSubsection, setActiveSubsection] = useState("preferences")
  const [expandedSections, setExpandedSections] = useState<string[]>([])
  const [expandedSubsections, setExpandedSubsections] = useState<{ [key: string]: string[] }>({})
  const [settingsIndex, setSettingsIndex] = useState<SearchableSetting[]>([])
  const [highlightedSetting, setHighlightedSetting] = useState<string | null>(null)
  const isMobile = useMobile()

  // Initialize settings index
  useEffect(() => {
    setSettingsIndex(generateSettingsIndex())
  }, [])

  useEffect(() => {
    // Safely access searchParams
    if (searchParams) {
      const section = searchParams.get("section")
      const subsection = searchParams.get("subsection")

      if (section && settingsSections[section]) {
        setActiveSection(section)

        // Set default subsection or use the provided one if valid
        const subsections = settingsSections[section].subsections
        const defaultSubsection = Object.keys(subsections)[0]

        if (subsection && subsections[subsection]) {
          setActiveSubsection(subsection)
        } else {
          setActiveSubsection(defaultSubsection)
        }

        // For mobile: expand the active section
        if (isMobile && !expandedSections.includes(section)) {
          setExpandedSections([...expandedSections, section])

          // Initialize expanded subsections for this section if needed
          if (!expandedSubsections[section]) {
            setExpandedSubsections({
              ...expandedSubsections,
              [section]: [subsection || defaultSubsection],
            })
          }
        }
      }
    }
  }, [searchParams, isMobile])

  // Handle section change
  const handleSectionChange = (section: string) => {
    setActiveSection(section)
    // Set default subsection when changing sections
    const defaultSubsection = Object.keys(settingsSections[section].subsections)[0]
    setActiveSubsection(defaultSubsection)
  }

  // Handle accordion value change for main sections
  const handleSectionAccordionChange = (value: string[]) => {
    setExpandedSections(value)
  }

  // Handle accordion value change for subsections
  const handleSubsectionAccordionChange = (section: string, value: string[]) => {
    setExpandedSubsections({
      ...expandedSubsections,
      [section]: value,
    })
  }

  // Handle search result selection
  const handleSearchResultSelect = (setting: SearchableSetting) => {
    // Navigate to the correct section and subsection
    setActiveSection(setting.section)
    setActiveSubsection(setting.subsection)

    // For mobile: expand the relevant accordions
    if (isMobile) {
      if (!expandedSections.includes(setting.section)) {
        setExpandedSections([...expandedSections, setting.section])
      }

      setExpandedSubsections({
        ...expandedSubsections,
        [setting.section]: [...(expandedSubsections[setting.section] || []), setting.subsection],
      })
    }

    // Highlight the selected setting
    setHighlightedSetting(setting.id)

    // Clear the highlight after a delay
    setTimeout(() => {
      setHighlightedSetting(null)
    }, 3000)
  }

  // Render mobile view with accordions
  const renderMobileView = () => {
    return (
      <div className="space-y-4">
        <Accordion
          type="multiple"
          value={expandedSections}
          onValueChange={handleSectionAccordionChange}
          className="w-full"
        >
          {Object.entries(settingsSections).map(([sectionKey, section]) => (
            <AccordionItem key={sectionKey} value={sectionKey} className="border rounded-lg mb-4">
              <AccordionTrigger className="px-4 py-3 hover:bg-muted/50 rounded-t-lg font-medium">
                {section.label}
              </AccordionTrigger>
              <AccordionContent className="px-0 pt-0">
                <Accordion
                  type="multiple"
                  value={expandedSubsections[sectionKey] || []}
                  onValueChange={(value) => handleSubsectionAccordionChange(sectionKey, value)}
                  className="w-full"
                >
                  {Object.entries(section.subsections).map(([subKey, subsection]) => {
                    const Component = subsection.component
                    return (
                      <AccordionItem
                        key={subKey}
                        value={subKey}
                        className="border-t border-b-0 border-x-0 last:border-b-0"
                      >
                        <AccordionTrigger className="px-6 py-2 hover:bg-muted/30 text-sm font-normal">
                          {subsection.label}
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-4 pt-2">
                          <Component highlightedSetting={highlightedSetting} />
                        </AccordionContent>
                      </AccordionItem>
                    )
                  })}
                </Accordion>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    )
  }

  // Render desktop view with tabs
  const renderDesktopView = () => {
    return (
      <Tabs value={activeSection} onValueChange={handleSectionChange} className="w-full">
        <TabsList className="w-full flex overflow-x-auto mb-2 justify-start">
          {Object.entries(settingsSections).map(([key, section]) => (
            <TabsTrigger key={key} value={key} className="flex-shrink-0">
              {section.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Section contents with subsection tabs */}
        {Object.entries(settingsSections).map(([sectionKey, section]) => (
          <TabsContent key={sectionKey} value={sectionKey} className="mt-0">
            {/* Subsection tabs */}
            <Tabs value={activeSubsection} onValueChange={setActiveSubsection} className="w-full">
              <TabsList className="w-full flex overflow-x-auto mb-4 justify-start">
                {Object.entries(section.subsections).map(([subKey, subsection]) => (
                  <TabsTrigger key={subKey} value={subKey} className="flex-shrink-0">
                    {subsection.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* Subsection contents */}
              {Object.entries(section.subsections).map(([subKey, subsection]) => {
                const Component = subsection.component
                return (
                  <TabsContent key={subKey} value={subKey} className="mt-0">
                    <Card className="p-6">
                      <Component highlightedSetting={highlightedSetting} />
                    </Card>
                  </TabsContent>
                )
              })}
            </Tabs>
          </TabsContent>
        ))}
      </Tabs>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Settings</h1>
        </div>

        <SettingsSearch settings={settingsIndex} onSelectSetting={handleSearchResultSelect} className="w-full" />

        <div className="space-y-6">{isMobile ? renderMobileView() : renderDesktopView()}</div>
      </div>
    </div>
  )
}
