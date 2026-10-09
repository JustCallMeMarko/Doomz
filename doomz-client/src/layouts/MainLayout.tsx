import { NavLink, Outlet } from "react-router-dom"
import { useApi } from "@/hooks/use-api"
import { health } from "@/lib/api"
import { cn } from "cn"
import { Skull } from "lucide-react"

const NAV = [
  { to: "/", label: "Home" },
  { to: "/plans", label: "Plans" },
  { to: "/chat", label: "Chat" },
  { to: "/elements", label: "Elements" },
  { to: "/inventory", label: "Inventory" },
]

export default function MainLayout() {
  const { data } = useApi(() => health().catch(() => ({ status: "down" })), [])
  const online = data?.status === "ok"

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4">
          <NavLink to="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <Skull className="size-5 text-primary" />
            Doomz
          </NavLink>
          <nav className="flex items-center gap-1">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  cn(
                    "rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground",
                    isActive && "bg-accent text-foreground",
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
            <span className={cn("size-2 rounded-full", online ? "bg-emerald-500" : "bg-destructive")} />
            {data === undefined ? "connecting" : online ? "server online" : "server offline"}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
