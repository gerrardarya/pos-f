"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type ProductFormState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "success" };

type ParsedFields =
  | { ok: true; values: ProductFieldValues; units: ParsedUnit[] }
  | { ok: false; message: string };

type ProductFieldValues = {
  name: string;
  category: string | null;
  barcode: string | null;
  base_unit: string;
  unit_price: number;
};

type ParsedUnit = {
  unit_name: string;
  qty_in_base: number;
  price: number;
  barcode: string | null;
};

function parseFields(formData: FormData): ParsedFields {
  const name = String(formData.get("name") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const barcode = String(formData.get("barcode") ?? "").trim();
  const baseUnit = String(formData.get("base_unit") ?? "").trim();
  const unitPriceRaw = String(formData.get("unit_price") ?? "").trim();
  const unitsJson = String(formData.get("units_json") ?? "[]");

  if (!name) return { ok: false, message: "Nama wajib diisi." };
  if (!baseUnit) return { ok: false, message: "Satuan dasar wajib diisi." };

  const unitPrice = Number(unitPriceRaw);
  if (!unitPriceRaw || Number.isNaN(unitPrice) || unitPrice < 0) {
    return { ok: false, message: "Harga satuan harus berupa angka >= 0." };
  }

  let rawUnits: unknown;
  try {
    rawUnits = JSON.parse(unitsJson);
  } catch {
    return { ok: false, message: "Data tier tidak valid." };
  }
  if (!Array.isArray(rawUnits)) {
    return { ok: false, message: "Data tier tidak valid." };
  }

  const units: ParsedUnit[] = [];
  const seenNames = new Set<string>();

  for (const raw of rawUnits) {
    if (typeof raw !== "object" || raw === null) {
      return { ok: false, message: "Data tier tidak valid." };
    }
    const r = raw as Record<string, unknown>;
    const unitName = String(r.unit_name ?? "").trim();
    const qtyInBase = Number(r.qty_in_base);
    const price = Number(r.price);
    const tierBarcode = String(r.barcode ?? "").trim();

    if (!unitName) return { ok: false, message: "Setiap tier harus memiliki nama satuan." };
    if (unitName.toLowerCase() === baseUnit.toLowerCase()) {
      return { ok: false, message: `Tier "${unitName}" tidak boleh sama dengan nama satuan dasar.` };
    }
    if (seenNames.has(unitName.toLowerCase())) {
      return { ok: false, message: `Nama tier "${unitName}" digunakan lebih dari sekali.` };
    }
    if (!Number.isInteger(qtyInBase) || qtyInBase <= 1) {
      return {
        ok: false,
        message: `"${unitName}" harus berisi lebih dari 1 ${baseUnit || "satuan dasar"}.`,
      };
    }
    if (Number.isNaN(price) || price < 0) {
      return { ok: false, message: `Harga "${unitName}" harus berupa angka >= 0.` };
    }

    seenNames.add(unitName.toLowerCase());
    units.push({
      unit_name: unitName,
      qty_in_base: qtyInBase,
      price,
      barcode: tierBarcode || null,
    });
  }

  return {
    ok: true,
    values: {
      name,
      category: category || null,
      barcode: barcode || null,
      base_unit: baseUnit,
      unit_price: unitPrice,
    },
    units,
  };
}

async function replaceProductUnits(
  supabase: Awaited<ReturnType<typeof createClient>>,
  productId: string,
  units: ParsedUnit[]
) {
  const { error: deleteError } = await supabase
    .from("product_units")
    .delete()
    .eq("product_id", productId);
  if (deleteError) return deleteError;

  if (units.length === 0) return null;

  const { error: insertError } = await supabase.from("product_units").insert(
    units.map((u) => ({ ...u, product_id: productId }))
  );
  return insertError;
}

export async function createProduct(
  _prevState: ProductFormState,
  formData: FormData
): Promise<ProductFormState> {
  await requireRole("admin");

  const parsed = parseFields(formData);
  if (!parsed.ok) return { status: "error", message: parsed.message };

  const stockQtyRaw = String(formData.get("stock_qty") ?? "0").trim();
  const stockQty = Number(stockQtyRaw);
  if (Number.isNaN(stockQty) || stockQty < 0) {
    return { status: "error", message: "Stok awal harus berupa angka >= 0." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .insert({ ...parsed.values, stock_qty: stockQty })
    .select("id")
    .single();

  if (error || !data) {
    if (error?.code === "23505") {
      return { status: "error", message: "Barcode tersebut sudah digunakan." };
    }
    return { status: "error", message: "Tidak dapat membuat produk." };
  }

  const unitsError = await replaceProductUnits(supabase, data.id, parsed.units);
  if (unitsError) {
    if (unitsError.code === "23505") {
      return { status: "error", message: "Salah satu barcode tier sudah digunakan." };
    }
    return { status: "error", message: "Produk dibuat, tetapi tier gagal disimpan." };
  }

  revalidatePath("/products");
  return { status: "success" };
}

export async function updateProduct(
  id: string,
  _prevState: ProductFormState,
  formData: FormData
): Promise<ProductFormState> {
  await requireRole("admin");

  const parsed = parseFields(formData);
  if (!parsed.ok) return { status: "error", message: parsed.message };

  const supabase = await createClient();
  const { error } = await supabase
    .from("products")
    .update({ ...parsed.values, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    if (error.code === "23505") {
      return { status: "error", message: "Barcode tersebut sudah digunakan." };
    }
    return { status: "error", message: "Tidak dapat memperbarui produk." };
  }

  const unitsError = await replaceProductUnits(supabase, id, parsed.units);
  if (unitsError) {
    if (unitsError.code === "23505") {
      return { status: "error", message: "Salah satu barcode tier sudah digunakan." };
    }
    return { status: "error", message: "Produk diperbarui, tetapi tier gagal disimpan." };
  }

  revalidatePath("/products");
  return { status: "success" };
}

export async function deleteProduct(id: string): Promise<{ error: string } | null> {
  await requireRole("admin");

  const supabase = await createClient();
  const { error } = await supabase.from("products").delete().eq("id", id);

  if (error) {
    if (error.code === "23503") {
      return {
        error:
          "Produk ini memiliki riwayat penyesuaian stok dan tidak dapat dihapus.",
      };
    }
    return { error: "Tidak dapat menghapus produk." };
  }

  revalidatePath("/products");
  return null;
}
