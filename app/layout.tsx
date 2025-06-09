import type React from "react"
import "./globals.css"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import BackgroundProvider from "@/components/background-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Day Segment Tracker",
  description: "Track your productivity and mood throughout different segments of your day",
    generator: 'v0.dev'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <BackgroundProvider>{children}</BackgroundProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
