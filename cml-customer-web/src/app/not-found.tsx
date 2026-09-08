import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md px-6 py-24 text-center">
      <p className="eyebrow">404</p>
      <h1 className="mt-3 font-display text-3xl text-[var(--color-ink)]">Page not found</h1>
      <p className="mt-3 text-sm text-[var(--color-stone)]">
        The page you&apos;re looking for doesn&apos;t exist, or may have moved.
      </p>
      <Link href="/" className="pill mt-8">
        Back to homepage
      </Link>
    </div>
  );
}
