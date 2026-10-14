"use client";

import { useState, useTransition } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AdjustStockDialog } from "./adjust-stock-dialog";
import { ProductLogDialog } from "./product-log-dialog";
import { getProductStockLog, type ProductStockLogEntry } from "../actions";
import type { Database } from "@/types/database";

type Product = Database["public"]["Tables"]["products"]["Row"];
type ProductUnit = Database["public"]["Tables"]["product_units"]["Row"];

export function StockTable({
  products,
  unitsByProductId,
}: {
  products: Product[];
  unitsByProductId: Map<string, ProductUnit[]>;
}) {
  const [selected, setSelected] = useState<Product | null>(null);
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState<ProductStockLogEntry[] | null>(null);
  const [isPending, startTransition] = useTransition();

  function openLog(product: Product) {
    setSelected(product);
    setOpen(true);
    setEntries(null);
    startTransition(async () => {
      const result = await getProductStockLog(product.id);
      setEntries(result);
    });
  }

  if (products.length === 0) {
    return (
      <div className="rounded-lg border p-8 text-center text-sm text-muted-foreground">
        Belum ada produk.
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produk</TableHead>
              <TableHead className="text-right">Stok</TableHead>
              <TableHead className="w-0" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow
                key={product.id}
                className="cursor-pointer"
                onClick={() => openLog(product)}
              >
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell className="text-right">
                  {product.stock_qty} {product.base_unit}
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <AdjustStockDialog
                    products={products}
                    unitsByProductId={unitsByProductId}
                    product={product}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <ProductLogDialog
        product={selected}
        entries={entries}
        isLoading={isPending}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
