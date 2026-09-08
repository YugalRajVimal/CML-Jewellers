import { LucideIcon } from "lucide-react";
import clsx from "clsx";
import Link from "next/link";

export function Panel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={clsx("rounded-xl border border-line bg-white shadow-panel", className)}>
      {children}
    </div>
  );
}

export function PageHeader({
  eyebrow, title, description, actions,
}: { eyebrow?: string; title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 pb-6">
      <div>
        {eyebrow && <p className="text-sm text-maroon-600 font-medium">{eyebrow}</p>}
        <h1 className="font-display text-[28px] leading-tight text-ink-950">{title}</h1>
        {description && <p className="mt-1 text-sm text-ink-500 max-w-lg">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

const statusStyles: Record<string, string> = {
  active: "bg-good/10 text-good",
  Delivered: "bg-good/10 text-good",
  Refunded: "bg-good/10 text-good",
  Completed: "bg-good/10 text-good",
  Success: "bg-good/10 text-good",
  Received: "bg-good/10 text-good",
  draft: "bg-ink-100 text-ink-700",
  Pending: "bg-warn/10 text-warn",
  Processing: "bg-warn/10 text-warn",
  Ordered: "bg-warn/10 text-warn",
  PartiallyReceived: "bg-warn/10 text-warn",
  Requested: "bg-warn/10 text-warn",
  Approved: "bg-warn/10 text-warn",
  PickedUp: "bg-warn/10 text-warn",
  Inspected: "bg-warn/10 text-warn",
  Initiated: "bg-warn/10 text-warn",
  Confirmed: "bg-gold-500/15 text-gold-600",
  Shipped: "bg-gold-500/15 text-gold-600",
  ReturnRequested: "bg-bad/10 text-bad",
  Cancelled: "bg-bad/10 text-bad",
  Rejected: "bg-bad/10 text-bad",
  Failed: "bg-bad/10 text-bad",
  archived: "bg-ink-100 text-ink-500",
  suspended: "bg-bad/10 text-bad",
};

export function StatusPill({ status }: { status: string }) {
  return (
    <span className={clsx("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium", statusStyles[status] ?? "bg-ink-100 text-ink-700")}>
      {status.replace(/([a-z])([A-Z])/g, "$1 $2")}
    </span>
  );
}

export function Button({
  children, variant = "primary", size = "md", className, ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" | "danger"; size?: "sm" | "md" }) {
  const variants = {
    primary: "bg-maroon-700 text-gold-100 hover:bg-maroon-600 border-transparent",
    secondary: "bg-white text-ink-900 hover:bg-ink-100/60 border-line",
    ghost: "bg-transparent text-ink-700 hover:bg-ink-100/60 border-transparent",
    danger: "bg-bad text-white hover:bg-bad/90 border-transparent",
  };
  const sizes = { sm: "px-2.5 py-1.5 text-xs", md: "px-3.5 py-2 text-sm" };
  return (
    <button
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-lg border font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none",
        variants[variant], sizes[size], className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function LinkButton({
  href, children, variant = "secondary", size = "md",
}: { href: string; children: React.ReactNode; variant?: "primary" | "secondary" | "ghost"; size?: "sm" | "md" }) {
  const variants = {
    primary: "bg-maroon-700 text-gold-100 hover:bg-maroon-600 border-transparent",
    secondary: "bg-white text-ink-900 hover:bg-ink-100/60 border-line",
    ghost: "bg-transparent text-ink-700 hover:bg-ink-100/60 border-transparent",
  };
  const sizes = { sm: "px-2.5 py-1.5 text-xs", md: "px-3.5 py-2 text-sm" };
  return (
    <Link href={href} className={clsx("inline-flex items-center gap-1.5 rounded-lg border font-medium transition-colors", variants[variant], sizes[size])}>
      {children}
    </Link>
  );
}

export function StatCard({
  label, value, icon: Icon, hint, tone = "default",
}: { label: string; value: string; icon: LucideIcon; hint?: string; tone?: "default" | "warn" | "bad" }) {
  const toneColor = tone === "warn" ? "text-warn" : tone === "bad" ? "text-bad" : "text-maroon-600";
  return (
    <Panel className="p-4">
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-ink-500">{label}</p>
        <Icon size={16} className={toneColor} />
      </div>
      <p className="mt-2 font-display text-2xl text-ink-950">{value}</p>
      {hint && <p className="mt-1 text-xs text-ink-500">{hint}</p>}
    </Panel>
  );
}

export function EmptyState({
  icon: Icon, title, description, action,
}: { icon: LucideIcon; title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-line bg-white/60 px-6 py-16 text-center">
      <Icon size={28} className="text-ink-300" />
      <div>
        <p className="font-medium text-ink-900">{title}</p>
        <p className="mt-1 text-sm text-ink-500 max-w-sm">{description}</p>
      </div>
      {action}
    </div>
  );
}

export function ForbiddenState() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-line bg-white px-6 py-20 text-center">
      <p className="font-display text-xl text-ink-950">403 — Not permitted</p>
      <p className="text-sm text-ink-500 max-w-sm">
        Your role doesn&apos;t include access to this module. Ask a Super Admin to update your permissions in
        Roles &amp; Permissions.
      </p>
    </div>
  );
}

export function Toolbar({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap items-center gap-2 mb-4">{children}</div>;
}

export function SearchInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      type="search"
      className={clsx(
        "w-full max-w-xs rounded-lg border border-line bg-white px-3 py-2 text-sm placeholder:text-ink-300 focus:border-maroon-600",
        props.className
      )}
    />
  );
}

export function Select({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={clsx("rounded-lg border border-line bg-white px-3 py-2 text-sm focus:border-maroon-600", props.className)}
    >
      {children}
    </select>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={clsx("animate-pulse rounded-md bg-ink-100", className)} />;
}
