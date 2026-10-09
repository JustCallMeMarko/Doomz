import { useEffect, useRef, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { Bot, Send, Trash2, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Banner } from "@/components/banner"
import { useApi } from "@/hooks/use-api"
import { cn } from "cn"
import {
  deleteThread,
  getThread,
  listThreads,
  PERSONAS,
  streamChat,
  type ChatMessage,
  type Persona,
} from "@/lib/api"

type Bubble = { id: string; role: "user" | "assistant"; content: string; pending?: boolean }

export default function ChatPage() {
  const { data: threads, reload } = useApi(() => listThreads(), [])
  const [threadId, setThreadId] = useState<string>()
  const [persona, setPersona] = useState<Persona>("general")
  const [messages, setMessages] = useState<Bubble[]>([])
  const [draft, setDraft] = useState("")
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string>()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [searchParams, setSearchParams] = useSearchParams()
  const askedRef = useRef(false)

  useEffect(() => {
    if (!threadId) {
      setMessages([])
      return
    }
    getThread(threadId)
      .then((t) => {
        setPersona(t.persona)
        setMessages(t.messages.map((m: ChatMessage) => ({ id: m.id, role: m.role, content: m.content })))
      })
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
  }, [threadId])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [messages])

  const send = async (override?: string) => {
    const message = (override ?? draft).trim()
    if (!message || sending) return
    setDraft("")
    setSending(true)
    setError(undefined)
    const assistantId = crypto.randomUUID()
    setMessages((m) => [
      ...m,
      { id: crypto.randomUUID(), role: "user", content: message },
      { id: assistantId, role: "assistant", content: "", pending: true },
    ])
    try {
      const { threadId: id } = await streamChat(
        { message, threadId, persona },
        (delta) =>
          setMessages((m) => m.map((b) => (b.id === assistantId ? { ...b, content: b.content + delta } : b))),
      )
      if (!threadId) setThreadId(id)
      setMessages((m) => m.map((b) => (b.id === assistantId ? { ...b, pending: false } : b)))
      reload()
    } catch (e) {
      setMessages((m) => m.filter((b) => b.id !== assistantId))
      setError(e instanceof Error ? e.message : "Request failed")
    } finally {
      setSending(false)
    }
  }

  useEffect(() => {
    const ask = searchParams.get("ask")
    if (!ask || askedRef.current) return
    askedRef.current = true
    const next = new URLSearchParams(searchParams)
    next.delete("ask")
    setSearchParams(next, { replace: true })
    send(ask)
  })

  return (
    <div className="grid h-full gap-4 lg:grid-cols-[260px_1fr]">
      <aside className="space-y-2 rounded-xl border border-border bg-card p-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Threads</span>
          <Button
            variant="outline"
            size="xs"
            onClick={() => {
              setThreadId(undefined)
              setMessages([])
            }}
          >
            New
          </Button>
        </div>
        <div className="space-y-1">
          {threads?.map((t) => (
            <button
              key={t.id}
              onClick={() => setThreadId(t.id)}
              className={cn(
                "group flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-sm hover:bg-accent",
                threadId === t.id && "bg-accent",
              )}
            >
              <span className="min-w-0 truncate">{t.title}</span>
              <span
                className="ml-2 hidden text-muted-foreground hover:text-destructive group-hover:block"
                onClick={(e) => {
                  e.stopPropagation()
                  deleteThread(t.id).then(() => {
                    if (threadId === t.id) {
                      setThreadId(undefined)
                      setMessages([])
                    }
                    reload()
                  })
                }}
              >
                <Trash2 className="size-3.5" />
              </span>
            </button>
          ))}
          {threads?.length === 0 && <p className="px-2 py-4 text-xs text-muted-foreground">No conversations yet.</p>}
        </div>
      </aside>

      <section className="flex min-h-[calc(100vh-10rem)] flex-col rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <div className="font-medium">Doomz AI</div>
            <div className="text-xs text-muted-foreground">Local model · streams token by token</div>
          </div>
          <select
            value={persona}
            onChange={(e) => setPersona(e.target.value as Persona)}
            className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm dark:bg-input/30"
          >
            {PERSONAS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
          {messages.length === 0 && (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Ask about triage, farming, shelter, power or rationing.
            </p>
          )}
          {messages.map((m) => (
            <div key={m.id} className={cn("flex gap-2", m.role === "user" && "flex-row-reverse")}>
              <div className="mt-0.5 shrink-0 rounded-lg bg-muted p-1.5">
                {m.role === "user" ? <User className="size-4" /> : <Bot className="size-4 text-primary" />}
              </div>
              <div
                className={cn(
                  "max-w-[80%] rounded-xl px-3 py-2 text-sm whitespace-pre-wrap",
                  m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted",
                )}
              >
                {m.content}
                {m.pending && !m.content && <span className="inline-block animate-pulse">…</span>}
              </div>
            </div>
          ))}
        </div>

        {error && (
          <div className="px-4 pb-2">
            <Banner text={error} tone="error" />
          </div>
        )}
        <form
          className="flex gap-2 border-t border-border p-3"
          onSubmit={(e) => {
            e.preventDefault()
            send()
          }}
        >
          <Input
            placeholder={sending ? "Waiting for Doomz…" : "Message Doomz…"}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            disabled={sending}
          />
          <Button type="submit" size="icon" disabled={sending || !draft.trim()} aria-label="Send">
            <Send />
          </Button>
        </form>
      </section>
    </div>
  )
}
