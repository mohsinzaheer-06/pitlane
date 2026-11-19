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
  const {route, user} = useApp();
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialOrder && user) {
      lookup(initialOrder, user.email);
    }
  }, [initialOrder, user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    lookup(orderNumber, email);
  };

  const activeIndex = order ? STAGES.indexOf(order.order_status) : -1;

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-10 py-12">
      <p className="font-mono-tabular text-xs uppercase tracking-widest text-[#EF2929]">
        PITLANE Logistics
      </p>
      <h1 className="font-display text-4xl text-white uppercase mt-1">Track Your Order</h1>

      <form onSubmit={handleSubmit} className="mt-6 bg-[#181A1D] border border-[#27272A] p-6 grid grid-cols-1 sm:grid-cols-12 gap-3">
        <input
          required
          value={orderNumber}
          onChange={(e) => setOrderNumber(e.target.value)}
          placeholder="Order # (e.g. PTL-26123456)"
          className="sm:col-span-5 h-11 px-3 bg-[#090A0B] border border-[#27272A] text-sm font-mono-tabular uppercase text-white"
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Checkout Email"
          className="sm:col-span-5 h-11 px-3 bg-[#090A0B] border border-[#27272A] text-sm text-white"
        />
        <button
          type="submit"
          disabled={loading}
          className="sm:col-span-2 h-11 bg-[#EF2929] hover:bg-white text-white hover:text-[#111315] font-mono-tabular text-xs font-semibold uppercase"
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
        <div className="mt-8 bg-[#181A1D] border border-[#27272A] p-6 space-y-6">
          <div className="flex flex-wrap justify-between gap-2 border-b border-[#27272A] pb-4">
            <div>
              <p className="font-mono-tabular text-xs text-[#EF2929]">{order.order_number}</p>
              <h2 className="font-display text-2xl text-white uppercase mt-0.5">
                Status: {order.order_status.replace(/_/g, ' ')}
              </h2>
            </div>
            <div className="text-right font-mono-tabular text-xs text-[#C6C6C7]">
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
              <div key={it.id} className="flex justify-between text-[#C6C6C7]">
                <span>
                  {it.product_name} ({it.size} · {it.color_name}) × {it.quantity}
                </span>
                <span className="font-mono-tabular text-white">
                  PKR {Number(it.line_total_pkr).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
