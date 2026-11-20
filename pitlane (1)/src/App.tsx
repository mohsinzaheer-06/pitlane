import {useEffect} from 'react';
import {AppProvider, useApp} from './context/AppContext';
import {Navbar} from './components/Navbar';
import {CartDrawer} from './components/CartDrawer';
import {WhatsAppFloat} from './components/WhatsAppFloat';
import {Footer} from './components/Footer';
import {HomePage} from './pages/HomePage';
import {ShopPage} from './pages/ShopPage';
import {CollectionsPage} from './pages/CollectionsPage';
import {ProductDetailPage} from './pages/ProductDetailPage';
import {CheckoutPage} from './pages/CheckoutPage';
import {RacingCentrePage} from './pages/RacingCentrePage';
import {AccountPage} from './pages/AccountPage';
import {TrackOrderPage} from './pages/TrackOrderPage';
import {AdminDashboard} from './pages/AdminDashboard';

function PitlaneShell() {
  const {route, toast, navigate} = useApp();
  const rawPath = route.split('?')[0] || '/';
  const path = rawPath.length > 1 ? rawPath.replace(/\/+$/, '') : rawPath;
  const isCheckout = path === '/checkout';

  useEffect(() => {
    const titleMap: Record<string, string> = {
      '/': 'PITLANE — Built for the Racing Culture | Motorsport Streetwear & Racing Centre',
      '/shop': 'Shop Catalogue | PITLANE Motorsport Streetwear',
      '/collections': 'Collections & Categories | PITLANE',
      '/checkout': 'Checkout & Dispatch | PITLANE',
      '/racing-centre': 'Formula 1 Racing Centre | PITLANE',
      '/account': 'Customer Account | PITLANE',
      '/track-order': 'Track Order | PITLANE',
      '/admin': 'Operations Console | PITLANE',
    };
    if (titleMap[path]) {
      document.title = titleMap[path];
    } else if (path.startsWith('/category/')) {
      const cat = path.slice('/category/'.length).replace(/-/g, ' ').toUpperCase();
      document.title = `${cat} | PITLANE Catalogue`;
    } else if (!path.startsWith('/product/')) {
      document.title = 'Page Not Found | PITLANE';
    }
  }, [path]);

  const renderPage = () => {
    if (path === '/' || path === '') return <HomePage />;
    if (path === '/shop') return <ShopPage />;
    if (path === '/collections') return <CollectionsPage />;
    if (path.startsWith('/category/') && path.length > '/category/'.length) {
      const slug = path.slice('/category/'.length);
      return <ShopPage categorySlug={slug} />;
    }
    if (path.startsWith('/product/') && path.length > '/product/'.length) {
      const slug = path.slice('/product/'.length);
      return <ProductDetailPage slug={slug} />;
    }
    if (path === '/checkout') return <CheckoutPage />;
    if (path === '/racing-centre') return <RacingCentrePage />;
    if (path === '/account') return <AccountPage />;
    if (path === '/track-order') return <TrackOrderPage />;
    if (path === '/admin') return <AdminDashboard />;

    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-5">
        <p className="font-mono-tabular text-xs uppercase tracking-widest text-[#EF2929]">
          Error 404 · Route Off-Track
        </p>
        <h1 className="font-display text-4xl sm:text-5xl text-white uppercase">Page Not Found</h1>
        <p className="text-sm text-[#C6C6C7]">
          The requested route does not exist. Return to the main PITLANE grid or browse the full
          streetwear and collectibles catalogue.
        </p>
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="min-h-[44px] px-6 bg-[#EF2929] hover:bg-white text-white hover:text-[#111315] font-mono-tabular text-xs font-semibold uppercase tracking-wider transition-colors"
          >
            Return Home
          </button>
          <button
            type="button"
            onClick={() => navigate('/shop')}
            className="min-h-[44px] px-6 border border-[#27272A] hover:border-white text-white font-mono-tabular text-xs uppercase tracking-wider transition-colors"
          >
            Browse Catalogue
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#111315] text-white">
      <Navbar />
      <main className="flex-1 min-w-0">{renderPage()}</main>
      <Footer />
      <CartDrawer />
      <WhatsAppFloat />
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed left-1/2 -translate-x-1/2 z-50 max-w-[calc(100vw-2rem)] bg-[#181A1D] border border-[#EF2929] px-5 py-3 text-xs font-mono-tabular uppercase text-white text-center shadow-2xl ${
            isCheckout ? 'bottom-24 md:bottom-6' : 'bottom-5'
          }`}
        >
          {toast}
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <PitlaneShell />
    </AppProvider>
  );
}
