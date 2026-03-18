'use client'

import { ExternalLink, Linkedin, Building2, Users, MapPin, BadgeCheck } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  type Startup,
  formatCurrency,
  getFlagEmoji,
  getRoundStageColor,
} from '@/lib/mock-data'

interface StartupDetailSheetProps {
  startup: Startup | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function StartupDetailSheet({
  startup,
  open,
  onOpenChange,
}: StartupDetailSheetProps) {
  if (!startup) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="text-left">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-lg font-bold text-primary">
              {startup.logoPlaceholder}
            </div>
            <div>
              <SheetTitle className="text-xl">{startup.name}</SheetTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge
                  variant="outline"
                  className={`${getRoundStageColor(startup.roundStage)}`}
                >
                  {startup.roundStage}
                </Badge>
                {startup.diiaCity && (
                  <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                    Diia.City
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <SheetDescription className="sr-only">
            Details for {startup.name}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border p-3">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Building2 className="h-4 w-4" />
                Target Raise
              </div>
              <div className="mt-1 text-lg font-semibold text-foreground">
                {formatCurrency(startup.targetRaise)}
              </div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <BadgeCheck className="h-4 w-4" />
                Round Stage
              </div>
              <div className="mt-1 text-lg font-semibold text-foreground">
                {startup.roundStage}
              </div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <MapPin className="h-4 w-4" />
                Legal HQ
              </div>
              <div className="mt-1 text-lg font-semibold text-foreground">
                {getFlagEmoji(startup.legalHQ)} {startup.legalHQ}
              </div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Users className="h-4 w-4" />
                Founders
              </div>
              <div className="mt-1 text-lg font-semibold text-foreground">
                {startup.founders.length}
              </div>
            </div>
          </div>

          <Separator />

          {/* About Section */}
          <div>
            <h3 className="font-semibold text-foreground mb-2">About</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {startup.description}
            </p>
          </div>

          {/* Verticals */}
          <div>
            <h3 className="font-semibold text-foreground mb-2">Verticals</h3>
            <div className="flex flex-wrap gap-2">
              {startup.verticals.map((vertical) => (
                <Badge key={vertical} variant="secondary">
                  {vertical}
                </Badge>
              ))}
            </div>
          </div>

          <Separator />

          {/* Founders */}
          <div>
            <h3 className="font-semibold text-foreground mb-3">Founding Team</h3>
            <div className="space-y-3">
              {startup.founders.map((founder, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <div className="font-medium text-foreground">{founder.name}</div>
                    <div className="text-sm text-muted-foreground">{founder.role}</div>
                  </div>
                  {founder.linkedin && (
                    <a
                      href={founder.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Linkedin className="h-5 w-5" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Existing Investors - Highlighted */}
          <div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-4">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <BadgeCheck className="h-5 w-5 text-primary" />
              Existing Investors
            </h3>
            <div className="flex flex-wrap gap-2">
              {startup.existingInvestors.map((investor, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="bg-background text-foreground"
                >
                  {investor}
                </Badge>
              ))}
            </div>
          </div>

          {/* News Link */}
          {startup.newsUrl && (
            <a
              href={startup.newsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <ExternalLink className="h-4 w-4" />
              View Latest News Coverage
            </a>
          )}

          {/* Action Button */}
          <Button className="w-full" size="lg">
            Request Pitch Deck
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
