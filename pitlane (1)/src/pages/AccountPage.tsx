import React, {useEffect, useState} from 'react';
import {LogOut, Package, Shield} from 'lucide-react';
import {useApp} from '../context/AppContext';
import type {OrderRecord} from '../types';

export function AccountPage() {
  const {user, setUser, refreshUser, logout, navigate, showToast, formatPrice} = useApp();
  const [authTab, setAuthTab] = useState<'login' | 'register' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsappOptIn, setWhatsappOptIn] = useState(true);
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authBusy, setAuthBusy] = useState(false);

  const [accountTab, setAccountTab] = useState<'orders' | 'addresses' | 'wishlist' | 'settings'>('orders');
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [loadingAccountData, setLoadingAccountData] = useState(false);

  // Address form
  const [addrLabel, setAddrLabel] = useState('Home');
  const [addrCountry, setAddrCountry] = useState('Pakistan');
  const [addrCity, setAddrCity] = useState('');
  const [addrPostal, setAddrPostal] = useState('');
  const [addrStreet, setAddrStreet] = useState('');

  // Profile form
  const [profName, setProfName] = useState('');
  const [profPhone, setProfPhone] = useState('');
  const [profWa, setProfWa] = useState(true);
  const [profMkt, setProfMkt] = useState(false);

  useEffect(() => {
    if (!user) return;
    setProfName(user.name);
    setProfPhone(user.phone);
    setProfWa(Boolean(user.whatsapp_opt_in));
    setProfMkt(Boolean(user.marketing_opt_in));

    setLoadingAccountData(true);
    Promise.all([
      fetch('/api/account/orders').then((r) => (r.ok ? r.json() : null)),
      fetch('/api/account/addresses').then((r) => (r.ok ? r.json() : null)),
      fetch('/api/account/wishlist').then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([ordData, addrData, wishData]) => {
        if (ordData) setOrders(ordData.orders || []);
        if (addrData) setAddresses(addrData.addresses || []);
        if (wishData) setWishlist(wishData.wishlist || []);
      })
      .catch(() => {})
      .finally(() => setLoadingAccountData(false));
  }, [user]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthBusy(true);
    try {
      if (authTab === 'reset') {
        const res = await fetch('/api/auth/password-reset-request', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({email}),
        });
        const d = await res.json();
        if (!res.ok) {
          setAuthError(d.error || 'Unable to process reset request.');
          return;
        }
        showToast(d.message || 'Reset link queued.');
        setAuthTab('login');
        return;
      }

      const url = authTab === 'login' ? '/api/auth/login' : '/api/auth/register';
      const body =
        authTab === 'login'
          ? {email, password}
          : {name, email, phone, password, whatsappOptIn, marketingOptIn};
      const res = await fetch(url, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(body),
      });
      const d = await res.json();
      if (!res.ok) {
        setAuthError(d.error || 'Authentication failed.');
        return;
      }
      setUser(d.user);
      await refreshUser();
      showToast(`Welcome, ${d.user.name}`);
    } catch {
      setAuthError('Network error. Please try again.');
    } finally {
      setAuthBusy(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-lg mx-auto px-4 py-14">
        <div className="bg-[#181A1D] border border-[#27272A] p-6 md:p-8 space-y-6">
          <div>
            <p className="font-mono-tabular text-xs uppercase text-[#EF2929]">PITLANE Member Access</p>
            <h1 className="font-display text-3xl text-white uppercase mt-1">
              {authTab === 'login'
                ? 'Sign In'
                : authTab === 'register'
                  ? 'Create Account'
                  : 'Reset Password'}
            </h1>
          </div>

          <div className="flex border-b border-[#27272A] text-xs font-mono-tabular uppercase">
            <button
              type="button"
              onClick={() => setAuthTab('login')}
              className={`min-h-[44px] px-4 py-2.5 border-b-2 ${
                authTab === 'login' ? 'border-[#EF2929] text-white' : 'border-transparent text-[#71717A]'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setAuthTab('register')}
              className={`min-h-[44px] px-4 py-2.5 border-b-2 ${
                authTab === 'register' ? 'border-[#EF2929] text-white' : 'border-transparent text-[#71717A]'
              }`}
            >
              Register
            </button>
            <button
              type="button"
              onClick={() => setAuthTab('reset')}
              className={`min-h-[44px] px-4 py-2.5 border-b-2 ${
                authTab === 'reset' ? 'border-[#EF2929] text-white' : 'border-transparent text-[#71717A]'
              }`}
            >
              Reset
            </button>
          </div>

          {authError && (
            <div role="alert" className="bg-[#93000a] border border-[#EF2929] p-3 text-xs text-white">
              {authError}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            {authTab === 'register' && (
              <>
                <label htmlFor="auth-name" className="sr-only">
                  Full Name
                </label>
                <input
                  id="auth-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full Name"
                  className="w-full h-11 px-3 bg-[#090A0B] border border-[#27272A] text-sm text-white"
                />
                <label htmlFor="auth-phone" className="sr-only">
                  Phone or WhatsApp
                </label>
                <input
                  id="auth-phone"
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Phone / WhatsApp (+92... or intl)"
                  className="w-full h-11 px-3 bg-[#090A0B] border border-[#27272A] text-sm text-white"
                />
              </>
            )}

            <label htmlFor="auth-email" className="sr-only">
              Email Address
            </label>
            <input
              id="auth-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email Address"
              className="w-full h-11 px-3 bg-[#090A0B] border border-[#27272A] text-sm text-white"
            />

            {authTab !== 'reset' && (
              <>
                <label htmlFor="auth-password" className="sr-only">
                  Password
                </label>
                <input
                  id="auth-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full h-11 px-3 bg-[#090A0B] border border-[#27272A] text-sm text-white"
                />
              </>
            )}

            {authTab === 'register' && (
              <div className="space-y-2 text-xs text-[#C6C6C7]">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={whatsappOptIn}
                    onChange={(e) => setWhatsappOptIn(e.target.checked)}
                    className="w-4 h-4 accent-[#EF2929]"
                  />
                  <span>Receive order updates via WhatsApp</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={marketingOptIn}
                    onChange={(e) => setMarketingOptIn(e.target.checked)}
                    className="w-4 h-4 accent-[#EF2929]"
                  />
                  <span>Receive limited drop release alerts</span>
                </label>
              </div>
            )}

            <button
              type="submit"
              disabled={authBusy}
              className="w-full h-12 bg-[#EF2929] hover:bg-white text-white hover:text-[#111315] font-mono-tabular text-xs font-semibold uppercase tracking-wider transition-colors"
            >
              {authBusy
                ? 'Authenticating...'
                : authTab === 'login'
                  ? 'Sign In'
                  : authTab === 'register'
                    ? 'Create Account'
                    : 'Request Reset'}
            </button>
          </form>

          {/* Seeded Demo Credentials Helper */}
          <div className="pt-4 border-t border-[#27272A] text-xs font-mono-tabular text-[#71717A] space-y-1.5">
            <p className="text-white uppercase">Demo Test Credentials:</p>
            <p>Customer: driver@pitlane.pk / PitlaneDriver!2026</p>
            <p>Admin: admin@pitlane.pk / PitlaneAdmin!2026</p>
          </div>
        </div>
      </div>
    );
  }

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/account/addresses', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          label: addrLabel,
          recipientName: user.name,
          phone: user.phone || '+923001234567',
          country: addrCountry,
          city: addrCity,
          postalCode: addrPostal,
          streetAddress: addrStreet,
          isDefault: addresses.length === 0,
        }),
      });
      const d = await res.json();
      if (!res.ok) {
        showToast(d.error || 'Could not save address');
        return;
      }
      setAddresses((prev) => [d.address, ...prev]);
      setAddrCity('');
      setAddrPostal('');
      setAddrStreet('');
      showToast('Address saved');
    } catch {
      showToast('Network error saving address');
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          name: profName,
          phone: profPhone,
          preferredCurrency: user.preferred_currency || 'PKR',
          marketingOptIn: profMkt,
          whatsappOptIn: profWa,
        }),
      });
      const d = await res.json();
      if (!res.ok) {
        showToast(d.error || 'Failed to save preferences');
        return;
      }
      setUser(d.user);
      showToast('Preferences updated');
    } catch {
      showToast('Network error updating preferences');
    }
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 md:px-10 py-10">
      <div className="pb-6 border-b border-[#27272A] flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="font-mono-tabular text-xs uppercase text-[#EF2929]">
            {user.role} Account · {user.email}
          </p>
          <h1 className="font-display text-4xl text-white uppercase mt-1">{user.name}</h1>
        </div>
        <div className="flex flex-wrap gap-3">
          {user.role === 'ADMIN' && (
            <button
              type="button"
              onClick={() => navigate('/admin')}
              className="h-11 px-5 bg-[#EF2929] text-white font-mono-tabular text-xs font-semibold uppercase flex items-center gap-2"
            >
              <Shield className="w-4 h-4" />
              <span>Admin Dashboard</span>
            </button>
          )}
          <button
            type="button"
            onClick={logout}
            className="h-11 px-5 border border-[#27272A] hover:border-white text-white font-mono-tabular text-xs uppercase flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-1 bg-[#090A0B] p-1 border border-[#27272A] w-full sm:w-fit">
        {[
          {id: 'orders' as const, label: `Orders (${orders.length})`},
          {id: 'addresses' as const, label: `Addresses (${addresses.length})`},
          {id: 'wishlist' as const, label: `Wishlist (${wishlist.length})`},
          {id: 'settings' as const, label: 'Preferences & Security'},
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setAccountTab(t.id)}
            className={`min-h-[44px] px-3 sm:px-4 py-2 text-xs font-mono-tabular uppercase ${
              accountTab === t.id ? 'bg-[#EF2929] text-white font-semibold' : 'text-[#C6C6C7] hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-8">
        {accountTab === 'orders' && (
          <div className="space-y-4">
            {loadingAccountData && orders.length === 0 ? (
              <div className="h-32 bg-[#181A1D] border border-[#27272A] animate-pulse" />
            ) : orders.length === 0 ? (
              <div className="bg-[#181A1D] border border-[#27272A] p-6 sm:p-8 text-center">
                <Package className="w-8 h-8 text-[#71717A] mx-auto" />
                <p className="text-sm text-white mt-3">No orders placed under this account yet.</p>
                <button
                  type="button"
                  onClick={() => navigate('/shop')}
                  className="mt-4 min-h-[44px] h-11 px-5 bg-[#EF2929] text-white font-mono-tabular text-xs uppercase"
                >
                  Shop Catalogue
                </button>
              </div>
            ) : (
              orders.map((o) => (
                <div key={o.id} className="bg-[#181A1D] border border-[#27272A] p-4 sm:p-5 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#27272A] pb-3">
                    <div>
                      <span className="font-mono-tabular text-sm font-semibold text-white">
                        {o.order_number}
                      </span>
                      <span className="text-xs text-[#71717A] ml-3">
                        {new Date(o.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 font-mono-tabular text-xs">
                      <span className="text-[#EF2929]">{o.order_status}</span>
                      <span className="text-white">{formatPrice(o.total_pkr)}</span>
                      <button
                        type="button"
                        onClick={() => navigate(`/track-order?order=${o.order_number}`)}
                        className="min-h-[44px] px-2 underline text-[#C6C6C7] hover:text-white inline-flex items-center"
                      >
                        Track
                      </button>
                    </div>
                  </div>
                  <div className="text-xs text-[#C6C6C7] space-y-1">
                    {(o.items || []).map((it) => (
                      <p key={it.id}>
                        {it.product_name} ({it.size} · {it.color_name}) × {it.quantity}
                      </p>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {accountTab === 'addresses' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7 space-y-4">
              {addresses.length === 0 ? (
                <div className="bg-[#181A1D] border border-[#27272A] p-6 text-sm text-[#71717A]">
                  No saved addresses yet. Add a delivery address using the form.
                </div>
              ) : (
                addresses.map((a) => (
                  <div key={a.id} className="bg-[#181A1D] border border-[#27272A] p-4 sm:p-5 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-mono-tabular text-xs uppercase text-[#EF2929]">{a.label}</p>
                      <p className="text-sm font-semibold text-white mt-1 break-words">{a.street_address}</p>
                      <p className="text-xs text-[#C6C6C7] mt-0.5">
                        {a.city}, {a.postal_code} · {a.country}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const res = await fetch(`/api/account/addresses/${a.id}`, {method: 'DELETE'});
                          if (!res.ok) {
                            showToast('Could not remove address');
                            return;
                          }
                          setAddresses((prev) => prev.filter((x) => x.id !== a.id));
                          showToast('Address removed');
                        } catch {
                          showToast('Network error removing address');
                        }
                      }}
                      className="min-h-[44px] px-2 text-xs font-mono-tabular text-[#71717A] hover:text-[#EF2929] shrink-0"
                    >
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleAddAddress} className="lg:col-span-5 bg-[#181A1D] border border-[#27272A] p-4 sm:p-6 space-y-3">
              <h2 className="font-display text-2xl text-white uppercase">Add Saved Address</h2>
              <label htmlFor="addr-label" className="sr-only">
                Address Label
              </label>
              <input
                id="addr-label"
                required
                value={addrLabel}
                onChange={(e) => setAddrLabel(e.target.value)}
                placeholder="Label (Home / Studio)"
                className="w-full h-11 px-3 bg-[#090A0B] border border-[#27272A] text-sm text-white"
              />
              <label htmlFor="addr-country" className="sr-only">
                Country
              </label>
              <input
                id="addr-country"
                required
                value={addrCountry}
                onChange={(e) => setAddrCountry(e.target.value)}
                placeholder="Country"
                className="w-full h-11 px-3 bg-[#090A0B] border border-[#27272A] text-sm text-white"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="addr-city" className="sr-only">
                    City
                  </label>
                  <input
                    id="addr-city"
                    required
                    value={addrCity}
                    onChange={(e) => setAddrCity(e.target.value)}
                    placeholder="City"
                    className="w-full h-11 px-3 bg-[#090A0B] border border-[#27272A] text-sm text-white"
                  />
                </div>
                <div>
                  <label htmlFor="addr-postal" className="sr-only">
                    Postal Code
                  </label>
                  <input
                    id="addr-postal"
                    value={addrPostal}
                    onChange={(e) => setAddrPostal(e.target.value)}
                    placeholder="Postal Code"
                    className="w-full h-11 px-3 bg-[#090A0B] border border-[#27272A] text-sm text-white"
                  />
                </div>
              </div>
              <label htmlFor="addr-street" className="sr-only">
                Complete Street Address
              </label>
              <input
                id="addr-street"
                required
                value={addrStreet}
                onChange={(e) => setAddrStreet(e.target.value)}
                placeholder="Complete Street Address"
                className="w-full h-11 px-3 bg-[#090A0B] border border-[#27272A] text-sm text-white"
              />
              <button
                type="submit"
                className="w-full h-11 min-h-[44px] bg-[#EF2929] hover:bg-white text-white hover:text-[#111315] font-mono-tabular text-xs font-semibold uppercase transition-colors"
              >
                Save Address
              </button>
            </form>
          </div>
        )}

        {accountTab === 'wishlist' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {wishlist.map((w) => (
              <button
                key={w.id}
                type="button"
                onClick={() => navigate(`/product/${w.slug}`)}
                className="text-left bg-[#181A1D] border border-[#27272A] hover:border-[#EF2929] p-4"
              >
                <img
                  src={w.image_url}
                  alt={w.name}
                  referrerPolicy="no-referrer"
                  className="aspect-[4/3] w-full object-cover bg-[#090A0B]"
                />
                <p className="text-sm font-semibold text-white mt-3">{w.name}</p>
                <p className="font-mono-tabular text-xs text-[#C6C6C7] mt-1">
                  {formatPrice(w.base_price_pkr)}
                </p>
              </button>
            ))}
            {wishlist.length === 0 && (
              <p className="text-sm text-[#71717A]">Your wishlist is empty.</p>
            )}
          </div>
        )}

        {accountTab === 'settings' && (
          <form onSubmit={handleSaveProfile} className="max-w-lg bg-[#181A1D] border border-[#27272A] p-4 sm:p-6 space-y-4">
            <h2 className="font-display text-2xl text-white uppercase">
              Profile &amp; Notification Consent
            </h2>
            <div>
              <label htmlFor="prof-name" className="block font-mono-tabular text-xs uppercase text-[#71717A] mb-1">
                Full Name
              </label>
              <input
                id="prof-name"
                required
                value={profName}
                onChange={(e) => setProfName(e.target.value)}
                className="w-full h-11 px-3 bg-[#090A0B] border border-[#27272A] text-sm text-white"
              />
            </div>
            <div>
              <label htmlFor="prof-phone" className="block font-mono-tabular text-xs uppercase text-[#71717A] mb-1">
                Phone / WhatsApp
              </label>
              <input
                id="prof-phone"
                required
                value={profPhone}
                onChange={(e) => setProfPhone(e.target.value)}
                className="w-full h-11 px-3 bg-[#090A0B] border border-[#27272A] text-sm text-white"
              />
            </div>
            <label className="flex items-center gap-2.5 text-xs text-[#C6C6C7] cursor-pointer">
              <input
                type="checkbox"
                checked={profWa}
                onChange={(e) => setProfWa(e.target.checked)}
                className="w-4 h-4 accent-[#EF2929]"
              />
              <span>WhatsApp Order &amp; Dispatch Notifications</span>
            </label>
            <label className="flex items-center gap-2.5 text-xs text-[#C6C6C7] cursor-pointer">
              <input
                type="checkbox"
                checked={profMkt}
                onChange={(e) => setProfMkt(e.target.checked)}
                className="w-4 h-4 accent-[#EF2929]"
              />
              <span>Marketing Emails &amp; Limited Drop Alerts</span>
            </label>
            <button
              type="submit"
              className="h-11 min-h-[44px] px-6 bg-[#EF2929] hover:bg-white text-white hover:text-[#111315] font-mono-tabular text-xs font-semibold uppercase transition-colors"
            >
              Save Preferences
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
