import { useEffect, useState } from "react";
import {
  createFileRoute,
  useNavigate,
} from "@tanstack/react-router";

import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/hooks/useLanguage";
import { LANGUAGES, type LanguageCode } from "@/i18n/languages";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/auth")({
  component: Auth,
});

function Auth() {
  const navigate = useNavigate();

  const { language, setLanguage } = useLanguage();
  const { t } = useTranslation("auth");

  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  /*
   * Listen for Supabase authentication changes.
   *
   * Google OAuth returns to /auth and Supabase restores the
   * authenticated session automatically when using the implicit
   * browser flow.
   */
  useEffect(() => {
    let mounted = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) {
          return;
        }

        if (
          session?.user &&
          event === "SIGNED_IN"
        ) {
          window.setTimeout(() => {
            if (!mounted) {
              return;
            }

            void navigate({
              to: "/dashboard",
              replace: true,
            });
          }, 0);
        }
      },
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  const handleGoogleLogin = async () => {
    setError("");
    setMessage("");
    setGoogleLoading(true);

    try {
      const redirectTo =
        `${window.location.origin}/auth`;

      const { error: googleError } =
        await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo,
            queryParams: {
              access_type: "offline",
              prompt: "select_account",
            },
          },
        });

      if (googleError) {
        throw googleError;
      }

      /*
       * The browser leaves this page and goes to Google.
       *
       * After successful authentication, Supabase redirects
       * back to /auth and the auth state listener above sends
       * the user to /.
       */
    } catch (err) {
      console.error(
        "Google sign-in failed:",
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : t("googleSigninFailed"),
      );

      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    setError("");
    setMessage("");
    setLoading(true);

    try {
      if (!email.trim() || !password) {
        throw new Error(
          t("pleaseEnterCredentials"),
        );
      }

      const normalizedEmail = email
        .trim()
        .toLowerCase();

      if (isLogin) {
        const { error: loginError } =
          await supabase.auth.signInWithPassword({
            email: normalizedEmail,
            password,
          });

        if (loginError) {
          throw loginError;
        }

        await navigate({
          to: "/dashboard",
          replace: true,
        });

        return;
      }

      const {
        data: { session },
        error: signupError,
      } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
      });

      if (signupError) {
        throw signupError;
      }

      if (session?.user) {
        await navigate({
          to: "/dashboard",
          replace: true,
        });

        return;
      }

      setMessage(
        t("verificationMessage"),
      );
    } catch (err) {
      console.error(
        "Authentication failed:",
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : t("authenticationFailed"),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border">
        <a
          href="/"
          className="text-xl font-bold text-foreground"
        >
          AgriSense AI
        </a>

        {/* Language selector */}
        <div className="flex items-center gap-2">
          <label
            htmlFor="language"
            className="text-sm text-muted-foreground"
          >
            {t("language")}
          </label>

          <select
            id="language"
            value={language}
            onChange={(event) =>
            setLanguage(event.target.value as LanguageCode)
            }
            className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            {LANGUAGES.map((item) => (
              <option key={item.code} value={item.code}>
                {item.native}
              </option>
            ))}
          </select>
        </div>
      </header>

      {/* Authentication */}
      <main className="min-h-[calc(100vh-73px)] flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="rounded-xl border border-border bg-card p-6 shadow-lg">
            <div className="mb-6 text-center">
              <h1 className="text-2xl font-bold text-foreground">
                {isLogin
                  ? t("welcomeBack")
                  : t("createAccount")}
              </h1>

              <p className="mt-2 text-sm text-muted-foreground">
                {isLogin
                  ? t("signInDescription")
                  : t("signUpDescription")}
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-foreground"
                >
                  {t("email")}
                </label>

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  placeholder={t("emailPlaceholder")}
                  autoComplete="email"
                  disabled={
                    loading || googleLoading
                  }
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-medium text-foreground"
                >
                  {t("password")}
                </label>

                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  placeholder={t("passwordPlaceholder")}
                  autoComplete={
                    isLogin
                      ? "current-password"
                      : "new-password"
                  }
                  disabled={
                    loading || googleLoading
                  }
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              {error && (
                <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2">
                  <p className="text-sm text-red-500">
                    {error}
                  </p>
                </div>
              )}

              {message && (
                <div className="rounded-md border border-green-500/30 bg-green-500/10 px-3 py-2">
                  <p className="text-sm text-green-500">
                    {message}
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={
                  loading || googleLoading
                }
                className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading
                  ? t("pleaseWait")
                  : isLogin
                    ? t("signIn")
                    : t("createAccountButton")}
              </button>
            </form>

            <div className="my-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />

              <span className="text-xs text-muted-foreground">
                {t("or")}
              </span>

              <div className="h-px flex-1 bg-border" />
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={
                loading || googleLoading
              }
              className="w-full rounded-md border border-input bg-background px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
            >
              {googleLoading
                ? t("connecting")
                : t("continueWithGoogle")}
            </button>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsLogin((value) => !value);
                  setError("");
                  setMessage("");
                }}
                disabled={
                  loading || googleLoading
                }
                className="text-sm font-medium text-primary hover:underline disabled:pointer-events-none disabled:opacity-50"
              >
                {isLogin
                  ? t("createNewAccount")
                  : t("alreadyHaveAccount")}
              </button>
            </div>

            <div className="mt-4 text-center">
              <a
                href="/"
                className="text-sm text-muted-foreground hover:text-foreground hover:underline"
              >
                {t("backToHome")}
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}