import { Badge } from "@/components/ui/badge"
import type { RoundStatus } from "@/lib/types"
import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { AlertCircle } from "lucide-react"

interface RoundStatusBadgeProps {
  status: RoundStatus
  errorMessage?: string | null
  progress?: number
}

const statusConfig: Record<
  RoundStatus,
  { label: string; className: string }
> = {
  PENDING: {
    label: "Pending",
    className: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  },
  RUNNING: {
    label: "Running",
    className: "bg-blue-500/10 text-blue-500 border-blue-500/20 animate-pulse",
  },
  COMPLETED: {
    label: "Completed",
    className: "bg-green-500/10 text-green-500 border-green-500/20",
  },
  FAILED: {
    label: "Failed",
    className: "bg-red-500/10 text-red-500 border-red-500/20",
  },
}

export function RoundStatusBadge({ status, errorMessage, progress }: RoundStatusBadgeProps) {
  const config = statusConfig[status]
  
  // Show progress percentage for running rounds
  const label = status === 'RUNNING' && progress !== undefined
    ? `Running ${progress}%`
    : config.label

  if (status === 'FAILED' && errorMessage) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className={cn(config.className, "flex items-center gap-1 cursor-help")}>
              <AlertCircle className="h-3 w-3" />
              {config.label}
            </Badge>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="text-sm">{errorMessage}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <Badge variant="outline" className={cn(config.className)}>
      {label}
    </Badge>
  )
}
