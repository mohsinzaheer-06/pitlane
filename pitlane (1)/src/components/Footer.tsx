import React, {useState} from 'react';
import {useApp} from '../context/AppContext';

export function Footer() {
  const {navigate, showToast, buildWhatsAppUrl} = useApp();
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsappOptIn, setWhatsappOptIn] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({email, phone, whatsappOptIn}),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || 'Subscribed to PITLANE drop alerts');
        setEmail('');
        setPhone('');
        setWhatsappOptIn(false);
      } else {
        showToast(data.error || 'Could not subscribe.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <footer className="bg-[#090A0B] border-t border-[#27272A] mt-16">
      <div className="checkered-divider opacity-40" />
      <div className="max-w-[1440px] mx-auto px-4 md:px-10 py-14 grid grid-cols-1 md:grid-cols-12 gap-10">
        {/* Brand & Newsletter */}
        <div className="md:col-span-5 space-y-5">
          <div>
            <p className="font-display text-3xl text-white tracking-wider">PITLANE</p>
            <p className="font-mono-tabular text-xs uppercase tracking-widest text-[#EF2929] mt-1">
              Built for the Racing Culture.
            </p>
          </div>
          <p className="text-sm text-[#C6C6C7] max-w-md leading-relaxed">
            Independent motorsport-inspired fashion atelier headquartered in Lahore, Pakistan.
            Heavyweight paddock apparel, technical outerwear, and scale collector models shipped
            nationwide and worldwide.
          </p>

          <form onSubmit={handleSubscribe} className="space-y-3 max-w-md pt-2">
            <label htmlFor="newsletter-email" className="block font-mono-tabular text-xs uppercase text-white">
              Drop Dispatch &amp; Restock Alerts
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                id="newsletter-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                className="flex-1 h-11 px-3.5 bg-[#111315] border border-[#27272A] text-sm text-white placeholder-[#71717A] focus:border-white"
              />
              <button
                type="submit"
                disabled={submitting}
                className="h-11 px-5 bg-[#EF2929] hover:bg-white text-white hover:text-[#111315] font-mono-tabular text-xs font-semibold uppercase tracking-wider transition-colors whitespace-nowrap"
              >
                {submitting ? 'Saving...' : 'Subscribe'}
              </button>
            </div>
            <div className="flex flex-col gap-2">
              <label className="flex items-start gap-2.5 text-xs text-[#C6C6C7] cursor-pointer">
                <input
                  type="checkbox"
                  checked={whatsappOptIn}
                  onChange={(e) => setWhatsappOptIn(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-[#EF2929]"
                />
                <span>Also send limited-edition drop alerts via WhatsApp (optional).</span>
              </label>
              {whatsappOptIn && (
                <div>
                  <label htmlFor="newsletter-phone" className="sr-only">
                    WhatsApp Phone Number
                  </label>
                  <input
                    id="newsletter-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="WhatsApp number (e.g. +92 300 1234567)"
                    className="w-full h-11 px-3 bg-[#111315] border border-[#27272A] text-xs text-white placeholder-[#71717A]"
                  />
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Navigation Links */}
        <div className="md:col-span-2 space-y-2">
          <h3 className="font-mono-tabular text-xs uppercase tracking-wider text-[#71717A] mb-2">
            Storefront
          </h3>
          <ul className="space-y-0.5 text-sm text-[#C6C6C7]">
            <li>
              <button
                type="button"
                onClick={() => navigate('/shop')}
                className="min-h-[40px] flex items-center hover:text-white transition-colors"
              >
                All Products
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => navigate('/shop?group=APPAREL')}
                className="min-h-[40px] flex items-center hover:text-white transition-colors"
              >
                Apparel
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => navigate('/shop?group=ACCESSORIES')}
                className="min-h-[40px] flex items-center hover:text-white transition-colors"
              >
                Accessories
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => navigate('/shop?group=COLLECTIBLES')}
                className="min-h-[40px] flex items-center hover:text-white transition-colors"
              >
                Collector&apos;s Corner
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => navigate('/collections')}
                className="min-h-[40px] flex items-center hover:text-white transition-colors"
              >
                Collections
              </button>
            </li>
          </ul>
        </div>

        <div className="md:col-span-2 space-y-2">
          <h3 className="font-mono-tabular text-xs uppercase tracking-wider text-[#71717A] mb-2">
            Platform
          </h3>
          <ul className="space-y-0.5 text-sm text-[#C6C6C7]">
            <li>
              <button
                type="button"
                onClick={() => navigate('/racing-centre')}
                className="min-h-[40px] flex items-center hover:text-white transition-colors"
              >
                F1 Racing Centre
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => navigate('/track-order')}
                className="min-h-[40px] flex items-center hover:text-white transition-colors"
              >
                Track Order
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => navigate('/account')}
                className="min-h-[40px] flex items-center hover:text-white transition-colors"
              >
                Customer Account
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => navigate('/admin')}
                className="min-h-[40px] flex items-center hover:text-white transition-colors"
              >
                Admin Console
              </button>
            </li>
          </ul>
        </div>

        {/* Payments & Support */}
        <div className="md:col-span-3 space-y-3">
          <h3 className="font-mono-tabular text-xs uppercase tracking-wider text-[#71717A]">
            Payments &amp; Dispatch
          </h3>
          <p className="text-xs text-[#C6C6C7] leading-relaxed">
            Pakistan: Cash on Delivery (COD), JazzCash, Easypaisa, Bank Transfer via TCS &amp;
            Leopards (2–4 days).
          </p>
          <p className="text-xs text-[#C6C6C7] leading-relaxed">
            International: Multi-currency checkout (PKR, USD, GBP, EUR, AED) via DHL Express.
          </p>
          <a
            href={buildWhatsAppUrl('Hello PITLANE! I have a question about an order or product.')}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center min-h-[44px] mt-2 px-4 py-2.5 border border-[#27272A] hover:border-[#EF2929] text-xs font-mono-tabular uppercase text-white transition-colors"
          >
            WhatsApp Studio Desk →
          </a>
        </div>
      </div>

      <div className="border-t border-[#27272A] px-4 md:px-10 py-5">
        <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-[#71717A]">
          <p>
            © {new Date().getFullYear()} PITLANE Atelier. Independent motorsport-inspired fashion
            label. Not affiliated with or endorsed by Formula One Licensing B.V. or any racing team.
          </p>
          <p className="font-mono-tabular shrink-0">Lahore · Dubai · London</p>
        </div>
      </div>
    </footer>
  );
}
