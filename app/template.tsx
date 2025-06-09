"use client"

import type React from "react"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import Header from "@/components/header"
import FooterMenu from "@/components/footer-menu"
import { useMobile } from "@/hooks/use-mobile"

export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isMobile = useMobile()

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <>
      <Header />
      <main className={isMobile ? "pb-20" : "pb-4"}>{children}</main>
      {isMobile && <FooterMenu />}
    </>
  )
}
