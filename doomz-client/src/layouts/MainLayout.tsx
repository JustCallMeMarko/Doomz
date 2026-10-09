import { NavLink, Outlet, useLocation } from "react-router-dom"
import { Atom, ClipboardList, MessageSquare, Package, Skull } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { useApi } from "@/hooks/use-api"
import { health } from "@/lib/api"
import { cn } from "cn"

const NAV = [
  { to: "/home", label: "Chat", icon: MessageSquare },
  { to: "/plan", label: "Plan", icon: ClipboardList },
  { to: "/elements", label: "Elements", icon: Atom },
  { to: "/inventory", label: "Inventory", icon: Package },
]

function ServerStatus() {
  const { data } = useApi(() => health().catch(() => ({ status: "down" })), [])
  const online = data?.status === "ok"
  return (
    <div className="flex items-center gap-2 px-2 text-xs text-sidebar-foreground/60">
      <span className={cn("size-2 rounded-full", data === undefined ? "bg-muted-foreground" : online ? "bg-emerald-500" : "bg-destructive")} />
      <span className="group-data-[collapsible=icon]:hidden">
        {data === undefined ? "connecting…" : online ? "server online" : "server offline"}
      </span>
    </div>
  )
}

export default function MainLayout() {
  const { pathname } = useLocation()
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" render={<NavLink to="/home" />}>
                <div className="flex size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Skull className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Doomz</span>
                  <span className="truncate text-xs text-sidebar-foreground/60">grid-down assistant</span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {NAV.map(({ to, label, icon: Icon }) => (
                  <SidebarMenuItem key={to}>
                    <SidebarMenuButton
                      tooltip={label}
                      isActive={pathname.startsWith(to)}
                      render={<NavLink to={to} />}
                    >
                      <Icon />
                      <span>{label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <ServerStatus />
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-12 items-center gap-2 border-b border-border bg-background/80 px-4 backdrop-blur">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-4" />
          <span className="text-sm text-muted-foreground">
            {NAV.find((n) => pathname.startsWith(n.to))?.label ?? "Doomz"}
          </span>
        </header>
        <main className="flex-1 p-4">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
