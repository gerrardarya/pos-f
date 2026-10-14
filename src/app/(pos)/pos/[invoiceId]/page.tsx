import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/server";
import { ProductPicker } from "./_components/product-picker";
import { CartTable } from "./_components/cart-table";
import { InvoiceNameField } from "./_components/invoice-name-field";
import { CheckoutDialog } from "./_components/checkout-dialog";
import { CancelSaleButton } from "./_components/cancel-sale-button";
import { invoiceStatusLabel } from "@/lib/statuses";
import type { Database } from "@/types/database";

type ProductUnit = Database["public"]["Tables"]["product_units"]["Row"];

export default async function PosSalePage({
  params,
}: PageProps<"/pos/[invoiceId]">) {
  const { invoiceId } = await params;
  const supabase = await createClient();

  const { data: invoice } = await supabase
    .from("invoices")
    .select("*")
    .eq("id", invoiceId)
    .single();

  if (!invoice) notFound();

  const [{ data: items }, { data: products }, { data: units }] = await Promise.all([
    supabase
      .from("invoice_items")
      .select("*")
      .eq("invoice_id", invoiceId)
      .order("created_at"),
    supabase.from("products").select("*").order("name"),
    supabase.from("product_units").select("*").order("qty_in_base"),
  ]);

  const unitsByProductId = new Map<string, ProductUnit[]>();
  for (const unit of units ?? []) {
    const list = unitsByProductId.get(unit.product_id) ?? [];
    list.push(unit);
    unitsByProductId.set(unit.product_id, list);
  }

  const readOnly = invoice.status !== "draft";

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon-sm" render={<Link href="/pos" />}>
            <ArrowLeft className="size-4" />
          </Button>
          <InvoiceNameField
            invoiceId={invoice.id}
            initialName={invoice.name}
            readOnly={readOnly}
          />
          <Badge variant={readOnly ? "secondary" : "default"}>
            {invoiceStatusLabel(invoice.status)}
            {invoice.invoice_number ? ` · ${invoice.invoice_number}` : ""}
          </Badge>
        </div>
        {!readOnly && <CancelSaleButton invoiceId={invoice.id} />}
      </div>

      <Separator />

      <div className="grid gap-4 md:grid-cols-2">
        {!readOnly && (
          <ProductPicker
            products={products ?? []}
            unitsByProductId={unitsByProductId}
            invoiceId={invoice.id}
          />
        )}
        <div className={readOnly ? "md:col-span-2" : ""}>
          <CartTable
            items={items ?? []}
            invoiceId={invoice.id}
            readOnly={readOnly}
          />
        </div>
      </div>

      {!readOnly && (
        <div className="flex justify-end">
          <CheckoutDialog
            invoiceId={invoice.id}
            total={invoice.total}
            disabled={(items ?? []).length === 0}
          />
        </div>
      )}
    </div>
  );
}
