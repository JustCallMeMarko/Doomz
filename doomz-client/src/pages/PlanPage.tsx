import { useState } from "react"
import { ChevronLeft, Sparkles, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Banner } from "@/components/banner"
import { useApi } from "@/hooks/use-api"
import { cn } from "cn"
import {
  createPlan,
  deletePlan,
  generatePlan,
  getPlan,
  listPlans,
  togglePlanStep,
  type PlanStatus,
  type PlanStep,
} from "@/lib/api"

const STATUSES: { value: PlanStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "todo", label: "To do" },
  { value: "in_progress", label: "In progress" },
  { value: "done", label: "Done" },
]

const STATUS_STYLE: Record<PlanStatus, string> = {
  todo: "text-muted-foreground",
  in_progress: "text-amber-500",
  done: "text-emerald-500",
}

const textareaCls =
  "w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"

export default function PlanPage() {
  const [status, setStatus] = useState<PlanStatus | "all">("all")
  const [consume, setConsume] = useState(true)
  const { data: plans, loading, error, reload } = useApi(
    () => listPlans(status === "all" ? undefined : { status }),
    [status],
  )
  const [planId, setPlanId] = useState<string>()
  const plan = useApi(() => (planId ? getPlan(planId) : Promise.resolve(undefined)), [planId])

  const [title, setTitle] = useState("")
  const [category, setCategory] = useState("Civilization")
  const [stepsText, setStepsText] = useState("")
  const [busy, setBusy] = useState(false)
  const [aiPrompt, setAiPrompt] = useState("")
  const [notice, setNotice] = useState<string>()

  const reloadAll = () => {
    reload()
    plan.reload()
  }

  const submit = async () => {
    if (!title.trim()) return
    setBusy(true)
    try {
      const created = await createPlan({
        title: title.trim(),
        category: category.trim() || "General",
        steps: stepsText
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean)
          .map((s) => ({ title: s })),
      })
      setTitle("")
      setStepsText("")
      reload()
      if (created?.id) setPlanId(created.id)
    } finally {
      setBusy(false)
    }
  }

  const askAI = async () => {
    if (!aiPrompt.trim()) return
    setBusy(true)
    setNotice(undefined)
    try {
      const res = await generatePlan({ prompt: aiPrompt.trim(), category })
      setAiPrompt("")
      setNotice(`Plan created: ${res.plan.title}`)
      reload()
      if (res.saved && "id" in res.plan) setPlanId(res.plan.id)
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Generation failed")
    } finally {
      setBusy(false)
    }
  }

  const toggle = async (stepId: string) => {
    if (!planId) return
    try {
      await togglePlanStep(planId, stepId, { consumeItems: consume })
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Step update failed")
    }
    reloadAll()
  }

  const columns: { label: string; steps: PlanStep[] }[] = [
    { label: "To do", steps: (plan.data?.steps ?? []).filter((s) => !s.completed) },
    { label: "Done", steps: (plan.data?.steps ?? []).filter((s) => s.completed) },
  ]

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xl font-semibold tracking-tight">
            {planId ? (
              <>
                <Button variant="ghost" size="icon-sm" aria-label="Back to plans" onClick={() => setPlanId(undefined)}>
                  <ChevronLeft />
                </Button>
                <span>{plan.data?.title ?? "Plan"}</span>
              </>
            ) : (
              "Strategy Plans"
            )}
          </div>
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={consume}
              onChange={(e) => setConsume(e.target.checked)}
              className="size-3.5 accent-primary"
            />
            Deduct items when a step completes
          </label>
        </div>

        {error && <Banner text={error.message} tone="error" />}
        {notice && <Banner text={notice} tone="info" />}

        {!planId && (
          <>
            <div className="flex gap-2">
              {STATUSES.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setStatus(s.value)}
                  className={cn(
                    "rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors",
                    status === s.value && "border-primary/50 bg-accent text-foreground",
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="grid gap-4 md:grid-cols-2">
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {plans?.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPlanId(p.id)}
                    className="rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-primary/50"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-medium">{p.title}</div>
                        <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{p.category}</span>
                          <span>·</span>
                          <span>{p.priority}</span>
                          <span>·</span>
                          <span className={STATUS_STYLE[p.status]}>{p.status.replace("_", " ")}</span>
                        </div>
                      </div>
                      <span
                        role="button"
                        aria-label="Delete plan"
                        className="rounded-md p-1 text-muted-foreground hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation()
                          deletePlan(p.id).then(reload)
                        }}
                      >
                        <Trash2 className="size-4" />
                      </span>
                    </div>
                    {p.progress.total > 0 && (
                      <div className="mt-3">
                        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full bg-primary transition-all"
                            style={{ width: `${(p.progress.completed / p.progress.total) * 100}%` }}
                          />
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {p.progress.completed}/{p.progress.total} steps
                        </div>
                      </div>
                    )}
                  </button>
                ))}
                {plans?.length === 0 && (
                  <p className="col-span-full py-8 text-center text-sm text-muted-foreground">No plans yet.</p>
                )}
              </div>
            )}
          </>
        )}

        {planId && (
          <div className="grid gap-3 sm:grid-cols-2">
            {columns.map((col) => (
              <div key={col.label} className="rounded-xl border border-border bg-card p-3">
                <div className="mb-2 flex items-center justify-between px-1">
                  <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{col.label}</span>
                  <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                    {col.steps.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {col.steps.map((step) => (
                    <div key={step.id} className="rounded-lg border border-border bg-background p-2.5">
                      <label className="flex items-start gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={step.completed}
                          onChange={() => toggle(step.id)}
                          className="mt-0.5 size-3.5 accent-primary"
                        />
                        <span className={step.completed ? "text-muted-foreground line-through" : ""}>
                          {step.title}
                        </span>
                      </label>
                      {step.requiredItems.length > 0 && (
                        <div className="mt-1 pl-5 text-xs text-muted-foreground">
                          needs {step.requiredItems.map((r) => `${r.quantity}× ${r.itemId}`).join(", ")}
                        </div>
                      )}
                    </div>
                  ))}
                  {col.steps.length === 0 && (
                    <p className="py-6 text-center text-xs text-muted-foreground">Nothing here.</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <aside className="space-y-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="mb-3 font-medium">New plan</div>
          <div className="space-y-2">
            <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
            <Input placeholder="Category" value={category} onChange={(e) => setCategory(e.target.value)} />
            <textarea
              placeholder="Steps, one per line"
              value={stepsText}
              onChange={(e) => setStepsText(e.target.value)}
              rows={3}
              className={textareaCls}
            />
            <Button onClick={submit} disabled={busy || !title.trim()}>
              Create plan
            </Button>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center gap-2 font-medium">
            <Sparkles className="size-4 text-primary" />
            Ask Doomz to plan it
          </div>
          <div className="space-y-2">
            <textarea
              placeholder="e.g. Secure a clean water supply for 4 people"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              rows={4}
              className={textareaCls}
            />
            <Button onClick={askAI} disabled={busy || !aiPrompt.trim()}>
              Generate &amp; save plan
            </Button>
            <p className="text-xs text-muted-foreground">Uses the local model; requires Ollama running.</p>
          </div>
        </div>
      </aside>
    </div>
  )
}
