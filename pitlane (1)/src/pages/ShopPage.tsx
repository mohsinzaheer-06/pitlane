import {useEffect, useMemo, useState} from 'react';
import {ArrowLeft, SlidersHorizontal, X} from 'lucide-react';
import {useApp} from '../context/AppContext';
import type {Product} from '../types';
import {ProductCard} from '../components/ProductCard';

export function ShopPage({categorySlug}: {categorySlug?: string}) {
  const {route, navigate, bootstrap} = useApp();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const queryParams = useMemo(() => {
    const qStr = route.includes('?') ? route.split('?')[1] : '';
    return new URLSearchParams(qStr);
  }, [route]);

  const [search, setSearch] = useState(() => queryParams.get('search') || '');
  const [group, setGroup] = useState(() => queryParams.get('group') || '');
  const [category, setCategory] = useState(() => categorySlug || queryParams.get('category') || '');
  const [collection, setCollection] = useState(() => queryParams.get('collection') || '');
  const [gender, setGender] = useState(() => queryParams.get('gender') || '');
  const [size, setSize] = useState(() => queryParams.get('size') || '');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [inStock, setInStock] = useState(false);
  const [sort, setSort] = useState('featured');

  useEffect(() => {
    setSearch(queryParams.get('search') || '');
    setGroup(queryParams.get('group') || '');
    setCategory(categorySlug || queryParams.get('category') || '');
    setCollection(queryParams.get('collection') || '');
    setGender(queryParams.get('gender') || '');
    setSize(queryParams.get('size') || '');
  }, [queryParams, categorySlug]);

  useEffect(() => {
    if (!mobileFiltersOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileFiltersOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [mobileFiltersOpen]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    if (group) params.set('group', group);
    if (category) params.set('category', category);
    if (collection) params.set('collection', collection);
    if (gender) params.set('gender', gender);
    if (size) params.set('size', size);
    if (minPrice.trim()) params.set('minPrice', minPrice.trim());
    if (maxPrice.trim()) params.set('maxPrice', maxPrice.trim());
    if (inStock) params.set('inStock', '1');
    if (sort) params.set('sort', sort);

    fetch(`/api/products?${params.toString()}`, {signal: controller.signal})
      .then((r) => r.json())
      .then((d) => setProducts(d.products || []))
      .catch((err) => {
        if (err?.name !== 'AbortError') {
          setProducts([]);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [search, group, category, collection, gender, size, minPrice, maxPrice, inStock, sort]);

  const categories = bootstrap?.categories || [];
  const collections = bootstrap?.collections || [];
  const filteredCats = group ? categories.filter((c) => c.group_name === group) : categories;

  const activeCategoryObj = categories.find((c) => c.slug === category);
  const activeCollectionObj = collections.find((c) => c.slug === collection);

  const resetFilters = () => {
    setSearch('');
    setGroup('');
    setCategory('');
    setCollection('');
    setGender('');
    setSize('');
    setMinPrice('');
    setMaxPrice('');
    setInStock(false);
    setSort('featured');
    navigate('/shop');
  };

  const renderFilterPanel = (idPrefix: string) => (
    <div className="space-y-6">
      <div>
        <label htmlFor={`${idPrefix}-search`} className="block font-mono-tabular text-xs uppercase text-[#71717A] mb-2">
          Search Catalogue
        </label>
        <input
          id={`${idPrefix}-search`}
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Jacket, hoodie, 1:18..."
          className="w-full h-11 px-3 bg-[#090A0B] border border-[#27272A] text-sm text-white placeholder-[#71717A] focus:border-white"
        />
      </div>

      <div>
        <p className="font-mono-tabular text-xs uppercase text-[#71717A] mb-2">Gender Fit</p>
        <div className="grid grid-cols-2 gap-1.5">
          {[
            {val: '', label: 'All'},
            {val: 'MALE', label: 'Male'},
            {val: 'FEMALE', label: 'Female'},
            {val: 'UNISEX', label: 'Unisex'},
          ].map((g) => (
            <button
              key={g.val || 'ALL_G'}
              type="button"
              onClick={() => setGender(g.val)}
              className={`min-h-[44px] px-2 text-xs font-mono-tabular uppercase border transition-colors ${
                gender === g.val
                  ? 'bg-[#EF2929] text-white border-[#EF2929] font-semibold'
                  : 'bg-[#181A1D] text-[#C6C6C7] border-[#27272A] hover:border-white'
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="font-mono-tabular text-xs uppercase text-[#71717A] mb-2">Division</p>
        <div className="grid grid-cols-2 gap-1.5">
          {['', 'APPAREL', 'ACCESSORIES', 'COLLECTIBLES'].map((g) => (
            <button
              key={g || 'ALL'}
              type="button"
              onClick={() => {
                setGroup(g);
                if (categorySlug) {
                  navigate(g ? `/shop?group=${g}` : '/shop');
                } else {
                  setCategory('');
                }
              }}
              className={`min-h-[44px] px-2 text-xs font-mono-tabular uppercase border transition-colors ${
                group === g
                  ? 'bg-white text-[#111315] border-white font-semibold'
                  : 'bg-[#181A1D] text-[#C6C6C7] border-[#27272A] hover:border-white'
              }`}
            >
              {g || 'All'}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor={`${idPrefix}-category`} className="block font-mono-tabular text-xs uppercase text-[#71717A] mb-2">
          Category
        </label>
        <select
          id={`${idPrefix}-category`}
          value={category}
          onChange={(e) => {
            const val = e.target.value;
            if (val) {
              navigate(`/category/${val}`);
            } else {
              navigate('/shop');
            }
          }}
          className="w-full h-11 px-3 bg-[#090A0B] border border-[#27272A] text-sm text-white"
        >
          <option value="">All Categories</option>
          {filteredCats.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor={`${idPrefix}-collection`} className="block font-mono-tabular text-xs uppercase text-[#71717A] mb-2">
          Collection
        </label>
        <select
          id={`${idPrefix}-collection`}
          value={collection}
          onChange={(e) => setCollection(e.target.value)}
          className="w-full h-11 px-3 bg-[#090A0B] border border-[#27272A] text-sm text-white"
        >
          <option value="">All Collections</option>
          {collections.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <p className="font-mono-tabular text-xs uppercase text-[#71717A] mb-2">Price Range (PKR)</p>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label htmlFor={`${idPrefix}-min-price`} className="sr-only">
              Minimum price PKR
            </label>
            <input
              id={`${idPrefix}-min-price`}
              type="number"
              min={0}
              step={500}
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              placeholder="Min PKR"
              className="w-full h-11 px-3 bg-[#090A0B] border border-[#27272A] text-xs font-mono-tabular text-white placeholder-[#71717A]"
            />
          </div>
          <div>
            <label htmlFor={`${idPrefix}-max-price`} className="sr-only">
              Maximum price PKR
            </label>
            <input
              id={`${idPrefix}-max-price`}
              type="number"
              min={0}
              step={500}
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              placeholder="Max PKR"
              className="w-full h-11 px-3 bg-[#090A0B] border border-[#27272A] text-xs font-mono-tabular text-white placeholder-[#71717A]"
            />
          </div>
        </div>
      </div>

      <div>
        <p className="font-mono-tabular text-xs uppercase text-[#71717A] mb-2">Size / Scale</p>
        <div className="flex flex-wrap gap-1.5">
          {['', 'XS', 'S', 'M', 'L', 'XL', 'OS', '1:18', '1:43'].map((s) => (
            <button
              key={s || 'ANY'}
              type="button"
              onClick={() => setSize(s)}
              className={`min-w-[44px] min-h-[44px] px-2.5 text-xs font-mono-tabular border transition-colors ${
                size === s
                  ? 'bg-[#EF2929] text-white border-[#EF2929] font-semibold'
                  : 'bg-[#181A1D] text-[#C6C6C7] border-[#27272A] hover:border-white'
              }`}
            >
              {s || 'Any'}
            </button>
          ))}
        </div>
      </div>

      <label className="min-h-[44px] flex items-center gap-2.5 cursor-pointer text-sm text-white">
        <input
          type="checkbox"
          checked={inStock}
          onChange={(e) => setInStock(e.target.checked)}
          className="w-4 h-4 accent-[#EF2929]"
        />
        <span>In-stock items only</span>
      </label>

      <button
        type="button"
        onClick={resetFilters}
        className="w-full min-h-[44px] border border-[#27272A] hover:border-white text-xs font-mono-tabular uppercase text-[#C6C6C7] hover:text-white transition-colors"
      >
        Reset All Filters
      </button>
    </div>
  );

  const pageTitle = activeCategoryObj
    ? activeCategoryObj.name
    : activeCollectionObj
      ? activeCollectionObj.name
      : gender
        ? `${gender === 'MALE' ? 'Male' : gender === 'FEMALE' ? 'Female' : 'Unisex'} Division`
        : group
          ? `${group} Division`
          : 'Full Catalogue';

  return (
    <div className="max-w-[1440px] mx-auto px-4 md:px-10 py-10">
      {/* Breadcrumb when viewing a dedicated category or collection */}
      {(activeCategoryObj || activeCollectionObj || gender) && (
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono-tabular text-[#71717A] mb-5">
          <button
            type="button"
            onClick={() => navigate('/collections')}
            className="min-h-[36px] inline-flex items-center gap-1.5 text-white hover:text-[#EF2929]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Collections &amp; Categories</span>
          </button>
          <span>/</span>
          <span className="text-[#EF2929] uppercase">{pageTitle}</span>
        </div>
      )}

      {/* Catalog Header & Gender Quick Bar + Sort */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 pb-6 border-b border-[#27272A]">
        <div className="min-w-0">
          <p className="font-mono-tabular text-xs uppercase tracking-widest text-[#71717A]">
            PITLANE Storefront · {products.length} {products.length === 1 ? 'Product' : 'Products'}
          </p>
          <h1 className="font-display text-3xl md:text-5xl text-white uppercase mt-1">{pageTitle}</h1>
          {activeCollectionObj?.description && (
            <p className="text-sm text-[#C6C6C7] mt-2 max-w-2xl">{activeCollectionObj.description}</p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          {/* Quick Gender Toggle */}
          <div className="flex flex-wrap items-center bg-[#090A0B] border border-[#27272A] p-1 w-full sm:w-auto">
            {[
              {val: '', label: 'All'},
              {val: 'MALE', label: 'Male'},
              {val: 'FEMALE', label: 'Female'},
              {val: 'UNISEX', label: 'Unisex'},
            ].map((g) => (
              <button
                key={g.val || 'TOP_ALL'}
                type="button"
                onClick={() => setGender(g.val)}
                className={`flex-1 sm:flex-none min-h-[40px] px-3 py-1.5 text-xs font-mono-tabular uppercase transition-colors ${
                  gender === g.val
                    ? 'bg-[#EF2929] text-white font-semibold'
                    : 'text-[#C6C6C7] hover:text-white'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setMobileFiltersOpen(true)}
            className="lg:hidden min-h-[44px] px-4 bg-[#181A1D] border border-[#27272A] text-white text-xs font-mono-tabular uppercase flex items-center gap-2"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filters</span>
          </button>

          <label htmlFor="shop-sort" className="sr-only">
            Sort products
          </label>
          <select
            id="shop-sort"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="flex-1 sm:flex-none min-w-0 h-11 px-3 bg-[#181A1D] border border-[#27272A] text-xs font-mono-tabular text-white"
          >
            <option value="featured">Sort: Featured</option>
            <option value="newest">Sort: New Arrivals</option>
            <option value="bestseller">Sort: Bestsellers</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
        </div>
      </div>

      {/* Main Grid + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-8">
        <aside className="hidden lg:block lg:col-span-3 border-r border-[#27272A] pr-6">
          {renderFilterPanel('desktop')}
        </aside>

        <div className="lg:col-span-9 min-w-0">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="h-96 bg-[#181A1D] border border-[#27272A] animate-pulse" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="bg-[#181A1D] border border-[#27272A] p-8 sm:p-12 text-center">
              <p className="font-display text-2xl text-white uppercase">No Matching Gear Found</p>
              <p className="text-sm text-[#71717A] mt-2">
                Adjust your active filters or explore all categories in the Collections directory.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={resetFilters}
                  className="min-h-[44px] px-6 bg-[#EF2929] text-white font-mono-tabular text-xs font-semibold uppercase"
                >
                  View Full Catalogue
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/collections')}
                  className="min-h-[44px] px-6 border border-white text-white font-mono-tabular text-xs uppercase"
                >
                  All Categories
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      {mobileFiltersOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden flex"
          role="dialog"
          aria-modal="true"
          aria-label="Filter catalogue"
        >
          <div
            className="fixed inset-0 bg-black/80"
            onClick={() => setMobileFiltersOpen(false)}
            aria-hidden="true"
          />
          <div className="relative z-10 w-80 max-w-[90vw] bg-[#111315] border-r border-[#27272A] flex flex-col h-full">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#27272A]">
              <h2 className="font-display text-xl text-white uppercase">Filter Catalogue</h2>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                aria-label="Close filters"
                className="min-w-[44px] min-h-[44px] flex items-center justify-center text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">{renderFilterPanel('mobile')}</div>
            <div className="p-4 border-t border-[#27272A] bg-[#090A0B]">
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="w-full min-h-[44px] bg-[#EF2929] text-white font-mono-tabular text-xs font-semibold uppercase"
              >
                Show {products.length} {products.length === 1 ? 'Product' : 'Products'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
