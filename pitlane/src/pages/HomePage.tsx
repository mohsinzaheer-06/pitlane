import {useEffect, useState} from 'react';
import {ArrowRight, Star} from 'lucide-react';
import {useApp} from '../context/AppContext';
import type {Product} from '../types';
import {ProductCard} from '../components/ProductCard';

export function HomePage() {
  const {navigate, bootstrap} = useApp();
  const [products, setProducts] = useState<Product[]>([]);
  const [activeTab, setActiveTab] = useState<'new' | 'bestsellers' | 'limited'>('new');
  const [racingSnapshot, setRacingSnapshot] = useState<any>(null);
  const [articles, setArticles] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    fetch('/api/products')
      .then((r) => r.json())
      .then((d) => setProducts(d.products || []))
      .finally(() => setLoadingProducts(false));

    fetch('/api/racing/overview')
      .then((r) => r.json())
      .then((d) => {
        setRacingSnapshot(d.racing);
        setArticles(d.articles || []);
      })
      .catch(() => {});
  }, []);

  const hero = bootstrap?.heroBanner || {
    kicker: 'Drop 04 · Independent Motorsport Atelier',
    headline: 'BUILT FOR THE RACING CULTURE.',
    subheadline:
      'Technical paddock outerwear, 480gsm heavyweight streetwear, and 1:18 scale collector pieces. Crafted in Pakistan, shipped worldwide.',
    imageUrl: '/src/assets/images/hero_pitlane_campaign_1795087933257.jpg',
  };

  const filteredProducts = products
    .filter((p) => {
      if (activeTab === 'new') return p.is_new_arrival === 1;
      if (activeTab === 'bestsellers') return p.is_bestseller === 1;
      return p.is_limited_edition === 1;
    })
    .slice(0, 4);

  const visibleProducts = filteredProducts.length > 0 ? filteredProducts : products.slice(0, 4);
  const featuredCollections = (bootstrap?.collections || []).filter((c) => c.is_featured === 1).slice(0, 4);
  const collectorProduct = products.find((p) => p.category_group === 'COLLECTIBLES');

  return (
    <div className="bg-[#111315]">
      {/* 1. Hero Campaign */}
      <section className="relative border-b border-[#27272A] bg-[#090A0B]">
        <div className="max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-12 items-stretch">
          <div className="lg:col-span-6 px-4 md:px-10 py-12 md:py-20 flex flex-col justify-center gap-6 z-10">
            <p className="font-mono-tabular text-xs uppercase tracking-widest text-[#EF2929]">
              {hero.kicker}
            </p>
            <h1 className="font-display text-5xl sm:text-6xl lg:text-[72px] leading-[0.95] text-white text-balance uppercase">
              {hero.headline}
            </h1>
            <p className="text-base md:text-lg text-[#C6C6C7] max-w-xl leading-relaxed">
              {hero.subheadline}
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => navigate('/shop')}
                className="h-12 px-7 bg-[#EF2929] hover:bg-white text-white hover:text-[#111315] font-mono-tabular text-xs font-semibold uppercase tracking-wider transition-colors flex items-center gap-2 whitespace-nowrap"
              >
                <span>Shop Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => navigate('/collections')}
                className="h-12 px-7 bg-transparent border border-white text-white hover:bg-white hover:text-[#111315] font-mono-tabular text-xs font-semibold uppercase tracking-wider transition-colors whitespace-nowrap"
              >
                Explore Collections
              </button>
            </div>
          </div>

          <div className="lg:col-span-6 relative min-h-[320px] lg:min-h-[540px] bg-[#181A1D] border-t lg:border-t-0 lg:border-l border-[#27272A] overflow-hidden">
            <img
              src={hero.imageUrl || '/src/assets/images/hero_pitlane_campaign_1795087933257.jpg'}
              alt="PITLANE technical motorsport paddock jacket editorial look"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-t from-[#090A0B]/75 via-transparent to-transparent lg:bg-gradient-to-r lg:from-[#090A0B]/60 lg:via-transparent lg:to-transparent"
            />
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-xs font-mono-tabular text-white/90">
              <span>MONOCOQUE SERIES · LAHORE STUDIO</span>
              <span>PKR · USD · GBP · AED</span>
            </div>
          </div>
        </div>

        {/* 4-column Strip Below Hero */}
        <div className="border-t border-[#27272A] bg-[#111315]">
          <div className="max-w-[1440px] mx-auto grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 divide-x divide-[#27272A]">
            {[
              {title: 'Pakistan Express & COD', detail: '2–4 Day TCS / Leopards + JazzCash & Easypaisa'},
              {title: 'Worldwide DHL Dispatch', detail: 'Multi-currency checkout in PKR, USD, GBP, EUR, AED'},
              {title: '480GSM Atelier Textiles', detail: 'Original motorsport silhouettes, numbered limited runs'},
              {title: 'WhatsApp Paddock Desk', detail: 'Direct sizing advice & live order tracking updates'},
            ].map((item) => (
              <div key={item.title} className="px-4 md:px-6 py-4">
                <p className="font-mono-tabular text-xs font-semibold uppercase text-white">
                  {item.title}
                </p>
                <p className="text-xs text-[#71717A] mt-1">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 2. Featured Products (New Arrivals / Bestsellers / Limited Drops) */}
      <section className="max-w-[1440px] mx-auto px-4 md:px-10 py-14 border-b border-[#27272A]">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-8">
          <div>
            <p className="font-mono-tabular text-xs uppercase tracking-widest text-[#71717A]">
              Curated Grid · Season Drop
            </p>
            <h2 className="font-display text-3xl md:text-5xl text-white uppercase mt-1">
              Engineered Streetwear
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-1 bg-[#090A0B] p-1 border border-[#27272A]">
            {[
              {id: 'new' as const, label: 'New Arrivals'},
              {id: 'bestsellers' as const, label: 'Bestsellers'},
              {id: 'limited' as const, label: 'Limited Drops'},
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-xs font-mono-tabular uppercase tracking-wider transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-[#EF2929] text-white font-semibold'
                    : 'text-[#C6C6C7] hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {loadingProducts ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-96 bg-[#181A1D] border border-[#27272A] animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {visibleProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}

        <div className="mt-8 flex justify-end">
          <button
            type="button"
            onClick={() => navigate('/shop')}
            className="h-11 px-6 border border-[#27272A] hover:border-white text-xs font-mono-tabular uppercase tracking-wider text-white transition-colors"
          >
            View Full Catalogue ({products.length}) →
          </button>
        </div>
      </section>

      {/* 3. Collections, Shop by Category & Collector's Corner */}
      <section className="max-w-[1440px] mx-auto px-4 md:px-10 py-14 border-b border-[#27272A]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Collections + Category Directory */}
          <div className="lg:col-span-7 flex flex-col justify-between gap-6">
            <div>
              <p className="font-mono-tabular text-xs uppercase tracking-widest text-[#71717A]">
                Capsules &amp; Divisions
              </p>
              <h2 className="font-display text-3xl md:text-5xl text-white uppercase mt-1">
                Shop by Collection
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {featuredCollections.map((col) => (
                <button
                  key={col.id}
                  type="button"
                  onClick={() => navigate(`/shop?collection=${col.slug}`)}
                  className="group relative text-left bg-[#181A1D] border border-[#27272A] hover:border-[#EF2929] p-5 transition-colors flex flex-col justify-between min-h-[148px]"
                >
                  <div>
                    <span className="font-mono-tabular text-[11px] uppercase tracking-wider text-[#EF2929]">
                      Collection
                    </span>
                    <h3 className="font-display text-2xl text-white uppercase mt-1 group-hover:text-[#EF2929] transition-colors">
                      {col.name}
                    </h3>
                    <p className="text-xs text-[#C6C6C7] mt-2 line-clamp-2">{col.description}</p>
                  </div>
                  <span className="font-mono-tabular text-xs uppercase text-white mt-4">
                    Explore →
                  </span>
                </button>
              ))}
            </div>

            {/* Category & Gender Quick Bar */}
            <div className="border-t border-[#27272A] pt-5 flex flex-wrap gap-2">
              {[
                {label: 'Men', path: '/shop?gender=MALE'},
                {label: 'Women', path: '/shop?gender=FEMALE'},
                {label: 'Hoodies', path: '/category/hoodies'},
                {label: 'Racing Jackets', path: '/category/racing-jackets'},
                {label: 'Windbreakers', path: '/category/windbreakers'},
                {label: 'Jumpsuits', path: '/category/jumpsuits'},
                {label: 'Tracksuits', path: '/category/tracksuits'},
                {label: 'Watches', path: '/category/watches'},
                {label: '1:18 Scale Models', path: '/category/diecast-cars'},
              ].map((cat) => (
                <button
                  key={cat.path}
                  type="button"
                  onClick={() => navigate(cat.path)}
                  className="px-3.5 py-2 bg-[#090A0B] border border-[#27272A] hover:border-white text-xs font-mono-tabular uppercase text-[#C6C6C7] hover:text-white transition-colors"
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Collector's Corner Highlight */}
          <div className="lg:col-span-5 bg-[#181A1D] border border-[#27272A] flex flex-col">
            <div className="aspect-[4/3] bg-[#090A0B] border-b border-[#27272A] overflow-hidden relative">
              <img
                src={
                  collectorProduct?.images?.[0]?.url ||
                  '/src/assets/images/product_diecast_collector_1795087933569.jpg'
                }
                alt="1:18 Scale Carbon Aero Collector Model"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#090A0B]/85 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <span className="font-mono-tabular text-[11px] uppercase tracking-widest text-[#EF2929]">
                  Collector&apos;s Corner · Precision Scale
                </span>
                <h3 className="font-display text-2xl md:text-3xl text-white uppercase mt-0.5">
                  1:18 &amp; 1:43 Display Models
                </h3>
              </div>
            </div>
            <div className="p-6 flex-1 flex flex-col justify-between gap-4">
              <p className="text-sm text-[#C6C6C7] leading-relaxed">
                Diecast zinc-alloy open-wheel chassis models, rubber slick tires, and engraved
                acrylic plinths crafted for motorsport collectors.
              </p>
              <button
                type="button"
                onClick={() => navigate('/shop?group=COLLECTIBLES')}
                className="h-11 px-5 bg-[#EF2929] hover:bg-white text-white hover:text-[#111315] font-mono-tabular text-xs font-semibold uppercase tracking-wider transition-colors self-start"
              >
                Enter Collector&apos;s Corner →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 4. PITLANE Racing Centre Spotlight + Latest F1 Updates */}
      <section className="max-w-[1440px] mx-auto px-4 md:px-10 py-14 border-b border-[#27272A]">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <p className="font-mono-tabular text-xs uppercase tracking-widest text-[#EF2929]">
              PITLANE Racing Centre · Telemetry &amp; Editorial
            </p>
            <h2 className="font-display text-3xl md:text-5xl text-white uppercase mt-1">
              Championship Briefing
            </h2>
          </div>
          <button
            type="button"
            onClick={() => navigate('/racing-centre')}
            className="h-11 px-6 bg-transparent border border-white hover:bg-white text-white hover:text-[#111315] font-mono-tabular text-xs font-semibold uppercase tracking-wider transition-colors self-start md:self-auto"
          >
            Open Full Racing Centre →
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Next Race / Championship Leaders Card */}
          <div className="lg:col-span-5 bg-[#181A1D] border border-[#27272A] p-6 flex flex-col justify-between gap-5">
            <div>
              <div className="flex items-center justify-between text-xs font-mono-tabular text-[#71717A] border-b border-[#27272A] pb-3">
                <span>{racingSnapshot?.provider || 'Motorsport Data Feed'}</span>
                <span>{racingSnapshot?.syncStatus || 'SYNCING'}</span>
              </div>

              {racingSnapshot?.nextRace ? (
                <div className="mt-4">
                  <span className="font-mono-tabular text-[11px] uppercase text-[#EF2929]">
                    Round {racingSnapshot.nextRace.round} · {racingSnapshot.nextRace.status}
                  </span>
                  <h3 className="font-display text-2xl text-white uppercase mt-1">
                    {racingSnapshot.nextRace.raceName}
                  </h3>
                  <p className="text-xs text-[#C6C6C7] mt-1">
                    {racingSnapshot.nextRace.circuitName} · {racingSnapshot.nextRace.locality},{' '}
                    {racingSnapshot.nextRace.country}
                  </p>
                  <p className="font-mono-tabular text-xs text-white mt-2">
                    Race Date: {racingSnapshot.nextRace.date}
                  </p>
                </div>
              ) : (
                <div className="mt-4">
                  <h3 className="font-display text-2xl text-white uppercase">
                    Season Data Feed Standby
                  </h3>
                  <p className="text-xs text-[#C6C6C7] mt-2">
                    {racingSnapshot?.errorMessage ||
                      'Open the Racing Centre to view cached championship standings, race schedules, and circuit briefings.'}
                  </p>
                </div>
              )}

              {racingSnapshot?.driverStandings?.length > 0 && (
                <div className="mt-5 pt-4 border-t border-[#27272A] space-y-2">
                  <p className="font-mono-tabular text-[11px] uppercase text-[#71717A]">
                    Drivers&apos; Championship Leaders
                  </p>
                  {racingSnapshot.driverStandings.slice(0, 3).map((d: any) => (
                    <div
                      key={d.driverName}
                      className="flex items-center justify-between text-xs py-1 border-b border-[#27272A]/60"
                    >
                      <span className="font-mono-tabular text-white">
                        P{d.position} · {d.driverName}
                      </span>
                      <span className="font-mono-tabular text-[#EF2929] font-semibold">
                        {d.points} PTS
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <p className="font-mono-tabular text-[11px] text-[#71717A]">
              {racingSnapshot?.lastSyncedAt
                ? `Last Updated: ${new Date(racingSnapshot.lastSyncedAt).toLocaleString()}`
                : 'No fabricated telemetry — live feed adapter'}
            </p>
          </div>

          {/* Editorial Articles */}
          <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-6">
            {articles.slice(0, 2).map((art) => (
              <article
                key={art.id}
                className="bg-[#181A1D] border border-[#27272A] flex flex-col justify-between"
              >
                <div>
                  <div className="aspect-[16/9] bg-[#090A0B] border-b border-[#27272A] overflow-hidden">
                    <img
                      src={art.image_url}
                      alt={art.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-5">
                    <div className="flex items-center gap-2 font-mono-tabular text-[11px] uppercase text-[#71717A]">
                      <span className="text-[#EF2929]">{art.category}</span>
                      <span aria-hidden="true">·</span>
                      <span className="truncate">{art.source_name}</span>
                    </div>
                    <h3 className="text-lg font-semibold text-white mt-2 leading-snug">
                      {art.title}
                    </h3>
                    <p className="text-xs text-[#C6C6C7] mt-2 line-clamp-3 leading-relaxed">
                      {art.summary}
                    </p>
                  </div>
                </div>
                <div className="px-5 pb-5">
                  <button
                    type="button"
                    onClick={() => navigate('/racing-centre')}
                    className="font-mono-tabular text-xs uppercase text-white hover:text-[#EF2929]"
                  >
                    Read Briefing →
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Verified Customer Reviews */}
      {bootstrap?.featuredReviews && bootstrap.featuredReviews.length > 0 && (
        <section className="max-w-[1440px] mx-auto px-4 md:px-10 py-14">
          <div className="mb-8">
            <p className="font-mono-tabular text-xs uppercase tracking-widest text-[#71717A]">
              Paddock Feedback · Verified Orders
            </p>
            <h2 className="font-display text-3xl md:text-4xl text-white uppercase mt-1">
              Worn From Lahore to Dubai
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {bootstrap.featuredReviews.slice(0, 4).map((rev) => (
              <div
                key={rev.id}
                className="bg-[#181A1D] border border-[#27272A] p-5 flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-1 text-[#EF2929]" aria-label={`${rev.rating} out of 5 stars`}>
                    {Array.from({length: rev.rating}).map((_, idx) => (
                      <Star key={idx} className="w-3.5 h-3.5 fill-current" />
                    ))}
                  </div>
                  <h3 className="text-sm font-semibold text-white mt-3">{rev.title}</h3>
                  <p className="text-xs text-[#C6C6C7] mt-2 leading-relaxed">{rev.comment}</p>
                </div>
                <div className="pt-3 border-t border-[#27272A] text-xs font-mono-tabular text-[#71717A]">
                  <p className="text-white">
                    {rev.author_name} {rev.author_city ? `· ${rev.author_city}` : ''}
                  </p>
                  {rev.product_name && (
                    <button
                      type="button"
                      onClick={() => navigate(`/product/${rev.product_slug}`)}
                      className="text-[#EF2929] hover:underline mt-0.5 text-left truncate block max-w-full"
                    >
                      {rev.product_name}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
