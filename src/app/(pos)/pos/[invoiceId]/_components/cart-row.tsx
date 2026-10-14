"use client";

import { useState, useTransition } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { updateItemQty, updateItemPrice, removeItem } from "../actions";
import { formatCurrency } from "@/lib/format";
import type { Database } from "@/types/database";

type InvoiceItem = Database["public"]["Tables"]["invoice_items"]["Row"];

export function CartRow({
  item,
  invoiceId,
  readOnly,
}: {
  item: InvoiceItem;
  invoiceId: string;
  readOnly: boolean;
}) {
  const [qty, setQty] = useState(String(item.qty));
  const [price, setPrice] = useState(String(item.final_price));
  const [isPending, startTransition] = useTransition();
  const isOverridden = item.final_price !== item.original_price;

  function commitQty() {
    const value = Number(qty);
    if (value === item.qty || !Number.isFinite(value) || value <= 0) {
      setQty(String(item.qty));
      return;
    }
    startTransition(async () => {
      const result = await updateItemQty(item.id, invoiceId, value);
      if (result?.error) {
        toast.error(result.error);
        setQty(String(item.qty));
      }
    });
  }

  function commitPrice() {
    const value = Number(price);
    if (value === item.final_price || !Number.isFinite(value) || value < 0) {
      setPrice(String(item.final_price));
      return;
    }
    startTransition(async () => {
      const result = await updateItemPrice(item.id, invoiceId, value);
      if (result?.error) {
        toast.error(result.error);
        setPrice(String(item.final_price));
      }
    });
  }

  function handleRemove() {
    startTransition(async () => {
      const result = await removeItem(item.id, invoiceId);
      if (result?.error) toast.error(result.error);
    });
  }

  return (
    <TableRow>
      <TableCell>
        <p className="font-medium">{item.product_name_snapshot}</p>
        <p className="text-xs text-muted-foreground">{item.unit_sold}</p>
      </TableCell>
      <TableCell>
        <Input
          type="number"
          min="1"
          step="1"
          value={qty}
          onChange={(e) => setQty(e.target.value)}
          onBlur={commitQty}
          disabled={isPending || readOnly}
          className="w-16"
        />
      </TableCell>
      <TableCell>
        <Input
          type="number"
          min="0"
          step="0.01"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          onBlur={commitPrice}
          disabled={isPending || readOnly}
          className="w-24"
        />
        {isOverridden && (
          <p className="text-xs text-muted-foreground line-through">
            {formatCurrency(item.original_price)}
          </p>
        )}
      </TableCell>
      <TableCell className="text-right">
        {formatCurrency(item.final_price * Number(qty || item.qty))}
      </TableCell>
      <TableCell>
        {!readOnly && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleRemove}
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Trash2 className="size-4" />
            )}
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
}
