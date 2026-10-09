import { useState } from "react"
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom"
import { ChevronLeft, GripVertical, MoreHorizontal, Sparkles, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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

const STATUSES: { value: PlanStatus; label: string }[] = [
  { value: "todo", label: "To do" },
  { value: "in_progress", label: "In progress" },
  { value: "done", label: "Done" },
]

const isStatus = (v: string | null): v is PlanStatus => STATUSES.some((s) => s.value === v)

const STATUS_STYLE: Record<PlanStatus, string> = {
  todo: "text-muted-foreground",
  in_progress: "text-amber-500",
  done: "text-emerald-500",
}

const textareaCls =
  "w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"

export default function PlanPage() {
  const { planId } = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const statusParam = searchParams.get("status")
  const stepFilter = isStatus(statusParam) ? statusParam : "all"
  const setStepFilter = (value: PlanStatus | "all") =>
    setSearchParams(value === "all" ? {} : { status: value }, { replace: true })
  const setPlanId = (id: string) => navigate(`/plan/${id}`)

  const [dragId, setDragId] = useState<string>()
  const [dropTarget, setDropTarget] = useState<PlanStatus>()
  const { data: plans, loading, error, reload } = useApi(() => listPlans(), [])
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

  const setStepStatus = async (stepId: string, status: PlanStatus) => {
    if (!planId) return
    plan.setData((p) =>
      p ? { ...p, steps: p.steps.map((s) => (s.id === stepId ? { ...s, status, completed: status === "done" } : s)) } : p,
    )
    try {
      await togglePlanStep(planId, stepId, { status })
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Step update failed")
    }
    reloadAll()
  }

  const columns: { value: PlanStatus; label: string; steps: PlanStep[] }[] = STATUSES.filter(
    (s) => stepFilter === "all" || s.value === stepFilter,
  ).map((s) => ({ ...s, steps: (plan.data?.steps ?? []).filter((step) => step.status === s.value) }))

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xl font-semibold tracking-tight">
            {planId ? (
              <>
                <Button variant="ghost" size="icon-sm" aria-label="Back to plans" render={<Link to="/plan" />}>
                  <ChevronLeft />
                </Button>
                <span>{plan.data?.title ?? "Plan"}</span>
              </>
            ) : (
              "Strategy Plans"
            )}
          </div>
        </div>

        {error && <Banner text={error.message} tone="error" />}
        {notice && <Banner text={notice} tone="info" />}

        {!planId && (
          <>
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
          <div className="flex gap-2">
            {[{ value: "all" as const, label: "All" }, ...STATUSES].map((s) => (
              <button
                key={s.value}
                onClick={() => setStepFilter(s.value)}
                className={cn(
                  "rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors",
                  stepFilter === s.value && "border-primary/50 bg-accent text-foreground",
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        )}

        {planId && plan.loading && !plan.data && (
          <div className="grid gap-3 sm:grid-cols-3">
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
          </div>
        )}

        {planId && plan.data && (
          <div className={cn("grid gap-3", columns.length > 1 && "sm:grid-cols-3")}>
            {columns.map((col) => (
              <div
                key={col.value}
                onDragOver={(e) => {
                  if (!dragId) return
                  e.preventDefault()
                  e.dataTransfer.dropEffect = "move"
                  setDropTarget(col.value)
                }}
                onDragLeave={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDropTarget(undefined)
                }}
                onDrop={(e) => {
                  e.preventDefault()
                  const id = e.dataTransfer.getData("text/plain") || dragId
                  const step = plan.data?.steps.find((s) => s.id === id)
                  setDragId(undefined)
                  setDropTarget(undefined)
                  if (step && step.status !== col.value) setStepStatus(step.id, col.value)
                }}
                className={cn(
                  "rounded-xl border border-border bg-card p-3 transition-colors",
                  dropTarget === col.value && "border-primary/60 bg-accent/40",
                )}
              >
                <div className="mb-2 flex items-center justify-between px-1">
                  <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{col.label}</span>
                  <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                    {col.steps.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {col.steps.map((step) => (
                    <div
                      key={step.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("text/plain", step.id)
                        e.dataTransfer.effectAllowed = "move"
                        setDragId(step.id)
                      }}
                      onDragEnd={() => {
                        setDragId(undefined)
                        setDropTarget(undefined)
                      }}
                      className={cn(
                        "cursor-grab rounded-lg border border-border bg-background p-2.5 select-none active:cursor-grabbing",
                        dragId === step.id && "opacity-40",
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <GripVertical className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                        <span className={cn("flex-1 text-sm", step.completed && "text-muted-foreground line-through")}>
                          {step.title}
                        </span>
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button variant="ghost" size="icon-xs" aria-label="Move step">
                                <MoreHorizontal />
                              </Button>
                            }
                          />
                          <DropdownMenuContent align="end">
                            {STATUSES.filter((s) => s.value !== step.status).map((s) => (
                              <DropdownMenuItem key={s.value} onClick={() => setStepStatus(step.id, s.value)}>
                                Move to {s.label.toLowerCase()}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      {step.requiredItems.length > 0 && (
                        <div className="mt-1 pl-5.5 text-xs text-muted-foreground">
                          needs {step.requiredItems.map((r) => `${r.quantity}× ${r.itemId}`).join(", ")}
                        </div>
                      )}
                    </div>
                  ))}
                  {col.steps.length === 0 && (
                    <p className="py-6 text-center text-xs text-muted-foreground">
                      {dragId ? "Drop here" : "Nothing here."}
                    </p>
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
