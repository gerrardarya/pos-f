"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function deleteInvoice(
  invoiceId: string
): Promise<{ error: string } | null> {
  await requireRole("admin");

  const supabase = await createClient();
  const { error } = await supabase.rpc("delete_invoice", {
    p_invoice_id: invoiceId,
  });

  if (error) return { error: "Tidak dapat menghapus transaksi." };

  revalidatePath("/invoices");
  revalidatePath("/pos");
  revalidatePath("/stock");
  revalidatePath("/products");
  return null;
}
