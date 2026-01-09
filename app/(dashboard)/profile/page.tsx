"use client"

import { useEffect, useState } from "react"
import api from "@/lib/api/client"
import type { User as AppUser } from "@/lib/types"
import { COLOR_OPTIONS } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
  User,
  Zap,
  Target,
  Rocket,
  Brain,
  Flame,
  LineChart,
  TrendingUp,
  Loader2,
  Save,
} from "lucide-react"

const ICON_OPTIONS = [
  { id: "user", icon: User, label: "User" },
  { id: "chart-line", icon: LineChart, label: "Chart" },
  { id: "trending-up", icon: TrendingUp, label: "Trending" },
  { id: "zap", icon: Zap, label: "Zap" },
  { id: "target", icon: Target, label: "Target" },
  { id: "rocket", icon: Rocket, label: "Rocket" },
  { id: "brain", icon: Brain, label: "Brain" },
  { id: "flame", icon: Flame, label: "Flame" },
]

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

export default function ProfilePage() {
  const [user, setUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [nickname, setNickname] = useState("")
  const [selectedColor, setSelectedColor] = useState(COLOR_OPTIONS[0])
  const [selectedIcon, setSelectedIcon] = useState("user")

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await api.auth.me()
        setUser(userData)
        setNickname(userData.nickname)
        setSelectedColor(userData.color)
        setSelectedIcon(userData.icon)
      } catch (error) {
        console.error("Failed to fetch user:", error)
        toast.error("Failed to load profile")
      } finally {
        setLoading(false)
      }
    }
    fetchUser()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const updatedUser = await api.auth.updateMe({
        nickname,
        color: selectedColor,
        icon: selectedIcon,
      })
      setUser(updatedUser)
      toast.success("Profile updated!")
    } catch (error) {
      console.error("Failed to update profile:", error)
      toast.error("Failed to update profile")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="text-center py-24">
        <p className="text-muted-foreground">Failed to load profile</p>
      </div>
    )
  }

  const IconComponent = ICON_MAP[selectedIcon] || User

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Profile Settings</h1>
        <p className="text-muted-foreground mt-1">
          Customize your trader profile
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Profile</CardTitle>
          <CardDescription>
            This is how you appear on the leaderboard
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Preview */}
          <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
            <Avatar className="h-16 w-16" style={{ backgroundColor: selectedColor }}>
              <AvatarFallback style={{ backgroundColor: selectedColor }}>
                <IconComponent className="h-8 w-8 text-white" />
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="text-lg font-semibold">{nickname || "Your Name"}</div>
              <div className="text-sm text-muted-foreground">{user.email}</div>
              {user.is_admin && (
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                  Admin
                </span>
              )}
            </div>
          </div>

          {/* Nickname */}
          <div className="space-y-2">
            <Label htmlFor="nickname">Nickname</Label>
            <Input
              id="nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Enter your nickname"
            />
          </div>

          {/* Color */}
          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex gap-2 flex-wrap">
              {COLOR_OPTIONS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={cn(
                    "w-10 h-10 rounded-full transition-all",
                    selectedColor === color
                      ? "ring-2 ring-offset-2 ring-offset-background ring-primary scale-110"
                      : "hover:scale-105"
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Icon */}
          <div className="space-y-2">
            <Label>Icon</Label>
            <div className="flex gap-2 flex-wrap">
              {ICON_OPTIONS.map(({ id, icon: Icon, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSelectedIcon(id)}
                  className={cn(
                    "w-12 h-12 rounded-lg flex items-center justify-center transition-all border",
                    selectedIcon === id
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-muted hover:border-primary/50"
                  )}
                  title={label}
                >
                  <Icon className="h-6 w-6" />
                </button>
              ))}
            </div>
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Changes
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-muted-foreground">Email</Label>
            <p className="font-medium">{user.email}</p>
          </div>
          <div>
            <Label className="text-muted-foreground">Member Since</Label>
            <p className="font-medium">
              {new Date(user.created_at).toLocaleDateString()}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
