"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import * as api from "@/lib/api";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // must match backend upload.middleware.ts

/**
 * Uploads a single image straight to Cloudinary via the backend's
 * /admin/media/upload endpoint and hands the resulting secure URL back to
 * the parent form. The parent is responsible for putting that URL into the
 * product's `images` array on save — this component only handles the file
 * picker + upload + preview.
 */
export function ImageUploader({
  value,
  onChange,
  folder = "products",
  label = "Image",
}: {
  value: string | null | undefined;
  onChange: (url: string | null) => void;
  folder?: "products" | "categories" | "banners";
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Only JPEG, PNG, WEBP or AVIF images are allowed.");
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setError("Image must be 5MB or smaller.");
      return;
    }

    setUploading(true);
    try {
      const res = await api.uploadImage(file, folder);
      onChange(res.data.image.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed. Please try again.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      <label className="block text-xs font-medium text-ink-700 mb-1.5">{label}</label>
      <div className="flex items-center gap-3">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-line bg-ink-100/40">
          {uploading ? (
            <Loader2 size={20} className="animate-spin text-ink-400" />
          ) : value ? (
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <ImagePlus size={20} className="text-ink-300" />
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-medium text-ink-900 hover:bg-ink-100/60 disabled:opacity-50"
            >
              {uploading ? "Uploading…" : value ? "Replace" : "Upload image"}
            </button>
            {value && !uploading && (
              <button
                type="button"
                onClick={() => onChange(null)}
                className="inline-flex items-center gap-1 rounded-lg border border-line bg-white px-2.5 py-1.5 text-xs font-medium text-ink-500 hover:bg-ink-100/60"
              >
                <X size={12} /> Remove
              </button>
            )}
          </div>
          <p className="text-[11px] text-ink-400">JPEG, PNG, WEBP or AVIF. Max 5MB.</p>
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_TYPES.join(",")}
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      {error && <p className="mt-1.5 text-[11px] text-bad">{error}</p>}
    </div>
  );
}
