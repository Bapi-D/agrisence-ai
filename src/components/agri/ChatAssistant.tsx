import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Bot, Send, Sparkles, X } from "lucide-react";

import { askAssistant } from "@/lib/agri.functions";
import { useFarm } from "@/hooks/useFarm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Turn = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "Why was my last scan flagged?",
  "Should I irrigate today?",
  "Summarise this week's leaf health",
];

export function ChatAssistant({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ask = useServerFn(askAssistant);
  const { activeFarm } = useFarm();
  const [turns, setTurns] = useState<Turn[]>([
    {
      role: "assistant",
      content:
        "Hi! I'm your AgriSense assistant. Ask me anything about your moisture readings, leaf scans or alerts.",
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  async function send(question: string) {
    if (!question.trim() || busy) return;
    const next = [...turns, { role: "user" as const, content: question }];
    setTurns(next);
    setInput("");
    setBusy(true);
    try {
      const res = await ask({
        data: { question, farmId: activeFarm?.id ?? null, history: turns.slice(-6) },
      });
      setTurns([...next, { role: "assistant", content: res.answer }]);
    } catch {
      setTurns([...next, { role: "assistant", content: "Something went wrong. Please try again." }]);
    } finally {
      setBusy(false);
    }
  }

  if (!open) return null;

  return (
    <aside className="glass-card animate-rise fixed bottom-24 right-4 z-50 flex h-[26rem] w-[min(24rem,calc(100vw-2rem))] flex-col p-0 md:bottom-6">
      <header className="flex items-center justify-between border-b border-border/60 px-4 py-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">AgriSense Assistant</h3>
        </div>
        <button onClick={onClose} aria-label="Close assistant" className="text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3 text-sm">
        {turns.map((t, i) => (
          <div
            key={i}
            className={cn(
              "max-w-[85%] rounded-[var(--radius-md)] px-3 py-2 leading-relaxed",
              t.role === "user"
                ? "ml-auto bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground",
            )}
          >
            {t.content}
          </div>
        ))}
        {busy && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Bot className="h-4 w-4 animate-pulse" /> thinking…
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5 px-4 pb-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => void send(s)}
            className="rounded-full border border-border bg-background/60 px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          >
            {s}
          </button>
        ))}
      </div>

      <form
        className="flex gap-2 border-t border-border/60 p-3"
        onSubmit={(e) => {
          e.preventDefault();
          void send(input);
        }}
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your farm…"
          className="h-9"
        />
        <Button type="submit" size="icon" className="h-9 w-9 shrink-0" disabled={busy}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </aside>
  );
}
