import AddDealForm, { type SelectOptions } from './AddDealForm'

const BASE_ID  = 'appzew2eaB6QOy0RF'
const TABLE_ID = 'tblFoWnsAmc40zupt'

const FIELD = {
  vertical:       'fld8vlgdSARM8rBws',
  bornYear:       'fldoLWa6mJvKeezd1',
  roundStage:     'fldQb64YYoL1quoUe',
  currency:       'fldFJ61ucHzAlzDLg',
  investmentType: 'fld3ZtKwRpoPltNsR',
}

const FALLBACK: SelectOptions = {
  verticals:       ['Aerospace','Agrifood','Business Productivity','Communications','Cybersecurity','Defense','Education','Energy & Environment','Finance','Gaming','Healthcare','HR','Legal','Logistics & Transportation','Marketing & Media','Property & Construction','Travel & Leisure'],
  stages:          ['Pre-seed','Seed','Angel','Series A','Series B','Series C','Series D','Growth','Corporate funding','Non-disclosed'],
  currencies:      ['USD','EUR','PLN','GBP','UAH','Non-disclosed'],
  investmentTypes: ['New','Follow-up'],
  bornYears:       ['2026','2025','2024','2023','2022','2021','2020','2019','2018','2017','2016','2015','2014','2013','2012','2009','2006','2000','1998','Non-disclosed'],
}

async function fetchSelectOptions(): Promise<SelectOptions | null> {
  try {
    const res = await fetch(
      `https://api.airtable.com/v0/meta/bases/${BASE_ID}/tables`,
      {
        headers: { Authorization: `Bearer ${process.env.AIRTABLE_API_TOKEN}` },
        next: { revalidate: 3600 },
      }
    )
    if (!res.ok) return null
    const data  = await res.json()
    const table = data.tables?.find((t: any) => t.id === TABLE_ID)
    if (!table) return null
    const getChoices = (fieldId: string): string[] =>
      table.fields.find((f: any) => f.id === fieldId)?.options?.choices?.map((c: any) => c.name as string).filter(Boolean) ?? []
    const rawYears  = getChoices(FIELD.bornYear).filter(y => y !== 'Non-disclosed')
    const bornYears = [...rawYears.sort((a, b) => Number(b) - Number(a)), 'Non-disclosed']
    return {
      verticals:       getChoices(FIELD.vertical),
      stages:          getChoices(FIELD.roundStage),
      currencies:      getChoices(FIELD.currency),
      investmentTypes: getChoices(FIELD.investmentType),
      bornYears,
    }
  } catch { return null }
}

export default async function AddDealPage() {
  const options = (await fetchSelectOptions()) ?? FALLBACK
  return <AddDealForm options={options} />
}
