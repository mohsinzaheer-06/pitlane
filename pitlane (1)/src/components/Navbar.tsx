import React, {useEffect, useState} from 'react';
import {Menu, Search, ShoppingBag, User, X} from 'lucide-react';
import {useApp} from '../context/AppContext';

export function Navbar() {
  const {
    route,
    navigate,
    bootstrap,
    currency,
    setCurrency,
    cartCount,
    setCartOpen,
    user,
  } = useApp();

  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const currentPath = route.split('?')[0];
  const announcement = bootstrap?.announcementBar;
  const currencyCodes = Object.keys(bootstrap?.currencies || {PKR: 1, USD: 1, GBP: 1, EUR: 1, AED: 1});

  const navItems = [
    {label: 'Shop', path: '/shop'},
    {label: 'Collections', path: '/collections'},
    {label: 'Racing Centre', path: '/racing-centre'},
    {label: 'Track Order', path: '/track-order'},
    ...(user?.role === 'ADMIN' ? [{label: 'Admin', path: '/admin'}] : []),
  ];

  useEffect(() => {
    if (!mobileMenuOpen && !searchOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
        setSearchOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mobileMenuOpen, searchOpen]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileMenuOpen]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    setSearchOpen(false);
    setMobileMenuOpen(false);
    navigate(q ? `/shop?search=${encodeURIComponent(q)}` : '/shop');
  };

  return (
    <>
      {announcement?.enabled && !bannerDismissed && (
        <div className="bg-[#EF2929] text-white min-h-[36px] py-1.5 px-3 sm:px-4 flex items-center justify-between gap-2 text-[11px] font-mono-tabular tracking-wider uppercase">
          <span className="truncate flex-1 text-center min-w-0">{announcement.text}</span>
          <button
            type="button"
            onClick={() => setBannerDismissed(true)}
            aria-label="Dismiss announcement"
            className="min-w-[32px] min-h-[32px] flex items-center justify-center hover:bg-black/20 shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <header className="sticky top-0 z-40 bg-[#111315]/95 backdrop-blur-sm border-b border-[#27272A]">
        <div className="max-w-[1440px] mx-auto px-3 sm:px-6 md:px-10 h-16 flex items-center justify-between gap-2 sm:gap-4 md:gap-8">
          {/* Zone 1: Brand Wordmark */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              aria-expanded={mobileMenuOpen}
              className="lg:hidden min-w-[44px] min-h-[44px] -ml-1.5 flex items-center justify-center text-white hover:text-[#EF2929]"
            >
              <Menu className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="font-display text-[22px] sm:text-2xl md:text-3xl tracking-wider text-white hover:text-[#EF2929] transition-colors whitespace-nowrap shrink-0 min-h-[44px] flex items-center"
            >
              PITLANE
            </button>
          </div>

          {/* Zone 2: Clean single-line navigation */}
          <nav aria-label="Primary navigation" className="hidden lg:flex items-center gap-7">
            {navItems.map((item) => {
              const active =
                currentPath === item.path ||
                (item.path === '/shop' &&
                  (currentPath.startsWith('/product/') || currentPath.startsWith('/category/')));
              return (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => navigate(item.path)}
                  className={`text-sm font-medium whitespace-nowrap shrink-0 py-2 border-b-2 transition-colors ${
                    active
                      ? 'text-white border-[#EF2929]'
                      : 'text-[#C6C6C7] border-transparent hover:text-white hover:border-[#27272A]'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Actions (Currency, Search, Account, Bag) */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <label htmlFor="currency-select" className="sr-only">
              Select currency
            </label>
            <select
              id="currency-select"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="hidden sm:block bg-[#181A1D] border border-[#27272A] text-white text-xs font-mono-tabular px-2.5 h-11 focus:border-white cursor-pointer"
            >
              {currencyCodes.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setSearchOpen((v) => !v)}
              aria-label="Search products"
              aria-expanded={searchOpen}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center text-white hover:text-[#EF2929] border border-transparent hover:border-[#27272A] transition-colors"
            >
              <Search className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => navigate('/account')}
              aria-label={user ? 'Customer account' : 'Sign in or register'}
              className="min-w-[44px] min-h-[44px] px-1.5 sm:px-2 flex items-center justify-center gap-1.5 text-white hover:text-[#EF2929] border border-transparent hover:border-[#27272A] transition-colors"
            >
              <User className="w-4 h-4" />
              <span className="hidden xl:inline text-xs font-mono-tabular uppercase whitespace-nowrap">
                {user ? user.name.split(' ')[0] : 'Account'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setCartOpen(true)}
              aria-label={`Shopping bag with ${cartCount} items`}
              className="min-h-[44px] px-2.5 sm:px-3.5 bg-[#EF2929] hover:bg-white text-white hover:text-[#111315] font-mono-tabular text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 sm:gap-2 transition-colors whitespace-nowrap shrink-0"
            >
              <ShoppingBag className="w-4 h-4 shrink-0" />
              <span>Bag ({cartCount})</span>
            </button>
          </div>
        </div>

        {/* Expandable Search Bar */}
        {searchOpen && (
          <div className="border-t border-[#27272A] bg-[#090A0B] px-3 sm:px-6 md:px-10 py-3">
            <form onSubmit={handleSearchSubmit} className="max-w-[1440px] mx-auto flex gap-2">
              <label htmlFor="navbar-search-input" className="sr-only">
                Search products
              </label>
              <input
                id="navbar-search-input"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search hoodies, paddock jackets, 1:18 models..."
                autoFocus
                className="min-w-0 flex-1 h-11 bg-[#181A1D] border border-[#27272A] px-3 sm:px-4 text-sm text-white placeholder-[#71717A] focus:border-white"
              />
              <button
                type="submit"
                className="min-h-[44px] px-4 sm:px-5 bg-[#EF2929] hover:bg-white text-white hover:text-[#111315] font-mono-tabular text-xs font-semibold uppercase tracking-wider transition-colors shrink-0"
              >
                Search
              </button>
            </form>
          </div>
        )}
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden flex"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation menu"
        >
          <div
            className="fixed inset-0 bg-black/80"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <div className="relative w-72 max-w-[85vw] bg-[#111315] border-r border-[#27272A] flex flex-col justify-between p-5 z-10 overflow-y-auto">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[#27272A]">
                <span className="font-display text-2xl text-white">PITLANE</span>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Close navigation menu"
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="mt-4 flex flex-col" aria-label="Mobile navigation">
                {navItems.map((item) => {
                  const active = currentPath === item.path;
                  return (
                    <button
                      key={item.path}
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        navigate(item.path);
                      }}
                      className={`min-h-[44px] py-3 text-left text-base font-medium border-b border-[#27272A] transition-colors ${
                        active ? 'text-[#EF2929]' : 'text-white hover:text-[#EF2929]'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate('/account');
                  }}
                  className="min-h-[44px] py-3 text-left text-base font-medium text-white border-b border-[#27272A] hover:text-[#EF2929]"
                >
                  {user ? `Account (${user.name.split(' ')[0]})` : 'Sign In / Register'}
                </button>
              </nav>

              <div className="mt-6">
                <label
                  htmlFor="mobile-currency-select"
                  className="block font-mono-tabular text-xs uppercase text-[#71717A] mb-2"
                >
                  Currency
                </label>
                <select
                  id="mobile-currency-select"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full bg-[#181A1D] border border-[#27272A] text-white text-sm font-mono-tabular px-3 h-11"
                >
                  {currencyCodes.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-6 text-xs font-mono-tabular text-[#71717A]">
              BUILT FOR THE RACING CULTURE.
            </div>
          </div>
        </div>
      )}
    </>
  );
}
