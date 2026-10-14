"use client";

import { useState, useTransition } from "react";
import { Plus, Pencil, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createProduct, updateProduct, type ProductFormState } from "../actions";
import { BASE_UNITS } from "@/lib/units";
import type { Database } from "@/types/database";

type Product = Database["public"]["Tables"]["products"]["Row"];
type ProductUnit = Database["public"]["Tables"]["product_units"]["Row"];

type TierRow = {
  key: string;
  unit_name: string;
  qty_in_base: string;
  price: string;
  barcode: string;
};

const idleState: ProductFormState = { status: "idle" };

function emptyTier(): TierRow {
  return {
    key: crypto.randomUUID(),
    unit_name: "",
    qty_in_base: "",
    price: "",
    barcode: "",
  };
}

function tiersFromUnits(units: ProductUnit[]): TierRow[] {
  return units.map((u) => ({
    key: u.id,
    unit_name: u.unit_name,
    qty_in_base: String(u.qty_in_base),
    price: String(u.price),
    barcode: u.barcode ?? "",
  }));
}

export function ProductFormDialog({
  product,
  units = [],
}: {
  product?: Product;
  units?: ProductUnit[];
}) {
  const isEdit = Boolean(product);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [baseUnit, setBaseUnit] = useState(product?.base_unit ?? BASE_UNITS[0]);
  const [tiers, setTiers] = useState<TierRow[]>(() => tiersFromUnits(units));
  const [stockUnit, setStockUnit] = useState("base");
  const [isPending, startTransition] = useTransition();

  const namedTiers = tiers.filter((t) => t.unit_name.trim() !== "");
  const stockTier = namedTiers.find((t) => t.unit_name === stockUnit);

  function updateTier(key: string, patch: Partial<TierRow>) {
    setTiers((prev) => prev.map((t) => (t.key === key ? { ...t, ...patch } : t)));
  }

  function removeTier(key: string) {
    setTiers((prev) => prev.filter((t) => t.key !== key));
  }

  function handleSubmit(formData: FormData) {
    setError(null);

    if (!isEdit && stockUnit !== "base") {
      const multiplier = Number(stockTier?.qty_in_base);
      if (!stockTier || !Number.isInteger(multiplier) || multiplier <= 1) {
        setError(`Atur jumlah yang valid untuk "${stockTier?.unit_name || stockUnit}" terlebih dahulu.`);
        return;
      }
      const rawStockQty = Number(formData.get("stock_qty") ?? "0");
      formData.set("stock_qty", String(rawStockQty * multiplier));
    }

    formData.set(
      "units_json",
      JSON.stringify(
        tiers.map((t) => ({
          unit_name: t.unit_name,
          qty_in_base: Number(t.qty_in_base),
          price: Number(t.price),
          barcode: t.barcode,
        }))
      )
    );

    startTransition(async () => {
      const result = isEdit
        ? await updateProduct(product!.id, idleState, formData)
        : await createProduct(idleState, formData);

      if (result.status === "error") {
        setError(result.message);
        return;
      }

      toast.success(isEdit ? "Produk diperbarui" : "Produk dibuat");
      setOpen(false);
      if (!isEdit) {
        setBaseUnit(BASE_UNITS[0]);
        setTiers([]);
        setStockUnit("base");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          isEdit ? (
            <Button variant="ghost" size="icon-sm" />
          ) : (
            <Button size="sm" />
          )
        }
      >
        {isEdit ? (
          <Pencil className="size-4" />
        ) : (
          <>
            <Plus className="size-4" />
            Produk baru
          </>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Ubah produk" : "Produk baru"}</DialogTitle>
          <DialogDescription>
            Harga yang Anda atur di sini hanya berlaku ke depan — transaksi
            lama tetap menyimpan data aslinya.
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 flex flex-col gap-1.5">
              <Label htmlFor="name">Nama</Label>
              <Input
                id="name"
                name="name"
                defaultValue={product?.name}
                required
                disabled={isPending}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="category">Kategori</Label>
              <Input
                id="category"
                name="category"
                defaultValue={product?.category ?? ""}
                disabled={isPending}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="barcode">Barcode</Label>
              <Input
                id="barcode"
                name="barcode"
                placeholder="Barcode satuan dasar"
                defaultValue={product?.barcode ?? ""}
                disabled={isPending}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="base_unit">Satuan dasar</Label>
              <Select
                value={baseUnit}
                onValueChange={(value) => setBaseUnit(value ?? BASE_UNITS[0])}
                disabled={isPending}
              >
                <SelectTrigger id="base_unit" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BASE_UNITS.map((unit) => (
                    <SelectItem key={unit} value={unit}>
                      {unit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input type="hidden" name="base_unit" value={baseUnit} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="unit_price">Harga satuan</Label>
              <Input
                id="unit_price"
                name="unit_price"
                type="number"
                step="0.01"
                min="0"
                defaultValue={product?.unit_price}
                required
                disabled={isPending}
              />
            </div>
            {!isEdit && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="stock_qty">Stok awal</Label>
                <div className="flex gap-1.5">
                  <Input
                    id="stock_qty"
                    name="stock_qty"
                    type="number"
                    step="1"
                    min="0"
                    defaultValue={0}
                    disabled={isPending}
                  />
                  {namedTiers.length > 0 && (
                    <Select
                      value={stockUnit}
                      onValueChange={(v) => setStockUnit(v ?? "base")}
                      disabled={isPending}
                    >
                      <SelectTrigger className="w-28 shrink-0">
                        <SelectValue>{stockTier ? stockTier.unit_name : baseUnit}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="base">{baseUnit}</SelectItem>
                        {namedTiers.map((t) => (
                          <SelectItem key={t.key} value={t.unit_name}>
                            {t.unit_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                {stockTier && (
                  <p className="text-xs text-muted-foreground">
                    Dikonversi {stockTier.qty_in_base || "?"}× per{" "}
                    {stockTier.unit_name} menjadi {baseUnit}.
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="rounded-lg border p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">
                Tier lebih besar (misalnya Box, Master Case)
              </p>
              <Button
                type="button"
                variant="outline"
                size="xs"
                onClick={() => setTiers((prev) => [...prev, emptyTier()])}
                disabled={isPending}
              >
                <Plus className="size-3" />
                Tambah tier
              </Button>
            </div>

            {tiers.length === 0 ? (
              <p className="py-2 text-center text-xs text-muted-foreground">
                Belum ada tier lebih besar. Hanya dijual per {baseUnit || "satuan dasar"}.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {tiers.map((tier) => (
                  <div
                    key={tier.key}
                    className="grid grid-cols-[1fr_1fr_1fr_1fr_auto] items-end gap-1.5"
                  >
                    <div className="flex flex-col gap-1">
                      <Label className="text-xs">Nama tier</Label>
                      <Input
                        placeholder="Box"
                        value={tier.unit_name}
                        onChange={(e) =>
                          updateTier(tier.key, { unit_name: e.target.value })
                        }
                        disabled={isPending}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label className="text-xs">Jml / {baseUnit || "satuan"}</Label>
                      <Input
                        type="number"
                        min="2"
                        step="1"
                        placeholder="24"
                        value={tier.qty_in_base}
                        onChange={(e) =>
                          updateTier(tier.key, { qty_in_base: e.target.value })
                        }
                        disabled={isPending}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label className="text-xs">Harga</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={tier.price}
                        onChange={(e) => updateTier(tier.key, { price: e.target.value })}
                        disabled={isPending}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label className="text-xs">Barcode</Label>
                      <Input
                        value={tier.barcode}
                        onChange={(e) =>
                          updateTier(tier.key, { barcode: e.target.value })
                        }
                        disabled={isPending}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeTier(tier.key)}
                      disabled={isPending}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="size-4 animate-spin" />}
              {isEdit ? "Simpan perubahan" : "Buat produk"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
