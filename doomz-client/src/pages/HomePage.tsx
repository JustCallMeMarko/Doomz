import { Link } from "react-router-dom"
import { Skeleton } from "@/components/ui/skeleton"
import { useApi } from "@/hooks/use-api"
import { listElements, listInventory, listPlans } from "@/lib/api"

export default function HomePage() {
  const plans = useApi(() => listPlans(), [])
  const elements = useApi(() => listElements(), [])
  const inventory = useApi(() => listInventory(), [])

  const done = plans.data?.filter((p) => p.status === "done").length ?? 0
  const discovered = elements.data?.filter((e) => e.discovered).length ?? 0
  const low = inventory.data?.filter((i) => i.quantity <= i.capacity * 0.15).length ?? 0

  const cards = [
    {
      to: "/plans",
      title: "Strategy Plans",
      metric: plans.data ? `${done}/${plans.data.length} done` : undefined,
      hint: "Kanban board and step tracking for reconstruction tasks",
    },
    {
      to: "/chat",
      title: "Doomz AI",
      metric: undefined,
      hint: "Ask the local model — medic, agronomist, engineer, arbiter",
    },
    {
      to: "/elements",
      title: "Elements Vault",
      metric: elements.data ? `${discovered}/${elements.data.length} discovered` : undefined,
      hint: "Combine raw elements to unlock materials and tech",
    },
    {
      to: "/inventory",
      title: "Stockpile",
      metric: inventory.data ? `${low} low` : undefined,
      hint: "Track reserves and consumed resources",
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Civilization Console</h1>
        <p className="text-sm text-muted-foreground">Offline-first survival assistant. Everything runs on-device.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {cards.map((card) => (
          <Link
            key={card.to}
            to={card.to}
            className="rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/50"
          >
            <div className="text-sm font-medium text-muted-foreground">{card.title}</div>
            <div className="mt-2 min-h-8 text-2xl font-semibold">
              {card.metric ?? <Skeleton className="h-7 w-24" />}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">{card.hint}</div>
          </Link>
        ))}
      </div>
    </div>
  )
}
