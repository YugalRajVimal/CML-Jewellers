import type { ReactNode } from "react";

export function AuthCard({
  eyebrow,
  title,
  children,
  footer,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-6 py-16">
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="mt-3 font-display text-3xl text-[var(--color-ink)]">{title}</h1>
      <div className="mt-8 flex flex-col gap-4">{children}</div>
      {footer && <div className="mt-6 text-sm text-[var(--color-stone)]">{footer}</div>}
    </div>
  );
}

export function AuthInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full border-b border-[var(--color-stone-light)] bg-transparent py-3 text-sm outline-none placeholder:text-[var(--color-stone)] focus-visible:border-[var(--color-gold)]"
    />
  );
}
