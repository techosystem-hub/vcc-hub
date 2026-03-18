'use client'

import { useState, useEffect } from 'react'
import { Save, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const VERTICALS  = ['AI', 'Defense', 'SaaS', 'EdTech', 'HealthTech', 'FinTech']
const STAGES     = ['Pre-seed', 'Seed', 'Series A', 'Series B+']

export function MyCriteriaView() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [saved, setSaved]     = useState(false)
  const [formData, setFormData] = useState({
    fundName:       '',
    contactPerson:  '',
    primaryFocus:   [] as string[],
    stagePreference:[] as string[],
    ticketSize:     '',
    dualUsePolicy:  'Agnostic',
    description:    '',
  })

  useEffect(() => {
    fetch('/api/investor')
      .then(r => r.json())
      .then(investor => {
        if (investor) {
          setFormData({
            fundName:       investor.name || '',
            contactPerson:  investor.whatsapp || '',
            primaryFocus:   investor.focusVerticals || [],
            stagePreference:investor.stagePreference || [],
            ticketSize:     investor.ticketSize?.[0] || '',
            dualUsePolicy:  investor.dualUsePolicy || 'Agnostic',
            description:    investor.description || '',
          })
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const toggle = (field: 'primaryFocus' | 'stagePreference', value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value) ? prev[field].filter(v => v !== value) : [...prev[field], value],
    }))
    setSaved(false)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await fetch('/api/investor', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          focusVerticals:  formData.primaryFocus,
          stagePreference: formData.stagePreference,
          ticketSize:      formData.ticketSize ? [formData.ticketSize] : [],
          dualUsePolicy:   formData.dualUsePolicy,
          description:     formData.description,
        }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="flex items-center justify-center py-20 text-muted-foreground">Loading your criteria…</div>

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-foreground">Your Investment Mandate</h1>
        <p className="text-muted-foreground">Configure your criteria for personalized Smart Matchmaking</p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Fund Information</CardTitle><CardDescription>Your fund details for deal matching</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fundName">Fund Name</Label>
                <Input id="fundName" value={formData.fundName} disabled className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactPerson">WhatsApp / Contact</Label>
                <Input id="contactPerson" value={formData.contactPerson} onChange={e => { setFormData(p => ({ ...p, contactPerson: e.target.value })); setSaved(false) }} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Investment Focus</CardTitle><CardDescription>Select your primary investment verticals</CardDescription></CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {VERTICALS.map(v => (
                <div key={v} className="flex items-center space-x-3">
                  <Checkbox id={`v-${v}`} checked={formData.primaryFocus.includes(v)} onCheckedChange={() => toggle('primaryFocus', v)} />
                  <Label htmlFor={`v-${v}`} className="text-sm font-normal cursor-pointer">{v}</Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Stage Preference</CardTitle><CardDescription>Which investment stages do you focus on?</CardDescription></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              {STAGES.map(s => (
                <div key={s} className="flex items-center space-x-3">
                  <Checkbox id={`s-${s}`} checked={formData.stagePreference.includes(s)} onCheckedChange={() => toggle('stagePreference', s)} />
                  <Label htmlFor={`s-${s}`} className="text-sm font-normal cursor-pointer">{s}</Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Standard Ticket Size</CardTitle><CardDescription>Your typical investment amount per deal</CardDescription></CardHeader>
          <CardContent>
            <Select value={formData.ticketSize} onValueChange={v => { setFormData(p => ({ ...p, ticketSize: v })); setSaved(false) }}>
              <SelectTrigger className="w-full sm:w-[280px]"><SelectValue placeholder="Select ticket size" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="<$50k">&lt;$50K</SelectItem>
                <SelectItem value="$50k-$200k">$50K – $200K</SelectItem>
                <SelectItem value="$200k-$500k">$200K – $500K</SelectItem>
                <SelectItem value="$500k-$1M+">$500K – $1M+</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Dual-Use / Defense Policy</CardTitle><CardDescription>Your stance on defense and dual-use technology investments</CardDescription></CardHeader>
          <CardContent>
            <RadioGroup value={formData.dualUsePolicy} onValueChange={v => { setFormData(p => ({ ...p, dualUsePolicy: v })); setSaved(false) }} className="space-y-3">
              <div className="flex items-center space-x-3"><RadioGroupItem value="Agnostic" id="d-agnostic" /><Label htmlFor="d-agnostic" className="font-normal cursor-pointer">Agnostic (any)</Label></div>
              <div className="flex items-center space-x-3"><RadioGroupItem value="Non-lethal only" id="d-nonlethal" /><Label htmlFor="d-nonlethal" className="font-normal cursor-pointer">Non-lethal only</Label></div>
              <div className="flex items-center space-x-3"><RadioGroupItem value="No military" id="d-no" /><Label htmlFor="d-no" className="font-normal cursor-pointer">No military / defense investments</Label></div>
            </RadioGroup>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSave} className="gap-2" disabled={saving || saved}>
            {saved   ? <><Check className="h-4 w-4" /> Saved</>
              : saving ? 'Saving…'
              : <><Save className="h-4 w-4" /> Save Criteria</>}
          </Button>
        </div>
      </div>
    </div>
  )
}
