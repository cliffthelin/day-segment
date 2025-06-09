"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Database, HardDrive, Shield, Download, Cloud, Trash2 } from "lucide-react"

export function HelpSection() {
  const [activeTab, setActiveTab] = useState("data-privacy")

  return (
    <div className="space-y-6 py-6">
      <h3 className="text-lg font-medium">Help & Information</h3>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="data-privacy">Data & Privacy</TabsTrigger>
          <TabsTrigger value="faq">FAQ</TabsTrigger>
          <TabsTrigger value="about">About</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="data-privacy" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center">
                <Database className="mr-2 h-5 w-5" />
                Data Storage
              </CardTitle>
              <CardDescription>Information about how and where your data is stored</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-md bg-blue-50 dark:bg-blue-950 p-4 text-sm">
                <p className="font-medium text-blue-800 dark:text-blue-300 mb-2">
                  Your data is stored exclusively on your device
                </p>
                <p className="text-blue-700 dark:text-blue-400">
                  This app uses IndexedDB, a browser-based database that keeps all your information locally on your
                  device. No data is ever sent to any external servers.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded-md p-4 flex flex-col">
                  <div className="flex items-center mb-2">
                    <HardDrive className="h-5 w-5 mr-2 text-gray-500" />
                    <h4 className="font-medium">Local Storage</h4>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 flex-grow">
                    All check-ins, segments, tasks, and settings are stored in your browser's IndexedDB database.
                  </p>
                </div>

                <div className="border rounded-md p-4 flex flex-col">
                  <div className="flex items-center mb-2">
                    <Shield className="h-5 w-5 mr-2 text-gray-500" />
                    <h4 className="font-medium">Privacy</h4>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 flex-grow">
                    Your data is private and only accessible on your current device. No one else can see your data.
                  </p>
                </div>

                <div className="border rounded-md p-4 flex flex-col">
                  <div className="flex items-center mb-2">
                    <Download className="h-5 w-5 mr-2 text-gray-500" />
                    <h4 className="font-medium">Backups</h4>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 flex-grow">
                    Use the Data Management tab to export your data for backup or to transfer to another device.
                  </p>
                </div>

                <div className="border rounded-md p-4 flex flex-col">
                  <div className="flex items-center mb-2">
                    <Cloud className="h-5 w-5 mr-2 text-gray-500" />
                    <h4 className="font-medium">Cloud Storage</h4>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 flex-grow">
                    This app does not use any cloud storage. All data remains on your device unless you manually export
                    it.
                  </p>
                </div>
              </div>

              <div className="rounded-md bg-amber-50 dark:bg-amber-950 p-4 text-sm">
                <p className="font-medium text-amber-800 dark:text-amber-300 mb-2">Browser storage limitations</p>
                <p className="text-amber-700 dark:text-amber-400">
                  Browser storage can be cleared if you clear your browser data or use private/incognito mode. We
                  recommend regularly exporting your data as a backup.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center">
                <Trash2 className="mr-2 h-5 w-5" />
                Data Deletion
              </CardTitle>
              <CardDescription>Information about how to delete your data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Since all data is stored locally on your device, you have complete control over it. You can delete your
                data in the following ways:
              </p>

              <ul className="list-disc pl-5 text-sm text-gray-600 dark:text-gray-400 space-y-2">
                <li>Use the "Clear All Data" button in the Data Management tab</li>
                <li>Clear your browser's storage for this website</li>
                <li>Use your browser's developer tools to delete the IndexedDB database</li>
              </ul>

              <div className="flex justify-end">
                <Button variant="outline" size="sm" asChild>
                  <a href="/settings?tab=data-management">Go to Data Management</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="faq" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
              <CardDescription>Common questions and answers about the app</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger>Is my data secure?</AccordionTrigger>
                  <AccordionContent>
                    Yes. All your data is stored locally on your device using IndexedDB, a secure browser storage
                    mechanism. No data is transmitted to any servers, and no one else can access your data.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2">
                  <AccordionTrigger>Will I lose my data if I clear my browser cache?</AccordionTrigger>
                  <AccordionContent>
                    Yes, clearing your browser cache or data will delete your app data. We recommend regularly exporting
                    your data as a backup using the Data Management tab in Settings.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-3">
                  <AccordionTrigger>Can I use this app on multiple devices?</AccordionTrigger>
                  <AccordionContent>
                    Yes, but your data won't automatically sync between devices. You'll need to manually export your
                    data from one device and import it on another using the Data Management tab in Settings.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-4">
                  <AccordionTrigger>Does this app collect any analytics or usage data?</AccordionTrigger>
                  <AccordionContent>
                    No. This app does not collect any analytics, usage data, or personal information. Everything you do
                    in the app stays on your device.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-5">
                  <AccordionTrigger>How can I back up my data?</AccordionTrigger>
                  <AccordionContent>
                    Go to the Data Management tab in Settings and use the "Export All Data" button to download a JSON
                    file containing all your app data. You can later import this file to restore your data.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="about" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>About Day Segment Tracker</CardTitle>
              <CardDescription>Information about the app and its features</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Day Segment Tracker is a privacy-focused productivity app designed to help you track your daily
                activities, mood, energy levels, and tasks throughout different segments of your day.
              </p>

              <h4 className="font-medium mt-4">Key Features:</h4>
              <ul className="list-disc pl-5 space-y-1">
                <li>Customizable day segments to match your schedule</li>
                <li>Check-in system to track your metrics throughout the day</li>
                <li>Voice check-ins with transcription</li>
                <li>Task management with segment-specific tasks</li>
                <li>Data visualization and reporting</li>
                <li>Complete data privacy - all data stays on your device</li>
                <li>Export and import functionality for backups</li>
              </ul>

              <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                <p>Version: 1.0.0</p>
                <p>Last Updated: May 2025</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Optimization</CardTitle>
              <CardDescription>Learn about performance optimization techniques used in this app</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-3">Dynamic Component Loading</h3>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">1. Interactive Example Component</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>A fully functional demo that shows dynamic loading in action</li>
                      <li>Includes a "Load Heavy Component" button that triggers the dynamic import</li>
                      <li>Shows a loading skeleton while the component is being fetched</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">2. Heavy Component Simulation</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Created a data visualization component that simulates heavy processing</li>
                      <li>Demonstrates how to handle loading states within the dynamically loaded component</li>
                      <li>Shows performance benefits of not loading this on initial page load</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">3. Dedicated Example Pages</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Added an `/examples/dynamic-loading` page with detailed documentation</li>
                      <li>Created an `/examples` index page for future patterns and examples</li>
                      <li>Includes implementation details and best practices</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">4. Reusable Utilities</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Enhanced the `dynamicImport` utility for consistent dynamic loading</li>
                      <li>Added a `Skeleton` component for loading states</li>
                      <li>Included TypeScript types for better developer experience</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-3">Key Benefits Demonstrated:</h3>
                <ol className="list-decimal pl-5 space-y-2">
                  <li>
                    <span className="font-medium">Reduced Initial Bundle Size</span>: The heavy component is only loaded
                    when requested
                  </li>
                  <li>
                    <span className="font-medium">Better User Experience</span>: Loading states prevent layout shifts
                  </li>
                  <li>
                    <span className="font-medium">Improved Performance</span>: Initial page load is faster without
                    unnecessary components
                  </li>
                  <li>
                    <span className="font-medium">Code Organization</span>: Clean separation of components that aren't
                    needed immediately
                  </li>
                </ol>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-3">How to Use in Your App:</h3>
                <p className="mb-2">You can apply this pattern to any heavy components in your app:</p>
                <ol className="list-decimal pl-5 space-y-2">
                  <li>
                    <span className="font-medium">Identify Heavy Components</span>: Charts, complex forms, rich text
                    editors, etc.
                  </li>
                  <li>
                    <span className="font-medium">Convert to Dynamic Imports</span>: Use the `dynamicImport` utility
                  </li>
                  <li>
                    <span className="font-medium">Add Loading States</span>: Create appropriate skeletons or loading
                    indicators
                  </li>
                  <li>
                    <span className="font-medium">Control When to Load</span>: Only load components when they're needed
                  </li>
                </ol>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-md">
                <p className="text-blue-800 dark:text-blue-300">
                  This example provides a template you can follow for optimizing your entire application with code
                  splitting.
                </p>
              </div>

              <div className="flex justify-end">
                <Button variant="outline" size="sm" asChild>
                  <a href="/examples/dynamic-loading">View Dynamic Loading Example</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
