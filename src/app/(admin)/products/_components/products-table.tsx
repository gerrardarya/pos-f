import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ProductFormDialog } from "./product-form-dialog";
import { DeleteProductButton } from "./delete-product-button";
import { formatCurrency } from "@/lib/format";
import type { Database } from "@/types/database";

type Product = Database["public"]["Tables"]["products"]["Row"];
type ProductUnit = Database["public"]["Tables"]["product_units"]["Row"];

export function ProductsTable({
  products,
  unitsByProductId,
}: {
  products: Product[];
  unitsByProductId: Map<string, ProductUnit[]>;
}) {
  if (products.length === 0) {
    return (
      <div className="rounded-lg border p-8 text-center text-sm text-muted-foreground">
        Belum ada produk. Tambahkan produk pertama Anda untuk memulai.
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nama</TableHead>
            <TableHead>Kategori</TableHead>
            <TableHead>Barcode</TableHead>
            <TableHead>Satuan dasar</TableHead>
            <TableHead>Tier lebih besar</TableHead>
            <TableHead className="text-right">Stok</TableHead>
            <TableHead className="w-0" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => {
            const units = unitsByProductId.get(product.id) ?? [];
            return (
              <TableRow key={product.id}>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell>
                  {product.category ? (
                    <Badge variant="secondary">{product.category}</Badge>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {product.barcode ?? "—"}
                </TableCell>
                <TableCell>
                  {product.base_unit} &middot; {formatCurrency(product.unit_price)}
                </TableCell>
                <TableCell>
                  {units.length === 0 ? (
                    <span className="text-muted-foreground">—</span>
                  ) : (
                    <div className="flex flex-col gap-0.5">
                      {units.map((unit) => (
                        <span key={unit.id} className="text-sm">
                          {unit.unit_name} isi {unit.qty_in_base} &middot;{" "}
                          {formatCurrency(unit.price)}
                        </span>
                      ))}
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {product.stock_qty} {product.base_unit}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <ProductFormDialog product={product} units={units} />
                    <DeleteProductButton
                      productId={product.id}
                      productName={product.name}
                    />
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
