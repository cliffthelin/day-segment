import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export const metadata = {
  title: "Examples | Day Segment Tracker",
  description: "Example implementations and patterns for the Day Segment Tracker app",
}

export default function ExamplesPage() {
  return (
    <div className="container py-10 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Examples & Patterns</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <Link href="/examples/dynamic-loading" className="block">
          <Card className="h-full transition-all hover:shadow-md">
            <CardHeader>
              <CardTitle>Dynamic Component Loading</CardTitle>
              <CardDescription>Learn how to use dynamic imports to optimize performance</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Improve initial load time by splitting your code and loading components on demand.
              </p>
            </CardContent>
          </Card>
        </Link>

        {/* Placeholder for future examples */}
        <Card className="h-full border-dashed opacity-70">
          <CardHeader>
            <CardTitle>More Examples Coming Soon</CardTitle>
            <CardDescription>Additional patterns and implementation examples</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Check back later for more examples and best practices.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
