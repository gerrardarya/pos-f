"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { updateInvoiceName } from "../actions";

export function InvoiceNameField({
  invoiceId,
  initialName,
  readOnly,
}: {
  invoiceId: string;
  initialName: string;
  readOnly: boolean;
}) {
  const [name, setName] = useState(initialName);
  const [isPending, startTransition] = useTransition();

  function commit() {
    if (name.trim() === initialName || !name.trim()) {
      setName(initialName);
      return;
    }
    startTransition(async () => {
      const result = await updateInvoiceName(invoiceId, name);
      if (result?.error) {
        toast.error(result.error);
        setName(initialName);
      }
    });
  }

  return (
    <Input
      value={name}
      onChange={(e) => setName(e.target.value)}
      onBlur={commit}
      disabled={isPending || readOnly}
      className="w-64 text-lg font-semibold"
    />
  );
}
