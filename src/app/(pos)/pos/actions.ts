"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function createDraftInvoice() {
  const user = await requireUser();
  const supabase = await createClient();

  const defaultName = `Transaksi ${new Date().toLocaleString("id-ID")}`;

  const { data, error } = await supabase
    .from("invoices")
    .insert({ name: defaultName, status: "draft", created_by: user.id })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error("Tidak dapat memulai transaksi baru.");
  }

  redirect(`/pos/${data.id}`);
}
