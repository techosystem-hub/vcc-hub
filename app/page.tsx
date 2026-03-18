'use client'

import { useState } from 'react'
import { Briefcase, Sparkles, BarChart3, Settings, LogOut } from 'lucide-react'
import { useUser, useClerk } from '@clerk/nextjs'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { DealRoomView } from '@/components/views/deal-room-view'
import { SmartMatchesView } from '@/components/views/smart-matches-view'
import { AnalyticsView } from '@/components/views/analytics-view'
import { MyCriteriaView } from '@/components/views/my-criteria-view'

type View = 'deal-room' | 'smart-matches' | 'analytics' | 'my-criteria'

const navItems = [
  { id: 'deal-room'      as View, label: 'Deal Room',        icon: Briefcase  },
  { id: 'smart-matches'  as View, label: 'Smart Matches',    icon: Sparkles   },
  { id: 'analytics'      as View, label: 'Market Analytics', icon: BarChart3  },
  { id: 'my-criteria'    as View, label: 'My Criteria',      icon: Settings   },
]

function AppSidebar({ activeView, onViewChange }: { activeView: View; onViewChange: (v: View) => void }) {
  const { user }    = useUser()
  const { signOut } = useClerk()

  const initials = user?.firstName?.[0] && user?.lastName?.[0]
    ? `${user.firstName[0]}${user.lastName[0]}`
    : user?.emailAddresses?.[0]?.emailAddress?.slice(0, 2).toUpperCase() || 'TV'

  const displayName = user?.firstName || user?.emailAddresses?.[0]?.emailAddress?.split('@')[0] || 'Member'
  const fundName    = (user?.publicMetadata?.fund as string) || 'VCC Member'

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
            TV
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="font-semibold text-foreground text-sm">Techosystem</span>
            <span className="text-xs text-muted-foreground">VCC Hub</span>
          </div>
        </div>
      </SidebarHeader>

      <Separator className="mx-4 w-auto" />

      <SidebarContent className="p-2">
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.id}>
              <SidebarMenuButton
                isActive={activeView === item.id}
                onClick={() => onViewChange(item.id)}
                tooltip={item.label}
                className="gap-3"
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <Separator className="mb-4" />
        <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-sm font-medium text-foreground flex-shrink-0">
            {initials}
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden min-w-0">
            <span className="text-sm font-medium text-foreground truncate">{displayName}</span>
            <span className="text-xs text-muted-foreground truncate">{fundName}</span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => signOut({ redirectUrl: '/sign-in' })}
          className="mt-3 w-full justify-start gap-2 text-muted-foreground hover:text-foreground group-data-[collapsible=icon]:justify-center"
        >
          <LogOut className="h-4 w-4" />
          <span className="group-data-[collapsible=icon]:hidden">Sign Out</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  )
}

export default function Home() {
  const [activeView, setActiveView] = useState<View>('deal-room')

  return (
    <SidebarProvider>
      <AppSidebar activeView={activeView} onViewChange={setActiveView} />
      <SidebarInset>
        <header className="flex h-14 items-center gap-4 border-b px-6">
          <SidebarTrigger />
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-foreground">
              {navItems.find((item) => item.id === activeView)?.label}
            </h1>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6">
          {activeView === 'deal-room'     && <DealRoomView />}
          {activeView === 'smart-matches' && <SmartMatchesView />}
          {activeView === 'analytics'     && <AnalyticsView />}
          {activeView === 'my-criteria'   && <MyCriteriaView />}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
