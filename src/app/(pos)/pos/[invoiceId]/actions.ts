"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type ActionResult = { error: string } | null;

async function recomputeInvoiceTotals(
  supabase: SupabaseClient<Database>,
  invoiceId: string
) {
  const { data: items } = await supabase
    .from("invoice_items")
    .select("qty, original_price, final_price")
    .eq("invoice_id", invoiceId);

  const subtotal = (items ?? []).reduce(
    (sum, item) => sum + item.original_price * item.qty,
    0
  );
  const total = (items ?? []).reduce(
    (sum, item) => sum + item.final_price * item.qty,
    0
  );

  await supabase.from("invoices").update({ subtotal, total }).eq("id", invoiceId);
}

async function getDraftInvoice(supabase: SupabaseClient<Database>, invoiceId: string) {
  const { data } = await supabase
    .from("invoices")
    .select("id, status")
    .eq("id", invoiceId)
    .single();
  return data;
}

export async function addItem(
  invoiceId: string,
  formData: FormData
): Promise<ActionResult> {
  await requireUser();
  const supabase = await createClient();

  const invoice = await getDraftInvoice(supabase, invoiceId);
  if (!invoice) return { error: "Transaksi tidak ditemukan." };
  if (invoice.status !== "draft") return { error: "Transaksi ini sudah selesai." };

  const productId = String(formData.get("product_id") ?? "");
  const unitChoice = String(formData.get("unit") ?? "base");
  const qty = Number(formData.get("qty") ?? "0");

  if (!productId) return { error: "Pilih produk terlebih dahulu." };
  if (!Number.isFinite(qty) || qty <= 0) return { error: "Jumlah harus lebih dari 0." };

  const { data: product } = await supabase
    .from("products")
    .select("name, base_unit, unit_price")
    .eq("id", productId)
    .single();

  if (!product) return { error: "Produk tidak ditemukan." };

  let unitSold = product.base_unit;
  let price = product.unit_price;
  let baseUnitQty = qty;

  if (unitChoice !== "base") {
    const { data: tier } = await supabase
      .from("product_units")
      .select("unit_name, qty_in_base, price")
      .eq("id", unitChoice)
      .eq("product_id", productId)
      .single();

    if (!tier) return { error: "Tier tersebut sudah tidak ada untuk produk ini." };

    unitSold = tier.unit_name;
    price = tier.price;
    baseUnitQty = qty * tier.qty_in_base;
  }

  const { error } = await supabase.from("invoice_items").insert({
    invoice_id: invoiceId,
    product_id: productId,
    product_name_snapshot: product.name,
    unit_sold: unitSold,
    qty,
    base_unit_qty: baseUnitQty,
    original_price: price,
    final_price: price,
    line_total: price * qty,
  });

  if (error) return { error: "Tidak dapat menambahkan item tersebut." };

  await recomputeInvoiceTotals(supabase, invoiceId);
  revalidatePath(`/pos/${invoiceId}`);
  return null;
}

export async function updateItemQty(
  itemId: string,
  invoiceId: string,
  qty: number
): Promise<ActionResult> {
  await requireUser();
  if (!Number.isFinite(qty) || qty <= 0) return { error: "Jumlah harus lebih dari 0." };

  const supabase = await createClient();
  const invoice = await getDraftInvoice(supabase, invoiceId);
  if (!invoice || invoice.status !== "draft") return { error: "Transaksi ini tidak dapat diubah lagi." };

  const { data: item } = await supabase
    .from("invoice_items")
    .select("qty, base_unit_qty, final_price")
    .eq("id", itemId)
    .single();
  if (!item) return { error: "Item tidak ditemukan." };

  const ratio = item.base_unit_qty / item.qty;

  const { error } = await supabase
    .from("invoice_items")
    .update({
      qty,
      base_unit_qty: ratio * qty,
      line_total: item.final_price * qty,
    })
    .eq("id", itemId);

  if (error) return { error: "Tidak dapat mengubah jumlah." };

  await recomputeInvoiceTotals(supabase, invoiceId);
  revalidatePath(`/pos/${invoiceId}`);
  return null;
}

export async function updateItemPrice(
  itemId: string,
  invoiceId: string,
  finalPrice: number
): Promise<ActionResult> {
  await requireUser();
  if (!Number.isFinite(finalPrice) || finalPrice < 0) {
    return { error: "Harga harus berupa angka >= 0." };
  }

  const supabase = await createClient();
  const invoice = await getDraftInvoice(supabase, invoiceId);
  if (!invoice || invoice.status !== "draft") return { error: "Transaksi ini tidak dapat diubah lagi." };

  const { data: item } = await supabase
    .from("invoice_items")
    .select("qty")
    .eq("id", itemId)
    .single();
  if (!item) return { error: "Item tidak ditemukan." };

  const { error } = await supabase
    .from("invoice_items")
    .update({ final_price: finalPrice, line_total: finalPrice * item.qty })
    .eq("id", itemId);

  if (error) return { error: "Tidak dapat mengubah harga." };

  await recomputeInvoiceTotals(supabase, invoiceId);
  revalidatePath(`/pos/${invoiceId}`);
  return null;
}

export async function removeItem(
  itemId: string,
  invoiceId: string
): Promise<ActionResult> {
  await requireUser();
  const supabase = await createClient();

  const invoice = await getDraftInvoice(supabase, invoiceId);
  if (!invoice || invoice.status !== "draft") return { error: "Transaksi ini tidak dapat diubah lagi." };

  const { error } = await supabase.from("invoice_items").delete().eq("id", itemId);
  if (error) return { error: "Tidak dapat menghapus item." };

  await recomputeInvoiceTotals(supabase, invoiceId);
  revalidatePath(`/pos/${invoiceId}`);
  return null;
}

export async function updateInvoiceName(
  invoiceId: string,
  name: string
): Promise<ActionResult> {
  await requireUser();
  const trimmed = name.trim();
  if (!trimmed) return { error: "Nama tidak boleh kosong." };

  const supabase = await createClient();
  const invoice = await getDraftInvoice(supabase, invoiceId);
  if (!invoice || invoice.status !== "draft") return { error: "Transaksi ini tidak dapat diubah lagi." };

  const { error } = await supabase
    .from("invoices")
    .update({ name: trimmed })
    .eq("id", invoiceId);

  if (error) return { error: "Tidak dapat mengganti nama transaksi ini." };

  revalidatePath(`/pos/${invoiceId}`);
  revalidatePath("/pos");
  return null;
}

export async function deleteDraftInvoice(invoiceId: string): Promise<ActionResult> {
  await requireUser();
  const supabase = await createClient();

  const invoice = await getDraftInvoice(supabase, invoiceId);
  if (!invoice || invoice.status !== "draft") return { error: "Transaksi ini tidak dapat dihapus lagi." };

  const { error } = await supabase.from("invoices").delete().eq("id", invoiceId);
  if (error) return { error: "Tidak dapat menghapus transaksi ini." };

  revalidatePath("/pos");
  return null;
}

export async function completeInvoice(
  invoiceId: string,
  formData: FormData
): Promise<{ error: string } | { success: true; invoiceNumber: string }> {
  await requireUser();
  const supabase = await createClient();

  const invoice = await getDraftInvoice(supabase, invoiceId);
  if (!invoice) return { error: "Transaksi tidak ditemukan." };
  if (invoice.status !== "draft") return { error: "Transaksi ini sudah selesai." };

  const { count } = await supabase
    .from("invoice_items")
    .select("id", { count: "exact", head: true })
    .eq("invoice_id", invoiceId);
  if (!count) return { error: "Tambahkan minimal satu item sebelum menyelesaikan transaksi." };

  const paymentMethod = String(formData.get("payment_method") ?? "cash") as
    | "cash"
    | "other";
  const amountTenderedRaw = String(formData.get("amount_tendered") ?? "").trim();

  const { data: invoiceRow } = await supabase
    .from("invoices")
    .select("total")
    .eq("id", invoiceId)
    .single();
  const total = invoiceRow?.total ?? 0;

  let amountTendered: number | null = null;
  if (paymentMethod === "cash") {
    amountTendered = Number(amountTenderedRaw);
    if (!amountTenderedRaw || Number.isNaN(amountTendered) || amountTendered < total) {
      return { error: "Uang diterima minimal harus sama dengan total." };
    }
  }

  const { error } = await supabase.rpc("complete_invoice", {
    p_invoice_id: invoiceId,
    p_payment_method: paymentMethod,
    p_amount_tendered: amountTendered,
  });

  if (error) {
    if (error.message.includes("Insufficient stock")) {
      return { error: "Stok tidak cukup untuk satu atau lebih item." };
    }
    return { error: "Tidak dapat menyelesaikan transaksi." };
  }

  const { data: completed } = await supabase
    .from("invoices")
    .select("invoice_number")
    .eq("id", invoiceId)
    .single();

  revalidatePath("/invoices");
  revalidatePath("/pos");
  return { success: true, invoiceNumber: completed?.invoice_number ?? "" };
}
