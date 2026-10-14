"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { completeInvoice } from "../actions";
import { formatCurrency } from "@/lib/format";

export function CheckoutDialog({
  invoiceId,
  total,
  disabled,
}: {
  invoiceId: string;
  total: number;
  disabled: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "other">("cash");
  const [amountTendered, setAmountTendered] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const changeDue = useMemo(() => {
    const tendered = Number(amountTendered);
    if (!Number.isFinite(tendered)) return null;
    return tendered - total;
  }, [amountTendered, total]);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await completeInvoice(invoiceId, formData);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      toast.success(
        result.invoiceNumber
          ? `Transaksi selesai — ${result.invoiceNumber}`
          : "Transaksi selesai"
      );
      setOpen(false);
      router.push(`/invoices/${invoiceId}/print`);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="lg" disabled={disabled} />}>
        <CreditCard className="size-4" />
        Bayar &middot; {formatCurrency(total)}
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Selesaikan transaksi</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="flex flex-col gap-4">
          <div className="flex items-center justify-between rounded-lg bg-muted p-3">
            <span className="text-sm text-muted-foreground">Total bayar</span>
            <span className="text-lg font-semibold">{formatCurrency(total)}</span>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="payment_method">Metode pembayaran</Label>
            <Select
              value={paymentMethod}
              onValueChange={(v) => setPaymentMethod(v as "cash" | "other")}
            >
              <SelectTrigger id="payment_method" className="w-full">
                <SelectValue>{paymentMethod === "cash" ? "Tunai" : "Lainnya"}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Tunai</SelectItem>
                <SelectItem value="other">Lainnya</SelectItem>
              </SelectContent>
            </Select>
            <input type="hidden" name="payment_method" value={paymentMethod} />
          </div>

          {paymentMethod === "cash" && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="amount_tendered">Uang diterima</Label>
              <Input
                id="amount_tendered"
                name="amount_tendered"
                type="number"
                min="0"
                step="0.01"
                value={amountTendered}
                onChange={(e) => setAmountTendered(e.target.value)}
                required
                disabled={isPending}
              />
              {changeDue !== null && (
                <p className="text-sm text-muted-foreground">
                  Kembalian: {formatCurrency(Math.max(changeDue, 0))}
                </p>
              )}
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="size-4 animate-spin" />}
              Selesaikan transaksi
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
