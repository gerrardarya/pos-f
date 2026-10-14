import { createClient } from "@/lib/supabase/server";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdjustStockDialog } from "./_components/adjust-stock-dialog";
import { StockTable } from "./_components/stock-table";
import { AdjustmentLog } from "./_components/adjustment-log";
import type { Database } from "@/types/database";

type ProductUnit = Database["public"]["Tables"]["product_units"]["Row"];

export default async function StockPage() {
  const supabase = await createClient();

  const [{ data: products }, { data: units }, { data: adjustments }] = await Promise.all([
    supabase.from("products").select("*").order("name"),
    supabase.from("product_units").select("*").order("qty_in_base"),
    supabase
      .from("stock_adjustments")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  const unitsByProductId = new Map<string, ProductUnit[]>();
  for (const unit of units ?? []) {
    const list = unitsByProductId.get(unit.product_id) ?? [];
    list.push(unit);
    unitsByProductId.set(unit.product_id, list);
  }

  const creatorIds = [...new Set((adjustments ?? []).map((a) => a.created_by))];
  const { data: creators } = creatorIds.length
    ? await supabase.from("profiles").select("id, name").in("id", creatorIds)
    : { data: [] as { id: string; name: string }[] };

  const productNameById = new Map((products ?? []).map((p) => [p.id, p.name]));
  const creatorNameById = new Map((creators ?? []).map((c) => [c.id, c.name]));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Stok</h1>
        <AdjustStockDialog products={products ?? []} unitsByProductId={unitsByProductId} />
      </div>

      <Tabs defaultValue="current">
        <TabsList>
          <TabsTrigger value="current">Stok saat ini</TabsTrigger>
          <TabsTrigger value="log">Riwayat penyesuaian</TabsTrigger>
        </TabsList>
        <TabsContent value="current" className="mt-4">
          <StockTable products={products ?? []} unitsByProductId={unitsByProductId} />
        </TabsContent>
        <TabsContent value="log" className="mt-4">
          <AdjustmentLog
            adjustments={adjustments ?? []}
            productNameById={productNameById}
            creatorNameById={creatorNameById}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
