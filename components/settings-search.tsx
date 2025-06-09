"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, X } from "lucide-react"
import { cn } from "@/lib/utils"

// Define the structure for searchable settings
export interface SearchableSetting {
  id: string
  label: string
  keywords: string[]
  section: string
  sectionLabel: string
  subsection: string
  subsectionLabel: string
  description?: string
}

interface SettingsSearchProps {
  settings: SearchableSetting[]
  onSelectSetting: (setting: SearchableSetting) => void
  className?: string
}

export function SettingsSearch({ settings, onSelectSetting, className }: SettingsSearchProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<SearchableSetting[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Handle search query changes with debounce
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    const timer = setTimeout(() => {
      const query = searchQuery.toLowerCase().trim()

      const results = settings.filter((setting) => {
        // Check if query matches setting label
        if (setting.label.toLowerCase().includes(query)) return true

        // Check if query matches section or subsection
        if (setting.sectionLabel.toLowerCase().includes(query)) return true
        if (setting.subsectionLabel.toLowerCase().includes(query)) return true

        // Check if query matches description
        if (setting.description?.toLowerCase().includes(query)) return true

        // Check if query matches any keywords
        return setting.keywords.some((keyword) => keyword.toLowerCase().includes(query))
      })

      setSearchResults(results)
      setIsSearching(false)
    }, 300)

    setIsSearching(true)
    return () => clearTimeout(timer)
  }, [searchQuery, settings])

  // Handle click outside to close search results
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsFocused(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsFocused(false)
    }
  }

  const clearSearch = () => {
    setSearchQuery("")
    inputRef.current?.focus()
  }

  return (
    <div className={cn("relative", className)} ref={searchRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          placeholder="Search settings..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onKeyDown={handleKeyDown}
          className="pl-10 pr-10"
          aria-label="Search settings"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-0"
            onClick={clearSearch}
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Search results dropdown */}
      {isFocused && searchQuery && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md">
          <div className="max-h-80 overflow-y-auto p-1">
            {isSearching ? (
              <div className="flex items-center justify-center p-4 text-sm text-muted-foreground">Searching...</div>
            ) : searchResults.length > 0 ? (
              <ul>
                {searchResults.map((result) => (
                  <li key={result.id}>
                    <button
                      className="w-full rounded-sm px-3 py-2 text-left text-sm hover:bg-accent flex flex-col"
                      onClick={() => {
                        onSelectSetting(result)
                        setIsFocused(false)
                      }}
                    >
                      <span className="font-medium">{result.label}</span>
                      <span className="text-xs text-muted-foreground">
                        {result.sectionLabel} &gt; {result.subsectionLabel}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex items-center justify-center p-4 text-sm text-muted-foreground">
                No settings found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
