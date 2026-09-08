"use client";

export interface ShippingMethod {
  id: string;
  label: string;
  eta: string;
  price: number;
}

export const SHIPPING_METHODS: ShippingMethod[] = [
  { id: "standard", label: "Standard Shipping", eta: "5–7 business days", price: 0 },
  { id: "express", label: "Express Shipping", eta: "2–3 business days", price: 199 },
];

export function ShippingStep({
  selectedId,
  onSelect,
  onBack,
  onNext,
}: {
  selectedId: string;
  onSelect: (id: string) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <div>
      <div className="flex flex-col gap-3">
        {SHIPPING_METHODS.map((method) => (
          <label
            key={method.id}
            className={`flex cursor-pointer items-center justify-between border p-4 text-sm ${
              selectedId === method.id ? "border-[var(--color-gold)]" : "border-[var(--color-stone-light)]"
            }`}
          >
            <div className="flex items-center gap-3">
              <input
                type="radio"
                name="shipping"
                checked={selectedId === method.id}
                onChange={() => onSelect(method.id)}
              />
              <div>
                <p className="text-[var(--color-ink)]">{method.label}</p>
                <p className="text-xs text-[var(--color-stone)]">{method.eta}</p>
              </div>
            </div>
            <span className="text-[var(--color-ink)]">{method.price === 0 ? "Free" : `₹${method.price}`}</span>
          </label>
        ))}
      </div>

      <div className="mt-8 flex gap-3">
        <button onClick={onBack} className="text-sm text-[var(--color-stone)] underline">
          Back
        </button>
        <button onClick={onNext} className="pill flex-1 justify-center">
          Continue to review
        </button>
      </div>
    </div>
  );
}
