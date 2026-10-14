import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CartRow } from "./cart-row";
import type { Database } from "@/types/database";

type InvoiceItem = Database["public"]["Tables"]["invoice_items"]["Row"];

export function CartTable({
  items,
  invoiceId,
  readOnly,
}: {
  items: InvoiceItem[];
  invoiceId: string;
  readOnly: boolean;
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-lg border p-8 text-center text-sm text-muted-foreground">
        Keranjang masih kosong. Tambahkan produk dari daftar.
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Item</TableHead>
            <TableHead>Jml</TableHead>
            <TableHead>Harga</TableHead>
            <TableHead className="text-right">Subtotal</TableHead>
            <TableHead className="w-0" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <CartRow
              key={item.id}
              item={item}
              invoiceId={invoiceId}
              readOnly={readOnly}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
