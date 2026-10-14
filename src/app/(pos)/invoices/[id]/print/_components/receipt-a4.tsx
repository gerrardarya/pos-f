import { STORE_ADDRESS, STORE_NAME, STORE_PHONE } from "@/lib/store-config";
import { formatCurrency, formatDateTime } from "@/lib/format";
import type { Database } from "@/types/database";

type Invoice = Database["public"]["Tables"]["invoices"]["Row"];
type InvoiceItem = Database["public"]["Tables"]["invoice_items"]["Row"];

export function ReceiptA4({
  invoice,
  items,
  createdByName,
}: {
  invoice: Invoice;
  items: InvoiceItem[];
  createdByName: string;
}) {
  const discount = invoice.subtotal - invoice.total;
  const date = invoice.completed_at ?? invoice.created_at;

  return (
    <div className="mx-auto flex min-h-[297mm] w-full max-w-[210mm] flex-col bg-white p-[15mm] text-black shadow-sm print:min-h-0 print:shadow-none">
      <header className="flex flex-col items-center gap-1 border-b pb-4 text-center">
        <h1 className="text-2xl font-bold">{STORE_NAME}</h1>
        <p className="text-sm text-neutral-600">{STORE_ADDRESS}</p>
        <p className="text-sm text-neutral-600">{STORE_PHONE}</p>
      </header>

      <div className="flex items-start justify-between gap-4 border-b py-4 text-sm">
        <div>
          <p className="font-medium">{invoice.name}</p>
          {invoice.invoice_number && (
            <p className="text-neutral-600">{invoice.invoice_number}</p>
          )}
          {invoice.status === "draft" && (
            <p className="font-semibold text-neutral-500">DRAF — BELUM SELESAI</p>
          )}
        </div>
        <div className="text-right text-neutral-600">
          <p>{formatDateTime(date)}</p>
          <p>Dilayani oleh {createdByName}</p>
        </div>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-neutral-600">
            <th className="py-2 font-medium">Item</th>
            <th className="py-2 text-right font-medium">Jml</th>
            <th className="py-2 text-right font-medium">Harga</th>
            <th className="py-2 text-right font-medium">Total</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-b border-dashed">
              <td className="py-2">
                {item.product_name_snapshot}
                <span className="text-neutral-500"> ({item.unit_sold})</span>
              </td>
              <td className="py-2 text-right">{item.qty}</td>
              <td className="py-2 text-right">{formatCurrency(item.final_price)}</td>
              <td className="py-2 text-right">{formatCurrency(item.line_total)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-4 flex justify-end">
        <div className="flex w-64 flex-col gap-1 text-sm">
          <div className="flex justify-between">
            <span className="text-neutral-600">Subtotal</span>
            <span>{formatCurrency(invoice.subtotal)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between">
              <span className="text-neutral-600">Diskon</span>
              <span>-{formatCurrency(discount)}</span>
            </div>
          )}
          <div className="flex justify-between border-t pt-1 text-base font-semibold">
            <span>Total</span>
            <span>{formatCurrency(invoice.total)}</span>
          </div>
          {invoice.payment_method && (
            <div className="mt-2 flex justify-between text-neutral-600">
              <span>Pembayaran</span>
              <span>{invoice.payment_method === "cash" ? "Tunai" : "Lainnya"}</span>
            </div>
          )}
          {invoice.payment_method === "cash" && invoice.amount_tendered != null && (
            <>
              <div className="flex justify-between text-neutral-600">
                <span>Uang diterima</span>
                <span>{formatCurrency(invoice.amount_tendered)}</span>
              </div>
              <div className="flex justify-between text-neutral-600">
                <span>Kembalian</span>
                <span>{formatCurrency(invoice.change_due ?? 0)}</span>
              </div>
            </>
          )}
        </div>
      </div>

      <footer className="mt-auto pt-8 text-center text-sm text-neutral-500">
        Terima kasih telah berbelanja dengan kami!
      </footer>
    </div>
  );
}
