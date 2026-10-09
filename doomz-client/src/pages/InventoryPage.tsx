import { Minus, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useApi } from "@/hooks/use-api"
import { listInventory, updateInventoryItem, type InventoryItem } from "@/lib/api"
import { Banner } from "./PlansPage"
import { useState } from "react"

function ItemRow({ item, onChanged }: { item: InventoryItem; onChanged: () => void }) {
  const [error, setError] = useState<string>()
  const pct = Math.min(100, (item.quantity / item.capacity) * 100)

  const adjust = async (delta: number) => {
    setError(undefined)
    try {
      await updateInventoryItem(item.id, { delta })
      onChanged()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      onChanged()
    }
  }

  return (
    <div className="py-3">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">{item.name}</div>
          <div className="text-xs text-muted-foreground">
            {item.unit} · lv{item.level}
          </div>
        </div>
        <div className="w-32">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>
              {item.quantity}/{item.capacity}
            </span>
            <span>{Math.round(pct)}%</span>
          </div>
          <div className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className={item.quantity <= item.capacity * 0.15 ? "h-full bg-destructive" : "h-full bg-primary"}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
        <div className="flex items-center gap-1">
          {[-10, -1, 1, 10].map((d) => (
            <Button
              key={d}
              variant="outline"
              size="icon-xs"
              aria-label={d > 0 ? `Add ${d}` : `Remove ${-d}`}
              onClick={() => adjust(d)}
            >
              {Math.abs(d) === 1 ? (d > 0 ? <Plus /> : <Minus />) : d > 0 ? `+${d}` : `${d}`}
            </Button>
          ))}
        </div>
      </div>
      {error && <div className="mt-1 text-xs text-destructive">{error}</div>}
    </div>
  )
}

export default function InventoryPage() {
  const { data, loading, error, reload } = useApi(() => listInventory(), [])
  const groups = new Map<string, InventoryItem[]>()
  for (const item of data ?? []) {
    const list = groups.get(item.category) ?? []
    list.push(item)
    groups.set(item.category, list)
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Stockpile</h1>
        <p className="text-sm text-muted-foreground">Reserves and consumables. Completing plan steps can deduct items.</p>
      </div>
      {error && <Banner text={error.message} tone="error" />}
      {loading ? (
        <Skeleton className="h-64" />
      ) : (
        [...groups.entries()].map(([category, items]) => (
          <section key={category} className="rounded-xl border border-border bg-card p-4">
            <h2 className="mb-1 text-sm font-medium text-muted-foreground">{category}</h2>
            <div className="divide-y divide-border">
              {items.map((item) => (
                <ItemRow key={item.id} item={item} onChanged={reload} />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  )
}
