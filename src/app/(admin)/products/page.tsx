import { createClient } from "@/lib/supabase/server";
import { ProductsTable } from "./_components/products-table";
import { ProductFormDialog } from "./_components/product-form-dialog";
import type { Database } from "@/types/database";

type ProductUnit = Database["public"]["Tables"]["product_units"]["Row"];

export default async function ProductsPage() {
  const supabase = await createClient();
  const [{ data: products }, { data: units }] = await Promise.all([
    supabase.from("products").select("*").order("name"),
    supabase.from("product_units").select("*").order("qty_in_base"),
  ]);

  const unitsByProductId = new Map<string, ProductUnit[]>();
  for (const unit of units ?? []) {
    const list = unitsByProductId.get(unit.product_id) ?? [];
    list.push(unit);
    unitsByProductId.set(unit.product_id, list);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Produk</h1>
        <ProductFormDialog />
      </div>
      <ProductsTable
        products={products ?? []}
        unitsByProductId={unitsByProductId}
      />
    </div>
  );
}
