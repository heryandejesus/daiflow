import { useEffect, useRef, useState } from 'react'
import WaterProgressCard from '../components/water/WaterProgressCard'
import { DAILY_WATER_GOAL_ML } from '../constants/water'
import { useLocalDay } from '../day/LocalDayProvider'
import { supabase } from '../lib/supabase'

interface WaterEntry {
  id: string
  amount: number
  occurredAt: string
}

interface WaterEntryRow {
  id: string
  amount_ml: number
  occurred_at: string
}

function mapWaterEntry(row: WaterEntryRow): WaterEntry {
  return {
    id: row.id,
    amount: row.amount_ml,
    occurredAt: row.occurred_at,
  }
}

async function fetchWaterEntries(localDate: string) {
  try {
    const { data, error } = await supabase
      .from('water_entries')
      .select('id,amount_ml,occurred_at')
      .eq('local_date', localDate)
      .order('occurred_at', { ascending: true })

    return error ? null : (data ?? []).map(mapWaterEntry)
  } catch {
    return null
  }
}

function WaterPage() {
  const { localDate } = useLocalDay()
  const [entries, setEntries] = useState<WaterEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [isUndoing, setIsUndoing] = useState(false)
  const addingRef = useRef(false)
  const undoingRef = useRef(false)
  const [loadedDate, setLoadedDate] = useState<string | null>(null)
  const mountedRef = useRef(true)
  const currentLocalDateRef = useRef(localDate)

  useEffect(() => {
    currentLocalDateRef.current = localDate
  }, [localDate])

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    let ignore = false

    void Promise.resolve().then(async () => {
      if (ignore) return

      addingRef.current = false
      undoingRef.current = false
      setIsAdding(false)
      setIsUndoing(false)
      setEntries([])
      setLoadError(null)
      setActionError(null)
      setLoading(true)

      const waterEntries = await fetchWaterEntries(localDate)
      if (ignore) return

      if (waterEntries === null) {
        setLoadError('No pudimos cargar tu hidratación de hoy.')
      } else {
        setEntries(waterEntries)
      }

      setLoadedDate(localDate)
      setLoading(false)
    })

    return () => {
      ignore = true
    }
  }, [localDate])

  async function retryLoad() {
    const requestDate = localDate
    setLoadError(null)
    setLoading(true)

    const waterEntries = await fetchWaterEntries(requestDate)

    if (!mountedRef.current || currentLocalDateRef.current !== requestDate) {
      return
    }

    if (waterEntries === null) {
      setLoadError('No pudimos cargar tu hidratación de hoy.')
    } else {
      setEntries(waterEntries)
    }

    setLoadedDate(requestDate)
    setLoading(false)
  }

  async function addWater(amount: number) {
    if (addingRef.current || undoingRef.current) return

    const operationDate = localDate
    addingRef.current = true
    setIsAdding(true)
    setActionError(null)

    try {
      const { data, error } = await supabase
        .from('water_entries')
        .insert({
          local_date: operationDate,
          amount_ml: amount,
        })
        .select('id,amount_ml,occurred_at')
        .single()

      if (!mountedRef.current || currentLocalDateRef.current !== operationDate) {
        return
      }

      if (error) {
        setActionError('No pudimos registrar el agua. Intentá nuevamente.')
        return
      }

      setEntries((currentEntries) => [
        ...currentEntries,
        mapWaterEntry(data),
      ])
    } catch {
      if (mountedRef.current && currentLocalDateRef.current === operationDate) {
        setActionError('No pudimos registrar el agua. Intentá nuevamente.')
      }
    } finally {
      if (mountedRef.current && currentLocalDateRef.current === operationDate) {
        addingRef.current = false
        setIsAdding(false)
      }
    }
  }

  async function undoLastEntry() {
    if (addingRef.current || undoingRef.current) return

    const operationDate = localDate
    const lastEntry = entries.at(-1)

    if (!lastEntry) return

    undoingRef.current = true
    setIsUndoing(true)
    setActionError(null)

    try {
      const { error } = await supabase
        .from('water_entries')
        .delete()
        .eq('id', lastEntry.id)
        .eq('local_date', operationDate)

      if (!mountedRef.current || currentLocalDateRef.current !== operationDate) {
        return
      }

      if (error) {
        setActionError(
          'No pudimos deshacer la última carga. Intentá nuevamente.',
        )
        return
      }

      setEntries((currentEntries) =>
        currentEntries.filter((entry) => entry.id !== lastEntry.id),
      )
    } catch {
      if (mountedRef.current && currentLocalDateRef.current === operationDate) {
        setActionError(
          'No pudimos deshacer la última carga. Intentá nuevamente.',
        )
      }
    } finally {
      if (mountedRef.current && currentLocalDateRef.current === operationDate) {
        undoingRef.current = false
        setIsUndoing(false)
      }
    }
  }

  const totalMl = entries.reduce(
    (total, entry) => total + entry.amount,
    0,
  )
  const progress =
    DAILY_WATER_GOAL_ML > 0
      ? Math.min(
          Math.round((totalMl / DAILY_WATER_GOAL_ML) * 100),
          100,
        )
      : 0

  return (
    <div className="space-y-5">
      <section>
        <h1 className="text-2xl font-semibold tracking-tight text-navy">
          Agua
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tu hidratación de hoy
        </p>
      </section>

      {loading || loadedDate !== localDate ? (
        <div
          role="status"
          aria-live="polite"
          className="rounded-card border border-border bg-surface p-5 text-sm text-muted-foreground shadow-soft"
        >
          Cargando tu hidratación de hoy…
        </div>
      ) : loadError ? (
        <div className="rounded-card border border-coral/25 bg-surface p-5 shadow-soft">
          <p role="alert" className="text-sm font-medium text-navy">
            {loadError}
          </p>
          <button
            type="button"
            onClick={() => void retryLoad()}
            className="mt-4 min-h-11 rounded-button bg-mint px-5 py-2 text-sm font-semibold text-navy transition-colors hover:bg-mint/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
          >
            Reintentar
          </button>
        </div>
      ) : (
        <>
          {actionError ? (
            <p
              role="alert"
              className="rounded-control border border-coral/25 bg-coral/10 px-4 py-3 text-sm font-medium text-navy"
            >
              {actionError}
            </p>
          ) : null}

          <WaterProgressCard
            totalMl={totalMl}
            dailyGoal={DAILY_WATER_GOAL_ML}
            progress={progress}
            canUndo={entries.length > 0}
            isAdding={isAdding}
            isUndoing={isUndoing}
            onAddWater={(amount) => void addWater(amount)}
            onUndo={() => void undoLastEntry()}
          />

          <section className="rounded-card border border-border bg-surface p-5 shadow-soft">
            <h2 className="text-lg font-semibold text-navy">Hoy</h2>

            {entries.length > 0 ? (
              <ul className="mt-4 divide-y divide-border">
                {entries
                  .slice()
                  .reverse()
                  .map((entry) => (
                    <li
                      key={entry.id}
                      className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
                    >
                      <span className="text-sm text-muted-foreground">
                        {new Intl.DateTimeFormat('es-AR', {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: false,
                        }).format(new Date(entry.occurredAt))}
                      </span>
                      <span className="font-semibold text-navy">
                        +{entry.amount} ml
                      </span>
                    </li>
                  ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">
                Todavía no registraste agua hoy.
              </p>
            )}
          </section>
        </>
      )}
    </div>
  )
}

export default WaterPage
