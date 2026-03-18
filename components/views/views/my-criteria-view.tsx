'use client'

import { useState } from 'react'
import { Save, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { verticals, roundStages } from '@/lib/mock-data'

export function MyCriteriaView() {
  const [saved, setSaved] = useState(false)
  const [formData, setFormData] = useState({
    fundName: 'Geek Ventures',
    contactPerson: 'Maksym',
    primaryFocus: ['Defense / MilTech', 'AI / ML'] as string[],
    stagePreference: ['Pre-seed', 'Seed'] as string[],
    ticketSize: '200k-500k',
    dualUsePolicy: 'yes-non-lethal',
  })

  const toggleArrayField = (field: 'primaryFocus' | 'stagePreference', value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((v) => v !== value)
        : [...prev[field], value],
    }))
    setSaved(false)
  }

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-foreground">Your Investment Mandate</h1>
        <p className="text-muted-foreground">
          Configure your criteria for personalized Smart Matchmaking
        </p>
      </div>

      {/* Form */}
      <div className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Fund Information</CardTitle>
            <CardDescription>Your fund details for deal matching</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fundName">Fund Name</Label>
                <Input
                  id="fundName"
                  value={formData.fundName}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, fundName: e.target.value }))
                    setSaved(false)
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactPerson">Contact Person</Label>
                <Input
                  id="contactPerson"
                  value={formData.contactPerson}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, contactPerson: e.target.value }))
                    setSaved(false)
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Investment Focus */}
        <Card>
          <CardHeader>
            <CardTitle>Investment Focus</CardTitle>
            <CardDescription>Select your primary investment verticals</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {verticals.map((vertical) => (
                <div key={vertical} className="flex items-center space-x-3">
                  <Checkbox
                    id={`vertical-${vertical}`}
                    checked={formData.primaryFocus.includes(vertical)}
                    onCheckedChange={() => toggleArrayField('primaryFocus', vertical)}
                  />
                  <Label
                    htmlFor={`vertical-${vertical}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {vertical}
                  </Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Stage Preference */}
        <Card>
          <CardHeader>
            <CardTitle>Stage Preference</CardTitle>
            <CardDescription>Which investment stages do you focus on?</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              {roundStages.map((stage) => (
                <div key={stage} className="flex items-center space-x-3">
                  <Checkbox
                    id={`stage-${stage}`}
                    checked={formData.stagePreference.includes(stage)}
                    onCheckedChange={() => toggleArrayField('stagePreference', stage)}
                  />
                  <Label
                    htmlFor={`stage-${stage}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {stage}
                  </Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Ticket Size */}
        <Card>
          <CardHeader>
            <CardTitle>Standard Ticket Size</CardTitle>
            <CardDescription>Your typical investment amount per deal</CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={formData.ticketSize}
              onValueChange={(value) => {
                setFormData((prev) => ({ ...prev, ticketSize: value }))
                setSaved(false)
              }}
            >
              <SelectTrigger className="w-full sm:w-[280px]">
                <SelectValue placeholder="Select ticket size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="50k-100k">$50K - $100K</SelectItem>
                <SelectItem value="100k-200k">$100K - $200K</SelectItem>
                <SelectItem value="200k-500k">$200K - $500K</SelectItem>
                <SelectItem value="500k-1m">$500K - $1M</SelectItem>
                <SelectItem value="1m-5m">$1M - $5M</SelectItem>
                <SelectItem value="5m+">$5M+</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Dual-Use Policy */}
        <Card>
          <CardHeader>
            <CardTitle>Dual-Use / Defense Policy</CardTitle>
            <CardDescription>
              Your stance on defense and dual-use technology investments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={formData.dualUsePolicy}
              onValueChange={(value) => {
                setFormData((prev) => ({ ...prev, dualUsePolicy: value }))
                setSaved(false)
              }}
              className="space-y-3"
            >
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="yes-all" id="dual-yes-all" />
                <Label htmlFor="dual-yes-all" className="font-normal cursor-pointer">
                  Yes, including lethal systems
                </Label>
              </div>
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="yes-non-lethal" id="dual-yes-non-lethal" />
                <Label htmlFor="dual-yes-non-lethal" className="font-normal cursor-pointer">
                  Yes, non-lethal only (detection, protection, logistics)
                </Label>
              </div>
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="no" id="dual-no" />
                <Label htmlFor="dual-no" className="font-normal cursor-pointer">
                  No defense investments
                </Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} className="gap-2" disabled={saved}>
            {saved ? (
              <>
                <Check className="h-4 w-4" />
                Saved
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Criteria
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
