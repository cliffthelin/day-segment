"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Clock, BarChart2, Settings, Menu, X, CheckSquare, Folder, FileText, PieChart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"

export default function Header() {
  const pathname = usePathname()
  const isMobile = useMobile()
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  // Close the mobile menu when the path changes
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  // Add scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const navItems = [
    { href: "/", label: "Home", icon: <Home className="h-5 w-5" /> },
    { href: "/timers", label: "Timers", icon: <Clock className="h-5 w-5" /> },
    { href: "/tasks", label: "Tasks", icon: <CheckSquare className="h-5 w-5" /> },
    { href: "/collections", label: "Collections", icon: <Folder className="h-5 w-5" /> },
    { href: "/templates", label: "Templates", icon: <FileText className="h-5 w-5" /> },
    { href: "/insights", label: "Insights", icon: <PieChart className="h-5 w-5" /> },
    { href: "/reports", label: "Reports", icon: <BarChart2 className="h-5 w-5" /> },
    { href: "/settings", label: "Settings", icon: <Settings className="h-5 w-5" /> },
  ]

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full transition-all duration-200",
        scrolled ? "bg-background/80 backdrop-blur-sm border-b shadow-sm" : "bg-background border-b",
      )}
    >
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center">
          <Link href="/" className="flex items-center space-x-2">
            <Clock className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">Day Segment Tracker</span>
          </Link>
        </div>

        {isMobile ? (
          <div className="flex items-center gap-2">
            <ModeToggle />
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Menu">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] sm:w-[350px]">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-5 w-5 text-primary" />
                    <span className="font-semibold">Day Segment Tracker</span>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                <nav className="flex flex-col gap-1">
                  {navItems.map((item) => (
                    <Link key={item.href} href={item.href} onClick={() => setIsOpen(false)}>
                      <Button
                        variant={pathname === item.href ? "default" : "ghost"}
                        className={cn(
                          "w-full justify-start",
                          pathname === item.href ? "bg-primary text-primary-foreground" : "",
                        )}
                      >
                        {item.icon}
                        <span className="ml-2">{item.label}</span>
                      </Button>
                    </Link>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        ) : (
          <nav className="flex items-center gap-1">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={pathname === item.href ? "default" : "ghost"}
                  className={cn("h-9", pathname === item.href ? "bg-primary text-primary-foreground" : "")}
                  size="sm"
                >
                  {item.icon}
                  <span className="ml-1">{item.label}</span>
                </Button>
              </Link>
            ))}
            <ModeToggle />
          </nav>
        )}
      </div>
    </header>
  )
}
