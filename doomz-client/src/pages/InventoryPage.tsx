import { useState } from "react"
import { useSearchParams } from "react-router-dom"
import { LayoutGrid, Minus, MoreHorizontal, PackageOpen, Plus, Table2, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { Banner } from "@/components/banner"
import { useApi } from "@/hooks/use-api"
import { cn } from "cn"
import {
  CONTAINER_COLORS,
  createContainer,
  createItem,
  deleteContainer,
  deleteItem,
  listContainers,
  listInventory,
  updateInventoryItem,
  type ContainerColor,
  type InventoryContainer,
  type InventoryItem,
} from "@/lib/api"

type ViewMode = "box" | "table"
type TableFilter = "all" | "containers" | "items"
type MoveItem = (id: string, containerId: string | null) => void
type Confirm = { kind: "item" | "container"; id: string; name: string }

const UNASSIGNED = "__unassigned"
const PREVIEW_COUNT = 3

const COLORS: Record<ContainerColor, { dot: string; border: string; tint: string }> = {
  red: { dot: "bg-red-500", border: "border-red-500/40", tint: "bg-red-500/10" },
  orange: { dot: "bg-orange-500", border: "border-orange-500/40", tint: "bg-orange-500/10" },
  amber: { dot: "bg-amber-500", border: "border-amber-500/40", tint: "bg-amber-500/10" },
  green: { dot: "bg-green-500", border: "border-green-500/40", tint: "bg-green-500/10" },
  teal: { dot: "bg-teal-500", border: "border-teal-500/40", tint: "bg-teal-500/10" },
  sky: { dot: "bg-sky-500", border: "border-sky-500/40", tint: "bg-sky-500/10" },
  blue: { dot: "bg-blue-500", border: "border-blue-500/40", tint: "bg-blue-500/10" },
  violet: { dot: "bg-violet-500", border: "border-violet-500/40", tint: "bg-violet-500/10" },
  pink: { dot: "bg-pink-500", border: "border-pink-500/40", tint: "bg-pink-500/10" },
}

const Dot = ({ color, className }: { color?: ContainerColor; className?: string }) => (
  <span className={cn("inline-block size-2.5 shrink-0 rounded-full", color ? COLORS[color].dot : "bg-muted-foreground/50", className)} />
)

function QtyStepper({ item, adjust }: { item: InventoryItem; adjust: (id: string, delta: number) => void }) {
  return (
    <div className="flex items-center gap-1">
      <Button variant="outline" size="icon-xs" aria-label={`Decrease ${item.name}`} disabled={item.quantity <= 0} onClick={() => adjust(item.id, -1)}>
        <Minus />
      </Button>
      <span className="min-w-16 text-center text-xs tabular-nums">
        {item.quantity} {item.unit}
      </span>
      <Button variant="outline" size="icon-xs" aria-label={`Increase ${item.name}`} disabled={item.quantity >= item.capacity} onClick={() => adjust(item.id, 1)}>
        <Plus />
      </Button>
    </div>
  )
}

function FillBar({ item }: { item: InventoryItem }) {
  const pct = Math.min(100, (item.quantity / item.capacity) * 100)
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-muted" title={`${Math.round(pct)}% of ${item.capacity}`}>
      <div className={item.quantity <= item.capacity * 0.15 ? "h-full bg-destructive" : "h-full bg-primary"} style={{ width: `${pct}%` }} />
    </div>
  )
}

function ItemMenu({
  item,
  containers,
  move,
  onDelete,
}: {
  item: InventoryItem
  containers: InventoryContainer[]
  move: MoveItem
  onDelete: () => void
}) {
  const targets = [
    ...containers.filter((c) => c.id !== item.containerId).map((c) => ({ id: c.id as string | null, name: c.name, color: c.color as ContainerColor | undefined })),
    ...(item.containerId ? [{ id: null, name: "Unassigned", color: undefined }] : []),
  ]
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon-xs" aria-label={`Actions for ${item.name}`} />}>
        <MoreHorizontal />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <div className="px-2 py-1 text-xs text-muted-foreground">Move to…</div>
        {targets.map((t) => (
          <DropdownMenuItem key={t.id ?? UNASSIGNED} onClick={() => move(item.id, t.id)}>
            <Dot color={t.color} /> {t.name}
          </DropdownMenuItem>
        ))}
        <div className="my-1 h-px bg-border" />
        <DropdownMenuItem onClick={onDelete} className="text-destructive">
          <Trash2 /> Delete item
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

type RowProps = {
  item: InventoryItem
  containers: InventoryContainer[]
  adjust: (id: string, delta: number) => void
  move: MoveItem
  askDelete: (c: Confirm) => void
}

function ItemRow({ item, containers, adjust, move, askDelete, onDragStart }: RowProps & { onDragStart: () => void }) {
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", item.id)
        e.dataTransfer.effectAllowed = "move"
        onDragStart()
      }}
      className="cursor-grab rounded-lg border border-border bg-background/60 p-2.5 active:cursor-grabbing"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-sm font-medium">{item.name}</div>
          <div className="text-xs text-muted-foreground">{item.category}</div>
        </div>
        <div className="flex items-center gap-1">
          <QtyStepper item={item} adjust={adjust} />
          <ItemMenu item={item} containers={containers} move={move} onDelete={() => askDelete({ kind: "item", id: item.id, name: item.name })} />
        </div>
      </div>
      <div className="mt-2">
        <FillBar item={item} />
      </div>
    </div>
  )
}

function ContainerBox({
  container,
  items,
  onAdd,
  dropTarget,
  setDropTarget,
  onDropItem,
  expanded,
  onToggle,
  ...rowProps
}: Omit<RowProps, "item"> & {
  expanded: boolean
  onToggle: () => void
  container?: InventoryContainer
  items: InventoryItem[]
  onAdd: () => void
  dropTarget: boolean
  setDropTarget: (on: boolean) => void
  onDropItem: (itemId: string) => void
}) {
  const key = container?.id ?? UNASSIGNED
  return (
    <section
      onDragOver={(e) => {
        e.preventDefault()
        setDropTarget(true)
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setDropTarget(false)
      }}
      onDrop={(e) => {
        e.preventDefault()
        setDropTarget(false)
        const id = e.dataTransfer.getData("text/plain")
        if (id) onDropItem(id)
      }}
      className={cn(
        "flex flex-col rounded-xl border bg-card",
        container ? COLORS[container.color].border : "border-dashed border-border",
        dropTarget && "ring-2 ring-primary",
      )}
      data-container={key}
    >
      <header className={cn("flex items-center gap-2 rounded-t-xl px-3 py-2.5", container && COLORS[container.color].tint)}>
        <Dot color={container?.color} />
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-sm font-semibold">{container?.name ?? "Unassigned"}</h2>
          <p className="truncate text-xs text-muted-foreground">
            {[container?.location, `${items.length} item${items.length === 1 ? "" : "s"}`].filter(Boolean).join(" · ")}
          </p>
        </div>
        <Button variant="ghost" size="icon-xs" aria-label={`Add item to ${container?.name ?? "Unassigned"}`} onClick={onAdd}>
          <Plus />
        </Button>
        {container && (
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label={`Delete ${container.name}`}
            title={items.length ? "Move or delete its items first" : "Delete container"}
            disabled={items.length > 0}
            onClick={() => rowProps.askDelete({ kind: "container", id: container.id, name: container.name })}
          >
            <Trash2 />
          </Button>
        )}
      </header>
      <div className="flex-1 space-y-2 p-2.5">
        {(expanded ? items : items.slice(0, PREVIEW_COUNT)).map((item) => (
          <ItemRow key={item.id} item={item} {...rowProps} onDragStart={() => undefined} />
        ))}
        {items.length === 0 && (
          <p className="rounded-lg border border-dashed border-border py-6 text-center text-xs text-muted-foreground">
            Empty — drop items here
          </p>
        )}
        {items.length > PREVIEW_COUNT && (
          <Button variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={onToggle}>
            {expanded ? "Show less" : `Show all (${items.length})`}
          </Button>
        )}
      </div>
    </section>
  )
}

function InventoryTable({
  filter,
  containers,
  groups,
  items,
  ...rowProps
}: Omit<RowProps, "item"> & {
  filter: TableFilter
  groups: { container?: InventoryContainer; items: InventoryItem[] }[]
  items: InventoryItem[]
}) {
  const byId = new Map(containers.map((c) => [c.id, c]))
  const itemRow = (item: InventoryItem, showContainer: boolean) => {
    const c = item.containerId ? byId.get(item.containerId) : undefined
    return (
      <tr key={item.id}>
        <td className="px-3 py-2 font-medium">{item.name}</td>
        <td className="px-3 py-2 text-muted-foreground">{item.category}</td>
        {showContainer && (
          <td className="px-3 py-2">
            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
              <Dot color={c?.color} /> {c?.name ?? "Unassigned"}
            </span>
          </td>
        )}
        <td className="w-36 px-3 py-2">
          <FillBar item={item} />
        </td>
        <td className="px-3 py-2">
          <div className="flex items-center justify-end gap-1">
            <QtyStepper item={item} adjust={rowProps.adjust} />
            <ItemMenu
              item={item}
              containers={containers}
              move={rowProps.move}
              onDelete={() => rowProps.askDelete({ kind: "item", id: item.id, name: item.name })}
            />
          </div>
        </td>
      </tr>
    )
  }
  const head = (cols: string[]) => (
    <thead>
      <tr className="border-b border-border text-left text-xs text-muted-foreground">
        {cols.map((c, i) => (
          <th key={i} className="px-3 py-2 font-medium">
            {c}
          </th>
        ))}
      </tr>
    </thead>
  )

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <table className="w-full text-sm">
        {filter === "containers" ? (
          <>
            {head(["Container", "Location", "Items", ""])}
            <tbody className="divide-y divide-border">
              {containers.map((c) => {
                const count = groups.find((g) => g.container?.id === c.id)?.items.length ?? 0
                return (
                  <tr key={c.id}>
                    <td className="px-3 py-2 font-medium">
                      <span className="inline-flex items-center gap-2">
                        <Dot color={c.color} /> {c.name}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">{c.location || "—"}</td>
                    <td className="px-3 py-2 text-muted-foreground">{count}</td>
                    <td className="px-3 py-2 text-right">
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        aria-label={`Delete ${c.name}`}
                        title={count ? "Move or delete its items first" : "Delete container"}
                        disabled={count > 0}
                        onClick={() => rowProps.askDelete({ kind: "container", id: c.id, name: c.name })}
                      >
                        <Trash2 />
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </>
        ) : filter === "items" ? (
          <>
            {head(["Item", "Category", "Container", "Stock", ""])}
            <tbody className="divide-y divide-border">{items.map((i) => itemRow(i, true))}</tbody>
          </>
        ) : (
          <>
            {head(["Item", "Category", "Stock", ""])}
            {groups.map((g) => (
              <tbody key={g.container?.id ?? UNASSIGNED} className="divide-y divide-border border-b border-border">
                <tr className={cn(g.container && COLORS[g.container.color].tint)}>
                  <td colSpan={4} className="px-3 py-1.5 text-xs font-semibold">
                    <span className="inline-flex items-center gap-2">
                      <Dot color={g.container?.color} /> {g.container?.name ?? "Unassigned"}
                      <span className="font-normal text-muted-foreground">{g.items.length} items</span>
                    </span>
                  </td>
                </tr>
                {g.items.map((i) => itemRow(i, false))}
              </tbody>
            ))}
          </>
        )}
      </table>
    </div>
  )
}

function ContainerSelect({ value, onChange, containers }: { value: string; onChange: (v: string) => void; containers: InventoryContainer[] }) {
  const selected = containers.find((c) => c.id === value)
  return (
    <Select value={value} onValueChange={(v) => onChange(String(v ?? UNASSIGNED))}>
      <SelectTrigger className="w-full" aria-label="Container">
        <SelectValue>
          {() => (
            <span className="flex items-center gap-2">
              <Dot color={selected?.color} /> {selected?.name ?? "Unassigned"}
            </span>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {containers.map((c) => (
          <SelectItem key={c.id} value={c.id}>
            <Dot color={c.color} /> {c.name}
          </SelectItem>
        ))}
        <SelectItem value={UNASSIGNED}>
          <Dot /> Unassigned
        </SelectItem>
      </SelectContent>
    </Select>
  )
}

const emptyItem = { name: "", category: "General", unit: "units", quantity: "0", capacity: "" }

function AddItemSheet({
  containerId,
  onClose,
  containers,
  onDone,
}: {
  containerId?: string
  onClose: () => void
  containers: InventoryContainer[]
  onDone: (item: InventoryItem) => void
}) {
  const [form, setForm] = useState(emptyItem)
  const [target, setTarget] = useState(containerId ?? containers[0]?.id ?? UNASSIGNED)
  const [error, setError] = useState<string>()
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    setBusy(true)
    setError(undefined)
    try {
      const item = await createItem({
        name: form.name.trim(),
        category: form.category.trim() || "General",
        unit: form.unit.trim() || "units",
        quantity: Number(form.quantity) || 0,
        capacity: Number(form.capacity),
        containerId: target === UNASSIGNED ? null : target,
      })
      onDone(item)
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add item")
    } finally {
      setBusy(false)
    }
  }

  return (
    <Sheet open onOpenChange={(o) => o || onClose()}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Add item</SheetTitle>
          <SheetDescription>Stock a new resource in a container.</SheetDescription>
        </SheetHeader>
        <div className="space-y-3 p-4">
          <ContainerSelect value={target} onChange={setTarget} containers={containers} />
          <Input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          <div className="grid grid-cols-3 gap-2">
            <Input placeholder="Unit" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
            <Input placeholder="Qty" type="number" min={0} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
            <Input placeholder="Capacity" type="number" min={1} value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
          </div>
          {error && <Banner text={error} tone="error" />}
          <Button onClick={submit} disabled={busy || !form.name.trim() || !form.capacity}>
            Add item
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function AddContainerSheet({ onClose, onDone, used }: { onClose: () => void; onDone: (c: InventoryContainer) => void; used: ContainerColor[] }) {
  const [form, setForm] = useState({ name: "", description: "", location: "" })
  const [color, setColor] = useState<ContainerColor>(CONTAINER_COLORS.find((c) => !used.includes(c)) ?? "blue")
  const [error, setError] = useState<string>()
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    setBusy(true)
    setError(undefined)
    try {
      const created = await createContainer({ name: form.name.trim(), description: form.description.trim(), location: form.location.trim(), color })
      onDone(created)
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add container")
    } finally {
      setBusy(false)
    }
  }

  return (
    <Sheet open onOpenChange={(o) => o || onClose()}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Add container</SheetTitle>
          <SheetDescription>Create a box, shelf or cache that holds items.</SheetDescription>
        </SheetHeader>
        <div className="space-y-3 p-4">
          <Input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          <Input placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Color">
            {CONTAINER_COLORS.map((c) => (
              <button
                key={c}
                role="radio"
                aria-checked={color === c}
                aria-label={c}
                onClick={() => setColor(c)}
                className={cn("size-7 rounded-full ring-offset-2 ring-offset-background", COLORS[c].dot, color === c && "ring-2 ring-foreground")}
              />
            ))}
          </div>
          {error && <Banner text={error} tone="error" />}
          <Button onClick={submit} disabled={busy || !form.name.trim()}>
            Add container
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function BoxesSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className="space-y-2 rounded-xl border border-border bg-card p-3">
          <Skeleton className="h-5 w-40" />
          {Array.from({ length: 3 }, (_, j) => (
            <Skeleton key={j} className="h-14 w-full" />
          ))}
        </div>
      ))}
    </div>
  )
}

export default function InventoryPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const mode: ViewMode = searchParams.get("view") === "table" ? "table" : "box"
  const show = (["containers", "items"] as const).find((f) => f === searchParams.get("show")) ?? "all"
  const setParams = (view: ViewMode, filter: TableFilter) =>
    setSearchParams(view === "table" ? { view, ...(filter !== "all" && { show: filter }) } : {}, { replace: true })

  const open = new Set((searchParams.get("open") ?? "").split(",").filter(Boolean))
  const toggleOpen = (key: string) => {
    const next = new Set(open)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    setSearchParams(
      (prev) => {
        const q = new URLSearchParams(prev)
        if (next.size) q.set("open", [...next].join(","))
        else q.delete("open")
        return q
      },
      { replace: true },
    )
  }

  const [sheet, setSheet] = useState<{ kind: "item"; containerId?: string } | { kind: "container" } | null>(null)
  const [confirm, setConfirm] = useState<Confirm | null>(null)
  const [dropTarget, setDropTarget] = useState<string>()
  const [error, setError] = useState<string>()

  const containersApi = useApi(() => listContainers(), [])
  const itemsApi = useApi(() => listInventory(), [])
  const containers = containersApi.data ?? []
  const items = itemsApi.data ?? []
  const loading = (containersApi.loading && !containersApi.data) || (itemsApi.loading && !itemsApi.data)

  const groups = [
    ...containers.map((c) => ({ container: c as InventoryContainer | undefined, items: items.filter((i) => i.containerId === c.id) })),
    ...(items.some((i) => !i.containerId) ? [{ container: undefined, items: items.filter((i) => !i.containerId) }] : []),
  ]

  const fail = (e: unknown) => setError(e instanceof Error ? e.message : String(e))
  const replaceItem = (updated: InventoryItem) => itemsApi.setData((d) => d?.map((i) => (i.id === updated.id ? updated : i)))

  const adjust = async (id: string, delta: number) => {
    try {
      replaceItem(await updateInventoryItem(id, { delta }))
    } catch (e) {
      fail(e)
    }
  }

  const move: MoveItem = async (id, containerId) => {
    const item = items.find((i) => i.id === id)
    if (!item || item.containerId === containerId) return
    replaceItem({ ...item, containerId })
    try {
      replaceItem(await updateInventoryItem(id, { containerId }))
    } catch (e) {
      replaceItem(item)
      fail(e)
    }
  }

  const runConfirm = async () => {
    if (!confirm) return
    try {
      if (confirm.kind === "item") {
        await deleteItem(confirm.id)
        itemsApi.setData((d) => d?.filter((i) => i.id !== confirm.id))
      } else {
        await deleteContainer(confirm.id)
        containersApi.setData((d) => d?.filter((c) => c.id !== confirm.id))
      }
      setConfirm(null)
    } catch (e) {
      setConfirm(null)
      fail(e)
    }
  }

  const rowProps = { containers, adjust, move, askDelete: setConfirm }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Stockpile</h1>
          <p className="text-sm text-muted-foreground">
            {containers.length} containers · {items.length} items
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-border p-0.5">
            <button
              aria-label="Box view"
              onClick={() => setParams("box", show)}
              className={cn("rounded-md p-1.5 text-muted-foreground", mode === "box" && "bg-accent text-foreground")}
            >
              <LayoutGrid className="size-4" />
            </button>
            <button
              aria-label="Table view"
              onClick={() => setParams("table", show)}
              className={cn("rounded-md p-1.5 text-muted-foreground", mode === "table" && "bg-accent text-foreground")}
            >
              <Table2 className="size-4" />
            </button>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="outline"><Plus /> Add</Button>} />
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setSheet({ kind: "item" })}>
                <PackageOpen /> Add item
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSheet({ kind: "container" })}>
                <LayoutGrid /> Add container
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {error && <Banner text={error} tone="error" />}
      {(containersApi.error || itemsApi.error) && <Banner text={(containersApi.error ?? itemsApi.error)!.message} tone="error" />}

      {mode === "table" && (
        <div className="flex w-fit rounded-lg border border-border p-0.5 text-sm">
          {(["all", "containers", "items"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setParams("table", f)}
              className={cn("rounded-md px-3 py-1 capitalize text-muted-foreground", show === f && "bg-accent text-foreground")}
            >
              {f}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        mode === "box" ? (
          <BoxesSkeleton />
        ) : (
          <Skeleton className="h-64 w-full rounded-xl" />
        )
      ) : mode === "box" ? (
        <div className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-3">
          {groups.map((g) => {
            const key = g.container?.id ?? UNASSIGNED
            return (
              <ContainerBox
                key={key}
                container={g.container}
                items={g.items}
                onAdd={() => setSheet({ kind: "item", containerId: g.container?.id ?? UNASSIGNED })}
                expanded={open.has(key)}
                onToggle={() => toggleOpen(key)}
                dropTarget={dropTarget === key}
                setDropTarget={(on) => setDropTarget(on ? key : undefined)}
                onDropItem={(id) => move(id, g.container?.id ?? null)}
                {...rowProps}
              />
            )
          })}
          {groups.length === 0 && <p className="text-sm text-muted-foreground">No containers yet. Add one to start stocking.</p>}
        </div>
      ) : (
        <InventoryTable filter={show} groups={groups} items={items} {...rowProps} />
      )}

      {sheet?.kind === "item" && (
        <AddItemSheet
          containerId={sheet.containerId}
          containers={containers}
          onClose={() => setSheet(null)}
          onDone={(item) => itemsApi.setData((d) => [...(d ?? []), item])}
        />
      )}
      {sheet?.kind === "container" && (
        <AddContainerSheet
          used={containers.map((c) => c.color)}
          onClose={() => setSheet(null)}
          onDone={(c) => containersApi.setData((d) => [...(d ?? []), c])}
        />
      )}

      <Sheet open={!!confirm} onOpenChange={(o) => o || setConfirm(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Delete {confirm?.name}?</SheetTitle>
            <SheetDescription>
              {confirm?.kind === "item"
                ? "The item is removed from the stockpile and from any plan steps that need it."
                : "The empty container is removed."}
            </SheetDescription>
          </SheetHeader>
          <div className="flex gap-2 p-4">
            <Button variant="destructive" onClick={runConfirm}>
              <Trash2 /> Delete
            </Button>
            <Button variant="outline" onClick={() => setConfirm(null)}>
              Cancel
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
