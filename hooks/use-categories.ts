"use client"

import { useState, useEffect, useCallback } from "react"
import { db } from "@/lib/db"
import type { Category } from "@/types"

interface UseCategoriesProps {
  initialCategories?: Category[]
}

interface UseCategoriesReturn {
  categories: Category[]
  addCategory: (
    categoryData: Omit<Category, "id" | "createdAt">,
  ) => Promise<{ success: boolean; id?: string; error?: any }>
  deleteCategory: (id: string) => Promise<boolean>
  updateCategory: (id: string, updates: Partial<Category>) => Promise<boolean>
}

export const useCategories = ({ initialCategories }: UseCategoriesProps = {}): UseCategoriesReturn => {
  const [categories, setCategories] = useState<Category[]>(initialCategories || [])

  useEffect(() => {
    const loadCategories = async () => {
      if (!db || !db.categories) return

      const allCategories = await db.categories.toArray()
      setCategories(allCategories)
    }

    loadCategories()
  }, [])

  const addCategory = useCallback(async (categoryData: Omit<Category, "id" | "createdAt">) => {
    try {
      // Check if database is initialized
      if (!db || !db.categories) {
        throw new Error("Categories table does not exist in database")
      }

      // Check if a category with this name already exists
      const existingCategory = await db.categories.where("name").equalsIgnoreCase(categoryData.name).first()

      if (existingCategory) {
        return {
          success: false,
          error: new Error(`Category "${categoryData.name}" already exists`),
        }
      }

      // Generate a truly unique ID with timestamp and random string
      const randomStr = Math.random().toString(36).substring(2, 10)
      const id = `category-${categoryData.name.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}-${randomStr}`

      const newCategory: Category = {
        ...categoryData,
        id,
        createdAt: new Date().toISOString(),
      }

      await db.categories.add(newCategory)
      return { success: true, id }
    } catch (err) {
      console.error(`Failed to add category: ${(err as Error).message}`, err)
      return { success: false, error: err }
    }
  }, [])

  const deleteCategory = useCallback(async (id: string) => {
    try {
      if (!db || !db.categories) return false

      await db.categories.delete(id)
      setCategories((prevCategories) => prevCategories.filter((category) => category.id !== id))
      return true
    } catch (err) {
      console.error("Failed to delete category:", err)
      return false
    }
  }, [])

  const updateCategory = useCallback(async (id: string, updates: Partial<Category>) => {
    try {
      if (!db || !db.categories) return false

      await db.categories.update(id, updates)
      setCategories((prevCategories) =>
        prevCategories.map((category) => (category.id === id ? { ...category, ...updates } : category)),
      )
      return true
    } catch (err) {
      console.error("Failed to update category:", err)
      return false
    }
  }, [])

  return {
    categories,
    addCategory,
    deleteCategory,
    updateCategory,
  }
}
