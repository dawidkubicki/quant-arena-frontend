"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { toast } from "sonner"
import { TrendingUp, User, Zap, Target, Rocket, Brain, Flame, LineChart } from "lucide-react"
import { cn } from "@/lib/utils"
import { COLOR_OPTIONS } from "@/lib/types"

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

export default function SignupPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [nickname, setNickname] = useState("")
  const [selectedColor, setSelectedColor] = useState(COLOR_OPTIONS[0])
  const [selectedIcon, setSelectedIcon] = useState("user")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nickname: nickname || email.split("@")[0],
          color: selectedColor,
          icon: selectedIcon,
        },
      },
    })

    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }

    toast.success("Account created! Check your email to verify.")
    router.push("/login")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4 py-8">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="space-y-1 text-center p-4 sm:p-6">
          <div className="flex justify-center mb-2 sm:mb-4">
            <div className="flex items-center gap-2 text-primary">
              <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8" />
              <span className="text-xl sm:text-2xl font-bold">Quant Arena</span>
            </div>
          </div>
          <CardTitle className="text-xl sm:text-2xl">Create your account</CardTitle>
          <CardDescription className="text-sm">
            Join the arena and compete with other traders
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSignup}>
          <CardContent className="space-y-4 p-4 sm:p-6 pt-0 sm:pt-0">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="trader@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-10 sm:h-9"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Min 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
                className="h-10 sm:h-9"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nickname" className="text-sm">Nickname</Label>
              <Input
                id="nickname"
                type="text"
                placeholder="TraderJoe"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="h-10 sm:h-9"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Choose your color</Label>
              <div className="flex gap-2 flex-wrap">
                {COLOR_OPTIONS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    className={cn(
                      "w-9 h-9 sm:w-8 sm:h-8 rounded-full transition-all active:scale-95",
                      selectedColor === color
                        ? "ring-2 ring-offset-2 ring-offset-background ring-primary scale-110"
                        : "hover:scale-105"
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Choose your icon</Label>
              <div className="flex gap-2 flex-wrap">
                {ICON_OPTIONS.map(({ id, icon: Icon, label }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setSelectedIcon(id)}
                    className={cn(
                      "w-11 h-11 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center transition-all border active:scale-95",
                      selectedIcon === id
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-muted hover:border-primary/50"
                    )}
                    title={label}
                  >
                    <Icon className="h-5 w-5" />
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 p-4 sm:p-6 pt-0 sm:pt-0">
            <Button type="submit" className="w-full h-10 sm:h-9" disabled={loading}>
              {loading ? "Creating account..." : "Create account"}
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              Already have an account?{" "}
              <Link href="/login" className="text-primary hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
