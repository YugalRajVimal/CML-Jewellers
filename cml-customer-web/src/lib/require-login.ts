"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./auth-context";
import { getAccessToken, refreshAccessToken } from "./auth";

/**
 * Guard for actions that need an account (add to cart, Buy Now, wishlist).
 *
 * Returns an async function that resolves `true` when the visitor is logged in. Otherwise it sends
 * them to `/login?next=<current path>` and resolves `false`, so the caller should just stop.
 * (AuthProvider's `isLoggedIn` is briefly `false` while it silently refreshes the session on first
 * load, so a logged-in visitor who clicks immediately is checked against the refresh cookie first
 * rather than being bounced to the login page.)
 */
export function useRequireLogin(): () => Promise<boolean> {
  const router = useRouter();
  const { isLoggedIn } = useAuth();

  return useCallback(async () => {
    if (isLoggedIn || getAccessToken()) return true;
    if (await refreshAccessToken()) return true;
    const here = `${window.location.pathname}${window.location.search}`;
    router.push(`/login?next=${encodeURIComponent(here)}`);
    return false;
  }, [isLoggedIn, router]);
}