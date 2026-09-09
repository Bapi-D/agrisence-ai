import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import {
  Bell,
  BarChart3,
  Boxes,
  Bug,
  ClipboardCheck,
  Camera,
  Droplets,
  LayoutDashboard,
  LogOut,
  MapPin,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  ScanLine,
  Sparkles,
  Sun,
  Sprout,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useFarm } from "@/hooks/useFarm";
import { useRole } from "@/hooks/useRole";
import { useTheme } from "@/hooks/useTheme";
import { Orbs } from "@/components/agri/GlassCard";
import { LanguageSwitcher } from "@/components/agri/LanguageSwitcher";
import { ChatAssistant } from "@/components/agri/ChatAssistant";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export const NAV = [
  { to: "/dashboard", key: "dashboard", label: "Dashboard", icon: LayoutDashboard, emoji: "🌾" },
  { to: "/water", key: "water", label: "Water Prediction", icon: Droplets, emoji: "💧" },
  { to: "/disease", key: "disease", label: "Disease Detection", icon: ScanLine, emoji: "🔬" },
  { to: "/pests", key: "pests", label: "Pest Detection", icon: Bug, emoji: "🐛" },
  { to: "/live", key: "live", label: "Live Camera AI", icon: Camera, emoji: "📷" },
  { to: "/farm-3d", key: "farm3d", label: "3D Farm Monitor", icon: Boxes, emoji: "🌿" },
  { to: "/crop", key: "crop", label: "Crop Profile", icon: Sprout, emoji: "🌱" },
  { to: "/hotspots", key: "hotspots", label: "Hotspot Map", icon: MapPin, emoji: "🗺️" },
  { to: "/analytics", key: "analytics", label: "Analytics", icon: BarChart3, emoji: "📊" },
] as const;

export const OFFICER_NAV = {
  to: "/official",
  key: "official",
  label: "Officer Console",
  icon: ClipboardCheck,
  emoji: "🧑‍🌾",
} as const;

type Alert = { id: string; message: string; severity: string; created_at: string; is_read: boolean };

export function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [newFarm, setNewFarm] = useState({ name: "", location: "" });
  const [farmDialog, setFarmDialog] = useState(false);
  const { t } = useTranslation(["common", "nav"]);
  const { theme, toggle } = useTheme();
  const { farms, activeFarm, setActiveFarmId, createFarm } = useFarm();
  const { isOfficer } = useRole();
  const navItems = isOfficer ? [...NAV, OFFICER_NAV] : [...NAV];
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    void supabase
      .from("alerts")
      .select("id,message,severity,created_at,is_read")
      .order("created_at", { ascending: false })
      .limit(12)
      .then(({ data }) => setAlerts((data ?? []) as Alert[]));
  }, [pathname]);

  const unread = alerts.filter((a) => !a.is_read).length;

  async function markRead() {
    if (!unread) return;
    await supabase.from("alerts").update({ is_read: true }).eq("is_read", false);
    setAlerts((prev) => prev.map((a) => ({ ...a, is_read: true })));
  }

  async function signOut() {
    await supabase.auth.signOut();
    void navigate({ to: "/auth" });
  }

  return (
    <div className="relative min-h-screen">
      <Orbs />

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={cn(
            "glass-card sticky top-0 hidden h-screen shrink-0 rounded-none border-y-0 border-l-0 p-4 transition-[width] duration-250 md:flex md:flex-col",
            collapsed ? "w-[5.25rem]" : "w-64",
          )}
        >
          <div className="mb-8 flex items-center gap-2 px-1">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[var(--radius-md)] bg-primary text-primary-foreground">
              <Sprout className="h-5 w-5" />
            </span>
            {!collapsed && (
              <div className="leading-tight">
                <p className="font-display text-sm font-semibold">{t("common:appName")}</p>
                <p className="text-[11px] text-muted-foreground">{t("common:tagline")}</p>
              </div>
            )}
          </div>

          <nav className="flex flex-1 flex-col gap-1">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all duration-250",
                  "hover:bg-secondary hover:text-secondary-foreground",
                  pathname === item.to && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                )}
              >
                <item.icon className="h-[18px] w-[18px] shrink-0" />
                {!collapsed && (
                  <span className="truncate">{t(`nav:${item.key}`, { defaultValue: item.label })}</span>
                )}
              </Link>
            ))}
          </nav>

          <button
            onClick={() => setCollapsed((c) => !c)}
            className="mt-4 flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            {!collapsed && t("common:shell.collapse")}
          </button>
        </aside>

        {/* Main */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Opaque Header */}
          <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-border bg-background/95 backdrop-blur-md px-4 py-3">
            <span className="grid h-8 w-8 place-items-center rounded-[var(--radius-sm)] bg-primary text-primary-foreground md:hidden">
              <Sprout className="h-4 w-4" />
            </span>

            <Select value={activeFarm?.id ?? ""} onValueChange={setActiveFarmId}>
              <SelectTrigger className="h-9 w-[9.5rem] sm:w-52">
                <SelectValue placeholder={t("common:farm.select")} />
              </SelectTrigger>
              <SelectContent>
                {farms.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Dialog open={farmDialog} onOpenChange={setFarmDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon" className="h-9 w-9" aria-label={t("common:farm.add")}>
                  <Plus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t("common:farm.addTitle")}</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <Input
                    placeholder={t("common:farm.namePlaceholder")}
                    value={newFarm.name}
                    onChange={(e) => setNewFarm((s) => ({ ...s, name: e.target.value }))}
                  />
                  <Input
                    placeholder={t("common:farm.locationPlaceholder")}
                    value={newFarm.location}
                    onChange={(e) => setNewFarm((s) => ({ ...s, location: e.target.value }))}
                  />
                </div>
                <DialogFooter>
                  <Button
                    onClick={async () => {
                      if (!newFarm.name.trim()) return;
                      await createFarm({ name: newFarm.name.trim(), location: newFarm.location });
                      setNewFarm({ name: "", location: "" });
                      setFarmDialog(false);
                    }}
                  >
                    {t("common:farm.create")}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <div className="ml-auto flex items-center gap-1.5">
              <LanguageSwitcher />
              <Popover onOpenChange={(o) => o && void markRead()}>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative h-9 w-9" aria-label={t("common:alerts.aria")}>
                    <Bell className="h-[18px] w-[18px]" />
                    {unread > 0 && (
                      <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
                        {unread}
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-80 p-0">
                  <p className="border-b border-border px-4 py-2.5 text-sm font-semibold">
                    {t("common:alerts.title")}
                  </p>
                  <div className="max-h-72 overflow-y-auto">
                    {alerts.length === 0 && (
                      <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                        {t("common:alerts.empty")}
                      </p>
                    )}
                    {alerts.map((a) => (
                      <div key={a.id} className="border-b border-border/60 px-4 py-3 last:border-0">
                        <p className="text-sm">{a.message}</p>
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          {new Date(a.created_at).toLocaleString()} · {a.severity}
                        </p>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={toggle} aria-label={t("common:shell.toggleTheme")}>
                {theme === "dark" ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
              </Button>
              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => void signOut()} aria-label={t("common:shell.signOut")}>
                <LogOut className="h-[18px] w-[18px]" />
              </Button>
            </div>
          </header>

          <main className="min-w-0 flex-1 px-4 pb-28 pt-6 md:px-8 md:pb-10">{children}</main>
        </div>
      </div>

      {/* Chat launcher */}
      <button
        onClick={() => setChatOpen((o) => !o)}
        className="fixed bottom-20 right-4 z-40 grid h-12 w-12 place-items-center rounded-full bg-primary text-primary-foreground shadow-[var(--shadow-glass)] transition-transform duration-250 hover:scale-105 md:bottom-6"
        aria-label={t("common:shell.assistant")}
      >
        <Sparkles className="h-5 w-5" />
      </button>
      <ChatAssistant open={chatOpen} onClose={() => setChatOpen(false)} />

      {/* Opaque Mobile Bottom Nav */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-1 overflow-x-auto border-t border-border bg-background/95 backdrop-blur-md px-2 py-2 md:hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {navItems.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={cn(
              "flex shrink-0 flex-col items-center gap-1 rounded-[var(--radius-sm)] px-3 py-1.5 text-[11px] font-medium text-muted-foreground transition-colors",
              pathname === item.to && "bg-primary/10 text-primary font-semibold",
            )}
          >
            <item.icon className="h-5 w-5 shrink-0" />
            <span className="whitespace-nowrap">
              {t(`nav:short.${item.key}`, { defaultValue: item.label.split(" ")[0] ?? item.label })}
            </span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
