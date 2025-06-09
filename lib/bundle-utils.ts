// Utility to help with code splitting and lazy loading

/**
 * Dynamically imports a module only when needed
 * @param modulePath Path to the module to import
 * @returns A function that will import the module when called
 */
export function importOnDemand<T>(modulePath: string): () => Promise<T> {
  return () => import(modulePath) as Promise<T>
}

/**
 * Preloads a module in the background
 * @param modulePath Path to the module to preload
 */
export function preloadModule(modulePath: string): void {
  // Create a link for preloading
  const link = document.createElement("link")
  link.rel = "modulepreload"
  link.href = modulePath
  document.head.appendChild(link)
}

/**
 * Checks if a feature should be enabled based on bundle size considerations
 * @param featureName Name of the feature to check
 * @returns Whether the feature should be enabled
 */
export function shouldEnableFeature(featureName: string): boolean {
  // This could be expanded to check user preferences, device capabilities, etc.
  const lowEndDevice = navigator.hardwareConcurrency <= 2 || navigator.deviceMemory <= 2

  const heavyFeatures = ["voice-recognition", "advanced-charts", "3d-visualization"]

  if (lowEndDevice && heavyFeatures.includes(featureName)) {
    return false
  }

  return true
}

/**
 * Measures and reports JS execution time for performance monitoring
 * @param name Name of the component or function to measure
 * @param fn Function to execute and measure
 * @returns The result of the function
 */
export function measureExecution<T>(name: string, fn: () => T): T {
  const start = performance.now()
  const result = fn()
  const end = performance.now()

  // Only log in development
  if (process.env.NODE_ENV === "development") {
    console.log(`[Performance] ${name}: ${Math.round(end - start)}ms`)
  }

  return result
}
