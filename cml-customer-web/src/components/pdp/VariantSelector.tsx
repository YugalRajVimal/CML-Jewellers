// "use client";

// import type { ProductVariant } from "@/lib/types";

// export function VariantSelector({
//   variants,
//   selected,
//   onSelect,
// }: {
//   variants: ProductVariant[];
//   selected: ProductVariant;
//   onSelect: (variant: ProductVariant) => void;
// }) {
//   // Group attribute keys (e.g. "metal", "size") across all variants so each renders its own row.
//   const attributeKeys = Array.from(new Set(variants.flatMap((v) => Object.keys(v.attributes))));

//   return (
//     <div className="flex flex-col gap-5">
//       {attributeKeys.map((key) => {
//         const options = Array.from(new Set(variants.map((v) => v.attributes[key]))).filter(Boolean);
//         return (
//           <div key={key}>
//             <p className="text-sm capitalize text-[var(--color-stone)]">{key}</p>
//             <div className="mt-2 flex flex-wrap gap-2">
//               {options.map((option) => {
//                 const isActive = selected.attributes[key] === option;
//                 // find a variant matching this option plus the currently selected other attributes, if any
//                 const match =
//                   variants.find(
//                     (v) =>
//                       v.attributes[key] === option &&
//                       attributeKeys
//                         .filter((k) => k !== key)
//                         .every((k) => v.attributes[k] === selected.attributes[k]),
//                   ) ?? variants.find((v) => v.attributes[key] === option)!;

//                 return (
//                   <button
//                     key={option}
//                     onClick={() => onSelect(match)}
//                     className={`border px-4 py-2 text-sm ${
//                       isActive
//                         ? "border-[var(--color-maroon)] bg-[var(--color-maroon)] text-[var(--color-cream)]"
//                         : "border-[var(--color-stone-light)] text-[var(--color-ink)]"
//                     }`}
//                   >
//                     {option}
//                   </button>
//                 );
//               })}
//             </div>
//           </div>
//         );
//       })}
//     </div>
//   );
// }

"use client";

type VariantAttributes = Record<string, string>;

type SelectableVariant = {
  _id: string;
  sku: string;
  price: number;
  mrp?: number;
  attributes?: VariantAttributes;
};

export function VariantSelector({
  variants,
  selected,
  onSelect,
}: {
  variants: SelectableVariant[];
  selected: SelectableVariant;
  onSelect: (variant: SelectableVariant) => void;
}) {
  // Group attribute keys (e.g. "metal", "size") across all variants so each
  // renders its own row. `attributes` may be missing entirely on a variant
  // (e.g. a single one-size SKU), so default to {} before reading keys.
  const attributeKeys = Array.from(
    new Set(variants.flatMap((v) => Object.keys(v.attributes ?? {}))),
  );

  // Nothing to pick between — e.g. one variant with no distinguishing
  // attributes at all. Let the parent decide whether to show this
  // component; render nothing rather than an empty shell.
  if (attributeKeys.length === 0) return null;

  return (
    <div className="flex flex-col gap-5">
      {attributeKeys.map((key) => {
        const options = Array.from(
          new Set(variants.map((v) => v.attributes?.[key])),
        ).filter((v): v is string => Boolean(v));

        if (options.length === 0) return null;

        return (
          <div key={key}>
            <p className="text-sm capitalize text-[var(--color-stone)]">{key}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {options.map((option) => {
                const isActive = selected.attributes?.[key] === option;
                // find a variant matching this option plus the currently
                // selected other attributes, if any
                const match =
                  variants.find(
                    (v) =>
                      v.attributes?.[key] === option &&
                      attributeKeys
                        .filter((k) => k !== key)
                        .every((k) => v.attributes?.[k] === selected.attributes?.[k]),
                  ) ?? variants.find((v) => v.attributes?.[key] === option)!;

                return (
                  <button
                    key={option}
                    onClick={() => onSelect(match)}
                    className={`border px-4 py-2 text-sm ${
                      isActive
                        ? "border-[var(--color-maroon)] bg-[var(--color-maroon)] text-[var(--color-cream)]"
                        : "border-[var(--color-stone-light)] text-[var(--color-ink)]"
                    }`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}