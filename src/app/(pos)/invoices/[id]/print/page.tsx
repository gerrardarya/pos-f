import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PrintActions } from "./_components/print-actions";
import { ReceiptA4 } from "./_components/receipt-a4";

export default async function InvoicePrintPage({
  params,
}: PageProps<"/invoices/[id]/print">) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: invoice } = await supabase
    .from("invoices")
    .select("*")
    .eq("id", id)
    .single();

  if (!invoice) notFound();

  const [{ data: items }, { data: creator }] = await Promise.all([
    supabase
      .from("invoice_items")
      .select("*")
      .eq("invoice_id", id)
      .order("created_at"),
    supabase.from("profiles").select("name").eq("id", invoice.created_by).single(),
  ]);

  return (
    <div className="bg-muted py-6 print:bg-white print:py-0">
      <PrintActions />
      <ReceiptA4
        invoice={invoice}
        items={items ?? []}
        createdByName={creator?.name ?? "—"}
      />
    </div>
  );
}
