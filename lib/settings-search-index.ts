export interface SearchableSetting {
  id: string
  label: string
  section: string
  sectionLabel: string
  subsection: string
  subsectionLabel: string
  description?: string
  keywords?: string[]
}

export function generateSettingsIndex(): SearchableSetting[] {
  return [
    // General > Preferences
    {
      id: "theme-selector",
      label: "Theme",
      section: "general",
      sectionLabel: "General",
      subsection: "preferences",
      subsectionLabel: "Preferences",
      description: "Choose between light, dark, or system theme",
      keywords: ["theme", "dark mode", "light mode", "appearance", "color scheme"],
    },
    {
      id: "time-format",
      label: "Time Format",
      section: "general",
      sectionLabel: "General",
      subsection: "preferences",
      subsectionLabel: "Preferences",
      description: "Choose between 12-hour and 24-hour time format",
      keywords: ["time", "clock", "12-hour", "24-hour", "am/pm"],
    },
    {
      id: "haptic-feedback",
      label: "Haptic Feedback",
      section: "general",
      sectionLabel: "General",
      subsection: "preferences",
      subsectionLabel: "Preferences",
      description: "Enable or disable vibration feedback",
      keywords: ["vibration", "haptic", "feedback", "touch"],
    },

    // Many more settings would be defined here...

    // Data > Management
    {
      id: "settings-export-import",
      label: "Settings Backup",
      section: "data",
      sectionLabel: "Data",
      subsection: "management",
      subsectionLabel: "Data Management",
      description: "Export or import your settings",
      keywords: ["backup", "restore", "export", "import", "settings", "transfer"],
    },
    {
      id: "export-all-data",
      label: "Export All Data",
      section: "data",
      sectionLabel: "Data",
      subsection: "management",
      subsectionLabel: "Data Management",
      description: "Download all your data as a JSON file",
      keywords: ["backup", "export", "download", "data"],
    },
    {
      id: "import-all-data",
      label: "Import All Data",
      section: "data",
      sectionLabel: "Data",
      subsection: "management",
      subsectionLabel: "Data Management",
      description: "Restore your data from a previously exported file",
      keywords: ["restore", "import", "upload", "data"],
    },
    {
      id: "task-export",
      label: "Export Tasks",
      section: "data",
      sectionLabel: "Data",
      subsection: "management",
      subsectionLabel: "Data Management",
      description: "Export your tasks in various formats",
      keywords: ["export", "tasks", "backup"],
    },
    {
      id: "task-import",
      label: "Import Tasks",
      section: "data",
      sectionLabel: "Data",
      subsection: "management",
      subsectionLabel: "Data Management",
      description: "Import tasks from a file",
      keywords: ["import", "tasks", "restore"],
    },
    {
      id: "clear-all-data",
      label: "Clear All Data",
      section: "data",
      sectionLabel: "Data",
      subsection: "management",
      subsectionLabel: "Data Management",
      description: "Permanently delete all your data",
      keywords: ["delete", "clear", "reset", "remove", "data"],
    },
    {
      id: "reset-database",
      label: "Reset Database",
      section: "data",
      sectionLabel: "Data",
      subsection: "management",
      subsectionLabel: "Data Management",
      description: "Reset the database structure",
      keywords: ["reset", "database", "structure", "fix"],
    },
  ]
}
