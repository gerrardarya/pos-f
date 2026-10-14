"use client";

import { useTransition } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deleteInvoice } from "../actions";
import type { InvoiceStatus } from "@/types/database";

export function DeleteInvoiceButton({
  invoiceId,
  invoiceName,
  status,
}: {
  invoiceId: string;
  invoiceName: string;
  status: InvoiceStatus;
}) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteInvoice(invoiceId);
      if (result?.error) toast.error(result.error);
      else toast.success("Transaksi dihapus");
    });
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button variant="ghost" size="icon-sm" />}>
        <Trash2 className="size-4" />
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus {invoiceName}?</AlertDialogTitle>
          <AlertDialogDescription>
            {status === "completed"
              ? "Transaksi ini sudah selesai — stok yang terpakai akan dikembalikan dan dicatat di riwayat stok. Tindakan ini tidak dapat dibatalkan."
              : "Draf ini dan seluruh itemnya akan dihapus permanen. Tindakan ini tidak dapat dibatalkan."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Batal</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={isPending}>
            {isPending && <Loader2 className="size-4 animate-spin" />}
            Hapus
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
