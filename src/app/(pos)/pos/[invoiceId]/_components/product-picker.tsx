"use client";

import { useMemo, useState, useTransition } from "react";
import { Plus, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { addItem } from "../actions";
import { formatCurrency } from "@/lib/format";
import type { Database } from "@/types/database";

type Product = Database["public"]["Tables"]["products"]["Row"];
type ProductUnit = Database["public"]["Tables"]["product_units"]["Row"];

function ProductRow({
  product,
  units,
  invoiceId,
}: {
  product: Product;
  units: ProductUnit[];
  invoiceId: string;
}) {
  const [unit, setUnit] = useState("base");
  const [qty, setQty] = useState("1");
  const [isPending, startTransition] = useTransition();

  function handleAdd() {
    const qtyNum = Number(qty);
    if (!Number.isFinite(qtyNum) || qtyNum <= 0) {
      toast.error("Masukkan jumlah lebih dari 0.");
      return;
    }
    const formData = new FormData();
    formData.set("product_id", product.id);
    formData.set("unit", unit);
    formData.set("qty", qty);

    startTransition(async () => {
      const result = await addItem(invoiceId, formData);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      setQty("1");
      setUnit("base");
    });
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border p-2.5">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{product.name}</p>
        <p className="text-xs text-muted-foreground">
          {product.base_unit} {formatCurrency(product.unit_price)}
          {units.map((u) => (
            <span key={u.id}>
              {" "}
              &middot; {u.unit_name} isi {u.qty_in_base} {formatCurrency(u.price)}
            </span>
          ))}
          {" "}&middot; stok {product.stock_qty}
        </p>
      </div>
      <div className="flex items-center gap-1.5">
        {units.length > 0 && (
          <Select value={unit} onValueChange={(v) => setUnit(v ?? "base")}>
            <SelectTrigger size="sm" className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="base">{product.base_unit}</SelectItem>
              {units.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.unit_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Input
          type="number"
          min="1"
          step="1"
          value={qty}
          onChange={(e) => setQty(e.target.value)}
          className="w-16"
          disabled={isPending}
        />
        <Button size="icon-sm" onClick={handleAdd} disabled={isPending}>
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Plus className="size-4" />
          )}
        </Button>
      </div>
    </div>
  );
}

export function ProductPicker({
  products,
  unitsByProductId,
  invoiceId,
}: {
  products: Product[];
  unitsByProductId: Map<string, ProductUnit[]>;
  invoiceId: string;
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => {
      const tierBarcodes = unitsByProductId.get(p.id) ?? [];
      return (
        p.name.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q) ||
        p.barcode?.toLowerCase().includes(q) ||
        tierBarcodes.some((u) => u.barcode?.toLowerCase() === q)
      );
    });
  }, [products, query, unitsByProductId]);

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Cari berdasarkan nama, kategori, atau barcode"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-8"
        />
      </div>
      <div className="flex max-h-[60vh] flex-col gap-2 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="p-4 text-center text-sm text-muted-foreground">
            Tidak ada produk yang cocok dengan &ldquo;{query}&rdquo;.
          </p>
        ) : (
          filtered.map((product) => (
            <ProductRow
              key={product.id}
              product={product}
              units={unitsByProductId.get(product.id) ?? []}
              invoiceId={invoiceId}
            />
          ))
        )}
      </div>
    </div>
  );
}
