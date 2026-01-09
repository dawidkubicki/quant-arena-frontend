"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { TrendingUp, LayoutDashboard, Trophy, Shield } from "lucide-react"
import { UserMenu } from "@/components/auth/user-menu"
import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import api from "@/lib/api/client"

const navItems = [
  { href: "/", label: "Rounds", icon: LayoutDashboard },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
]

export function Navbar() {
  const pathname = usePathname()
  const [isAdmin, setIsAdmin] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        // First check if we have a session
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return
        
        const user = await api.auth.me()
        setIsAdmin(user.is_admin)
      } catch {
        setIsAdmin(false)
      }
    }
    checkAdmin()
  }, [supabase.auth])

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex h-14 sm:h-16 items-center">
        <Link href="/" className="flex items-center gap-2 mr-4 sm:mr-8">
          <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          <span className="font-bold text-base sm:text-lg hidden xs:inline">
            Quant Arena
          </span>
        </Link>

        <nav className="flex items-center gap-0.5 sm:gap-1 flex-1">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-md transition-colors",
                pathname === href
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{label}</span>
            </Link>
          ))}
          {isAdmin && (
            <Link
              href="/admin"
              className={cn(
                "flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-md transition-colors",
                pathname === "/admin"
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Admin</span>
            </Link>
          )}
        </nav>

        <UserMenu />
      </div>
    </header>
  )
}
