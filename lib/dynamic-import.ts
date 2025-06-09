import dynamic from "next/dynamic"
import { type ComponentType, lazy } from "react"

// Helper for consistent dynamic imports with loading states
export function dynamicImport<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: {
    ssr?: boolean
    loading?: ComponentType
    displayName?: string
  } = {},
) {
  const { ssr = true, loading, displayName } = options

  const Component = dynamic(importFn, {
    ssr,
    loading,
  })

  if (displayName) {
    Component.displayName = displayName
  }

  return Component
}

// Helper for React.lazy with better typing
export function lazyImport<T extends ComponentType<any>, I extends { [K in N]: T }, N extends string>(
  factory: () => Promise<I>,
  name: N,
): I {
  const LazyComponent = lazy(() => factory().then((module) => ({ default: module[name] })))
  return { [name]: LazyComponent } as I
}
