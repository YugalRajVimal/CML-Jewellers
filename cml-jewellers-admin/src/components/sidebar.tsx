"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import {
  LayoutDashboard, Gem, Layers, Boxes, Truck, ShoppingBag, RotateCcw,
  Wallet, Users, TicketPercent, Image as ImageIcon, ShieldCheck, ScrollText, ChevronRight, BarChart3, CreditCard,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Permission } from "@/lib/types";

interface NavItem { href: string; label: string; icon: React.ElementType; perm: Permission }
interface NavGroup { label: string; items: NavItem[] }

const NAV: NavGroup[] = [
  { label: "Overview", items: [{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, perm: "dashboard:read" }] },
  {
    label: "Catalog",
    items: [
      { href: "/products", label: "Products", icon: Gem, perm: "product:read" },
      { href: "/categories", label: "Categories", icon: Layers, perm: "category:write" },
      { href: "/inventory", label: "Inventory", icon: Boxes, perm: "inventory:read" },
    ],
  },
  {
    label: "Fulfilment",
    items: [
      { href: "/purchases", label: "Purchases", icon: Truck, perm: "purchase:manage" },
      { href: "/orders", label: "Orders", icon: ShoppingBag, perm: "order:read" },
      { href: "/payments", label: "Payments", icon: CreditCard, perm: "order:read" },
      { href: "/returns", label: "Returns", icon: RotateCcw, perm: "return:manage" },
      { href: "/refunds", label: "Refunds", icon: Wallet, perm: "refund:manage" },
    ],
  },
  {
    label: "Insights",
    items: [{ href: "/sales", label: "Sales", icon: BarChart3, perm: "order:read" }],
  },
  {
    label: "Customers",
    items: [
      { href: "/customers", label: "Customers", icon: Users, perm: "customer:read" },
      { href: "/coupons", label: "Coupons", icon: TicketPercent, perm: "coupon:manage" },
    ],
  },
  {
    label: "Storefront",
    items: [{ href: "/content", label: "Homepage & banners", icon: ImageIcon, perm: "content:manage" }],
  },
  {
    label: "System",
    items: [
      { href: "/roles", label: "Admin users & roles", icon: ShieldCheck, perm: "role:manage" },
      { href: "/audit-log", label: "Audit log", icon: ScrollText, perm: "dashboard:read" },
    ],
  },
];

export function Sidebar({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();
  const { can, role } = useAuth();

  return (
    <aside
      className={clsx(
        "w-64 flex-col border-r border-line bg-white",
        mobile ? "flex h-full" : "hidden md:flex"
      )}
    >
      <div className="flex items-center gap-3 px-5 py-5 border-b border-line">
        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full ring-1 ring-gold-400/60">
          <Image src="/cml-logo.jpg" alt="CML Jewellers" fill className="object-cover scale-[2.6] translate-y-1" />
        </div>
        <div className="leading-tight">
          <p className="font-display text-[15px] text-ink-950">CML Jewellers</p>
          <p className="text-[11px] uppercase tracking-wide text-ink-500">Operations Console</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {NAV.map((group) => {
          const visible = group.items.filter((item) => can(item.perm));
          if (visible.length === 0) return null;
          return (
            <div key={group.label} className="mb-5">
              <p className="px-2.5 mb-1.5 text-[11px] font-medium uppercase tracking-wide text-ink-300">
                {group.label}
              </p>
              <ul className="space-y-0.5">
                {visible.map((item) => {
                  const active = pathname === item.href || pathname.startsWith(item.href + "/");
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={clsx(
                          "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
                          active
                            ? "bg-maroon-700 text-gold-100 font-medium"
                            : "text-ink-700 hover:bg-ink-100/70"
                        )}
                      >
                        <Icon size={16} className={active ? "text-gold-200" : "text-ink-500"} />
                        {item.label}
                        {active && <ChevronRight size={13} className="ml-auto text-gold-200" />}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      <div className="border-t border-line px-4 py-3">
        <p className="text-xs text-ink-500">
          Signed in as <span className="font-medium text-ink-700">{role?.name}</span>
        </p>
      </div>
    </aside>
  );
}
