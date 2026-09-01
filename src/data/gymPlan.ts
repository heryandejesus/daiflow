export type GymWorkoutDayId = 'day-1' | 'day-2'

export interface GymExercise {
  readonly id: string
  readonly name: string
  readonly sets: number
  readonly targetReps: number
  readonly prescription: string
  readonly loadLabel?: string
}

export interface GymWorkoutDay {
  readonly id: GymWorkoutDayId
  readonly title: string
  readonly exercises: readonly GymExercise[]
}

export const gymPlan: readonly GymWorkoutDay[] = [
  {
    id: 'day-1',
    title: 'Día 1',
    exercises: [
      {
        id: 'remo-alto',
        name: 'Remo alto',
        sets: 4,
        targetReps: 15,
        prescription: '15/20 kg',
      },
      {
        id: 'remo-con-mancuernas',
        name: 'Remo con mancuernas',
        sets: 4,
        targetReps: 12,
        prescription: '4 kg',
      },
      {
        id: 'extension-con-soga',
        name: 'Extensión con soga',
        sets: 4,
        targetReps: 15,
        prescription: '2,5 kg',
      },
      {
        id: 'sillon-cuadriceps',
        name: 'Sillón cuádriceps',
        sets: 4,
        targetReps: 12,
        prescription: '20 kg; últimas dos con 25 kg',
      },
      {
        id: 'prensa',
        name: 'Prensa',
        sets: 4,
        targetReps: 15,
        prescription: '20 kg',
      },
      {
        id: 'elevacion-de-cadera',
        name: 'Elevación de cadera',
        sets: 4,
        targetReps: 12,
        prescription: '16 kg o máquina sin peso / 5 kg',
      },
      {
        id: 'gemelos-parado',
        name: 'Gemelos parado',
        sets: 4,
        targetReps: 15,
        prescription: '16 kg con pesa o Smith con 15 kg por lado',
      },
      {
        id: 'abdominales',
        name: 'Abdominales',
        sets: 4,
        targetReps: 15,
        prescription: 'Clásicos cortos',
      },
    ],
  },
  {
    id: 'day-2',
    title: 'Día 2',
    exercises: [
      {
        id: 'press-barra-plano',
        name: 'Press barra plano',
        sets: 4,
        targetReps: 15,
        prescription:
          '2,5 / 3,75 kg por lado; última con 5 kg por lado',
        loadLabel: 'kg por lado',
      },
      {
        id: 'apertura-en-inclinado',
        name: 'Apertura en inclinado',
        sets: 4,
        targetReps: 12,
        prescription: '3 kg; última con 4 kg',
      },
      {
        id: 'laterales',
        name: 'Laterales',
        sets: 4,
        targetReps: 12,
        prescription: '2 kg',
      },
      {
        id: 'frontales',
        name: 'Frontales',
        sets: 4,
        targetReps: 12,
        prescription: '2 kg',
      },
      {
        id: 'curl-mancuerna-biceps',
        name: 'Curl mancuerna bíceps',
        sets: 4,
        targetReps: 12,
        prescription: '4 kg',
      },
      {
        id: 'sentadilla-con-barra',
        name: 'Sentadilla con barra',
        sets: 4,
        targetReps: 12,
        prescription: '5 kg de cada lado / 7,5/10 kg',
      },
      {
        id: 'peso-muerto',
        name: 'Peso muerto',
        sets: 4,
        targetReps: 12,
        prescription: 'Barra de 25 kg',
      },
      {
        id: 'femoral-en-camilla',
        name: 'Femoral en camilla',
        sets: 4,
        targetReps: 12,
        prescription: '25/30 kg',
      },
      {
        id: 'aductores',
        name: 'Aductores',
        sets: 4,
        targetReps: 15,
        prescription: '15/20 kg',
      },
      {
        id: 'abductores',
        name: 'Abductores',
        sets: 4,
        targetReps: 15,
        prescription: '25/30 kg',
      },
    ],
  },
]
