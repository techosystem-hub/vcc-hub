'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  ComposedChart,
  Legend,
} from 'recharts'
import { analyticsData } from '@/lib/mock-data'
import { TrendingUp, TrendingDown, DollarSign, BarChart3, Users, Target, ArrowUpRight, ArrowDownRight } from 'lucide-react'

function MetricCard({
  title,
  value,
  suffix,
  prefix,
  icon: Icon,
  trend,
  trendLabel,
}: {
  title: string
  value: number | string
  suffix?: string
  prefix?: string
  icon: React.ElementType
  trend?: number
  trendLabel?: string
}) {
  const isPositive = trend && trend > 0
  return (
    <Card className="overflow-hidden">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-semibold tracking-tight text-foreground">
              {prefix}
              {value}
              {suffix && <span className="text-lg font-normal text-muted-foreground">{suffix}</span>}
            </p>
            {trend !== undefined && (
              <div className="flex items-center gap-1 pt-1">
                {isPositive ? (
                  <ArrowUpRight className="h-3.5 w-3.5 text-emerald-600" />
                ) : (
                  <ArrowDownRight className="h-3.5 w-3.5 text-red-500" />
                )}
                <span className={`text-xs font-medium ${isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
                  {isPositive ? '+' : ''}{trend}%
                </span>
                {trendLabel && <span className="text-xs text-muted-foreground">{trendLabel}</span>}
              </div>
            )}
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function CustomTooltip({ active, payload, label, formatter }: { active?: boolean; payload?: Array<{ value: number; dataKey: string; color?: string }>; label?: string; formatter?: (value: number, name: string) => string }) {
  if (!active || !payload) return null
  return (
    <div className="rounded-lg border border-border/50 bg-card px-3 py-2 shadow-xl">
      <p className="mb-1.5 text-xs font-medium text-foreground">{label}</p>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2 text-xs">
          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-muted-foreground capitalize">{entry.dataKey.replace(/([A-Z])/g, ' $1').trim()}:</span>
          <span className="font-medium text-foreground">
            {formatter ? formatter(entry.value, entry.dataKey) : entry.value}
          </span>
        </div>
      ))}
    </div>
  )
}

export function AnalyticsView() {
  const { roundsByVertical, capitalByQuarter, stageDistribution, investorActivity, monthlyTrend, summaryMetrics } = analyticsData

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Market Analytics
          </h1>
          <p className="text-sm text-muted-foreground">Ukrainian Tech Ecosystem Deal Flow - 2024/2025</p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-medium text-muted-foreground">Live Data</span>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Rounds"
          value={summaryMetrics.totalRounds}
          icon={TrendingUp}
          trend={summaryMetrics.qoqGrowth}
          trendLabel="vs last quarter"
        />
        <MetricCard
          title="Capital Deployed"
          value={summaryMetrics.totalFunding}
          prefix="$"
          suffix="M"
          icon={DollarSign}
          trend={18}
          trendLabel="YoY growth"
        />
        <MetricCard
          title="Avg Deal Size"
          value={summaryMetrics.avgDealSize}
          prefix="$"
          suffix="M"
          icon={BarChart3}
          trend={12}
          trendLabel="vs 2023"
        />
        <MetricCard
          title="Active Investors"
          value={summaryMetrics.activeInvestors}
          icon={Users}
          trend={24}
          trendLabel="new this year"
        />
      </div>

      {/* Main Charts Row */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Area Chart - Monthly Trend (larger) */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-medium">Monthly Deal Flow</CardTitle>
                <CardDescription>Deals closed and capital deployed (TTM)</CardDescription>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-primary" />
                  <span className="text-muted-foreground">Capital ($M)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  <span className="text-muted-foreground">Deals</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={monthlyTrend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="capitalGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" vertical={false} />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 11 }} 
                    tickLine={false} 
                    axisLine={false}
                    className="fill-muted-foreground"
                  />
                  <YAxis 
                    yAxisId="capital"
                    tick={{ fontSize: 11 }} 
                    tickLine={false} 
                    axisLine={false}
                    tickFormatter={(v) => `$${v}M`}
                    className="fill-muted-foreground"
                  />
                  <YAxis 
                    yAxisId="deals"
                    orientation="right"
                    tick={{ fontSize: 11 }} 
                    tickLine={false} 
                    axisLine={false}
                    className="fill-muted-foreground"
                  />
                  <Tooltip content={<CustomTooltip formatter={(v, k) => k === 'capital' ? `$${v}M` : `${v} deals`} />} />
                  <Area
                    yAxisId="capital"
                    type="monotone"
                    dataKey="capital"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fill="url(#capitalGradient)"
                  />
                  <Line
                    yAxisId="deals"
                    type="monotone"
                    dataKey="deals"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ fill: '#10b981', strokeWidth: 0, r: 3 }}
                    activeDot={{ r: 5, strokeWidth: 0 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Vertical Distribution */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Rounds by Vertical</CardTitle>
            <CardDescription>Distribution with YoY growth rates</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {roundsByVertical.map((item, index) => {
                const colors = ['bg-primary', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-violet-500']
                const total = roundsByVertical.reduce((acc, v) => acc + v.value, 0)
                const percentage = ((item.value / total) * 100).toFixed(0)
                return (
                  <div key={item.name} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-foreground">{item.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">{item.value} rounds</span>
                        <span className={`flex items-center gap-0.5 text-xs font-medium ${item.growth > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                          {item.growth > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                          {item.growth > 0 ? '+' : ''}{item.growth}%
                        </span>
                      </div>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${colors[index]}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Capital by Quarter - Bar + Line */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Quarterly Performance</CardTitle>
            <CardDescription>Capital raised and deal count by quarter</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={capitalByQuarter} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={1} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.7} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" vertical={false} />
                  <XAxis 
                    dataKey="quarter" 
                    tick={{ fontSize: 11 }} 
                    tickLine={false} 
                    axisLine={false}
                    className="fill-muted-foreground"
                  />
                  <YAxis 
                    yAxisId="capital"
                    tick={{ fontSize: 11 }} 
                    tickLine={false} 
                    axisLine={false}
                    tickFormatter={(v) => `$${v}M`}
                    className="fill-muted-foreground"
                  />
                  <YAxis 
                    yAxisId="rounds"
                    orientation="right"
                    tick={{ fontSize: 11 }} 
                    tickLine={false} 
                    axisLine={false}
                    className="fill-muted-foreground"
                  />
                  <Tooltip content={<CustomTooltip formatter={(v, k) => k === 'capital' ? `$${v}M` : `${v} rounds`} />} />
                  <Bar 
                    yAxisId="capital"
                    dataKey="capital" 
                    fill="url(#barGradient)" 
                    radius={[4, 4, 0, 0]} 
                    maxBarSize={40}
                  />
                  <Line
                    yAxisId="rounds"
                    type="monotone"
                    dataKey="rounds"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={{ fill: '#f59e0b', strokeWidth: 0, r: 3 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Stage Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Stage Distribution</CardTitle>
            <CardDescription>Deals and capital by funding stage</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stageDistribution} layout="vertical" margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" horizontal={false} />
                  <XAxis 
                    type="number" 
                    tick={{ fontSize: 11 }} 
                    tickLine={false} 
                    axisLine={false}
                    className="fill-muted-foreground"
                  />
                  <YAxis 
                    dataKey="stage" 
                    type="category" 
                    tick={{ fontSize: 11 }} 
                    tickLine={false} 
                    axisLine={false} 
                    width={70}
                    className="fill-muted-foreground"
                  />
                  <Tooltip content={<CustomTooltip formatter={(v, k) => k === 'capital' ? `$${v}M` : k === 'avgCheck' ? `$${v}M avg` : `${v} deals`} />} />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="Deals" maxBarSize={24} />
                  <Bar dataKey="capital" fill="#10b981" radius={[0, 4, 4, 0]} name="Capital ($M)" maxBarSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex items-center justify-center gap-6 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-sm bg-primary" />
                <span className="text-muted-foreground">Deal Count</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />
                <span className="text-muted-foreground">Capital ($M)</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Investors Table */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-medium">Most Active Investors</CardTitle>
              <CardDescription>Top VCs by deal count in the ecosystem</CardDescription>
            </div>
            <Target className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            {investorActivity.map((investor, index) => (
              <div key={investor.name} className="flex items-center gap-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground">{investor.name}</span>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-muted-foreground">{investor.deals} deals</span>
                      <span className="font-medium text-foreground">${investor.deployed}M</span>
                    </div>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-primary/60"
                      style={{ width: `${(investor.deals / investorActivity[0].deals) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
