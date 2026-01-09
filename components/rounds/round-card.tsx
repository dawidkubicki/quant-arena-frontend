import Link from "next/link"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { RoundStatusBadge } from "./round-status-badge"
import type { RoundList } from "@/lib/types"
import { formatDate } from "@/lib/utils"
import { Users, Calendar, ChevronRight } from "lucide-react"

interface RoundCardProps {
  round: RoundList
}

export function RoundCard({ round }: RoundCardProps) {
  return (
    <Link href={`/rounds/${round.id}`}>
      <Card className="hover:border-primary/50 transition-all cursor-pointer h-full group active:scale-[0.98]">
        <CardHeader className="pb-2 sm:pb-3 p-4 sm:p-6">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base sm:text-lg line-clamp-1">{round.name}</CardTitle>
            <RoundStatusBadge status={round.status} />
          </div>
          <CardDescription className="flex items-center gap-1 text-xs sm:text-sm">
            <Calendar className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{formatDate(round.created_at)}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>{round.agent_count} agents</span>
              </div>
              <div className="text-xs opacity-75">
                #{round.market_seed}
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
