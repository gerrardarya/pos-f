"use client";

import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ProductStockLogEntry } from "../actions";
import { formatDateTime } from "@/lib/format";
import type { Database } from "@/types/database";

type Product = Database["public"]["Tables"]["products"]["Row"];

export function ProductLogDialog({
  product,
  entries,
  isLoading,
  open,
  onOpenChange,
}: {
  product: Product | null;
  entries: ProductStockLogEntry[] | null;
  isLoading: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{product?.name}</DialogTitle>
          <DialogDescription>
            Stok saat ini: {product?.stock_qty} {product?.base_unit}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="size-5 animate-spin" />
          </div>
        ) : !entries || entries.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Belum ada riwayat stok untuk produk ini.
          </p>
        ) : (
          <div className="max-h-[60vh] overflow-y-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Jenis</TableHead>
                  <TableHead className="text-right">Perubahan</TableHead>
                  <TableHead>Oleh</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="text-muted-foreground">
                      {formatDateTime(entry.created_at)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={entry.is_sale ? "secondary" : "outline"}>
                        {entry.is_sale ? "Penjualan" : "Manual"}
                      </Badge>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {entry.reason}
                      </p>
                    </TableCell>
                    <TableCell
                      className={
                        "text-right " +
                        (entry.change_qty >= 0
                          ? "text-emerald-600"
                          : "text-destructive")
                      }
                    >
                      {entry.change_qty >= 0 ? "+" : ""}
                      {entry.change_qty}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {entry.created_by_name}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
