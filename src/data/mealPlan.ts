import { Apple, Coffee, MoonStar, Utensils } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type MealAccent = 'yellow' | 'coral' | 'mint' | 'lavender'

export interface MealPlanItem {
  readonly id: string
  readonly label: string
}

export interface MealPlanEntry {
  readonly id: string
  readonly title: string
  readonly icon: LucideIcon
  readonly accent: MealAccent
  readonly items: readonly MealPlanItem[]
}

export const mealPlan: readonly MealPlanEntry[] = [
  {
    id: 'desayuno',
    title: 'Desayuno',
    icon: Coffee,
    accent: 'yellow',
    items: [
      { id: 'infusion', label: 'Infusión sin azúcar' },
      {
        id: 'pan-integral',
        label: '1 rebanada de pan integral con semillas',
      },
      {
        id: 'queso-descremado',
        label: '1 cucharada sopera de queso descremado Tregar',
      },
      { id: 'palta', label: '½ palta' },
      { id: 'fruta', label: '1 fruta' },
    ],
  },
  {
    id: 'almuerzo',
    title: 'Almuerzo',
    icon: Utensils,
    accent: 'coral',
    items: [
      { id: 'carnes-magras', label: '150 g de carnes magras' },
      {
        id: 'vegetales-c',
        label: '1 unidad mediana de vegetales C',
      },
      {
        id: 'vegetales-a-b',
        label: 'Vegetales A y B, cantidad deseada',
      },
      {
        id: 'aceite-oliva',
        label: '1 cucharada té de aceite de oliva',
      },
      { id: 'fruta', label: '1 fruta' },
    ],
  },
  {
    id: 'merienda',
    title: 'Merienda',
    icon: Apple,
    accent: 'mint',
    items: [
      {
        id: 'yogur-proteina',
        label: '1 pote de yogur natural alto en proteína',
      },
      { id: 'banana', label: '1 banana' },
      { id: 'huevos', label: '2 huevos' },
    ],
  },
  {
    id: 'cena',
    title: 'Cena',
    icon: MoonStar,
    accent: 'lavender',
    items: [
      { id: 'carnes-magras', label: '150 g de carnes magras' },
      {
        id: 'vegetales-a-b',
        label: 'Vegetales A y B, cantidad deseada',
      },
      {
        id: 'aceite-oliva',
        label: '1 cucharada té de aceite de oliva',
      },
    ],
  },
]
