"use client";

import Link from "next/link";
import { ArrowLeft, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PrintActions() {
  return (
    <div className="mx-auto mb-4 flex w-full max-w-[210mm] items-center justify-between print:hidden">
      <Button variant="outline" size="sm" render={<Link href="/invoices" />}>
        <ArrowLeft className="size-4" />
        Kembali ke transaksi
      </Button>
      <Button size="sm" onClick={() => window.print()}>
        <Printer className="size-4" />
        Cetak
      </Button>
    </div>
  );
}
