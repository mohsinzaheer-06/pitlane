import React, {useEffect, useState} from 'react';
import {CheckCircle2, Lock, MessageCircle} from 'lucide-react';
import {useApp} from '../context/AppContext';

export function CheckoutPage() {
  const {
    cart,
    cartSubtotalPkr,
    currency,
    formatPrice,
    clearCart,
    user,
    navigate,
    showToast,
    buildWhatsAppUrl,
  } = useApp();

  const [customerName, setCustomerName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [country, setCountry] = useState('Pakistan');
  const [city, setCity] = useState('Lahore');
  const [postalCode, setPostalCode] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<
    'COD' | 'JAZZCASH' | 'EASYPAISA' | 'BANK_TRANSFER' | 'CARD'
  >('COD');
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState('');
  const [whatsappOptIn, setWhatsappOptIn] = useState(true);

  const [quote, setQuote] = useState<any>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<{
    order: any;
    items: any[];
    paymentInstructions: string;
  } | null>(null);

  useEffect(() => {
    if (user) {
      if (!customerName) setCustomerName(user.name);
      if (!email) setEmail(user.email);
      if (!phone) setPhone(user.phone);
      fetch('/api/account/addresses')
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          const def = d?.addresses?.[0];
          if (def && !streetAddress) {
            setCountry(def.country);
            setCity(def.city);
            setPostalCode(def.postal_code);
            setStreetAddress(def.street_address);
          }
        })
        .catch(() => {});
    }
  }, [user]);

  useEffect(() => {
    if (cart.length === 0) return;
    fetch('/api/checkout/quote', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        items: cart.map((i) => ({variantId: i.variantId, quantity: i.quantity})),
        country,
        couponCode: appliedCoupon,
        currency,
      }),
    })
      .then((r) => r.json())
      .then((d) => {
        setQuote(d);
        setQuoteError(d.couponError || null);
      })
      .catch(() => {});
  }, [cart, country, appliedCoupon, currency]);

  if (confirmation) {
    const o = confirmation.order;
    const waConfirmMsg = `Hello PITLANE! I just placed order ${o.order_number} (${o.payment_method}) for ${o.city}, ${o.country}.`;
    return (
      <div className="max-w-3xl mx-auto px-4 md:px-10 py-14">
        <div className="bg-[#181A1D] border border-[#27272A] p-6 md:p-10 space-y-6">
          <div className="flex items-start gap-4 border-b border-[#27272A] pb-6">
            <CheckCircle2 className="w-8 h-8 text-[#EF2929] shrink-0 mt-1" />
            <div>
              <p className="font-mono-tabular text-xs uppercase text-[#EF2929]">
                Order Confirmed · {o.order_number}
              </p>
              <h1 className="font-display text-3xl md:text-4xl text-white uppercase mt-1">
                Thank You, {o.customer_name}
              </h1>
              <p className="text-sm text-[#C6C6C7] mt-2">
                Your order has been logged in our Lahore studio dispatch queue.
              </p>
            </div>
          </div>

          <div className="bg-[#090A0B] border border-[#27272A] p-4 text-xs text-[#C6C6C7] space-y-1">
            <p className="font-mono-tabular uppercase text-white">Payment Instructions ({o.payment_method})</p>
            <p>{confirmation.paymentInstructions}</p>
          </div>

          <div className="space-y-2 border-b border-[#27272A] pb-4">
            {confirmation.items.map((it) => (
              <div key={it.id} className="flex justify-between text-xs">
                <span className="text-white">
                  {it.product_name} ({it.size} · {it.color_name}) × {it.quantity}
                </span>
                <span className="font-mono-tabular text-[#C6C6C7]">
                  PKR {Number(it.line_total_pkr).toLocaleString()}
                </span>
              </div>
            ))}
          </div>

          <div className="space-y-1.5 text-xs font-mono-tabular">
            <div className="flex justify-between text-[#C6C6C7]">
              <span>Subtotal</span>
              <span>PKR {Number(o.subtotal_pkr).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-[#C6C6C7]">
              <span>Shipping</span>
              <span>PKR {Number(o.shipping_pkr).toLocaleString()}</span>
            </div>
            {o.discount_pkr > 0 && (
              <div className="flex justify-between text-[#EF2929]">
                <span>Discount ({o.coupon_code})</span>
                <span>-PKR {Number(o.discount_pkr).toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-base text-white font-semibold pt-2 border-t border-[#27272A]">
              <span>Total Settlement ({o.currency})</span>
              <span>
                {o.currency === 'PKR'
                  ? `PKR ${Number(o.total_pkr).toLocaleString()}`
                  : `${o.currency} ${o.total_display_amount} (PKR ${Number(o.total_pkr).toLocaleString()})`}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate(`/track-order?order=${o.order_number}`)}
              className="h-11 px-6 bg-[#EF2929] hover:bg-white text-white hover:text-[#111315] font-mono-tabular text-xs font-semibold uppercase"
            >
              Track Order
            </button>
            <a
              href={buildWhatsAppUrl(waConfirmMsg)}
              target="_blank"
              rel="noopener noreferrer"
              className="h-11 px-5 border border-[#27272A] hover:border-[#25D366] text-white font-mono-tabular text-xs uppercase flex items-center gap-2"
            >
              <MessageCircle className="w-4 h-4 text-[#25D366]" />
              <span>Send Receipt via WhatsApp</span>
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 md:px-10 py-20 text-center">
        <h1 className="font-display text-4xl text-white uppercase">Your Bag is Empty</h1>
        <p className="text-sm text-[#71717A] mt-2">Add items from the PITLANE catalogue before checking out.</p>
        <button
          type="button"
          onClick={() => navigate('/shop')}
          className="mt-6 h-11 px-6 bg-[#EF2929] text-white font-mono-tabular text-xs uppercase"
        >
          Browse Catalogue
        </button>
      </div>
    );
  }

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          customerName,
          email,
          phone,
          country,
          city,
          postalCode,
          streetAddress,
          orderNotes,
          paymentMethod,
          currency,
          couponCode: appliedCoupon,
          whatsappOptIn,
          items: cart.map((i) => ({variantId: i.variantId, quantity: i.quantity})),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Checkout validation failed.');
        return;
      }
      clearCart();
      setConfirmation(data);
      showToast(`Order ${data.order.order_number} placed`);
    } catch {
      setErrorMsg('Network error submitting checkout. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const subtotalPkr = quote?.subtotalPkr ?? cartSubtotalPkr;
  const shippingPkr = quote?.shippingPkr ?? 0;
  const discountPkr = quote?.discountPkr ?? 0;
  const taxPkr = quote?.taxPkr ?? 0;
  const totalPkr = quote?.totalPkr ?? subtotalPkr + shippingPkr;

  return (
    <div className="max-w-[1440px] mx-auto px-4 md:px-10 py-10 pb-28 md:pb-14">
      <div className="pb-6 border-b border-[#27272A] flex items-center justify-between">
        <div>
          <p className="font-mono-tabular text-xs uppercase tracking-widest text-[#EF2929]">
            Secure Checkout · Server-Validated Stock
          </p>
          <h1 className="font-display text-3xl md:text-5xl text-white uppercase mt-1">
            Dispatch &amp; Settlement
          </h1>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs font-mono-tabular text-[#71717A]">
          <Lock className="w-4 h-4 text-[#EF2929]" />
          <span>Encrypted Session</span>
        </div>
      </div>

      <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-10 pt-8">
        <div className="lg:col-span-7 space-y-8">
          {errorMsg && (
            <div role="alert" className="bg-[#93000a] border border-[#EF2929] p-4 text-sm text-white">
              {errorMsg}
            </div>
          )}

          {/* Contact & Shipping Address */}
          <section className="bg-[#181A1D] border border-[#27272A] p-6 space-y-4">
            <h2 className="font-display text-2xl text-white uppercase">1. Delivery Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="chk-name" className="block font-mono-tabular text-xs uppercase text-[#71717A] mb-1.5">
                  Full Name *
                </label>
                <input
                  id="chk-name"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full h-11 px-3 bg-[#090A0B] border border-[#27272A] text-sm text-white"
                />
              </div>
              <div>
                <label htmlFor="chk-email" className="block font-mono-tabular text-xs uppercase text-[#71717A] mb-1.5">
                  Email Address *
                </label>
                <input
                  id="chk-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-11 px-3 bg-[#090A0B] border border-[#27272A] text-sm text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="chk-phone" className="block font-mono-tabular text-xs uppercase text-[#71717A] mb-1.5">
                  Phone / WhatsApp *
                </label>
                <input
                  id="chk-phone"
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+92 300 1234567 or international"
                  className="w-full h-11 px-3 bg-[#090A0B] border border-[#27272A] text-sm text-white"
                />
              </div>
              <div>
                <label htmlFor="chk-country" className="block font-mono-tabular text-xs uppercase text-[#71717A] mb-1.5">
                  Country *
                </label>
                <select
                  id="chk-country"
                  value={country}
                  onChange={(e) => {
                    const nextCountry = e.target.value;
                    setCountry(nextCountry);
                    if (nextCountry !== 'Pakistan' && paymentMethod === 'COD') {
                      setPaymentMethod('CARD');
                    }
                  }}
                  className="w-full h-11 px-3 bg-[#090A0B] border border-[#27272A] text-sm text-white"
                >
                  <option value="Pakistan">Pakistan (Domestic Courier)</option>
                  <option value="United Arab Emirates">United Arab Emirates (DHL Express)</option>
                  <option value="Saudi Arabia">Saudi Arabia (DHL Express)</option>
                  <option value="United Kingdom">United Kingdom (DHL Express)</option>
                  <option value="United States">United States (DHL Express)</option>
                  <option value="Germany">Germany (DHL Express)</option>
                  <option value="Other International">Other International</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="chk-city" className="block font-mono-tabular text-xs uppercase text-[#71717A] mb-1.5">
                  City *
                </label>
                <input
                  id="chk-city"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full h-11 px-3 bg-[#090A0B] border border-[#27272A] text-sm text-white"
                />
              </div>
              <div>
                <label htmlFor="chk-postal" className="block font-mono-tabular text-xs uppercase text-[#71717A] mb-1.5">
                  Postal Code
                </label>
                <input
                  id="chk-postal"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  className="w-full h-11 px-3 bg-[#090A0B] border border-[#27272A] text-sm text-white"
                />
              </div>
            </div>

            <div>
              <label htmlFor="chk-addr" className="block font-mono-tabular text-xs uppercase text-[#71717A] mb-1.5">
                Complete Delivery Address *
              </label>
              <input
                id="chk-addr"
                required
                value={streetAddress}
                onChange={(e) => setStreetAddress(e.target.value)}
                placeholder="House / Flat, Street, Sector / Area"
                className="w-full h-11 px-3 bg-[#090A0B] border border-[#27272A] text-sm text-white"
              />
            </div>

            <div>
              <label htmlFor="chk-notes" className="block font-mono-tabular text-xs uppercase text-[#71717A] mb-1.5">
                Order Notes (Optional)
              </label>
              <input
                id="chk-notes"
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                placeholder="Delivery timing or gate instructions"
                className="w-full h-11 px-3 bg-[#090A0B] border border-[#27272A] text-sm text-white"
              />
            </div>

            <label className="flex items-start gap-2.5 pt-2 cursor-pointer text-xs text-[#C6C6C7]">
              <input
                type="checkbox"
                checked={whatsappOptIn}
                onChange={(e) => setWhatsappOptIn(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-[#EF2929]"
              />
              <span>
                Send transactional order confirmation, dispatch tracking, and delivery updates via
                WhatsApp.
              </span>
            </label>
          </section>

          {/* Payment Method */}
          <section className="bg-[#181A1D] border border-[#27272A] p-6 space-y-4">
            <h2 className="font-display text-2xl text-white uppercase">2. Payment Method</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                {id: 'COD' as const, label: 'Cash on Delivery (Pakistan)', desc: 'Pay cash to courier rider'},
                {id: 'JAZZCASH' as const, label: 'JazzCash Mobile Account', desc: 'Verified merchant transfer'},
                {id: 'EASYPAISA' as const, label: 'Easypaisa Wallet', desc: 'Verified wallet transfer'},
                {id: 'BANK_TRANSFER' as const, label: 'Bank IBAN Transfer', desc: 'Meezan Bank Lahore'},
                {id: 'CARD' as const, label: 'International Card', desc: 'Visa / Mastercard gateway'},
              ].map((pm) => {
                const disabled = pm.id === 'COD' && country !== 'Pakistan';
                return (
                  <button
                    key={pm.id}
                    type="button"
                    disabled={disabled}
                    onClick={() => setPaymentMethod(pm.id)}
                    className={`text-left p-4 border transition-colors ${
                      paymentMethod === pm.id
                        ? 'border-[#EF2929] bg-[#111315]'
                        : disabled
                          ? 'border-[#27272A] bg-[#090A0B] opacity-40 cursor-not-allowed'
                          : 'border-[#27272A] bg-[#090A0B] hover:border-white'
                    }`}
                  >
                    <p className="text-sm font-semibold text-white">{pm.label}</p>
                    <p className="text-xs text-[#71717A] mt-0.5">{pm.desc}</p>
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        {/* Summary Column */}
        <aside className="lg:col-span-5">
          <div className="bg-[#181A1D] border border-[#27272A] p-6 space-y-5 lg:sticky lg:top-24">
            <h2 className="font-display text-2xl text-white uppercase">Order Summary</h2>

            <div className="divide-y divide-[#27272A] max-h-72 overflow-y-auto">
              {cart.map((it) => (
                <div key={it.variantId} className="py-3 flex justify-between gap-3 text-xs">
                  <div>
                    <p className="font-semibold text-white">{it.name}</p>
                    <p className="font-mono-tabular text-[#71717A]">
                      {it.size} · {it.colorName} × {it.quantity}
                    </p>
                  </div>
                  <span className="font-mono-tabular text-white shrink-0">
                    {formatPrice(it.unitPricePkr * it.quantity)}
                  </span>
                </div>
              ))}
            </div>

            {/* Coupon */}
            <div className="pt-2 border-t border-[#27272A]">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  placeholder="Promo code (e.g. PITLANE10)"
                  className="flex-1 h-10 px-3 bg-[#090A0B] border border-[#27272A] text-xs font-mono-tabular uppercase text-white"
                />
                <button
                  type="button"
                  onClick={() => setAppliedCoupon(couponInput.trim().toUpperCase())}
                  className="h-10 px-4 border border-white text-white hover:bg-white hover:text-[#111315] font-mono-tabular text-xs uppercase transition-colors"
                >
                  Apply
                </button>
              </div>
              {quoteError && <p className="text-xs text-[#EF2929] mt-1.5">{quoteError}</p>}
              {quote?.appliedCoupon && (
                <p className="text-xs font-mono-tabular text-[#C6C6C7] mt-1.5">
                  Applied {quote.appliedCoupon} (-{formatPrice(discountPkr)})
                </p>
              )}
            </div>

            <div className="space-y-2 pt-3 border-t border-[#27272A] text-xs font-mono-tabular">
              <div className="flex justify-between text-[#C6C6C7]">
                <span>Subtotal</span>
                <span>{formatPrice(subtotalPkr)}</span>
              </div>
              <div className="flex justify-between text-[#C6C6C7]">
                <span>Shipping ({quote?.shippingZone?.estimatedDays || '2–4 Days'})</span>
                <span>{shippingPkr === 0 ? 'FREE' : formatPrice(shippingPkr)}</span>
              </div>
              {discountPkr > 0 && (
                <div className="flex justify-between text-[#EF2929]">
                  <span>Discount</span>
                  <span>-{formatPrice(discountPkr)}</span>
                </div>
              )}
              {taxPkr > 0 && (
                <div className="flex justify-between text-[#C6C6C7]">
                  <span>Regional VAT / Tax</span>
                  <span>{formatPrice(taxPkr)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-semibold text-white pt-3 border-t border-[#27272A]">
                <span>Total</span>
                <span>{formatPrice(totalPkr)}</span>
              </div>
              {currency !== 'PKR' && (
                <p className="text-[11px] text-[#71717A]">
                  Base settlement amount: PKR {totalPkr.toLocaleString()}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="hidden md:block w-full h-12 bg-[#EF2929] hover:bg-white text-white hover:text-[#111315] font-mono-tabular text-xs font-semibold uppercase tracking-wider transition-colors"
            >
              {submitting ? 'Validating Inventory...' : 'Place Order'}
            </button>
          </div>
        </aside>

        {/* Mobile Sticky Bottom Checkout Bar */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#111315] border-t border-[#27272A] px-4 py-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-mono-tabular uppercase text-[#71717A]">Total</p>
            <p className="font-mono-tabular text-base font-semibold text-white">{formatPrice(totalPkr)}</p>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="h-12 px-6 bg-[#EF2929] text-white font-mono-tabular text-xs font-semibold uppercase tracking-wider"
          >
            {submitting ? 'Placing...' : 'Place Order'}
          </button>
        </div>
      </form>
    </div>
  );
}
