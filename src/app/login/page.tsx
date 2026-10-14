import { Store } from "lucide-react";
import { LoginForm } from "./_components/login-form";

export default function LoginPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-primary p-10 text-primary-foreground lg:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, white 0%, transparent 35%), radial-gradient(circle at 80% 80%, white 0%, transparent 35%)",
          }}
        />
        <div className="relative flex items-center gap-2 font-semibold">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary-foreground/15">
            <Store className="size-4" />
          </div>
          Kasir
        </div>
        <div className="relative flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight">
            Kelola kasir dengan percaya diri.
          </h1>
          <p className="max-w-sm text-sm text-primary-foreground/80">
            Cari produk, buat transaksi, dan cetak struk A4 dalam hitungan
            detik — dengan akses berbasis peran untuk seluruh tim Anda.
          </p>
        </div>
      </div>
      <div className="flex items-center justify-center bg-background p-6">
        <LoginForm />
      </div>
    </div>
  );
}
