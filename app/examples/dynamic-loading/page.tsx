import { DynamicLoadingExample } from "@/components/examples/dynamic-loading-example"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export const metadata = {
  title: "Dynamic Loading Example | Day Segment Tracker",
  description: "Learn how to use dynamic imports to optimize your application's performance",
}

export default function DynamicLoadingPage() {
  return (
    <div className="container py-10 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Dynamic Component Loading</h1>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Why Use Dynamic Loading?</CardTitle>
          <CardDescription>Dynamic loading helps optimize your application's initial load time</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            Dynamic component loading (also called code splitting) allows you to split your JavaScript bundle into
            smaller chunks that are loaded on demand. This can significantly improve your application's initial load
            time by:
          </p>

          <ul className="list-disc pl-6 space-y-2">
            <li>Reducing the size of the initial JavaScript bundle</li>
            <li>Loading components only when they're actually needed</li>
            <li>Improving time-to-interactive for your application</li>
            <li>Reducing memory usage for users who don't access certain features</li>
          </ul>

          <p className="text-sm bg-muted p-3 rounded-md">
            <strong>Pro tip:</strong> Use dynamic loading for components that are:
            <br />• Large or complex (charts, rich text editors, etc.)
            <br />• Not needed on initial page load (modals, settings panels, etc.)
            <br />• Used only by a subset of users (admin features, advanced tools, etc.)
          </p>
        </CardContent>
      </Card>

      <DynamicLoadingExample />

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Implementation Details</CardTitle>
          <CardDescription>How to implement dynamic loading in your own components</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            The example above uses Next.js dynamic imports with a custom wrapper for consistency. Here's how you can
            implement it in your own components:
          </p>

          <div className="bg-muted p-4 rounded-md overflow-x-auto">
            <pre className="text-sm">
              {`// 1. Import the dynamic import helper
import { dynamicImport } from "@/lib/dynamic-import";

// 2. Create your dynamic component
const HeavyComponent = dynamicImport(
  () => import("@/components/heavy-component"),
  {
    ssr: false, // Don't render on server
    loading: () => <LoadingSkeleton />, // Show skeleton while loading
    displayName: "DynamicHeavyComponent" // Optional but helpful for debugging
  }
);

// 3. Use it like a regular component
function MyPage() {
  return (
    <div>
      {showHeavyComponent && <HeavyComponent />}
    </div>
  );
}`}
            </pre>
          </div>

          <p className="text-sm text-muted-foreground">
            When using dynamic imports, make sure to handle loading states appropriately to avoid layout shifts and
            provide a good user experience.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
