"use client";

import { useAuth } from "@/lib/auth";
import { Permission } from "@/lib/types";
import { ForbiddenState } from "./ui";

export function PermissionGate({ perm, children }: { perm: Permission; children: React.ReactNode }) {
  const { can } = useAuth();
  if (!can(perm)) return <ForbiddenState />;
  return <>{children}</>;
}
