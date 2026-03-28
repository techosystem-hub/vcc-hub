'use client'

import { useState, useEffect } from 'react'
import { Briefcase, Sparkles, BarChart3, Settings, LogOut, Bookmark } from 'lucide-react'
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
import { SavedStartupsView } from '@/components/views/saved-startups-view'

type View = 'deal-room' | 'smart-matches' | 'analytics' | 'my-criteria' | 'saved-startups'

type DealFilter = {
  years?: string[]
  verticals?: string[]
  dateFrom?: string
  viewMode?: 'analytics' | 'deals'
}

const navItems = [
  { id: 'analytics' as View, label: 'Dashboard', icon: BarChart3 },
  { id: 'deal-room' as View, label: 'Deal Flow Database', icon: Briefcase },
  { id: 'smart-matches' as View, label: 'Smart Matches', icon: Sparkles },
  { id: 'saved-startups' as View, label: 'Saved Startups', icon: Bookmark },
  { id: 'my-criteria' as View, label: 'My Criteria', icon: Settings },
]

function AppSidebar({ activeView, onViewChange }: { activeView: View; onViewChange: (v: View) => void }) {
  const { user } = useUser()
  const { signOut } = useClerk()

  const initials =
    user?.firstName?.[0] && user?.lastName?.[0]
      ? `${user.firstName[0]}${user.lastName[0]}`
      : user?.emailAddresses?.[0]?.emailAddress?.slice(0, 2).toUpperCase() || 'TV'

  const displayName =
    user?.firstName || user?.emailAddresses?.[0]?.emailAddress?.split('@')[0] || 'Member'

  const fundName = (user?.publicMetadata?.fund as string) || 'VCC Member'

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-lg flex-shrink-0 font-black text-white text-lg select-none"
            style={{ background: '#e71d36', fontFamily: 'Georgia, serif', letterSpacing: '-1px' }}
          >
            T
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="font-bold text-sm tracking-wide" style={{ color: '#011627' }}>Techosystem</span>
            <span className="text-xs text-muted-foreground">VCC Intelligence Hub</span>
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
  const [activeView, setActiveView] = useState<View>('analytics')
  const [dealFilter, setDealFilter] = useState<DealFilter | undefined>()

  useEffect(() => {
    const saved = localStorage.getItem('vcc_active_view') as View | null
    if (saved && navItems.some((i) => i.id === saved)) {
      setActiveView(saved)
    }
  }, [])

  const handleViewChange = (v: View) => {
    setActiveView(v)
    localStorage.setItem('vcc_active_view', v)
  }

  return (
    <SidebarProvider>
      <AppSidebar activeView={activeView} onViewChange={handleViewChange} />
      <SidebarInset>
        <header className="flex h-14 items-center gap-4 border-b px-6">
          <SidebarTrigger />
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-foreground">
              {navItems.find((item) => item.id === activeView)?.label}
            </h1>
          </div>
          <div className="flex items-center gap-2 select-none">
            <div
              className="h-7 w-7 rounded-md flex items-center justify-center text-white font-black text-base"
              style={{ background: '#e71d36', fontFamily: 'Georgia, serif' }}
            >
              T
            </div>
            <span className="text-sm font-semibold hidden sm:block" style={{ color: '#011627' }}>
              Techosystem
            </span>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6">
          {activeView === 'deal-room' && <DealRoomView initialFilter={dealFilter} />}
          {activeView === 'smart-matches' && <SmartMatchesView />}
          {activeView === 'analytics' && (
            <AnalyticsView
              onNavigate={(v, filter) => {
                setDealFilter(filter)
                handleViewChange(v as View)
              }}
            />
          )}
          {activeView === 'my-criteria' && <MyCriteriaView />}
          {activeView === 'saved-startups' && <SavedStartupsView />}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
