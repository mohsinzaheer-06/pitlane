import React, {useEffect, useState} from 'react';
import {useApp} from '../context/AppContext';
import type {OrderRecord} from '../types';

const STAGES = [
  'RECEIVED',
  'CONFIRMED',
  'PROCESSING',
  'SHIPPED',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
];

export function TrackOrderPage() {
  const {route, user, formatPrice} = useApp();
  const initialOrder = new URLSearchParams(route.split('?')[1] || '').get('order') || '';
  const [orderNumber, setOrderNumber] = useState(initialOrder);
  const [email, setEmail] = useState(user?.email || '');
  const [order, setOrder] = useState<OrderRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const lookup = async (num: string, em: string) => {
    if (!num.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/orders/track/${encodeURIComponent(num.trim().toUpperCase())}?email=${encodeURIComponent(em.trim())}`
      );
      const d = await res.json();
      if (!res.ok) {
        setOrder(null);
        setError(d.error || 'Unable to locate order.');
      } else {
        setOrder({...d.order, items: d.items});
      }
    } catch {
      setOrder(null);
      setError('Network error looking up order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialOrder) {
      setOrderNumber(initialOrder);
    }
    if (initialOrder && user) {
      setEmail(user.email);
      lookup(initialOrder, user.email);
    }
  }, [initialOrder, user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    lookup(orderNumber, email);
  };

  const activeIndex = order ? STAGES.indexOf(order.order_status) : -1;

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-10 py-10 sm:py-12">
      <p className="font-mono-tabular text-xs uppercase tracking-widest text-[#EF2929]">
        PITLANE Logistics
      </p>
      <h1 className="font-display text-3xl sm:text-4xl text-white uppercase mt-1">Track Your Order</h1>

      {initialOrder && !user && !order && (
        <p className="text-xs text-[#C6C6C7] mt-3">
          Enter the checkout email used for <span className="font-mono-tabular text-white">{initialOrder}</span> to view dispatch &amp; courier details.
        </p>
      )}

      <form onSubmit={handleSubmit} className="mt-6 bg-[#181A1D] border border-[#27272A] p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-12 gap-3">
        <label htmlFor="track-order-num" className="sr-only">
          Order Number
        </label>
        <input
          id="track-order-num"
          required
          value={orderNumber}
          onChange={(e) => setOrderNumber(e.target.value)}
          placeholder="Order # (e.g. PTL-26123456)"
          className="sm:col-span-5 h-11 px-3 bg-[#090A0B] border border-[#27272A] text-sm font-mono-tabular uppercase text-white"
        />
        <label htmlFor="track-order-email" className="sr-only">
          Checkout Email
        </label>
        <input
          id="track-order-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Checkout Email"
          className="sm:col-span-5 h-11 px-3 bg-[#090A0B] border border-[#27272A] text-sm text-white"
        />
        <button
          type="submit"
          disabled={loading}
          className="sm:col-span-2 min-h-[44px] h-11 bg-[#EF2929] hover:bg-white text-white hover:text-[#111315] font-mono-tabular text-xs font-semibold uppercase transition-colors"
        >
          {loading ? '...' : 'Track'}
        </button>
      </form>

      {error && (
        <div role="alert" className="mt-4 bg-[#181A1D] border border-[#EF2929] p-4 text-xs text-white">
          {error}
        </div>
      )}

      {order && (
        <div className="mt-8 bg-[#181A1D] border border-[#27272A] p-4 sm:p-6 space-y-6">
          <div className="flex flex-wrap justify-between gap-3 border-b border-[#27272A] pb-4">
            <div>
              <p className="font-mono-tabular text-xs text-[#EF2929]">{order.order_number}</p>
              <h2 className="font-display text-2xl text-white uppercase mt-0.5">
                Status: {order.order_status.replace(/_/g, ' ')}
              </h2>
              <p className="text-xs text-[#71717A] mt-1">
                Destination: {order.city}, {order.country}
              </p>
            </div>
            <div className="sm:text-right font-mono-tabular text-xs text-[#C6C6C7]">
              <p>Payment: {order.payment_method} ({order.payment_status})</p>
              {order.tracking_code && (
                <p className="text-white mt-0.5">
                  {order.courier_name || 'Courier'}: {order.tracking_code}
                </p>
              )}
            </div>
          </div>

          {order.order_status !== 'CANCELLED' && (
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
              {STAGES.map((st, idx) => (
                <div
                  key={st}
                  className={`p-2.5 border text-[11px] font-mono-tabular uppercase ${
                    idx <= activeIndex
                      ? 'border-[#EF2929] bg-[#111315] text-white'
                      : 'border-[#27272A] bg-[#090A0B] text-[#71717A]'
                  }`}
                >
                  {st.replace(/_/g, ' ')}
                </div>
              ))}
            </div>
          )}

          <div className="space-y-2 border-t border-[#27272A] pt-4 text-xs">
            {(order.items || []).map((it) => (
              <div key={it.id} className="flex justify-between gap-3 text-[#C6C6C7]">
                <span className="min-w-0">
                  {it.product_name} ({it.size} · {it.color_name}) × {it.quantity}
                </span>
                <span className="font-mono-tabular text-white shrink-0">
                  {formatPrice(Number(it.line_total_pkr))}
                </span>
              </div>
            ))}
          </div>

          <div className="space-y-1.5 border-t border-[#27272A] pt-4 text-xs font-mono-tabular">
            <div className="flex justify-between text-[#C6C6C7]">
              <span>Shipping</span>
              <span>{order.shipping_pkr === 0 ? 'FREE' : formatPrice(Number(order.shipping_pkr))}</span>
            </div>
            {Number(order.discount_pkr) > 0 && (
              <div className="flex justify-between text-[#EF2929]">
                <span>Discount</span>
                <span>-{formatPrice(Number(order.discount_pkr))}</span>
              </div>
            )}
            <div className="flex justify-between text-sm text-white font-semibold pt-2 border-t border-[#27272A]">
              <span>Order Total</span>
              <span>{formatPrice(Number(order.total_pkr))}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
