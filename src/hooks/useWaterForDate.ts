import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { DAILY_WATER_GOAL_ML } from '../constants/water'
import { supabase } from '../lib/supabase'

export interface WaterEntry {
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

async function fetchWaterEntries(selectedDate: string) {
  try {
    const { data, error } = await supabase
      .from('water_entries')
      .select('id,amount_ml,occurred_at')
      .eq('local_date', selectedDate)
      .order('occurred_at', { ascending: true })

    return error ? null : (data ?? []).map(mapWaterEntry)
  } catch {
    return null
  }
}

export function useWaterForDate(selectedDate: string) {
  const [entries, setEntries] = useState<WaterEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [isUndoing, setIsUndoing] = useState(false)
  const addingRef = useRef(false)
  const undoingRef = useRef(false)
  const mountedRef = useRef(true)
  // Each visit gets its own identity, including A -> B -> A.
  const context = useMemo(() => ({ selectedDate }), [selectedDate])
  const activeContextRef = useRef<typeof context | null>(null)
  const loadGenerationRef = useRef(0)
  const readyRef = useRef(false)
  const [loadedContext, setLoadedContext] = useState<typeof context | null>(null)

  // Invalidate before passive effects or late promise callbacks can run.
  useLayoutEffect(() => {
    mountedRef.current = true
    activeContextRef.current = context
    loadGenerationRef.current += 1
    readyRef.current = false
    return () => {
      mountedRef.current = false
      activeContextRef.current = null
      loadGenerationRef.current += 1
      readyRef.current = false
    }
  }, [context])

  useEffect(() => {
    let ignore = false
    const generation = loadGenerationRef.current
    const isCurrent = () =>
      !ignore &&
      mountedRef.current &&
      activeContextRef.current === context &&
      loadGenerationRef.current === generation

    void Promise.resolve().then(async () => {
      if (!isCurrent()) return

      addingRef.current = false
      undoingRef.current = false
      setIsAdding(false)
      setIsUndoing(false)
      setEntries([])
      setLoadError(null)
      setActionError(null)
      setLoading(true)

      const waterEntries = await fetchWaterEntries(selectedDate)
      if (!isCurrent()) return

      if (waterEntries === null) {
        setLoadError('No pudimos cargar tu hidratación de hoy.')
      } else {
        setEntries(waterEntries)
      }

      setLoadedContext(context)
      readyRef.current = waterEntries !== null
      setLoading(false)
    })

    return () => {
      ignore = true
    }
  }, [context, selectedDate])

  async function retryLoad() {
    if (!mountedRef.current || activeContextRef.current !== context) return
    const requestDate = selectedDate
    if (addingRef.current || undoingRef.current) return
    const generation = ++loadGenerationRef.current
    readyRef.current = false
    setLoadError(null)
    setLoading(true)

    const waterEntries = await fetchWaterEntries(requestDate)

    if (
      !mountedRef.current ||
      activeContextRef.current !== context ||
      loadGenerationRef.current !== generation
    ) {
      return
    }

    if (waterEntries === null) {
      setLoadError('No pudimos cargar tu hidratación de hoy.')
    } else {
      setEntries(waterEntries)
    }

    setLoadedContext(context)
    readyRef.current = waterEntries !== null
    setLoading(false)
  }

  async function addWater(amount: number) {
    if (addingRef.current || undoingRef.current) return

    const operationDate = selectedDate
    const operationGeneration = loadGenerationRef.current
    const isCurrentOperation = () =>
      mountedRef.current &&
      activeContextRef.current === context &&
      loadGenerationRef.current === operationGeneration
    if (!isCurrentOperation() || !readyRef.current) return
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

      if (!isCurrentOperation()) {
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
      if (isCurrentOperation()) {
        setActionError('No pudimos registrar el agua. Intentá nuevamente.')
      }
    } finally {
      if (isCurrentOperation()) {
        addingRef.current = false
        setIsAdding(false)
      }
    }
  }

  async function undoLastEntry() {
    if (addingRef.current || undoingRef.current) return

    const operationDate = selectedDate
    const operationGeneration = loadGenerationRef.current
    const isCurrentOperation = () =>
      mountedRef.current &&
      activeContextRef.current === context &&
      loadGenerationRef.current === operationGeneration
    if (!isCurrentOperation() || !readyRef.current) return
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

      if (!isCurrentOperation()) {
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
      if (isCurrentOperation()) {
        setActionError(
          'No pudimos deshacer la última carga. Intentá nuevamente.',
        )
      }
    } finally {
      if (isCurrentOperation()) {
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

  return {
    entries,
    totalMl,
    dailyGoal: DAILY_WATER_GOAL_ML,
    progress,
    loading: loading || loadedContext !== context,
    loadError,
    actionError,
    isAdding,
    isUndoing,
    retryLoad,
    addWater,
    undoLastEntry,
  }
}
