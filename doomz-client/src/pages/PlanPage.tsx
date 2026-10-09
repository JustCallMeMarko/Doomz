import { useState } from "react"
import { Sparkles, Trash2 } from "lucide-react"
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
  listPlans,
  togglePlanStep,
  type Plan,
  type PlanStatus,
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

export default function PlanPage() {
  const [status, setStatus] = useState<PlanStatus | "all">("all")
  const [consume, setConsume] = useState(true)
  const { data: plans, loading, error, reload } = useApi(
    () => listPlans(status === "all" ? undefined : { status }),
    [status],
  )

  const [title, setTitle] = useState("")
  const [category, setCategory] = useState("Civilization")
  const [stepsText, setStepsText] = useState("")
  const [busy, setBusy] = useState(false)
  const [aiPrompt, setAiPrompt] = useState("")
  const [notice, setNotice] = useState<string>()

  const submit = async () => {
    if (!title.trim()) return
    setBusy(true)
    try {
      await createPlan({
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
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Generation failed")
    } finally {
      setBusy(false)
    }
  }

  const toggle = async (plan: Plan, stepId: string) => {
    try {
      await togglePlanStep(plan.id, stepId, { consumeItems: consume })
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Step update failed")
    }
    reload()
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-xl font-semibold tracking-tight">Strategy Plans</h1>
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

      {error && <Banner text={error.message} tone="error" />}
      {notice && <Banner text={notice} tone="info" />}

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {plans?.map((plan) => (
            <div key={plan.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-medium">{plan.title}</div>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{plan.category}</span>
                    <span>·</span>
                    <span>{plan.priority}</span>
                    <span>·</span>
                    <span className={STATUS_STYLE[plan.status]}>{plan.status.replace("_", " ")}</span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Delete plan"
                  onClick={() => deletePlan(plan.id).then(reload)}
                >
                  <Trash2 />
                </Button>
              </div>
              {plan.description && <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>}
              {plan.progress.total > 0 && (
                <div className="mt-3">
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${(plan.progress.completed / plan.progress.total) * 100}%` }}
                    />
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {plan.progress.completed}/{plan.progress.total} steps
                  </div>
                </div>
              )}
              <ul className="mt-2 space-y-1">
                {plan.steps.map((step) => (
                  <li key={step.id} className="flex items-start gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={step.completed}
                      onChange={() => toggle(plan, step.id)}
                      className="mt-1 size-3.5 accent-primary"
                    />
                    <span className={step.completed ? "text-muted-foreground line-through" : ""}>
                      {step.title}
                      {step.requiredItems.length > 0 && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          needs {step.requiredItems.map((r) => `${r.quantity}× ${r.itemId}`).join(", ")}
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {plans?.length === 0 && (
            <p className="col-span-full py-8 text-center text-sm text-muted-foreground">No plans yet.</p>
          )}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
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
              className="w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
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
              className="w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
            />
            <Button onClick={askAI} disabled={busy || !aiPrompt.trim()}>
              Generate &amp; save plan
            </Button>
            <p className="text-xs text-muted-foreground">Uses the local model; requires Ollama running.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
