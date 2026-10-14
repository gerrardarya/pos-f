import Link from "next/link";
import { Printer } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { invoiceStatusLabel } from "@/lib/statuses";

export default async function InvoicesPage() {
  const supabase = await createClient();

  const { data: invoices } = await supabase
    .from("invoices")
    .select("*")
    .order("created_at", { ascending: false });

  const creatorIds = [...new Set((invoices ?? []).map((i) => i.created_by))];
  const { data: creators } = creatorIds.length
    ? await supabase.from("profiles").select("id, name").in("id", creatorIds)
    : { data: [] as { id: string; name: string }[] };

  const creatorNameById = new Map((creators ?? []).map((c) => [c.id, c.name]));

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Transaksi</h1>

      {!invoices || invoices.length === 0 ? (
        <div className="rounded-lg border p-8 text-center text-sm text-muted-foreground">
          Belum ada transaksi.
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Dibuat oleh</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="w-0" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">
                    {invoice.name}
                    {invoice.invoice_number && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        {invoice.invoice_number}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={invoice.status === "draft" ? "default" : "secondary"}>
                      {invoiceStatusLabel(invoice.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {creatorNameById.get(invoice.created_by) ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDateTime(invoice.completed_at ?? invoice.created_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(invoice.total)}
                  </TableCell>
                  <TableCell>
                    {invoice.status === "draft" ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        render={<Link href={`/pos/${invoice.id}`} />}
                      >
                        Lanjutkan
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        render={<Link href={`/invoices/${invoice.id}/print`} />}
                      >
                        <Printer className="size-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
