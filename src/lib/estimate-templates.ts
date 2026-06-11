export interface EstimateTemplateItem {
  name: string
  description: string
  quantity: number
  unit: string
  unitPrice: number
  costPrice: number
  total: number
  category: string
}

export interface EstimateTemplate {
  id: string
  name: string
  items: EstimateTemplateItem[]
}

export const ESTIMATE_TEMPLATES: EstimateTemplate[] = [
  {
    id: 'construction',
    name: 'Строительные работы',
    items: [
      {
        name: 'Земляные работы',
        description: 'Разработка грунта',
        quantity: 1,
        unit: 'м³',
        unitPrice: 500,
        costPrice: 300,
        total: 500,
        category: 'Работы',
      },
      {
        name: 'Бетонные работы',
        description: 'Заливка фундамента',
        quantity: 1,
        unit: 'м³',
        unitPrice: 3000,
        costPrice: 2000,
        total: 3000,
        category: 'Работы',
      },
      {
        name: 'Кирпичная кладка',
        description: 'Кладка стен',
        quantity: 1,
        unit: 'м²',
        unitPrice: 2000,
        costPrice: 1200,
        total: 2000,
        category: 'Работы',
      },
    ],
  },
  {
    id: 'renovation',
    name: 'Ремонтные работы',
    items: [
      {
        name: 'Демонтаж',
        description: 'Снос старых конструкций',
        quantity: 1,
        unit: 'м²',
        unitPrice: 500,
        costPrice: 300,
        total: 500,
        category: 'Работы',
      },
      {
        name: 'Штукатурка',
        description: 'Выравнивание стен',
        quantity: 1,
        unit: 'м²',
        unitPrice: 800,
        costPrice: 400,
        total: 800,
        category: 'Работы',
      },
      {
        name: 'Покраска',
        description: 'Финишная отделка',
        quantity: 1,
        unit: 'м²',
        unitPrice: 300,
        costPrice: 150,
        total: 300,
        category: 'Работы',
      },
    ],
  },
]
