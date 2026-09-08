"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, LogOut, Menu, User } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Sidebar } from "./sidebar";

export function Topbar({ title }: { title: string }) {
  const { user, role, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <header className="flex items-center justify-between border-b border-line bg-paper/90 px-4 md:px-8 py-3.5 sticky top-0 z-20 backdrop-blur">
        <div className="flex items-center gap-3">
          <button
            className="md:hidden rounded-lg p-2 hover:bg-ink-100"
            onClick={() => setMobileNavOpen(true)}
            aria-label="Open navigation"
          >
            <Menu size={18} />
          </button>
          <p className="text-sm text-ink-500 md:hidden">{title}</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="relative rounded-lg p-2 hover:bg-ink-100" aria-label="Notifications">
            <Bell size={17} className="text-ink-500" />
            <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-maroon-600" />
          </button>
          <div className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-2 rounded-lg border border-line bg-white px-2.5 py-1.5 hover:bg-ink-100/50"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gold-100 text-maroon-700">
                <User size={13} />
              </span>
              <span className="hidden sm:block text-left leading-tight">
                <span className="block text-xs font-medium text-ink-900">{user?.name}</span>
                <span className="block text-[11px] text-ink-500">{role?.name}</span>
              </span>
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-44 rounded-lg border border-line bg-white shadow-panel py-1 z-30">
                <button
                  onClick={() => {
                    logout();
                    router.push("/login");
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-bad hover:bg-ink-100/60"
                >
                  <LogOut size={14} /> Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {mobileNavOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-ink-950/40" onClick={() => setMobileNavOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-64 bg-white shadow-xl">
            <Sidebar mobile />
          </div>
        </div>
      )}
    </>
  );
}
