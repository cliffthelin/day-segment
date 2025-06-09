"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import {
  Filter,
  SortAsc,
  SortDesc,
  Calendar,
  Flag,
  CheckCircle,
  Circle,
  PlayCircle,
  Tag,
  X,
  ListFilter,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { useLiveQuery } from "dexie-react-hooks"
import { db } from "@/lib/db"
import { format } from "date-fns"
import type { Task } from "@/types"

export type SortOption =
  | "name-asc"
  | "name-desc"
  | "created-asc"
  | "created-desc"
  | "due-asc"
  | "due-desc"
  | "priority-asc"
  | "priority-desc"
  | "status-asc"
  | "status-desc"

export type FilterOptions = {
  status: string[]
  priority: string[]
  category: string[]
  type: string[]
  dueDate: string | null
  search: string
}

interface CollectionFilterProps {
  tasks?: Task[]
  onFilteredTasksChange?: (tasks: Task[]) => void
  onSortChange?: (sortOption: SortOption) => void
  initialSort?: SortOption
  initialFilters?: Partial<FilterOptions>
  onCollectionChange?: (collectionId: string | null) => void
}

export function CollectionFilter({
  tasks = [],
  onFilteredTasksChange,
  onSortChange,
  initialSort = "name-asc",
  initialFilters = {},
  onCollectionChange,
}: CollectionFilterProps) {
  const [sortOption, setSortOption] = useState<SortOption>(initialSort)
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    status: initialFilters.status || [],
    priority: initialFilters.priority || [],
    category: initialFilters.category || [],
    type: initialFilters.type || [],
    dueDate: initialFilters.dueDate || null,
    search: initialFilters.search || "",
  })
  const [isFilterActive, setIsFilterActive] = useState(false)
  const [activeFilterCount, setActiveFilterCount] = useState(0)
  const [isFilterPopoverOpen, setIsFilterPopoverOpen] = useState(false)
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null)

  // Get categories for filtering
  const categories = useLiveQuery(() => db.categories.toArray()) || []

  // Get collections for filtering
  const collections = useLiveQuery(() => db.collections.toArray()) || []

  // Sort tasks based on sort option - memoized to prevent recreating on every render
  const sortTasks = useCallback((tasksToSort: Task[], option: SortOption): Task[] => {
    if (!tasksToSort || tasksToSort.length === 0) return []

    const sorted = [...tasksToSort]

    switch (option) {
      case "name-asc":
        return sorted.sort((a, b) => a.name.localeCompare(b.name))
      case "name-desc":
        return sorted.sort((a, b) => b.name.localeCompare(a.name))
      case "created-asc":
        return sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      case "created-desc":
        return sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      case "due-asc":
        return sorted.sort((a, b) => {
          if (!a.dueDate && !b.dueDate) return 0
          if (!a.dueDate) return 1
          if (!b.dueDate) return -1
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        })
      case "due-desc":
        return sorted.sort((a, b) => {
          if (!a.dueDate && !b.dueDate) return 0
          if (!a.dueDate) return 1
          if (!b.dueDate) return -1
          return new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()
        })
      case "priority-asc":
        return sorted.sort((a, b) => {
          const priorityOrder = { high: 0, medium: 1, low: 2, undefined: 3 }
          const aPriority = a.priority || "undefined"
          const bPriority = b.priority || "undefined"
          return (
            priorityOrder[aPriority as keyof typeof priorityOrder] -
            priorityOrder[bPriority as keyof typeof priorityOrder]
          )
        })
      case "priority-desc":
        return sorted.sort((a, b) => {
          const priorityOrder = { high: 0, medium: 1, low: 2, undefined: 3 }
          const aPriority = a.priority || "undefined"
          const bPriority = b.priority || "undefined"
          return (
            priorityOrder[bPriority as keyof typeof priorityOrder] -
            priorityOrder[aPriority as keyof typeof priorityOrder]
          )
        })
      case "status-asc":
        return sorted.sort((a, b) => {
          const statusOrder = { todo: 0, started: 1, completed: 2 }
          return statusOrder[a.status] - statusOrder[b.status]
        })
      case "status-desc":
        return sorted.sort((a, b) => {
          const statusOrder = { todo: 0, started: 1, completed: 2 }
          return statusOrder[b.status] - statusOrder[a.status]
        })
      default:
        return sorted
    }
  }, [])

  // Apply filters and sorting to tasks - memoized to prevent recalculation on every render
  const filteredAndSortedTasks = useMemo(() => {
    if (!tasks || tasks.length === 0) return []

    let result = [...tasks]

    // Filter by collection if one is selected
    if (selectedCollectionId) {
      result = result.filter(
        (task) =>
          task.collectionIds && Array.isArray(task.collectionIds) && task.collectionIds.includes(selectedCollectionId),
      )
    }

    // Apply status filter
    if (filterOptions.status.length > 0) {
      result = result.filter((task) => filterOptions.status.includes(task.status))
    }

    // Apply priority filter
    if (filterOptions.priority.length > 0) {
      result = result.filter((task) => task.priority && filterOptions.priority.includes(task.priority))
    }

    // Apply category filter
    if (filterOptions.category.length > 0) {
      result = result.filter((task) => task.categoryId && filterOptions.category.includes(task.categoryId))
    }

    // Apply type filter
    if (filterOptions.type.length > 0) {
      result = result.filter((task) => {
        const taskType = task.type || "standard"
        return filterOptions.type.includes(taskType)
      })
    }

    // Apply due date filter
    if (filterOptions.dueDate) {
      const filterDate = new Date(filterOptions.dueDate)
      filterDate.setHours(0, 0, 0, 0)

      result = result.filter((task) => {
        if (!task.dueDate) return false
        const taskDueDate = new Date(task.dueDate)
        taskDueDate.setHours(0, 0, 0, 0)
        return taskDueDate.getTime() === filterDate.getTime()
      })
    }

    // Apply search filter
    if (filterOptions.search) {
      const searchLower = filterOptions.search.toLowerCase()
      result = result.filter(
        (task) =>
          task.name.toLowerCase().includes(searchLower) ||
          (task.description && task.description.toLowerCase().includes(searchLower)),
      )
    }

    // Apply sorting
    return sortTasks(result, sortOption)
  }, [tasks, filterOptions, sortOption, sortTasks, selectedCollectionId])

  // Update filter state and notify parent only when filters change
  useEffect(() => {
    // Count active filters
    let count = 0
    if (filterOptions.status.length > 0) count++
    if (filterOptions.priority.length > 0) count++
    if (filterOptions.category.length > 0) count++
    if (filterOptions.type.length > 0) count++
    if (filterOptions.dueDate) count++
    if (filterOptions.search) count++
    if (selectedCollectionId) count++

    setActiveFilterCount(count)
    setIsFilterActive(count > 0)
  }, [filterOptions, selectedCollectionId])

  // Notify parent component of filtered tasks changes - separate effect to avoid loops
  useEffect(() => {
    if (onFilteredTasksChange) {
      onFilteredTasksChange(filteredAndSortedTasks)
    }
  }, [filteredAndSortedTasks, onFilteredTasksChange])

  // Handle sort option change
  const handleSortChange = (value: string) => {
    const newSortOption = value as SortOption
    setSortOption(newSortOption)
    if (onSortChange) {
      onSortChange(newSortOption)
    }
  }

  // Handle collection change
  const handleCollectionChange = (collectionId: string | null) => {
    setSelectedCollectionId(collectionId)
    if (onCollectionChange) {
      onCollectionChange(collectionId)
    }
  }

  // Handle filter changes
  const handleStatusFilterChange = (status: string, checked: boolean) => {
    setFilterOptions((prev) => {
      if (checked) {
        return { ...prev, status: [...prev.status, status] }
      } else {
        return { ...prev, status: prev.status.filter((s) => s !== status) }
      }
    })
  }

  const handlePriorityFilterChange = (priority: string, checked: boolean) => {
    setFilterOptions((prev) => {
      if (checked) {
        return { ...prev, priority: [...prev.priority, priority] }
      } else {
        return { ...prev, priority: prev.priority.filter((p) => p !== priority) }
      }
    })
  }

  const handleCategoryFilterChange = (categoryId: string, checked: boolean) => {
    setFilterOptions((prev) => {
      if (checked) {
        return { ...prev, category: [...prev.category, categoryId] }
      } else {
        return { ...prev, category: prev.category.filter((c) => c !== categoryId) }
      }
    })
  }

  const handleTypeFilterChange = (type: string, checked: boolean) => {
    setFilterOptions((prev) => {
      if (checked) {
        return { ...prev, type: [...prev.type, type] }
      } else {
        return { ...prev, type: prev.type.filter((t) => t !== type) }
      }
    })
  }

  const handleDueDateFilterChange = (date: Date | undefined) => {
    setFilterOptions((prev) => ({
      ...prev,
      dueDate: date ? date.toISOString() : null,
    }))
  }

  const handleSearchFilterChange = (search: string) => {
    setFilterOptions((prev) => ({
      ...prev,
      search,
    }))
  }

  // Reset all filters
  const resetFilters = () => {
    setFilterOptions({
      status: [],
      priority: [],
      category: [],
      type: [],
      dueDate: null,
      search: "",
    })
    setSelectedCollectionId(null)
    if (onCollectionChange) {
      onCollectionChange(null)
    }
    setIsFilterPopoverOpen(false)
  }

  // Get category name by ID
  const getCategoryName = (categoryId: string): string => {
    const category = categories.find((c) => c.id === categoryId)
    return category ? category.name : "Unknown"
  }

  // Get category color by ID
  const getCategoryColor = (categoryId: string): string => {
    const category = categories.find((c) => c.id === categoryId)
    return category ? category.color : "#64748b"
  }

  // Get sort icon and label
  const getSortInfo = () => {
    const [field, direction] = sortOption.split("-")
    const isAsc = direction === "asc"

    let label = ""
    const icon = isAsc ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />

    switch (field) {
      case "name":
        label = `Name ${isAsc ? "A-Z" : "Z-A"}`
        break
      case "created":
        label = `Created ${isAsc ? "Oldest" : "Newest"}`
        break
      case "due":
        label = `Due ${isAsc ? "Earliest" : "Latest"}`
        break
      case "priority":
        label = `Priority ${isAsc ? "High-Low" : "Low-High"}`
        break
      case "status":
        label = `Status ${isAsc ? "Todo-Done" : "Done-Todo"}`
        break
    }

    return { label, icon }
  }

  const { label: sortLabel, icon: sortIcon } = getSortInfo()

  return (
    <div className="flex flex-col space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        {/* Collection dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-9">
              <Filter className="h-4 w-4 mr-2" />
              {selectedCollectionId
                ? collections.find((c) => c.id === selectedCollectionId)?.name || "Collection"
                : "All Collections"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuLabel>Filter by Collection</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup
              value={selectedCollectionId || ""}
              onValueChange={(value) => handleCollectionChange(value || null)}
            >
              <DropdownMenuRadioItem value="">All Collections</DropdownMenuRadioItem>
              <DropdownMenuSeparator />
              {collections.map((collection) => (
                <DropdownMenuRadioItem key={collection.id} value={collection.id}>
                  {collection.name}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Search input */}
        <div className="relative flex-grow max-w-md">
          <input
            type="text"
            placeholder="Search tasks..."
            className="w-full h-9 px-3 py-2 bg-background border border-input rounded-md text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-input"
            value={filterOptions.search}
            onChange={(e) => handleSearchFilterChange(e.target.value)}
          />
          {filterOptions.search && (
            <button
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => handleSearchFilterChange("")}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filter button */}
        <Popover open={isFilterPopoverOpen} onOpenChange={setIsFilterPopoverOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-9">
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="end">
            <div className="p-4 pb-0">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Filter Tasks</h4>
                <Button variant="ghost" size="sm" onClick={resetFilters} className="h-8 px-2 text-xs">
                  Reset
                </Button>
              </div>
              <Separator className="my-4" />
            </div>
            <div className="px-4 pb-2">
              <h5 className="mb-2 text-sm font-medium flex items-center">
                <CheckCircle className="h-4 w-4 mr-2" />
                Status
              </h5>
              <div className="grid grid-cols-1 gap-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="status-todo"
                    checked={filterOptions.status.includes("todo")}
                    onCheckedChange={(checked) => handleStatusFilterChange("todo", checked as boolean)}
                  />
                  <Label htmlFor="status-todo" className="flex items-center">
                    <Circle className="h-4 w-4 mr-1 text-slate-500" />
                    To Do
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="status-started"
                    checked={filterOptions.status.includes("started")}
                    onCheckedChange={(checked) => handleStatusFilterChange("started", checked as boolean)}
                  />
                  <Label htmlFor="status-started" className="flex items-center">
                    <PlayCircle className="h-4 w-4 mr-1 text-blue-500" />
                    In Progress
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="status-completed"
                    checked={filterOptions.status.includes("completed")}
                    onCheckedChange={(checked) => handleStatusFilterChange("completed", checked as boolean)}
                  />
                  <Label htmlFor="status-completed" className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
                    Completed
                  </Label>
                </div>
              </div>
            </div>
            <Separator className="my-2" />
            <div className="px-4 pb-2">
              <h5 className="mb-2 text-sm font-medium flex items-center">
                <Flag className="h-4 w-4 mr-2" />
                Priority
              </h5>
              <div className="grid grid-cols-1 gap-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="priority-high"
                    checked={filterOptions.priority.includes("high")}
                    onCheckedChange={(checked) => handlePriorityFilterChange("high", checked as boolean)}
                  />
                  <Label htmlFor="priority-high" className="flex items-center">
                    <span className="h-2 w-2 rounded-full bg-red-500 mr-2"></span>
                    High
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="priority-medium"
                    checked={filterOptions.priority.includes("medium")}
                    onCheckedChange={(checked) => handlePriorityFilterChange("medium", checked as boolean)}
                  />
                  <Label htmlFor="priority-medium" className="flex items-center">
                    <span className="h-2 w-2 rounded-full bg-yellow-500 mr-2"></span>
                    Medium
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="priority-low"
                    checked={filterOptions.priority.includes("low")}
                    onCheckedChange={(checked) => handlePriorityFilterChange("low", checked as boolean)}
                  />
                  <Label htmlFor="priority-low" className="flex items-center">
                    <span className="h-2 w-2 rounded-full bg-blue-500 mr-2"></span>
                    Low
                  </Label>
                </div>
              </div>
            </div>
            <Separator className="my-2" />
            <div className="px-4 pb-2">
              <h5 className="mb-2 text-sm font-medium flex items-center">
                <Tag className="h-4 w-4 mr-2" />
                Category
              </h5>
              <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
                {categories.map((category) => (
                  <div key={category.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`category-${category.id}`}
                      checked={filterOptions.category.includes(category.id)}
                      onCheckedChange={(checked) => handleCategoryFilterChange(category.id, checked as boolean)}
                    />
                    <Label htmlFor={`category-${category.id}`} className="flex items-center">
                      <span className="h-2 w-2 rounded-full mr-2" style={{ backgroundColor: category.color }}></span>
                      {category.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            <Separator className="my-2" />
            <div className="px-4 pb-2">
              <h5 className="mb-2 text-sm font-medium flex items-center">
                <ListFilter className="h-4 w-4 mr-2" />
                Task Type
              </h5>
              <div className="grid grid-cols-1 gap-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="type-standard"
                    checked={filterOptions.type.includes("standard")}
                    onCheckedChange={(checked) => handleTypeFilterChange("standard", checked as boolean)}
                  />
                  <Label htmlFor="type-standard">Standard</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="type-tally"
                    checked={filterOptions.type.includes("tally")}
                    onCheckedChange={(checked) => handleTypeFilterChange("tally", checked as boolean)}
                  />
                  <Label htmlFor="type-tally">Tally</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="type-subtasks"
                    checked={filterOptions.type.includes("subtasks")}
                    onCheckedChange={(checked) => handleTypeFilterChange("subtasks", checked as boolean)}
                  />
                  <Label htmlFor="type-subtasks">Subtasks</Label>
                </div>
              </div>
            </div>
            <Separator className="my-2" />
            <div className="px-4 pb-4">
              <h5 className="mb-2 text-sm font-medium flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                Due Date
              </h5>
              <div className="flex flex-col space-y-2">
                <CalendarComponent
                  mode="single"
                  selected={filterOptions.dueDate ? new Date(filterOptions.dueDate) : undefined}
                  onSelect={handleDueDateFilterChange}
                  className="border rounded-md p-2"
                />
                {filterOptions.dueDate && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDueDateFilterChange(undefined)}
                    className="mt-2"
                  >
                    Clear Date
                  </Button>
                )}
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Sort dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-9">
              {sortIcon}
              <span className="ml-2">{sortLabel}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuLabel>Sort by</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup value={sortOption} onValueChange={handleSortChange}>
              <DropdownMenuRadioItem value="name-asc">Name (A-Z)</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="name-desc">Name (Z-A)</DropdownMenuRadioItem>
              <DropdownMenuSeparator />
              <DropdownMenuRadioItem value="created-desc">Created (Newest)</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="created-asc">Created (Oldest)</DropdownMenuRadioItem>
              <DropdownMenuSeparator />
              <DropdownMenuRadioItem value="due-asc">Due Date (Earliest)</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="due-desc">Due Date (Latest)</DropdownMenuRadioItem>
              <DropdownMenuSeparator />
              <DropdownMenuRadioItem value="priority-asc">Priority (High-Low)</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="priority-desc">Priority (Low-High)</DropdownMenuRadioItem>
              <DropdownMenuSeparator />
              <DropdownMenuRadioItem value="status-asc">Status (Todo-Done)</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="status-desc">Status (Done-Todo)</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Active filters display */}
      {isFilterActive && (
        <div className="flex flex-wrap items-center gap-2 mt-2">
          {selectedCollectionId && (
            <Badge variant="outline" className="flex items-center gap-1">
              <span>Collection:</span>
              <span className="ml-1">{collections.find((c) => c.id === selectedCollectionId)?.name || "Unknown"}</span>
              <button
                className="ml-1 text-muted-foreground hover:text-foreground"
                onClick={() => handleCollectionChange(null)}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {filterOptions.status.length > 0 && (
            <Badge variant="outline" className="flex items-center gap-1">
              <span>Status:</span>
              {filterOptions.status.map((status) => (
                <span key={status} className="ml-1">
                  {status === "todo" ? "To Do" : status === "started" ? "In Progress" : "Completed"}
                  {filterOptions.status.length > 1 &&
                  filterOptions.status.indexOf(status) < filterOptions.status.length - 1
                    ? ","
                    : ""}
                </span>
              ))}
              <button
                className="ml-1 text-muted-foreground hover:text-foreground"
                onClick={() => setFilterOptions((prev) => ({ ...prev, status: [] }))}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {filterOptions.priority.length > 0 && (
            <Badge variant="outline" className="flex items-center gap-1">
              <span>Priority:</span>
              {filterOptions.priority.map((priority) => (
                <span key={priority} className="ml-1 capitalize">
                  {priority}
                  {filterOptions.priority.length > 1 &&
                  filterOptions.priority.indexOf(priority) < filterOptions.priority.length - 1
                    ? ","
                    : ""}
                </span>
              ))}
              <button
                className="ml-1 text-muted-foreground hover:text-foreground"
                onClick={() => setFilterOptions((prev) => ({ ...prev, priority: [] }))}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {filterOptions.category.length > 0 && (
            <Badge variant="outline" className="flex items-center gap-1">
              <span>Category:</span>
              {filterOptions.category.map((categoryId) => (
                <span key={categoryId} className="ml-1 flex items-center">
                  <span
                    className="h-2 w-2 rounded-full mr-1"
                    style={{ backgroundColor: getCategoryColor(categoryId) }}
                  ></span>
                  {getCategoryName(categoryId)}
                  {filterOptions.category.length > 1 &&
                  filterOptions.category.indexOf(categoryId) < filterOptions.category.length - 1
                    ? ","
                    : ""}
                </span>
              ))}
              <button
                className="ml-1 text-muted-foreground hover:text-foreground"
                onClick={() => setFilterOptions((prev) => ({ ...prev, category: [] }))}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {filterOptions.type.length > 0 && (
            <Badge variant="outline" className="flex items-center gap-1">
              <span>Type:</span>
              {filterOptions.type.map((type) => (
                <span key={type} className="ml-1 capitalize">
                  {type}
                  {filterOptions.type.length > 1 && filterOptions.type.indexOf(type) < filterOptions.type.length - 1
                    ? ","
                    : ""}
                </span>
              ))}
              <button
                className="ml-1 text-muted-foreground hover:text-foreground"
                onClick={() => setFilterOptions((prev) => ({ ...prev, type: [] }))}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {filterOptions.dueDate && (
            <Badge variant="outline" className="flex items-center gap-1">
              <span>Due:</span>
              <span className="ml-1">{format(new Date(filterOptions.dueDate), "MMM d, yyyy")}</span>
              <button
                className="ml-1 text-muted-foreground hover:text-foreground"
                onClick={() => setFilterOptions((prev) => ({ ...prev, dueDate: null }))}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {isFilterActive && (
            <Button variant="ghost" size="sm" onClick={resetFilters} className="h-7 px-2 text-xs">
              Clear All
            </Button>
          )}
        </div>
      )}

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        {filteredAndSortedTasks.length} {filteredAndSortedTasks.length === 1 ? "task" : "tasks"} found
      </div>
    </div>
  )
}
