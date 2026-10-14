import { Store } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { NavMenu } from "@/components/nav-menu";
import { UserMenu } from "@/components/user-menu";
import type { CurrentUser } from "@/lib/auth";

export function AppShell({
  user,
  children,
}: {
  user: CurrentUser;
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <Sidebar className="print:hidden">
        <SidebarHeader>
          <div className="flex items-center gap-2 px-2 py-1.5">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Store className="size-4" />
            </div>
            <span className="text-sm font-semibold">Kasir</span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <NavMenu isAdmin={user.role === "admin"} />
        </SidebarContent>
        <SidebarFooter>
          <UserMenu user={user} />
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4 print:hidden">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-4" />
        </header>
        <main className="flex-1 p-4 md:p-6 print:p-0">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
