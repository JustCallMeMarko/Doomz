import { useEffect, useState } from "react"
import { Link, useParams, useSearchParams } from "react-router-dom"
import { ChevronRight, LayoutGrid, Minus, PackageOpen, Plus, Table2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { Banner } from "@/components/banner"
import { useApi } from "@/hooks/use-api"
import { cn } from "cn"
import {
  createContainer,
  createItem,
  getContainer,
  listContainers,
  listInventory,
  updateInventoryItem,
  type InventoryContainer,
  type InventoryItem,
} from "@/lib/api"

type ViewMode = "grid" | "table"

const inputCls =
  "w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"

function QtyControls({ onAdjust }: { onAdjust: (delta: number) => void }) {
  return (
    <div className="flex items-center gap-1">
      {[-10, -1, 1, 10].map((d) => (
        <Button
          key={d}
          variant="outline"
          size="icon-xs"
          aria-label={d > 0 ? `Add ${d}` : `Remove ${-d}`}
          onClick={() => onAdjust(d)}
        >
          {Math.abs(d) === 1 ? (d > 0 ? <Plus /> : <Minus />) : d > 0 ? `+${d}` : `${d}`}
        </Button>
      ))}
    </div>
  )
}

function FillBar({ item }: { item: InventoryItem }) {
  const pct = Math.min(100, (item.quantity / item.capacity) * 100)
  return (
    <div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>
          {item.quantity} {item.unit}
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
  )
}

function ItemCard({ item, adjust }: { item: InventoryItem; adjust: (id: string, delta: number) => void }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-sm font-medium">{item.name}</div>
          <div className="text-xs text-muted-foreground">
            {item.category} · lv{item.level}
          </div>
        </div>
        <QtyControls onAdjust={(d) => adjust(item.id, d)} />
      </div>
      <div className="mt-3">
        <FillBar item={item} />
      </div>
    </div>
  )
}

function ItemsSkeleton({ mode }: { mode: ViewMode }) {
  if (mode === "table") {
    return (
      <div className="space-y-2 rounded-xl border border-border bg-card p-3">
        <Skeleton className="h-5 w-full" />
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-9 w-full" />
        ))}
      </div>
    )
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="rounded-xl border border-border bg-card p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-6 w-24" />
          </div>
          <div className="mt-3 space-y-1.5">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-1.5 w-full" />
          </div>
        </div>
      ))}
    </div>
  )
}

function ContainersSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i} className="space-y-2 rounded-xl border border-border bg-card p-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-16" />
          <Skeleton className="mt-3 h-3 w-12" />
        </div>
      ))}
    </div>
  )
}

function ItemTable({ items, adjust, showContainer }: { items: InventoryItem[]; adjust: (id: string, delta: number) => void; showContainer: boolean }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs text-muted-foreground">
            <th className="px-3 py-2 font-medium">Item</th>
            <th className="px-3 py-2 font-medium">Category</th>
            {showContainer && <th className="px-3 py-2 font-medium">Container</th>}
            <th className="w-40 px-3 py-2 font-medium">Stock</th>
            <th className="px-3 py-2 font-medium" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {items.map((item) => (
            <tr key={item.id}>
              <td className="px-3 py-2 font-medium">{item.name}</td>
              <td className="px-3 py-2 text-muted-foreground">{item.category}</td>
              {showContainer && <td className="px-3 py-2 text-muted-foreground">{item.containerId ?? "—"}</td>}
              <td className="px-3 py-2">
                <FillBar item={item} />
              </td>
              <td className="px-3 py-2">
                <QtyControls onAdjust={(d) => adjust(item.id, d)} />
              </td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr>
              <td colSpan={showContainer ? 5 : 4} className="px-3 py-8 text-center text-sm text-muted-foreground">
                No items.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

function AddItemSheet({
  open,
  onOpenChange,
  containers,
  containerId,
  onDone,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  containers: InventoryContainer[]
  containerId?: string
  onDone: () => void
}) {
  const [form, setForm] = useState({ name: "", category: "General", unit: "units", quantity: "0", capacity: "", containerId: "" })
  const [error, setError] = useState<string>()
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (open) setForm((f) => ({ ...f, containerId: containerId ?? "" }))
  }, [open, containerId])

  const submit = async () => {
    setBusy(true)
    setError(undefined)
    try {
      await createItem({
        name: form.name.trim(),
        category: form.category.trim() || "General",
        unit: form.unit.trim() || "units",
        quantity: Number(form.quantity) || 0,
        capacity: Number(form.capacity),
        containerId: form.containerId || null,
      })
      onOpenChange(false)
      setForm({ name: "", category: "General", unit: "units", quantity: "0", capacity: "", containerId: "" })
      onDone()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add item")
    } finally {
      setBusy(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Add item</SheetTitle>
          <SheetDescription>Stock a new resource in the inventory.</SheetDescription>
        </SheetHeader>
        <div className="space-y-3 p-4">
          <Input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          <div className="grid grid-cols-3 gap-2">
            <Input placeholder="Unit" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
            <Input placeholder="Qty" type="number" min={0} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
            <Input placeholder="Capacity" type="number" min={1} value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
          </div>
          <select
            value={form.containerId}
            onChange={(e) => setForm({ ...form, containerId: e.target.value })}
            className={cn(inputCls, "h-9")}
          >
            <option value="">No container</option>
            {containers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {error && <Banner text={error} tone="error" />}
          <Button onClick={submit} disabled={busy || !form.name.trim() || !form.capacity}>
            Add item
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function AddContainerSheet({ open, onOpenChange, onDone }: { open: boolean; onOpenChange: (open: boolean) => void; onDone: () => void }) {
  const [form, setForm] = useState({ name: "", description: "", location: "" })
  const [error, setError] = useState<string>()
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    setBusy(true)
    setError(undefined)
    try {
      await createContainer({ name: form.name.trim(), description: form.description.trim(), location: form.location.trim() })
      onOpenChange(false)
      setForm({ name: "", description: "", location: "" })
      onDone()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add container")
    } finally {
      setBusy(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Add container</SheetTitle>
          <SheetDescription>Create a box, shelf or cache that holds items.</SheetDescription>
        </SheetHeader>
        <div className="space-y-3 p-4">
          <Input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          <Input placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          {error && <Banner text={error} tone="error" />}
          <Button onClick={submit} disabled={busy || !form.name.trim()}>
            Add container
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

export default function InventoryPage() {
  const { containerId } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const mode: ViewMode = searchParams.get("view") === "table" ? "table" : "grid"
  const setMode = (m: ViewMode) => setSearchParams(m === "table" ? { view: "table" } : {}, { replace: true })
  const [sheet, setSheet] = useState<"item" | "container" | null>(null)
  const [error, setError] = useState<string>()

  const containers = useApi(() => listContainers(), [])
  const container = useApi(() => (containerId ? getContainer(containerId) : Promise.resolve(undefined)), [containerId])
  const items = useApi(() => listInventory({ container: containerId ?? "unassigned" }), [containerId])

  const reload = () => {
    containers.reload()
    container.reload()
    items.reload()
  }

  const adjust = async (id: string, delta: number) => {
    try {
      const updated = await updateInventoryItem(id, { delta })
      items.setData((d) => d?.map((i) => (i.id === id ? updated : i)))
      container.setData((d) => (d ? { ...d, items: d.items.map((i) => (i.id === id ? updated : i)) } : d))
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  const unassigned = items.data ?? []
  const visibleItems = containerId ? (container.data?.items ?? items.data ?? []) : []

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xl font-semibold tracking-tight">
          <Link to="/inventory" className={cn(!containerId || "text-muted-foreground hover:text-foreground")}>
            Stockpile
          </Link>
          {containerId && (
            <>
              <ChevronRight className="size-4 text-muted-foreground" />
              {container.loading && !container.data ? (
                <Skeleton className="h-6 w-32" />
              ) : (
                <span>{container.data?.name ?? (containerId === "unassigned" ? "Unassigned" : containerId)}</span>
              )}
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          {containerId && (
          <div className="flex rounded-lg border border-border p-0.5">
            <button
              aria-label="Grid view"
              onClick={() => setMode("grid")}
              className={cn("rounded-md p-1.5 text-muted-foreground", mode === "grid" && "bg-accent text-foreground")}
            >
              <LayoutGrid className="size-4" />
            </button>
            <button
              aria-label="Table view"
              onClick={() => setMode("table")}
              className={cn("rounded-md p-1.5 text-muted-foreground", mode === "table" && "bg-accent text-foreground")}
            >
              <Table2 className="size-4" />
            </button>
          </div>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="outline"><Plus /> Add</Button>} />
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setSheet("item")}>
                <PackageOpen /> Add item
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSheet("container")}>Add container</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {error && <Banner text={error} tone="error" />}
      {items.error && <Banner text={items.error.message} tone="error" />}

      {!containerId && (containers.loading && !containers.data ? (
        <ContainersSkeleton />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {containers.data?.map((c) => (
            <Link
              key={c.id}
              to={`/inventory/${c.id}`}
              className="rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-primary/50"
            >
              <div className="text-sm font-medium">{c.name}</div>
              <div className="mt-0.5 text-xs text-muted-foreground">{c.location || "—"}</div>
              <div className="mt-2 text-xs text-muted-foreground">{c.itemCount ?? 0} items</div>
            </Link>
          ))}
          {unassigned.length > 0 && (
            <Link
              to="/inventory/unassigned"
              className="rounded-xl border border-dashed border-border bg-card p-4 text-left transition-colors hover:border-primary/50"
            >
              <div className="text-sm font-medium text-muted-foreground">Unassigned</div>
              <div className="mt-2 text-xs text-muted-foreground">{unassigned.length} items</div>
            </Link>
          )}
        </div>
      ))}

      {containerId &&
        (items.loading && !items.data ? (
          <ItemsSkeleton mode={mode} />
        ) : mode === "grid" ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {visibleItems.map((item) => (
              <ItemCard key={item.id} item={item} adjust={adjust} />
            ))}
          </div>
        ) : (
          <ItemTable items={visibleItems} adjust={adjust} showContainer={containerId === "unassigned"} />
        ))}

      <AddItemSheet
        open={sheet === "item"}
        onOpenChange={(o) => setSheet(o ? "item" : null)}
        containers={containers.data ?? []}
        containerId={containerId === "unassigned" ? undefined : containerId}
        onDone={reload}
      />
      <AddContainerSheet open={sheet === "container"} onOpenChange={(o) => setSheet(o ? "container" : null)} onDone={reload} />
    </div>
  )
}
