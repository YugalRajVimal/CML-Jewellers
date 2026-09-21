"use client";

import Image from "next/image";
import { useState } from "react";

export function Gallery({ images: rawImages, alt }: { images?: string[]; alt: string }) {
  const [selected, setSelected] = useState(0);
  const images = (rawImages ?? []).filter((src) => typeof src === "string" && src.trim() !== "");
  const hasImages = images.length > 0;
  // The image list changes when a variant with its own photos is selected; never
  // index past the end of the new list.
  const active = selected < images.length ? selected : 0;

  return (
    <div>
      <div className="relative aspect-square w-full overflow-hidden bg-[var(--color-cream-deep)]">
        {hasImages && (
          <Image
            src={images[active]}
            alt={alt}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
        )}
      </div>

      {images.length > 1 && (
        <div className="mt-4 flex gap-3">
          {images.map((src, i) => (
            <button
              key={src + i}
              onClick={() => setSelected(i)}
              className={`relative h-16 w-16 shrink-0 overflow-hidden border ${
                i === active ? "border-[var(--color-gold)]" : "border-transparent"
              }`}
              aria-label={`Show image ${i + 1}`}
              aria-pressed={i === active}
            >
              <Image src={src} alt="" fill sizes="64px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}