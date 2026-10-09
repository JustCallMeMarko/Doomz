import { cn } from "cn"

export function Banner({ text, tone }: { text: string; tone: "error" | "info" }) {
  return (
    <div
      className={cn(
        "rounded-lg border px-3 py-2 text-sm",
        tone === "error" ? "border-destructive/50 text-destructive" : "border-border text-muted-foreground",
      )}
    >
      {text}
    </div>
  )
}
