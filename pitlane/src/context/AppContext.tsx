import React, {createContext, useCallback, useContext, useEffect, useState} from 'react';
import type {
  AuthUser,
  CartItem,
  Category,
  Collection,
  CurrencyConfig,
  Review,
  ShippingZoneConfig,
} from '../types';

interface BootstrapData {
  categories: Category[];
  collections: Collection[];
  currencies: Record<string, CurrencyConfig>;
  shippingZones: ShippingZoneConfig[];
  announcementBar: {enabled: boolean; text: string};
  heroBanner: {kicker: string; headline: string; subheadline: string; imageUrl: string};
  whatsappBusinessPhone: string;
  featuredReviews: Review[];
}

interface AppContextValue {
  route: string;
  navigate: (to: string) => void;
  bootstrap: BootstrapData | null;
  currency: string;
  setCurrency: (code: string) => void;
  formatPrice: (pkrAmount: number) => string;
  cart: CartItem[];
  cartCount: number;
  cartSubtotalPkr: number;
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  addToCart: (item: CartItem) => void;
  updateCartQty: (variantId: number, qty: number) => void;
  removeFromCart: (variantId: number) => void;
  clearCart: () => void;
  user: AuthUser | null;
  setUser: (u: AuthUser | null) => void;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
  wishlistIds: number[];
  toggleWishlist: (productId: number) => Promise<void>;
  recentlyViewed: Array<{id: number; slug: string; name: string; imageUrl: string; pricePkr: number}>;
  trackViewedProduct: (item: {id: number; slug: string; name: string; imageUrl: string; pricePkr: number}) => void;
  toast: string | null;
  showToast: (msg: string) => void;
  buildWhatsAppUrl: (message: string) => string;
}

const AppContext = createContext<AppContextValue | null>(null);

const CART_STORAGE_KEY = 'pitlane_cart_v1';
const VIEWED_STORAGE_KEY = 'pitlane_viewed_v1';
const CURRENCY_STORAGE_KEY = 'pitlane_currency_v1';
const SESSION_KEY = 'pitlane_cart_sid';

function getOrCreateCartSessionKey(): string {
  let sid = localStorage.getItem(SESSION_KEY);
  if (!sid) {
    sid = `sid_${Math.random().toString(36).slice(2)}_${Date.now()}`;
    localStorage.setItem(SESSION_KEY, sid);
  }
  return sid;
}

export function AppProvider({children}: {children: React.ReactNode}) {
  const [route, setRoute] = useState<string>(() => window.location.pathname + window.location.search);
  const [bootstrap, setBootstrap] = useState<BootstrapData | null>(null);
  const [currency, setCurrencyState] = useState<string>(() => localStorage.getItem(CURRENCY_STORAGE_KEY) || 'PKR');
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const raw = localStorage.getItem(CART_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [cartOpen, setCartOpen] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [wishlistIds, setWishlistIds] = useState<number[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<
    Array<{id: number; slug: string; name: string; imageUrl: string; pricePkr: number}>
  >(() => {
    try {
      const raw = localStorage.getItem(VIEWED_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => {
      setToast((prev) => (prev === msg ? null : prev));
    }, 3400);
  }, []);

  const navigate = useCallback((to: string) => {
    if (to === window.location.pathname + window.location.search) {
      window.scrollTo({top: 0, behavior: 'smooth'});
      return;
    }
    window.history.pushState({}, '', to);
    setRoute(to);
    window.scrollTo({top: 0, behavior: 'instant' as ScrollBehavior});
  }, []);

  useEffect(() => {
    const onPop = () => setRoute(window.location.pathname + window.location.search);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user || null);
        if (data.user) {
          const wRes = await fetch('/api/account/wishlist');
          if (wRes.ok) {
            const wData = await wRes.json();
            setWishlistIds((wData.wishlist || []).map((p: any) => p.id));
          }
        } else {
          setWishlistIds([]);
        }
      }
    } catch {
      // Ignore network hiccup on startup
    }
  }, []);

  useEffect(() => {
    fetch('/api/bootstrap')
      .then((r) => r.json())
      .then((data) => setBootstrap(data))
      .catch(() => {});
    refreshUser();
  }, [refreshUser]);

  const setCurrency = useCallback((code: string) => {
    setCurrencyState(code);
    localStorage.setItem(CURRENCY_STORAGE_KEY, code);
  }, []);

  const formatPrice = useCallback(
    (pkrAmount: number) => {
      const cfg = bootstrap?.currencies?.[currency] || {
        code: 'PKR',
        symbol: 'PKR',
        rateFromPkr: 1,
        decimals: 0,
      };
      const val = pkrAmount * cfg.rateFromPkr;
      if (cfg.code === 'PKR') {
        return `PKR ${Math.round(val).toLocaleString('en-PK')}`;
      }
      return `${cfg.symbol}${val.toLocaleString('en-US', {
        minimumFractionDigits: cfg.decimals,
        maximumFractionDigits: cfg.decimals,
      })}`;
    },
    [bootstrap, currency]
  );

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    if (cart.length > 0 && user) {
      const subtotal = cart.reduce((s, i) => s + i.unitPricePkr * i.quantity, 0);
      fetch('/api/abandoned-cart', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          sessionKey: getOrCreateCartSessionKey(),
          email: user.email,
          phone: user.phone,
          name: user.name,
          whatsappOptIn: Boolean(user.whatsapp_opt_in),
          items: cart,
          subtotalPkr: subtotal,
        }),
      }).catch(() => {});
    }
  }, [cart, user]);

  const addToCart = useCallback(
    (item: CartItem) => {
      setCart((prev) => {
        const existing = prev.find((i) => i.variantId === item.variantId);
        if (existing) {
          const nextQty = Math.min(item.maxStock, existing.quantity + item.quantity);
          return prev.map((i) => (i.variantId === item.variantId ? {...i, quantity: nextQty} : i));
        }
        return [...prev, item];
      });
      setCartOpen(true);
      showToast(`${item.name} (${item.size}) added to bag`);
    },
    [showToast]
  );

  const updateCartQty = useCallback((variantId: number, qty: number) => {
    setCart((prev) =>
      qty <= 0
        ? prev.filter((i) => i.variantId !== variantId)
        : prev.map((i) => (i.variantId === variantId ? {...i, quantity: Math.min(i.maxStock, qty)} : i))
    );
  }, []);

  const removeFromCart = useCallback((variantId: number) => {
    setCart((prev) => prev.filter((i) => i.variantId !== variantId));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', {method: 'POST'});
    setUser(null);
    setWishlistIds([]);
    showToast('Signed out of PITLANE');
    if (window.location.pathname.startsWith('/admin') || window.location.pathname.startsWith('/account')) {
      navigate('/');
    }
  }, [navigate, showToast]);

  const toggleWishlist = useCallback(
    async (productId: number) => {
      if (!user) {
        showToast('Sign in to save items to your wishlist');
        navigate('/account');
        return;
      }
      const res = await fetch('/api/account/wishlist/toggle', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({productId}),
      });
      if (res.ok) {
        const data = await res.json();
        setWishlistIds((prev) =>
          data.wishlisted ? [...new Set([...prev, productId])] : prev.filter((id) => id !== productId)
        );
        showToast(data.wishlisted ? 'Saved to wishlist' : 'Removed from wishlist');
      }
    },
    [navigate, showToast, user]
  );

  const trackViewedProduct = useCallback(
    (item: {id: number; slug: string; name: string; imageUrl: string; pricePkr: number}) => {
      setRecentlyViewed((prev) => {
        const next = [item, ...prev.filter((p) => p.id !== item.id)].slice(0, 6);
        localStorage.setItem(VIEWED_STORAGE_KEY, JSON.stringify(next));
        return next;
      });
    },
    []
  );

  const buildWhatsAppUrl = useCallback(
    (message: string) => {
      const rawPhone = bootstrap?.whatsappBusinessPhone || '+923001234567';
      const cleaned = rawPhone.replace(/[^\d+]/g, '');
      const digits =
        cleaned.startsWith('03') && cleaned.length === 11
          ? `92${cleaned.slice(1)}`
          : cleaned.replace(/^\+/, '');
      return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
    },
    [bootstrap]
  );

  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);
  const cartSubtotalPkr = cart.reduce((sum, i) => sum + i.unitPricePkr * i.quantity, 0);

  return (
    <AppContext.Provider
      value={{
        route,
        navigate,
        bootstrap,
        currency,
        setCurrency,
        formatPrice,
        cart,
        cartCount,
        cartSubtotalPkr,
        cartOpen,
        setCartOpen,
        addToCart,
        updateCartQty,
        removeFromCart,
        clearCart,
        user,
        setUser,
        refreshUser,
        logout,
        wishlistIds,
        toggleWishlist,
        recentlyViewed,
        trackViewedProduct,
        toast,
        showToast,
        buildWhatsAppUrl,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
