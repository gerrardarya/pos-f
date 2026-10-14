import type { InvoiceStatus } from "@/types/database";

export function invoiceStatusLabel(status: InvoiceStatus): string {
  return status === "draft" ? "Draf" : "Selesai";
}
