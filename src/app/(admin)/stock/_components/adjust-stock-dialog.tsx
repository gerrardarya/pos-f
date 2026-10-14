"use client";

import { useRef, useState, useTransition } from "react";
import { Loader2, PackagePlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { adjustStock, type StockFormState } from "../actions";
import type { Database } from "@/types/database";

type Product = Database["public"]["Tables"]["products"]["Row"];
type ProductUnit = Database["public"]["Tables"]["product_units"]["Row"];

const idleState: StockFormState = { status: "idle" };

export function AdjustStockDialog({
  products,
  unitsByProductId,
  product,
}: {
  products: Product[];
  unitsByProductId: Map<string, ProductUnit[]>;
  product?: Product;
}) {
  const [open, setOpen] = useState(false);
  const [productId, setProductId] = useState(product?.id ?? "");
  const [direction, setDirection] = useState<"add" | "remove">("add");
  const [unit, setUnit] = useState("base");
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();

  const selectedProduct = product ?? products.find((p) => p.id === productId);
  const selectedUnits = selectedProduct
    ? unitsByProductId.get(selectedProduct.id) ?? []
    : [];
  const selectedTier = selectedUnits.find((u) => u.id === unit);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await adjustStock(idleState, formData);
      if (result.status === "error") {
        setError(result.message);
        return;
      }
      toast.success("Stok berhasil diperbarui");
      setOpen(false);
      formRef.current?.reset();
      setDirection("add");
      setUnit("base");
      if (!product) setProductId("");
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          product ? (
            <Button variant="ghost" size="icon-sm" />
          ) : (
            <Button size="sm" />
          )
        }
      >
        {product ? (
          <PackagePlus className="size-4" />
        ) : (
          <>
            <PackagePlus className="size-4" />
            Sesuaikan stok
          </>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Sesuaikan stok</DialogTitle>
        </DialogHeader>
        <form ref={formRef} action={handleSubmit} className="flex flex-col gap-3">
          <input type="hidden" name="product_id" value={productId} />
          <input type="hidden" name="direction" value={direction} />
          <input type="hidden" name="unit" value={unit} />

          <div className="flex flex-col gap-1.5">
            <Label>Produk</Label>
            <Select
              value={productId}
              onValueChange={(value) => {
                setProductId(value ?? "");
                setUnit("base");
              }}
              disabled={Boolean(product) || isPending}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih produk" />
              </SelectTrigger>
              <SelectContent>
                {(product ? [product] : products).map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} ({p.stock_qty} {p.base_unit})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Arah</Label>
            <Select
              value={direction}
              onValueChange={(v) => setDirection(v as "add" | "remove")}
              disabled={isPending}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="add">Tambah (restock)</SelectItem>
                <SelectItem value="remove">Kurangi (koreksi/rusak)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {selectedUnits.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <Label>Satuan</Label>
              <Select
                value={unit}
                onValueChange={(v) => setUnit(v ?? "base")}
                disabled={isPending}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="base">{selectedProduct?.base_unit}</SelectItem>
                  {selectedUnits.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.unit_name} (isi {u.qty_in_base} {selectedProduct?.base_unit})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="qty">
              Jumlah
              {selectedProduct &&
                ` (${selectedTier ? selectedTier.unit_name : selectedProduct.base_unit})`}
            </Label>
            <Input
              id="qty"
              name="qty"
              type="number"
              min="0"
              step="1"
              required
              disabled={isPending}
            />
            {selectedTier && selectedProduct && (
              <p className="text-xs text-muted-foreground">
                Dikonversi {selectedTier.qty_in_base}× per {selectedTier.unit_name} menjadi{" "}
                {selectedProduct.base_unit}.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="reason">Alasan</Label>
            <Input
              id="reason"
              name="reason"
              placeholder="misalnya Restock mingguan, barang rusak"
              required
              disabled={isPending}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="submit" disabled={isPending || !productId}>
              {isPending && <Loader2 className="size-4 animate-spin" />}
              Simpan penyesuaian
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
