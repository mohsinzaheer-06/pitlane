import {Minus, Plus, ShoppingBag, Trash2, X} from 'lucide-react';
import {useApp} from '../context/AppContext';

export function CartDrawer() {
  const {
    cart,
    cartCount,
    cartSubtotalPkr,
    cartOpen,
    setCartOpen,
    updateCartQty,
    removeFromCart,
    formatPrice,
    navigate,
  } = useApp();

  if (!cartOpen) return null;

  const freeShippingThreshold = 15000;
  const remainingForFree = Math.max(0, freeShippingThreshold - cartSubtotalPkr);
  const progressPct = Math.min(100, Math.round((cartSubtotalPkr / freeShippingThreshold) * 100));

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label="Shopping Bag">
      <div
        className="fixed inset-0 bg-black/80"
        onClick={() => setCartOpen(false)}
        aria-hidden="true"
      />
      <aside className="relative z-10 w-full max-w-md bg-[#111315] border-l border-[#27272A] flex flex-col h-full">
        <div className="px-5 py-4 border-b border-[#27272A] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-4 h-4 text-[#EF2929]" />
            <h2 className="font-display text-xl uppercase tracking-wide text-white">
              Your Bag ({cartCount})
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setCartOpen(false)}
            aria-label="Close shopping bag"
            className="min-w-[44px] min-h-[44px] flex items-center justify-center text-white hover:text-[#EF2929]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pakistan Free Shipping Progress */}
        <div className="px-5 py-3 bg-[#090A0B] border-b border-[#27272A]">
          <div className="flex items-center justify-between text-xs font-mono-tabular text-[#C6C6C7]">
            <span>
              {remainingForFree === 0
                ? 'Unlocked Free Pakistan Express Shipping'
                : `Add ${formatPrice(remainingForFree)} for Free Pakistan Shipping`}
            </span>
            <span>{progressPct}%</span>
          </div>
          <div className="mt-2 h-1.5 w-full bg-[#181A1D]">
            <div
              className="h-full bg-[#EF2929] transition-all duration-200"
              style={{width: `${progressPct}%`}}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-[#27272A]">
          {cart.length === 0 ? (
            <div className="p-8 text-center flex flex-col items-center justify-center h-full">
              <p className="text-base font-medium text-white">Your PITLANE bag is empty.</p>
              <p className="text-sm text-[#71717A] mt-2">
                Explore technical hoodies, paddock jackets, and collector scale models.
              </p>
              <button
                type="button"
                onClick={() => {
                  setCartOpen(false);
                  navigate('/shop');
                }}
                className="mt-6 px-6 py-3 bg-[#EF2929] hover:bg-white text-white hover:text-[#111315] font-mono-tabular text-xs font-semibold uppercase tracking-wider transition-colors"
              >
                Shop Catalogue
              </button>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.variantId} className="p-4 flex gap-4">
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  referrerPolicy="no-referrer"
                  className="w-20 h-20 object-cover bg-[#090A0B] border border-[#27272A] shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setCartOpen(false);
                        navigate(`/product/${item.slug}`);
                      }}
                      className="text-sm font-semibold text-white hover:text-[#EF2929] text-left truncate"
                    >
                      {item.name}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.variantId)}
                      aria-label={`Remove ${item.name}`}
                      className="text-[#71717A] hover:text-[#EF2929] p-1 shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs font-mono-tabular text-[#71717A] mt-0.5">
                    {item.size} · {item.colorName} · {item.sku}
                  </p>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="inline-flex items-center border border-[#27272A] bg-[#181A1D]">
                      <button
                        type="button"
                        onClick={() => updateCartQty(item.variantId, item.quantity - 1)}
                        aria-label="Decrease quantity"
                        className="w-9 h-9 flex items-center justify-center text-white hover:bg-[#27272A]"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-9 text-center font-mono-tabular text-xs text-white">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateCartQty(item.variantId, item.quantity + 1)}
                        aria-label="Increase quantity"
                        className="w-9 h-9 flex items-center justify-center text-white hover:bg-[#27272A]"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <span className="font-mono-tabular text-sm font-semibold text-white">
                      {formatPrice(item.unitPricePkr * item.quantity)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <div className="p-5 border-t border-[#27272A] bg-[#090A0B] space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#C6C6C7]">Estimated Subtotal</span>
              <span className="font-mono-tabular text-lg font-semibold text-white">
                {formatPrice(cartSubtotalPkr)}
              </span>
            </div>
            <p className="text-xs text-[#71717A]">
              Shipping, coupon codes, and COD / JazzCash / Easypaisa options calculated at checkout.
            </p>
            <button
              type="button"
              onClick={() => {
                setCartOpen(false);
                navigate('/checkout');
              }}
              className="w-full h-12 bg-[#EF2929] hover:bg-white text-white hover:text-[#111315] font-mono-tabular text-xs font-semibold uppercase tracking-wider transition-colors"
            >
              Proceed to Checkout
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}
