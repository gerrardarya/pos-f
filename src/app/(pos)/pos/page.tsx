import Link from "next/link";
import { Receipt } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/format";
import { cleanupEmptyDrafts } from "@/lib/cleanup-drafts";
import { createDraftInvoice } from "./actions";
import { StartSaleButton } from "./_components/start-sale-button";

export default async function PosPage() {
  const supabase = await createClient();
  await cleanupEmptyDrafts(supabase);
  const { data: drafts } = await supabase
    .from("invoices")
    .select("id, name, total, created_at")
    .eq("status", "draft")
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <form action={createDraftInvoice}>
        <StartSaleButton />
      </form>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Draf tersimpan</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-1">
          {!drafts || drafts.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Belum ada draf tersimpan. Mulai transaksi baru di atas.
            </p>
          ) : (
            drafts.map((draft) => (
              <Link
                key={draft.id}
                href={`/pos/${draft.id}`}
                className="flex items-center justify-between rounded-lg px-3 py-2 text-sm hover:bg-muted"
              >
                <span className="flex items-center gap-2">
                  <Receipt className="size-4 text-muted-foreground" />
                  {draft.name}
                </span>
                <span className="text-muted-foreground">
                  {formatCurrency(draft.total)}
                </span>
              </Link>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
