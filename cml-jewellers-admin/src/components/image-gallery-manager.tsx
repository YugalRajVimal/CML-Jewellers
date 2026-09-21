"use client";

import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ImagePlus, Loader2, X } from "lucide-react";
import * as api from "@/lib/api";

// Keep in step with ImageUploader and the backend's upload.middleware.ts.
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_IMAGES = 10;

/**
 * Manages an ordered list of image URLs (PC-02): upload several at once, remove,
 * and reorder. The FIRST image is the cover shown on listings. The parent owns the
 * array and must send the whole array on save — the backend replaces `images`.
 */
export function ImageGalleryManager({
  value,
  onChange,
  folder = "products",
  label = "Images",
}: {
  value: string[];
  onChange: (urls: string[]) => void;
  folder?: "products" | "categories" | "banners";
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(0); // files still in flight
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(fileList: FileList | null) {
    const files = Array.from(fileList ?? []);
    if (inputRef.current) inputRef.current.value = "";
    if (files.length === 0) return;
    setError(null);

    const room = MAX_IMAGES - value.length;
    if (room <= 0) {
      setError(`You can add up to ${MAX_IMAGES} images.`);
      return;
    }

    const problems: string[] = [];
    const accepted: File[] = [];
    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) problems.push(`${file.name}: only JPEG, PNG, WEBP or AVIF.`);
      else if (file.size > MAX_SIZE_BYTES) problems.push(`${file.name}: larger than 5MB.`);
      else accepted.push(file);
    }
    if (accepted.length > room) {
      problems.push(`Only ${room} more image${room === 1 ? "" : "s"} allowed; extra files were skipped.`);
      accepted.length = room;
    }

    setUploading(accepted.length);
    // Upload one at a time so the resulting order matches the order the files were picked in.
    const uploaded: string[] = [];
    for (const file of accepted) {
      try {
        const res = await api.uploadImage(file, folder);
        uploaded.push(res.data.image.url);
      } catch (e) {
        problems.push(`${file.name}: ${e instanceof Error ? e.message : "upload failed."}`);
      } finally {
        setUploading((n) => n - 1);
      }
    }
    // remove/reorder are disabled while uploading, so `value` cannot have changed underneath us.
    if (uploaded.length > 0) onChange([...value, ...uploaded]);
    if (problems.length > 0) setError(problems.join("\n"));
  }

  function remove(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  function move(index: number, delta: -1 | 1) {
    const target = index + delta;
    if (target < 0 || target >= value.length) return;
    const next = [...value];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  const busy = uploading > 0;

  return (
    <div>
      <label className="block text-xs font-medium text-ink-700 mb-1.5">{label}</label>
      <div className="grid grid-cols-3 gap-2">
        {value.map((url, i) => (
          <div key={`${url}-${i}`} className="group relative overflow-hidden rounded-lg border border-line bg-ink-100/40">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" className="h-24 w-full object-cover" />
            {i === 0 && (
              <span className="absolute left-1 top-1 rounded bg-maroon-700 px-1.5 py-0.5 text-[10px] font-medium text-white">
                Cover
              </span>
            )}
            <button
              type="button"
              onClick={() => remove(i)}
              disabled={busy}
              aria-label="Remove image"
              className="absolute right-1 top-1 rounded bg-white/90 p-1 text-ink-700 hover:bg-white disabled:opacity-50"
            >
              <X size={12} />
            </button>
            <div className="absolute inset-x-1 bottom-1 flex justify-between">
              <button
                type="button"
                onClick={() => move(i, -1)}
                disabled={busy || i === 0}
                aria-label="Move earlier"
                className="rounded bg-white/90 p-1 text-ink-700 hover:bg-white disabled:opacity-30"
              >
                <ArrowLeft size={12} />
              </button>
              <button
                type="button"
                onClick={() => move(i, 1)}
                disabled={busy || i === value.length - 1}
                aria-label="Move later"
                className="rounded bg-white/90 p-1 text-ink-700 hover:bg-white disabled:opacity-30"
              >
                <ArrowRight size={12} />
              </button>
            </div>
          </div>
        ))}
        {busy && (
          <div className="flex h-24 items-center justify-center rounded-lg border border-line bg-ink-100/40">
            <Loader2 size={18} className="animate-spin text-ink-400" />
          </div>
        )}
        {value.length < MAX_IMAGES && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="flex h-24 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-line bg-white text-xs text-ink-500 hover:bg-ink-100/60 disabled:opacity-50"
          >
            <ImagePlus size={18} />
            {busy ? `Uploading ${uploading}…` : "Add images"}
          </button>
        )}
      </div>
      <p className="mt-1.5 text-[11px] text-ink-400">
        The first image is the cover. Use the arrows to reorder. JPEG, PNG, WEBP or AVIF, max 5MB each, up to {MAX_IMAGES}.
      </p>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ALLOWED_TYPES.join(",")}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      {error && <p className="mt-1.5 whitespace-pre-line text-[11px] text-bad">{error}</p>}
    </div>
  );
}