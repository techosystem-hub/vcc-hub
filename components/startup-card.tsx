'use client'

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { type Startup, formatCurrency, getFlagEmoji, getRoundStageColor } from '@/lib/mock-data'

interface StartupCardProps {
  startup: Startup
  onClick: () => void
}

export function StartupCard({ startup, onClick }: StartupCardProps) {
  return (
    <Card
      onClick={onClick}
      className="cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/30 hover:-translate-y-0.5 group py-4"
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base font-semibold text-foreground leading-tight group-hover:text-primary transition-colors">
            {startup.name}
          </CardTitle>
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getRoundStageColor(startup.roundStage)}`}
          >
            {startup.roundStage}
          </span>
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 mb-3">
          {startup.description}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {startup.verticals.slice(0, 2).map((vertical) => (
            <Badge
              key={vertical}
              variant="secondary"
              className="text-xs font-medium px-2 py-0.5"
            >
              {vertical}
            </Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter className="pt-3 border-t border-border flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground">Target Raise</span>
          <span className="text-sm font-semibold text-foreground">
            {formatCurrency(startup.targetRaise)}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            {new Date(startup.dealDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
          </span>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <span>{getFlagEmoji(startup.legalHQ)}</span>
            <span className="text-xs">{startup.legalHQ === 'Delaware C-Corp' ? 'Delaware' : startup.legalHQ}</span>
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}
