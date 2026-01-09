"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  User,
  Zap,
  Target,
  Rocket,
  Brain,
  Flame,
  LineChart,
  TrendingUp,
  LogOut,
  Settings,
} from "lucide-react"
import { toast } from "sonner"
import type { User as AppUser } from "@/lib/types"
import api from "@/lib/api/client"

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  user: User,
  "chart-line": LineChart,
  "trending-up": TrendingUp,
  zap: Zap,
  target: Target,
  rocket: Rocket,
  brain: Brain,
  flame: Flame,
}

export function UserMenu() {
  const [user, setUser] = useState<AppUser | null>(null)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const fetchUser = async () => {
      try {
        // First check if we have a session
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          setLoading(false)
          return
        }
        
        const userData = await api.auth.me()
        setUser(userData)
      } catch (error) {
        console.error("Failed to fetch user:", error)
        // Don't redirect here - the API client handles 401s
      } finally {
        setLoading(false)
      }
    }
    fetchUser()
  }, [supabase.auth])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    toast.success("Signed out successfully")
    router.push("/login")
    router.refresh()
  }

  if (loading) {
    return (
      <div className="h-9 w-9 rounded-full bg-muted animate-pulse" />
    )
  }

  if (!user) {
    return null
  }

  const IconComponent = ICON_MAP[user.icon] || User

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 focus:outline-none"
      >
        <Avatar className="h-9 w-9" style={{ backgroundColor: user.color }}>
          <AvatarFallback style={{ backgroundColor: user.color }}>
            <IconComponent className="h-5 w-5 text-white" />
          </AvatarFallback>
        </Avatar>
        <span className="hidden md:inline text-sm font-medium">
          {user.nickname}
        </span>
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-56 rounded-md border bg-popover p-1 shadow-lg z-50">
            <div className="px-2 py-1.5 text-sm font-medium">
              {user.nickname}
            </div>
            <div className="px-2 py-1 text-xs text-muted-foreground">
              {user.email}
            </div>
            {user.is_admin && (
              <div className="px-2 py-1">
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                  Admin
                </span>
              </div>
            )}
            <div className="h-px bg-border my-1" />
            <Button
              variant="ghost"
              className="w-full justify-start h-9 px-2"
              onClick={() => {
                setOpen(false)
                router.push("/profile")
              }}
            >
              <Settings className="mr-2 h-4 w-4" />
              Profile Settings
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start h-9 px-2 text-destructive hover:text-destructive"
              onClick={handleSignOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
