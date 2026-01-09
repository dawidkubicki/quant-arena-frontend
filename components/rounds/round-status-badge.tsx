import { Badge } from "@/components/ui/badge"
import type { RoundStatus } from "@/lib/types"
import { cn } from "@/lib/utils"

interface RoundStatusBadgeProps {
  status: RoundStatus
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
}

export function RoundStatusBadge({ status }: RoundStatusBadgeProps) {
  const config = statusConfig[status]

  return (
    <Badge variant="outline" className={cn(config.className)}>
      {config.label}
    </Badge>
  )
}
