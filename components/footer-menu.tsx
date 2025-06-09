"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, ListTodo, Clock, PieChart, Folder } from "lucide-react"
import { cn } from "@/lib/utils"

export default function FooterMenu() {
  const pathname = usePathname()

  const menuItems = [
    { href: "/", icon: <Home className="h-5 w-5" />, label: "Home" },
    { href: "/tasks", icon: <ListTodo className="h-5 w-5" />, label: "Tasks" },
    { href: "/timers", icon: <Clock className="h-5 w-5" />, label: "Timers" },
    { href: "/collections", icon: <Folder className="h-5 w-5" />, label: "Collections" },
    { href: "/insights", icon: <PieChart className="h-5 w-5" />, label: "Insights" },
  ]

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/80 backdrop-blur-sm pb-safe">
      <div className="container flex h-16 items-center justify-between px-1">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-1 flex-col items-center justify-center h-full py-1 px-2 transition-colors",
              pathname === item.href ? "text-primary" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {item.icon}
            <span className="text-xs mt-1 font-medium">{item.label}</span>
            {pathname === item.href && <div className="absolute bottom-0 h-1 w-10 rounded-t-full bg-primary" />}
          </Link>
        ))}
      </div>
    </footer>
  )
}
