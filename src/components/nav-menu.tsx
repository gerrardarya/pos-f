"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Receipt, Package, Warehouse, Users } from "lucide-react";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const STAFF_NAV = [
  { href: "/pos", label: "Kasir", icon: LayoutGrid },
  { href: "/invoices", label: "Transaksi", icon: Receipt },
];

const ADMIN_NAV = [
  { href: "/products", label: "Produk", icon: Package },
  { href: "/stock", label: "Stok", icon: Warehouse },
  { href: "/staff", label: "Staf", icon: Users },
];

export function NavMenu({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();

  return (
    <>
      <SidebarGroup>
        <SidebarGroupLabel>Penjualan</SidebarGroupLabel>
        <SidebarMenu>
          {STAFF_NAV.map(({ href, label, icon: Icon }) => (
            <SidebarMenuItem key={href}>
              <SidebarMenuButton
                isActive={pathname.startsWith(href)}
                render={<Link href={href} />}
              >
                <Icon />
                <span>{label}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroup>

      {isAdmin && (
        <SidebarGroup>
          <SidebarGroupLabel>Admin</SidebarGroupLabel>
          <SidebarMenu>
            {ADMIN_NAV.map(({ href, label, icon: Icon }) => (
              <SidebarMenuItem key={href}>
                <SidebarMenuButton
                  isActive={pathname.startsWith(href)}
                  render={<Link href={href} />}
                >
                  <Icon />
                  <span>{label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      )}
    </>
  );
}
