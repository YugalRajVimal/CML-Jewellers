"use client";

import { X } from "lucide-react";
import { useEffect } from "react";

export function Drawer({
  open, onClose, title, description, children,
}: { open: boolean; onClose: () => void; title: string; description?: string; children: React.ReactNode }) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-ink-950/40" onClick={onClose} />
      <div className="absolute inset-y-0 right-0 w-full max-w-md bg-paper shadow-xl flex flex-col">
        <div className="flex items-start justify-between border-b border-line px-5 py-4">
          <div>
            <p className="font-display text-lg text-ink-950">{title}</p>
            {description && <p className="text-xs text-ink-500 mt-0.5">{description}</p>}
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 hover:bg-ink-100" aria-label="Close">
            <X size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
      </div>
    </div>
  );
}

export function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="mb-4">
      <label className="block text-xs font-medium text-ink-700 mb-1.5">{label}</label>
      {children}
      {hint && <p className="mt-1 text-[11px] text-ink-400">{hint}</p>}
    </div>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-lg border border-line bg-white px-3 py-2 text-sm focus:border-maroon-600 ${props.className ?? ""}`}
    />
  );
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full rounded-lg border border-line bg-white px-3 py-2 text-sm focus:border-maroon-600 ${props.className ?? ""}`}
    />
  );
}
