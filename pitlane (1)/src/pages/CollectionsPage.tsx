import {ArrowRight} from 'lucide-react';
import {useApp} from '../context/AppContext';

export function CollectionsPage() {
  const {navigate, bootstrap} = useApp();
  const collections = bootstrap?.collections || [];
  const categories = bootstrap?.categories || [];

  if (!bootstrap) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 md:px-10 py-10 space-y-8">
        <div className="h-24 bg-[#181A1D] border border-[#27272A] animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-72 bg-[#181A1D] border border-[#27272A] animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const groups: Array<{key: 'APPAREL' | 'ACCESSORIES' | 'COLLECTIBLES'; title: string; subtitle: string}> = [
    {
      key: 'APPAREL',
      title: 'Apparel Division',
      subtitle: 'Heavyweight hoodies, racing jackets, windbreakers, jumpsuits, tracksuits, and polos.',
    },
    {
      key: 'ACCESSORIES',
      title: 'Accessories Division',
      subtitle: 'Structured headwear, Cordura packs, titanium chronographs, and archival prints.',
    },
    {
      key: 'COLLECTIBLES',
      title: "Collector's Corner",
      subtitle: '1:18 & 1:43 precision scale motorsport models and serialized display editions.',
    },
  ];

  return (
    <div className="max-w-[1440px] mx-auto px-4 md:px-10 py-10 md:py-14 space-y-16">
      {/* Page Header */}
      <div className="pb-8 border-b border-[#27272A]">
        <p className="font-mono-tabular text-xs uppercase tracking-widest text-[#EF2929]">
          PITLANE Directory · Capsules, Gender Fit &amp; All Categories
        </p>
        <h1 className="font-display text-4xl md:text-6xl text-white uppercase mt-2">
          Collections &amp; Categories
        </h1>
        <p className="text-sm md:text-base text-[#C6C6C7] max-w-2xl mt-3">
          Select any collection, gender division, or product category below to open its dedicated
          catalogue page.
        </p>
      </div>

      {/* Shop by Gender */}
      <section className="space-y-5">
        <div>
          <p className="font-mono-tabular text-xs uppercase tracking-widest text-[#71717A]">
            Tailored Silhouettes
          </p>
          <h2 className="font-display text-3xl text-white uppercase mt-1">Shop by Gender</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            {
              gender: 'MALE',
              title: 'Male Collection',
              desc: 'Structured racing jackets, pit-wall windbreakers, heavyweight hoodies, cargos, and polos.',
              img: '/src/assets/images/product_paddock_jacket_1795087933898.jpg',
            },
            {
              gender: 'FEMALE',
              title: 'Female Collection',
              desc: 'Cropped racing jackets, fitted motorsport tracksuits, belted jumpsuits, and tailored tees.',
              img: '/src/assets/images/product_womens_racing_jacket_1795088860304.jpg',
            },
            {
              gender: 'UNISEX',
              title: 'Unisex & Equipment',
              desc: 'Boxy graphic tees, crewnecks, headwear, Cordura backpacks, chronographs, and scale models.',
              img: '/src/assets/images/product_telemetry_tee_1795087933704.jpg',
            },
          ].map((g) => (
            <button
              key={g.gender}
              type="button"
              onClick={() => navigate(`/shop?gender=${g.gender}`)}
              className="group text-left bg-[#181A1D] border border-[#27272A] hover:border-[#EF2929] transition-colors flex flex-col"
            >
              <div className="aspect-[16/9] bg-[#090A0B] border-b border-[#27272A] overflow-hidden">
                <img
                  src={g.img}
                  alt={g.title}
                  referrerPolicy="no-referrer"
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                />
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-display text-2xl text-white uppercase group-hover:text-[#EF2929] transition-colors">
                    {g.title}
                  </h3>
                  <p className="text-xs text-[#C6C6C7] mt-1.5 leading-relaxed">{g.desc}</p>
                </div>
                <span className="mt-4 inline-flex items-center gap-1.5 font-mono-tabular text-xs uppercase text-white">
                  <span>Browse {g.gender.toLowerCase()}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Featured Capsules / Collections */}
      <section className="space-y-5 pt-6 border-t border-[#27272A]">
        <div>
          <p className="font-mono-tabular text-xs uppercase tracking-widest text-[#71717A]">
            Seasonal Drops
          </p>
          <h2 className="font-display text-3xl text-white uppercase mt-1">All Collections</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {collections.map((col) => (
            <button
              key={col.id}
              type="button"
              onClick={() => navigate(`/shop?collection=${col.slug}`)}
              className="group text-left bg-[#181A1D] border border-[#27272A] hover:border-[#EF2929] transition-colors flex flex-col"
            >
              {col.hero_image && (
                <div className="aspect-[16/9] bg-[#090A0B] border-b border-[#27272A] overflow-hidden">
                  <img
                    src={col.hero_image}
                    alt={col.name}
                    referrerPolicy="no-referrer"
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                </div>
              )}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-display text-2xl text-white uppercase group-hover:text-[#EF2929] transition-colors">
                    {col.name}
                  </h3>
                  <p className="text-xs text-[#C6C6C7] mt-1.5 line-clamp-2">{col.description}</p>
                </div>
                <span className="mt-4 inline-flex items-center gap-1.5 font-mono-tabular text-xs uppercase text-white">
                  <span>Open Collection</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* All Categories Grouped — Clicking opens dedicated /category/:slug page */}
      <section className="space-y-10 pt-6 border-t border-[#27272A]">
        <div>
          <p className="font-mono-tabular text-xs uppercase tracking-widest text-[#EF2929]">
            Complete Taxonomy
          </p>
          <h2 className="font-display text-3xl md:text-4xl text-white uppercase mt-1">
            All Categories
          </h2>
        </div>

        {groups.map((grp) => {
          const items = categories.filter((c) => c.group_name === grp.key);
          return (
            <div key={grp.key} className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-[#27272A] pb-3">
                <h3 className="font-display text-2xl text-white uppercase">{grp.title}</h3>
                <p className="text-xs text-[#71717A]">{grp.subtitle}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {items.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => navigate(`/category/${cat.slug}`)}
                    className="group text-left p-4 bg-[#181A1D] border border-[#27272A] hover:border-[#EF2929] transition-colors flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white group-hover:text-[#EF2929] transition-colors truncate">
                        {cat.name}
                      </p>
                      <p className="font-mono-tabular text-[11px] text-[#71717A] mt-0.5">
                        {cat.product_count ?? 0} {(cat.product_count ?? 0) === 1 ? 'item' : 'items'}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[#71717A] group-hover:text-white shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}
