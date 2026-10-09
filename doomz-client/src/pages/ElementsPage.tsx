import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Bot, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { cn } from "cn"
import { CATEGORY_META, ELEMENTS, type PeriodicElement } from "@/lib/elements"

export default function ElementsPage() {
  const [selected, setSelected] = useState<PeriodicElement>()
  const navigate = useNavigate()

  const askAbout = (el: PeriodicElement) => {
    navigate(
      `/home?ask=${encodeURIComponent(
        `Tell me more about ${el.name} (${el.symbol}): key properties, practical uses, and how to obtain or refine it in a grid-down scenario.`,
      )}`,
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold tracking-tight">Periodic Table</h1>
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {Object.entries(CATEGORY_META).map(([key, meta]) => (
            <span key={key} className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <span className={cn("inline-block size-2.5 rounded-sm border", meta.tile.split(" ").slice(0, 2).join(" "))} />
              {meta.label}
            </span>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-card p-3">
        <div className="grid min-w-[54rem] grid-cols-[repeat(18,minmax(0,1fr))] gap-1">
          {ELEMENTS.map((el) => (
            <button
              key={el.z}
              onClick={() => setSelected(el)}
              style={{ gridColumn: el.x, gridRow: el.y }}
              className={cn(
                "flex aspect-square flex-col items-center justify-center rounded-md border p-0.5 transition-colors",
                CATEGORY_META[el.category].tile,
              )}
            >
              <span className="text-[8px] leading-none text-muted-foreground">{el.z}</span>
              <span className="text-sm font-bold leading-tight">{el.symbol}</span>
              <span className="hidden max-w-full truncate text-[7px] leading-none text-muted-foreground xl:block">
                {el.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(undefined)}>
        <SheetContent>
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle>
                  {selected.name} <span className="text-muted-foreground">({selected.symbol})</span>
                </SheetTitle>
                <SheetDescription>
                  #{selected.z} · {CATEGORY_META[selected.category].label} · {selected.mass} u
                </SheetDescription>
              </SheetHeader>
              <div className="space-y-4 p-4">
                <p className="text-sm text-muted-foreground">{selected.info}</p>
                <div>
                  <div className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Atomic data</div>
                  <table className="w-full text-sm">
                    <tbody className="divide-y divide-border [&>tr>td]:py-1 [&>tr>td:first-child]:text-muted-foreground [&>tr>td:last-child]:text-right">
                      <tr><td>Atomic number</td><td>{selected.z}</td></tr>
                      <tr><td>Atomic mass</td><td>{selected.mass} u</td></tr>
                      <tr><td>Group</td><td>{selected.group}</td></tr>
                      <tr><td>Period</td><td>{selected.period}</td></tr>
                      <tr><td>Block</td><td>{selected.block}-block</td></tr>
                      <tr><td>State at STP</td><td className="capitalize">{selected.state}</td></tr>
                      <tr><td>Electron config</td><td>{selected.electronConfig}</td></tr>
                    </tbody>
                  </table>
                </div>
                <div>
                  <div className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Uses</div>
                  <p className="text-sm">{selected.uses}</p>
                </div>
                <div>
                  <div className="mb-1 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    <MapPin className="size-3.5" /> Where to get it
                  </div>
                  <ul className="list-disc space-y-1 pl-5 text-sm">
                    {selected.examples.map((ex) => (
                      <li key={ex}>{ex}</li>
                    ))}
                  </ul>
                </div>
                <Button onClick={() => askAbout(selected)}>
                  <Bot /> Ask AI about {selected.symbol}
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
