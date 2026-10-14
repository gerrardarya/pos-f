"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type StockFormState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "success" };

export async function adjustStock(
  _prevState: StockFormState,
  formData: FormData
): Promise<StockFormState> {
  await requireRole("admin");

  const productId = String(formData.get("product_id") ?? "");
  const direction = String(formData.get("direction") ?? "add");
  const unitChoice = String(formData.get("unit") ?? "base");
  const qtyRaw = String(formData.get("qty") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim();

  if (!productId) return { status: "error", message: "Pilih produk terlebih dahulu." };

  const qty = Number(qtyRaw);
  if (!qtyRaw || !Number.isFinite(qty) || qty <= 0) {
    return { status: "error", message: "Jumlah harus lebih dari 0." };
  }
  if (!reason) return { status: "error", message: "Alasan wajib diisi." };

  const supabase = await createClient();

  const { data: product } = await supabase
    .from("products")
    .select("base_unit")
    .eq("id", productId)
    .single();
  if (!product) return { status: "error", message: "Produk tidak ditemukan." };

  let baseUnitQty = qty;
  let fullReason = reason;

  if (unitChoice !== "base") {
    const { data: tier } = await supabase
      .from("product_units")
      .select("unit_name, qty_in_base")
      .eq("id", unitChoice)
      .eq("product_id", productId)
      .single();
    if (!tier) return { status: "error", message: "Tier tersebut sudah tidak ada untuk produk ini." };

    baseUnitQty = qty * tier.qty_in_base;
    fullReason = `${reason} (${qty} ${tier.unit_name} = ${baseUnitQty} ${product.base_unit})`;
  }

  const changeQty = direction === "remove" ? -baseUnitQty : baseUnitQty;

  const { error } = await supabase.rpc("adjust_stock", {
    p_product_id: productId,
    p_change_qty: changeQty,
    p_reason: fullReason,
  });

  if (error) {
    if (error.message.includes("stock_qty")) {
      return { status: "error", message: "Stok akan menjadi negatif." };
    }
    return { status: "error", message: "Tidak dapat menyesuaikan stok." };
  }

  revalidatePath("/stock");
  revalidatePath("/products");
  return { status: "success" };
}

export type ProductStockLogEntry = {
  id: string;
  change_qty: number;
  reason: string;
  created_at: string;
  created_by_name: string;
  is_sale: boolean;
};

export async function getProductStockLog(
  productId: string
): Promise<ProductStockLogEntry[]> {
  await requireRole("admin");

  const supabase = await createClient();
  const { data: adjustments } = await supabase
    .from("stock_adjustments")
    .select("id, change_qty, reason, created_at, created_by")
    .eq("product_id", productId)
    .order("created_at", { ascending: false })
    .limit(100);

  const creatorIds = [...new Set((adjustments ?? []).map((a) => a.created_by))];
  const { data: creators } = creatorIds.length
    ? await supabase.from("profiles").select("id, name").in("id", creatorIds)
    : { data: [] as { id: string; name: string }[] };
  const creatorNameById = new Map((creators ?? []).map((c) => [c.id, c.name]));

  return (adjustments ?? []).map((a) => ({
    id: a.id,
    change_qty: a.change_qty,
    reason: a.reason,
    created_at: a.created_at,
    created_by_name: creatorNameById.get(a.created_by) ?? "—",
    is_sale: a.reason.startsWith("Penjualan "),
  }));
}
