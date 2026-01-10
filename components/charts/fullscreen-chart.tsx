"use client"

import * as React from "react"
import { Maximize2, Minimize2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

interface FullscreenChartProps {
  title: string
  description?: string
  children: React.ReactNode
  /** Render function for fullscreen mode - receives height as parameter */
  fullscreenContent?: (height: number) => React.ReactNode
  className?: string
}

export function FullscreenChart({
  title,
  description,
  children,
  fullscreenContent,
  className,
}: FullscreenChartProps) {
  const [isFullscreen, setIsFullscreen] = React.useState(false)
  const [chartHeight, setChartHeight] = React.useState(600)
  const contentRef = React.useRef<HTMLDivElement>(null)

  // Update chart height when fullscreen dialog opens or window resizes
  React.useEffect(() => {
    if (!isFullscreen) return

    const updateHeight = () => {
      if (contentRef.current) {
        // Get the content area height minus padding
        const contentHeight = contentRef.current.clientHeight - 32 // 32px for padding
        setChartHeight(Math.max(contentHeight, 400))
      }
    }

    // Initial calculation after a small delay to ensure dialog is rendered
    const timer = setTimeout(updateHeight, 50)
    window.addEventListener("resize", updateHeight)

    return () => {
      clearTimeout(timer)
      window.removeEventListener("resize", updateHeight)
    }
  }, [isFullscreen])

  return (
    <>
      {/* Regular view with maximize button */}
      <div className={cn("relative group", className)}>
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-0 right-0 z-10 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm hover:bg-background"
          onClick={() => setIsFullscreen(true)}
          title="Fullscreen"
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
        {children}
      </div>

      {/* Fullscreen dialog */}
      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent className="max-w-[95vw] w-[95vw] max-h-[95vh] h-[95vh] p-0 gap-0 flex flex-col">
          <DialogHeader className="p-4 pb-2 border-b flex-row items-center justify-between space-y-0 shrink-0">
            <div>
              <DialogTitle>{title}</DialogTitle>
              {description && (
                <p className="text-xs text-muted-foreground mt-1">
                  {description}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setIsFullscreen(false)}
              >
                <Minimize2 className="h-4 w-4" />
              </Button>
              <DialogClose asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <X className="h-4 w-4" />
                </Button>
              </DialogClose>
            </div>
          </DialogHeader>
          <div ref={contentRef} className="flex-1 p-4 overflow-auto min-h-0">
            {/* Use fullscreenContent if provided, otherwise render children */}
            {fullscreenContent ? fullscreenContent(chartHeight) : children}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
