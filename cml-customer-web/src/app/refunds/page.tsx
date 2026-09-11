export const metadata = {
    title: "Refunds & Cancellations | CML Jewellers",
  };
  
  export default function RefundsPage() {
    return (
      <div className="font-marcellus bg-[var(--color-cream,#f6efe4)]">
        <section className="px-5 pb-8 pt-14 text-center sm:px-6 sm:pb-10 sm:pt-20">
          <p className="text-[10px] tracking-[0.3em] text-[var(--color-gold,#b98a4e)] sm:text-xs sm:tracking-[0.4em]">
            POLICY
          </p>
          <h1 className="mt-4 text-3xl uppercase leading-[1.15] text-[var(--color-ink,#1c1c1c)] sm:mt-5 sm:text-5xl">
            Refunds &amp; Cancellations
          </h1>
          <p className="mt-3 text-xs text-[var(--color-stone,#6b6154)]">Last updated: [DATE]</p>
        </section>
  
        <section className="mx-auto max-w-3xl px-5 pb-20 sm:px-6 sm:pb-28">
          <div className="flex flex-col gap-8 text-sm leading-relaxed text-[var(--color-ink,#2a2019)]">
            <div>
              <h2 className="font-display text-xl text-[var(--color-ink,#1c1c1c)]">1. Order Cancellations</h2>
              <p className="mt-2">
                You may cancel an order free of charge as long as it has not yet been shipped. To cancel, go to{" "}
                <a href="/orders" className="text-[var(--color-gold,#b98a4e)] underline">
                  My Orders
                </a>{" "}
                and select "Cancel Order" on any order in the "Pending" or "Confirmed" status. Once an order has
                shipped, it can no longer be cancelled and instead falls under our returns process below.
              </p>
            </div>
  
            <div>
              <h2 className="font-display text-xl text-[var(--color-ink,#1c1c1c)]">2. Returns</h2>
              <p className="mt-2">
                We accept returns within <strong>7 days</strong> of delivery, provided the item is:
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>Unworn, unused, and in its original saleable condition</li>
                <li>Accompanied by its original packaging, invoice, and any certification/warranty card</li>
                <li>Not a customized, engraved, or made-to-order piece (see Section 5)</li>
              </ul>
              <p className="mt-2">
                To initiate a return, go to your order in{" "}
                <a href="/orders" className="text-[var(--color-gold,#b98a4e)] underline">
                  My Orders
                </a>{" "}
                and select "Request Return" — this is available once an order shows as "Delivered." Our team
                will review the request and arrange a reverse pickup where available, or provide instructions
                for shipping the item back to us.
              </p>
            </div>
  
            <div>
              <h2 className="font-display text-xl text-[var(--color-ink,#1c1c1c)]">3. Refund Timelines</h2>
              <p className="mt-2">
                Once a returned item passes our quality check, refunds are processed as follows:
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>
                  <strong>Prepaid orders (Cashfree — cards, UPI, net banking, wallets):</strong> refunded to the
                  original payment method within 5–7 business days of approval.
                </li>
                <li>
                  <strong>Order cancellations before shipping:</strong> refunded to the original payment method
                  within 3–5 business days.
                </li>
              </ul>
              <p className="mt-2">
                Please note that once we initiate a refund, it may take an additional 2–5 business days for the
                amount to reflect in your bank or card statement, depending on your bank or card issuer.
              </p>
            </div>
  
            <div>
              <h2 className="font-display text-xl text-[var(--color-ink,#1c1c1c)]">4. Failed or Stuck Payments</h2>
              <p className="mt-2">
                If an amount is debited from your account but your order does not show as confirmed, please do
                not place a duplicate order. Any amount debited for a payment that failed to complete is
                automatically reversed by Cashfree Payments to your original payment method within 5–7 business
                days. If your order shows as "Pending" with no successful payment, you can resume payment
                directly from{" "}
                <a href="/orders" className="text-[var(--color-gold,#b98a4e)] underline">
                  My Orders
                </a>
                . If funds were debited but not reflected after 7 business days, please contact us with your
                order ID and transaction reference.
              </p>
            </div>
  
            <div>
              <h2 className="font-display text-xl text-[var(--color-ink,#1c1c1c)]">5. Non-Returnable Items</h2>
              <p className="mt-2">
                For hygiene and customization reasons, the following are not eligible for return or exchange
                unless received damaged or defective:
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>Customized, engraved, or made-to-order pieces</li>
                <li>Earrings (for piercing/hygiene reasons), where applicable</li>
                <li>Items marked "Final Sale" at the time of purchase</li>
              </ul>
            </div>
  
            <div>
              <h2 className="font-display text-xl text-[var(--color-ink,#1c1c1c)]">6. Damaged or Incorrect Items</h2>
              <p className="mt-2">
                If you receive a damaged, defective, or incorrect item, please contact us within 48 hours of
                delivery with photos of the item and packaging. We will arrange a free replacement or full
                refund, including any shipping charges paid, once verified.
              </p>
            </div>
  
            <div>
              <h2 className="font-display text-xl text-[var(--color-ink,#1c1c1c)]">7. Contact Us</h2>
              <p className="mt-2">
                For any questions about a return, cancellation, or refund, reach us at{" "}
                <a href="mailto:support@cmljewellers.com" className="text-[var(--color-gold,#b98a4e)] underline">
                  support@cmljewellers.com
                </a>{" "}
                or through our{" "}
                <a href="/contact" className="text-[var(--color-gold,#b98a4e)] underline">
                  Contact Us
                </a>{" "}
                page, along with your order ID.
              </p>
            </div>
          </div>
        </section>
      </div>
    );
  }