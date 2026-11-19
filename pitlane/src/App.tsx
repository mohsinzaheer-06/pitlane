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
  const {route, toast} = useApp();
  const path = route.split('?')[0];

  const renderPage = () => {
    if (path === '/' || path === '') return <HomePage />;
    if (path === '/shop') return <ShopPage />;
    if (path === '/collections') return <CollectionsPage />;
    if (path.startsWith('/category/')) {
      const slug = path.slice('/category/'.length);
      return <ShopPage categorySlug={slug} />;
    }
    if (path.startsWith('/product/')) {
      const slug = path.slice('/product/'.length);
      return <ProductDetailPage slug={slug} />;
    }
    if (path === '/checkout') return <CheckoutPage />;
    if (path === '/racing-centre') return <RacingCentrePage />;
    if (path === '/account') return <AccountPage />;
    if (path === '/track-order') return <TrackOrderPage />;
    if (path === '/admin') return <AdminDashboard />;
    return <HomePage />;
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#111315] text-white">
      <Navbar />
      <main className="flex-1">{renderPage()}</main>
      <Footer />
      <CartDrawer />
      <WhatsAppFloat />
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 bg-[#181A1D] border border-[#EF2929] px-5 py-3 text-xs font-mono-tabular uppercase text-white shadow-2xl"
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
