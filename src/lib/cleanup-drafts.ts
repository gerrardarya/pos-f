import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

const STALE_AFTER_MS = 60 * 60 * 1000; // 1 hour

/**
 * Deletes draft invoices that never got a single item and have sat
 * untouched past the staleness window — e.g. someone clicked "Start new
 * sale" then closed the tab instead of using Back. Safe to call on every
 * page load: drafts actively being built always have items within minutes,
 * well under the window.
 */
export async function cleanupEmptyDrafts(
  supabase: SupabaseClient<Database>
): Promise<void> {
  const cutoff = new Date(Date.now() - STALE_AFTER_MS).toISOString();

  const { data: staleDrafts } = await supabase
    .from("invoices")
    .select("id")
    .eq("status", "draft")
    .lt("created_at", cutoff);

  if (!staleDrafts || staleDrafts.length === 0) return;

  const staleIds = staleDrafts.map((d) => d.id);
  const { data: itemRows } = await supabase
    .from("invoice_items")
    .select("invoice_id")
    .in("invoice_id", staleIds);

  const idsWithItems = new Set((itemRows ?? []).map((r) => r.invoice_id));
  const emptyIds = staleIds.filter((id) => !idsWithItems.has(id));

  if (emptyIds.length > 0) {
    await supabase.from("invoices").delete().in("id", emptyIds);
  }
}
