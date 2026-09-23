/**
 * Supabase PostgREST accessor for the public reading-plans API.
 *
 * Uses the same Supabase project as the web app and mobile app (reading_plans
 * + plan_sections are the authored source of truth). Implemented with plain
 * fetch against PostgREST so the backend needs no supabase-js dependency.
 * When Supabase env vars are missing, every accessor returns an empty list so
 * callers fall back to the static catalog in lib/reading-plans.ts.
 */

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  "";
const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.EXPO_PUBLIC_SUPABASE_KEY ||
  "";

export const isPublicSupabaseConfigured = !!(SUPABASE_URL && SUPABASE_KEY);

const REVALIDATE = 300;

type FetchRowsOptions = {
  select?: string;
  filters?: Record<string, string>; // PostgREST predicates, e.g. { slug: "eq.foo" }
  order?: string;
};

export async function fetchRows<T>(
  table: string,
  opts: FetchRowsOptions = {},
): Promise<T[]> {
  if (!isPublicSupabaseConfigured) return [];

  const url = new URL(`${SUPABASE_URL}/rest/v1/${table}`);
  if (opts.select) url.searchParams.set("select", opts.select);
  for (const [key, value] of Object.entries(opts.filters ?? {})) {
    url.searchParams.set(key, value);
  }
  if (opts.order) url.searchParams.set("order", opts.order);

  try {
    const res = await fetch(url.toString(), {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        Accept: "application/json",
      },
      next: { revalidate: REVALIDATE },
    });
    if (!res.ok) return [];
    const data: unknown = await res.json();
    return Array.isArray(data) ? (data as T[]) : [];
  } catch {
    return [];
  }
}