import { ChevronDown, Search, X } from 'lucide-react'
import { useId, useState } from 'react'
import { foodSelection } from '../../data/foodSelection'

function normalizeSearchText(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('es')
    .trim()
}

function FoodList({ items }: { items: readonly string[] }) {
  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-foreground">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2 leading-5">
          <span
            aria-hidden="true"
            className="mt-2 size-1.5 shrink-0 rounded-full bg-mint"
          />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

function FoodSelectionGuide() {
  const searchId = useId()
  const [query, setQuery] = useState('')
  const normalizedQuery = normalizeSearchText(query)
  const isSearching = normalizedQuery.length > 0
  const filteredCategories = foodSelection
    .map((category) => {
      const categoryMatches = normalizeSearchText(category.title).includes(
        normalizedQuery,
      )

      return {
        ...category,
        items: categoryMatches
          ? category.items
          : category.items.filter((item) =>
              normalizeSearchText(item).includes(normalizedQuery),
            ),
      }
    })
    .filter((category) => !isSearching || category.items.length > 0)

  return (
    <section className="mt-8 border-t border-border pt-7">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-navy">
          Guía de alimentos
        </h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Consultá las opciones de cada categoría del plan.
        </p>
      </div>

      <div className="mt-5 rounded-card border border-lavender/20 bg-surface p-4 shadow-soft">
        <label
          htmlFor={searchId}
          className="text-sm font-semibold text-foreground"
        >
          Buscar alimento
        </label>
        <div className="relative mt-2">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
          />
          <input
            id={searchId}
            type="search"
            value={query}
            placeholder="Ej. tomate, papa, pollo..."
            onChange={(event) => setQuery(event.target.value)}
            className="min-h-12 w-full rounded-control border border-border bg-background py-3 pl-10 pr-12 text-base text-foreground outline-none transition-shadow placeholder:text-muted-foreground focus-visible:border-lavender focus-visible:ring-2 focus-visible:ring-lavender/30"
          />
          {query.length > 0 ? (
            <button
              type="button"
              aria-label="Limpiar búsqueda"
              onClick={() => setQuery('')}
              className="absolute right-1 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-control text-muted-foreground transition-colors hover:bg-lavender/10 hover:text-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
            >
              <X aria-hidden="true" className="size-5" />
            </button>
          ) : null}
        </div>
      </div>

      {filteredCategories.length === 0 ? (
        <p
          role="status"
          className="mt-4 rounded-card border border-border bg-surface p-5 text-sm text-muted-foreground shadow-soft"
        >
          No encontramos ese alimento en la guía.
        </p>
      ) : isSearching ? (
        <div className="mt-4 space-y-3" aria-label="Resultados de búsqueda">
          {filteredCategories.map((category) => (
            <section
              key={category.id}
              className="rounded-card border border-lavender/20 bg-surface p-4 shadow-soft"
            >
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="font-semibold text-navy">{category.title}</h3>
                <p className="shrink-0 text-xs font-medium text-muted-foreground">
                  {category.items.length}{' '}
                  {category.items.length === 1 ? 'opción' : 'opciones'}
                </p>
              </div>
              <div className="mt-4 border-t border-border pt-4">
                <FoodList items={category.items} />
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {foodSelection.map((category) => (
            <details
              key={category.id}
              className="group rounded-card border border-border bg-surface shadow-soft"
            >
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 rounded-card px-4 py-3 text-navy transition-colors hover:bg-lavender/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy [&::-webkit-details-marker]:hidden">
                <span className="font-semibold">{category.title}</span>
                <span className="flex shrink-0 items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    {category.items.length} opciones
                  </span>
                  <ChevronDown
                    aria-hidden="true"
                    className="size-5 text-muted-foreground transition-transform group-open:rotate-180"
                  />
                </span>
              </summary>
              <div className="border-t border-border px-4 py-4">
                <FoodList items={category.items} />
              </div>
            </details>
          ))}
        </div>
      )}
    </section>
  )
}

export default FoodSelectionGuide
