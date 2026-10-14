"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteDraftInvoice } from "../actions";

export function BackButton({
  invoiceId,
  isEmpty,
}: {
  invoiceId: string;
  isEmpty: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (!isEmpty) {
      router.push("/pos");
      return;
    }
    startTransition(async () => {
      await deleteDraftInvoice(invoiceId);
      router.push("/pos");
    });
  }

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={handleClick}
      disabled={isPending}
    >
      {isPending ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <ArrowLeft className="size-4" />
      )}
    </Button>
  );
}
