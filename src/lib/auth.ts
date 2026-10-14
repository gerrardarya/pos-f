import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Role } from "@/types/database";

export type CurrentUser = {
  id: string;
  email: string | null;
  role: Role;
  name: string;
};

/**
 * Reads the authenticated user and their profile. Returns null if there is
 * no session or no matching profile row. Safe to call from Server
 * Components, Server Actions, and Route Handlers.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient();

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) return null;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, name")
    .eq("id", userData.user.id)
    .single();

  if (profileError || !profile) return null;

  return {
    id: userData.user.id,
    email: userData.user.email ?? null,
    role: profile.role,
    name: profile.name,
  };
}

/**
 * Guard for Server Actions / Route Handlers / Server Components. The proxy
 * already redirects unauthenticated or wrong-role requests away from
 * protected routes, but that is not a security boundary on its own — every
 * mutation must re-check here too.
 */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireRole(role: Role): Promise<CurrentUser> {
  const user = await requireUser();
  if (user.role !== role) redirect("/pos");
  return user;
}
