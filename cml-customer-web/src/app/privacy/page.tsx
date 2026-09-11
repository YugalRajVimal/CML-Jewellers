export const metadata = {
    title: "Privacy Policy | CML Jewellers",
  };
  
  export default function PrivacyPage() {
    return (
      <div className="font-marcellus bg-[var(--color-cream,#f6efe4)]">
        <section className="px-5 pb-8 pt-14 text-center sm:px-6 sm:pb-10 sm:pt-20">
          <p className="text-[10px] tracking-[0.3em] text-[var(--color-gold,#b98a4e)] sm:text-xs sm:tracking-[0.4em]">
            LEGAL
          </p>
          <h1 className="mt-4 text-3xl uppercase leading-[1.15] text-[var(--color-ink,#1c1c1c)] sm:mt-5 sm:text-5xl">
            Privacy Policy
          </h1>
          <p className="mt-3 text-xs text-[var(--color-stone,#6b6154)]">Last updated: [DATE]</p>
        </section>
  
        <section className="mx-auto max-w-3xl px-5 pb-20 sm:px-6 sm:pb-28">
          <div className="flex flex-col gap-8 text-sm leading-relaxed text-[var(--color-ink,#2a2019)]">
            <div>
              <h2 className="font-display text-xl text-[var(--color-ink,#1c1c1c)]">1. Introduction</h2>
              <p className="mt-2">
                This Privacy Policy explains how [LEGAL BUSINESS NAME] ("we", "us", "our"), registered office
                at [FULL BUSINESS ADDRESS], collects, uses, and protects your personal information when you
                use the CML Jewellers website. By using this website, you consent to the practices described
                in this policy.
              </p>
            </div>
  
            <div>
              <h2 className="font-display text-xl text-[var(--color-ink,#1c1c1c)]">2. Information We Collect</h2>
              <p className="mt-2">We collect the following categories of information:</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li><strong>Account information:</strong> name, email address, phone number, and password (stored as a secure hash, never in plain text).</li>
                <li><strong>Order &amp; shipping information:</strong> delivery addresses, order history, and order-related communications.</li>
                <li><strong>Payment information:</strong> we do not collect or store your card, UPI, or net-banking details. Payments are processed directly by our payment partner, Cashfree Payments, under their own security and privacy standards.</li>
                <li><strong>Usage information:</strong> pages visited, products viewed, and general device/browser information, collected automatically to help us operate and improve the website.</li>
              </ul>
            </div>
  
            <div>
              <h2 className="font-display text-xl text-[var(--color-ink,#1c1c1c)]">3. How We Use Your Information</h2>
              <p className="mt-2">We use your information to:</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>Create and manage your account</li>
                <li>Process and deliver your orders, and communicate order status updates</li>
                <li>Verify your identity via OTP sent to your email or phone number</li>
                <li>Respond to customer support requests, returns, and refund requests</li>
                <li>Send transactional emails/SMS (order confirmations, shipping updates, OTPs) — we do not send marketing communications without your consent</li>
                <li>Improve our website, products, and customer experience</li>
                <li>Detect and prevent fraud or misuse of our website</li>
              </ul>
            </div>
  
            <div>
              <h2 className="font-display text-xl text-[var(--color-ink,#1c1c1c)]">4. How We Share Your Information</h2>
              <p className="mt-2">
                We do not sell your personal information. We share information only with trusted third parties
                who help us operate our business, specifically:
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li><strong>Cashfree Payments</strong> — to securely process your payments.</li>
                <li><strong>Cloudinary</strong> — to host and deliver product and profile images.</li>
                <li><strong>Email &amp; SMS providers</strong> — to deliver order confirmations, OTPs, and account notifications.</li>
                <li><strong>Logistics/courier partners</strong> — to deliver your orders, limited to the shipping details required for delivery.</li>
              </ul>
              <p className="mt-2">
                We may also disclose information where required by law, to enforce our Terms &amp; Conditions,
                or to protect the rights, property, or safety of CML Jewellers, our customers, or others.
              </p>
            </div>
  
            <div>
              <h2 className="font-display text-xl text-[var(--color-ink,#1c1c1c)]">5. Data Security</h2>
              <p className="mt-2">
                We use industry-standard measures to protect your information, including encrypted password
                storage, secure token-based authentication, and HTTPS encryption for data in transit. However,
                no method of transmission or storage is 100% secure, and we cannot guarantee absolute security.
              </p>
            </div>
  
            <div>
              <h2 className="font-display text-xl text-[var(--color-ink,#1c1c1c)]">6. Data Retention</h2>
              <p className="mt-2">
                We retain your account and order information for as long as your account remains active, and
                for a reasonable period afterward as required to comply with our legal, accounting, and tax
                obligations, and to resolve any disputes.
              </p>
            </div>
  
            <div>
              <h2 className="font-display text-xl text-[var(--color-ink,#1c1c1c)]">7. Your Rights &amp; Choices</h2>
              <p className="mt-2">You can, at any time:</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>View and update your profile information from your Account page</li>
                <li>Manage or delete saved addresses</li>
                <li>Request a copy of the personal data we hold about you</li>
                <li>Request deletion of your account and associated personal data, subject to any orders/records we're legally required to retain</li>
              </ul>
              <p className="mt-2">
                To exercise any of these rights, contact us using the details in Section 9 below.
              </p>
            </div>
  
            <div>
              <h2 className="font-display text-xl text-[var(--color-ink,#1c1c1c)]">8. Cookies</h2>
              <p className="mt-2">
                We use essential cookies/local storage to keep you logged in and to remember items in your cart.
                We do not currently use third-party advertising or tracking cookies.
              </p>
            </div>
  
            <div>
              <h2 className="font-display text-xl text-[var(--color-ink,#1c1c1c)]">9. Contact Us</h2>
              <p className="mt-2">
                For any questions about this Privacy Policy or your personal data, contact us at{" "}
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
  
            <div>
              <h2 className="font-display text-xl text-[var(--color-ink,#1c1c1c)]">10. Changes to This Policy</h2>
              <p className="mt-2">
                We may update this Privacy Policy from time to time. Any changes will be posted on this page
                with a revised "Last updated" date.
              </p>
            </div>
          </div>
        </section>
      </div>
    );
  }