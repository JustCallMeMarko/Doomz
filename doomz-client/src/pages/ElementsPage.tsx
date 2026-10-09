import { useState } from "react"
import { FlaskConical, Lock, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useApi } from "@/hooks/use-api"
import { cn } from "cn"
import {
  combineElements,
  getElement,
  listElements,
  unlockElement,
  type CombineResult,
  type ElementDetail,
} from "@/lib/api"
import { Banner } from "./PlansPage"

type Mode = "inspect" | "combine"

export default function ElementsPage() {
  const { data: elements, loading, reload } = useApi(() => listElements(), [])
  const [mode, setMode] = useState<Mode>("inspect")
  const [selected, setSelected] = useState<string[]>([])
  const [detail, setDetail] = useState<ElementDetail>()
  const [result, setResult] = useState<CombineResult>()
  const [error, setError] = useState<string>()

  const pick = async (id: string) => {
    setError(undefined)
    setResult(undefined)
    if (mode === "combine") {
      const next = selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id].slice(-2)
      setSelected(next)
      if (next.length === 2) {
        try {
          setResult(await combineElements(next[0]!, next[1]!))
          setSelected([])
          reload()
        } catch (e) {
          setError(e instanceof Error ? e.message : "Combination failed")
          setSelected([])
        }
      }
    } else {
      try {
        setDetail(await getElement(id))
      } catch (e) {
        setError(e instanceof Error ? e.message : "Lookup failed")
      }
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Elements Vault</h1>
          <p className="text-sm text-muted-foreground">Inspect elements and combine discovered ones.</p>
        </div>
        <Button
          variant={mode === "combine" ? "default" : "outline"}
          onClick={() => {
            setMode(mode === "combine" ? "inspect" : "combine")
            setSelected([])
            setResult(undefined)
          }}
        >
          <FlaskConical /> {mode === "combine" ? "Cancel combine" : "Combine two elements"}
        </Button>
      </div>

      {mode === "combine" && (
        <Banner
          tone="info"
          text={`Combine mode — pick two discovered elements${selected.length ? ` (selected: ${selected.join(" + ")})` : ""}`}
        />
      )}
      {error && <Banner text={error} tone="error" />}
      {result && (
        <Banner
          tone="info"
          text={
            result.success
              ? `Synthesis ${result.isNew ? "discovered" : "known"}: ${result.result?.name} (${result.result?.symbol})`
              : "Nothing happened — these elements don't combine."
          }
        />
      )}

      {loading ? (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
          {elements?.map((el) => (
            <button
              key={el.id}
              onClick={() => pick(el.id)}
              disabled={mode === "combine" && !el.discovered}
              className={cn(
                "relative rounded-xl border border-border bg-card p-3 text-left transition-colors hover:border-primary/50 disabled:cursor-not-allowed disabled:opacity-50",
                selected.includes(el.id) && "border-primary",
                !el.discovered && "bg-muted/40",
              )}
            >
              {!el.discovered && <Lock className="absolute right-2 top-2 size-3.5 text-muted-foreground" />}
              <div className="text-xs text-muted-foreground">{el.category}</div>
              <div className="mt-1 text-lg font-semibold">{el.symbol}</div>
              <div className="text-xs">{el.discovered ? el.name : el.name}</div>
              {el.isBase && <div className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">primal</div>}
            </button>
          ))}
        </div>
      )}

      {detail && mode === "inspect" && (
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-lg font-semibold">
                {detail.name} <span className="text-muted-foreground">({detail.symbol})</span>
              </div>
              <div className="text-xs text-muted-foreground">
                {detail.category} · {detail.discovered ? "discovered" : "undiscovered"}
              </div>
            </div>
            <div className="flex gap-2">
              {!detail.discovered && (
                <Button
                  size="sm"
                  onClick={() =>
                    unlockElement(detail.id).then(() => {
                      reload()
                      pick(detail.id)
                    })
                  }
                >
                  Mark discovered
                </Button>
              )}
              <Button variant="ghost" size="icon-sm" aria-label="Close" onClick={() => setDetail(undefined)}>
                <X />
              </Button>
            </div>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">{detail.description}</p>
          {detail.recipes.length > 0 && (
            <div className="mt-3 text-sm">
              <span className="text-muted-foreground">Made from: </span>
              {detail.recipes.map((r) => r.ingredients.join(" + ")).join(" · ")}
            </div>
          )}
          {detail.usedIn.length > 0 && (
            <div className="mt-1 text-sm">
              <span className="text-muted-foreground">Combine with: </span>
              {detail.usedIn.map((u) => `${u.with} → ${u.result ?? "?"}`).join(" · ")}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
