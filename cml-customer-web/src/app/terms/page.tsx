export const metadata = {
    title: "Terms & Conditions | CML Jewellers",
  };
  
  export default function TermsPage() {
    return (
      <div className="font-marcellus bg-[var(--color-cream,#f6efe4)]">
        <section className="px-5 pb-8 pt-14 text-center sm:px-6 sm:pb-10 sm:pt-20">
          <p className="text-[10px] tracking-[0.3em] text-[var(--color-gold,#b98a4e)] sm:text-xs sm:tracking-[0.4em]">
            LEGAL
          </p>
          <h1 className="mt-4 text-3xl uppercase leading-[1.15] text-[var(--color-ink,#1c1c1c)] sm:mt-5 sm:text-5xl">
            Terms &amp; Conditions
          </h1>
          <p className="mt-3 text-xs text-[var(--color-stone,#6b6154)]">Last updated: [DATE]</p>
        </section>
  
        <section className="mx-auto max-w-3xl px-5 pb-20 sm:px-6 sm:pb-28">
          <div className="flex flex-col gap-8 text-sm leading-relaxed text-[var(--color-ink,#2a2019)]">
            <div>
              <h2 className="font-display text-xl text-[var(--color-ink,#1c1c1c)]">1. Introduction</h2>
              <p className="mt-2">
                These Terms &amp; Conditions ("Terms") govern your use of the CML Jewellers website and your
                purchase of any products listed on it. By accessing this website or placing an order, you agree
                to be bound by these Terms. This website is operated by [LEGAL BUSINESS NAME], having its
                registered office at [FULL BUSINESS ADDRESS] ("we", "us", "our").
              </p>
            </div>
  
            <div>
              <h2 className="font-display text-xl text-[var(--color-ink,#1c1c1c)]">2. Eligibility</h2>
              <p className="mt-2">
                You must be at least 18 years old, or be using this website under the supervision of a parent
                or legal guardian, to place an order with us.
              </p>
            </div>
  
            <div>
              <h2 className="font-display text-xl text-[var(--color-ink,#1c1c1c)]">3. Products &amp; Pricing</h2>
              <p className="mt-2">
                We make every effort to display our products and their prices as accurately as possible.
                Jewellery pieces are handcrafted and may show minor natural variations from the images shown.
                Prices are listed in Indian Rupees (INR) and are inclusive of applicable taxes unless stated
                otherwise. We reserve the right to correct pricing errors and to modify prices at any time
                without prior notice, though any order already confirmed will honour the price at the time of
                purchase.
              </p>
            </div>
  
            <div>
              <h2 className="font-display text-xl text-[var(--color-ink,#1c1c1c)]">4. Orders &amp; Payment</h2>
              <p className="mt-2">
                Once you place an order, you will receive an order confirmation. This confirms we have received
                your order — it does not guarantee acceptance. We reserve the right to cancel any order due to
                stock unavailability, pricing errors, or suspected fraudulent activity, in which case any amount
                paid will be refunded in full. All payments are processed securely through our third-party
                payment gateway, Cashfree Payments. We do not store your card, UPI, or net-banking credentials
                on our servers.
              </p>
            </div>
  
            <div>
              <h2 className="font-display text-xl text-[var(--color-ink,#1c1c1c)]">5. Shipping &amp; Delivery</h2>
              <p className="mt-2">
                Estimated delivery timelines are provided at checkout and on the order confirmation page.
                Delivery timelines are estimates and may vary due to logistics, courier delays, or circumstances
                beyond our control. Title and risk in the goods pass to you upon delivery.
              </p>
            </div>
  
            <div>
              <h2 className="font-display text-xl text-[var(--color-ink,#1c1c1c)]">6. Returns, Cancellations &amp; Refunds</h2>
              <p className="mt-2">
                Please refer to our{" "}
                <a href="/refunds" className="text-[var(--color-gold,#b98a4e)] underline">
                  Refunds &amp; Cancellations Policy
                </a>{" "}
                for full details on returns, cancellations, and how refunds are processed.
              </p>
            </div>
  
            <div>
              <h2 className="font-display text-xl text-[var(--color-ink,#1c1c1c)]">7. Intellectual Property</h2>
              <p className="mt-2">
                All content on this website — including product photography, designs, logos, and text — is the
                property of [LEGAL BUSINESS NAME] and may not be reproduced, copied, or used without our prior
                written consent.
              </p>
            </div>
  
            <div>
              <h2 className="font-display text-xl text-[var(--color-ink,#1c1c1c)]">8. Limitation of Liability</h2>
              <p className="mt-2">
                To the fullest extent permitted by law, we shall not be liable for any indirect, incidental, or
                consequential damages arising out of your use of this website or purchase of our products.
              </p>
            </div>
  
            <div>
              <h2 className="font-display text-xl text-[var(--color-ink,#1c1c1c)]">9. Governing Law</h2>
              <p className="mt-2">
                These Terms are governed by the laws of India, and any disputes shall be subject to the
                exclusive jurisdiction of the courts of [CITY], India.
              </p>
            </div>
  
            <div>
              <h2 className="font-display text-xl text-[var(--color-ink,#1c1c1c)]">10. Contact Us</h2>
              <p className="mt-2">
                For any questions about these Terms, please reach us at{" "}
                <a href="mailto:support@cmljewellers.com" className="text-[var(--color-gold,#b98a4e)] underline">
                  support@cmljewellers.com
                </a>{" "}
                or through our{" "}
                <a href="/contact" className="text-[var(--color-gold,#b98a4e)] underline">
                  Contact Us
                </a>{" "}
                page.
              </p>
            </div>
          </div>
        </section>
      </div>
    );
  }