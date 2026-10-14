import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/format";
import type { Database } from "@/types/database";

type StockAdjustment = Database["public"]["Tables"]["stock_adjustments"]["Row"];

export function AdjustmentLog({
  adjustments,
  productNameById,
  creatorNameById,
}: {
  adjustments: StockAdjustment[];
  productNameById: Map<string, string>;
  creatorNameById: Map<string, string>;
}) {
  if (adjustments.length === 0) {
    return (
      <div className="rounded-lg border p-8 text-center text-sm text-muted-foreground">
        Belum ada penyesuaian stok.
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tanggal</TableHead>
            <TableHead>Produk</TableHead>
            <TableHead>Jenis</TableHead>
            <TableHead className="text-right">Perubahan</TableHead>
            <TableHead>Alasan</TableHead>
            <TableHead>Oleh</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {adjustments.map((adjustment) => (
            <TableRow key={adjustment.id}>
              <TableCell className="text-muted-foreground">
                {formatDateTime(adjustment.created_at)}
              </TableCell>
              <TableCell className="font-medium">
                {productNameById.get(adjustment.product_id) ?? "—"}
              </TableCell>
              <TableCell>
                <Badge
                  variant={
                    adjustment.reason.startsWith("Penjualan ") ? "secondary" : "outline"
                  }
                >
                  {adjustment.reason.startsWith("Penjualan ") ? "Penjualan" : "Manual"}
                </Badge>
              </TableCell>
              <TableCell
                className={
                  "text-right " +
                  (adjustment.change_qty >= 0
                    ? "text-emerald-600"
                    : "text-destructive")
                }
              >
                {adjustment.change_qty >= 0 ? "+" : ""}
                {adjustment.change_qty}
              </TableCell>
              <TableCell>{adjustment.reason}</TableCell>
              <TableCell className="text-muted-foreground">
                {creatorNameById.get(adjustment.created_by) ?? "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
