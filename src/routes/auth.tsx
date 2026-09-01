import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Leaf, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { GlassCard, Orbs } from "@/components/agri/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LanguageSwitcher } from "@/components/agri/LanguageSwitcher";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — AgriSense AI" },
      {
        name: "description",
        content:
          "Sign in to AgriSense AI to monitor soil moisture, detect leaf disease and track your fields in 3D.",
      },
      { property: "og:title", content: "Sign in — AgriSense AI" },
      {
        property: "og:description",
        content: "Access your AgriSense AI smart farming dashboard.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { t } = useTranslation("auth");
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"farmer" | "officer">("farmer");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) void navigate({ to: "/dashboard" });
    });
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: { display_name: name || email.split("@")[0], role },
          },
        });
        if (error) throw error;
        // No email verification: sign the new account straight in.
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        toast.success(t("toastAccountCreated"));
        void navigate({ to: role === "officer" ? "/official" : "/dashboard" });
        return;
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      void navigate({ to: "/dashboard" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("toastAuthFailed"));
    } finally {
      setBusy(false);
    }
  }


  async function google() {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error(t("toastGoogleFailed"));
      return;
    }
    if (result.redirected) return;
    void navigate({ to: "/dashboard" });
  }

  return (
    <div className="relative grid min-h-screen place-items-center px-4 py-12">
      <Orbs />
      <GlassCard className="animate-rise w-full max-w-md p-8">
        <div className="mb-6 flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-[var(--radius-md)] bg-primary text-primary-foreground">
            <Leaf className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-semibold">AgriSense AI</h1>
            <p className="text-sm text-muted-foreground">
              {mode === "signin" ? t("welcomeBack") : t("createAccount")}
            </p>
          </div>
          <LanguageSwitcher />
        </div>

        <form onSubmit={submit} className="space-y-4">
          {mode === "signup" && (
            <div className="space-y-1.5">
              <Label htmlFor="name">{t("name")}</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder={t("namePlaceholder")} />
            </div>
          )}
          {mode === "signup" && (
            <div className="space-y-1.5">
              <Label>{t("iAmA")}</Label>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { key: "farmer", label: t("roleFarmer"), hint: t("roleFarmerHint") },
                  { key: "officer", label: t("roleOfficer"), hint: t("roleOfficerHint") },
                ] as const).map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setRole(opt.key)}
                    className={cn(
                      "rounded-[var(--radius-md)] border border-border px-3 py-2.5 text-left transition-colors",
                      role === opt.key
                        ? "border-primary bg-primary/10"
                        : "hover:bg-secondary",
                    )}
                  >
                    <span className="block text-sm font-medium">{opt.label}</span>
                    <span className="block text-[11px] text-muted-foreground">{opt.hint}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="email">{t("email")}</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("emailPlaceholder")}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">{t("password")}</Label>
            <Input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <Button type="submit" className="w-full" disabled={busy}>
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === "signin" ? t("signIn") : t("createAccountButton")}
          </Button>
        </form>

        <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" /> {t("or")} <span className="h-px flex-1 bg-border" />
        </div>

        <Button variant="outline" className="w-full" onClick={() => void google()}>
          {t("continueWithGoogle")}
        </Button>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {mode === "signin" ? t("newToAgrisense") : t("alreadyHaveAccount")}{" "}
          <button
            type="button"
            className="font-medium text-primary hover:underline"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          >
            {mode === "signin" ? t("createAnAccount") : t("signIn")}
          </button>
        </p>
      </GlassCard>
    </div>
  );
}
