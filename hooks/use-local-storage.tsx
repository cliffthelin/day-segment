"use client"

import { useState, useEffect, useRef } from "react"

export function useLocalStorage(key, initialValue) {
  // State to store our value
  const [storedValue, setStoredValue] = useState(initialValue)

  // Use a ref to track initialization
  const initialized = useRef(false)

  // Initialize the value from localStorage
  useEffect(() => {
    if (!initialized.current) {
      try {
        const item = window.localStorage.getItem(key)
        if (item) {
          setStoredValue(JSON.parse(item))
        }
      } catch (error) {
        console.log(error)
      }
      initialized.current = true
    }
  }, [key])

  // Return a wrapped version of useState's setter function that
  // persists the new value to localStorage
  const setValue = (value) => {
    try {
      // Allow value to be a function so we have the same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value

      // Save state
      setStoredValue(valueToStore)

      // Save to localStorage
      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, JSON.stringify(valueToStore))
      }
    } catch (error) {
      console.log(error)
    }
  }

  return [storedValue, setValue]
}
