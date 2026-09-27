import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const SUPABASE_URL =
  process.env["SUPABASE_URL"] ||
  process.env["VITE_SUPABASE_URL"];

const SUPABASE_SERVICE_ROLE_KEY =
  process.env["SUPABASE_SERVICE_ROLE_KEY"];

if (!SUPABASE_URL) {
  throw new Error(
    "Missing SUPABASE_URL. Add your Supabase project URL to .env.",
  );
}

if (!SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    "Missing SUPABASE_SERVICE_ROLE_KEY. Add your Supabase service role key to .env.",
  );
}

function isNewSupabaseApiKey(value: string): boolean {
  return (
    value.startsWith("sb_publishable_") ||
    value.startsWith("sb_secret_")
  );
}

function createSupabaseFetch(
  supabaseKey: string,
): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== "undefined" &&
        input instanceof Request
        ? input.headers
        : undefined,
    );

    if (init?.headers) {
      new Headers(init.headers).forEach(
        (value, key) => {
          headers.set(key, value);
        },
      );
    }

    if (
      isNewSupabaseApiKey(supabaseKey) &&
      headers.get("Authorization") ===
        `Bearer ${supabaseKey}`
    ) {
      headers.delete("Authorization");
    }

    headers.set("apikey", supabaseKey);

    return fetch(input, {
      ...init,
      headers,
    });
  };
}

export const supabaseAdmin = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  {
    global: {
      fetch: createSupabaseFetch(
        SUPABASE_SERVICE_ROLE_KEY,
      ),
    },

    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  },
);