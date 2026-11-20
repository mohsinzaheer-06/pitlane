import React, {useEffect, useMemo, useState} from 'react';
import {ArrowLeft, Heart, MessageCircle, Ruler, Star, X} from 'lucide-react';
import {useApp} from '../context/AppContext';
import type {Product, Review} from '../types';
import {ProductCard} from '../components/ProductCard';

export function ProductDetailPage({slug}: {slug: string}) {
  const {
    navigate,
    formatPrice,
    addToCart,
    wishlistIds,
    toggleWishlist,
    trackViewedProduct,
    recentlyViewed,
    buildWhatsAppUrl,
    showToast,
    user,
  } = useApp();

  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [qty, setQty] = useState(1);
  const [activeImgIdx, setActiveImgIdx] = useState(0);
  const [zoomPos, setZoomPos] = useState<{x: number; y: number} | null>(null);
  const [sizeChartOpen, setSizeChartOpen] = useState(false);

  // Review form
  const [revName, setRevName] = useState(user?.name || '');
  const [revCity, setRevCity] = useState('');
  const [revRating, setRevRating] = useState(5);
  const [revTitle, setRevTitle] = useState('');
  const [revComment, setRevComment] = useState('');
  const [revSubmitting, setRevSubmitting] = useState(false);

  useEffect(() => {
    if (user?.name && !revName) {
      setRevName(user.name);
    }
  }, [user, revName]);

  useEffect(() => {
    if (!sizeChartOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSizeChartOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [sizeChartOpen]);

  useEffect(() => {
    setLoading(true);
    setActiveImgIdx(0);
    setQty(1);
    setZoomPos(null);
    setSizeChartOpen(false);
    fetch(`/api/products/${slug}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Not found'))))
      .then((d) => {
        const prod: Product = d.product;
        setProduct(prod);
        document.title = `${prod.name} | PITLANE`;
        setReviews(d.reviews || []);
        setRelated(d.related || []);
        if (prod.variants?.length > 0) {
          const firstInStock = prod.variants.find((v) => v.stock_qty > 0) || prod.variants[0];
          setSelectedColor(firstInStock.color_name);
          setSelectedSize(firstInStock.size);
        }
        trackViewedProduct({
          id: prod.id,
          slug: prod.slug,
          name: prod.name,
          imageUrl: prod.images?.[0]?.url || '',
          pricePkr: prod.effective_price_pkr,
        });
      })
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [slug, trackViewedProduct]);

  const colors = useMemo(() => {
    if (!product) return [];
    const seen = new Map<string, string>();
    for (const v of product.variants) {
      if (!seen.has(v.color_name)) seen.set(v.color_name, v.color_hex);
    }
    return Array.from(seen.entries()).map(([name, hex]) => ({name, hex}));
  }, [product]);

  const sizesForColor = useMemo(() => {
    if (!product) return [];
    return product.variants.filter((v) => v.color_name === selectedColor);
  }, [product, selectedColor]);

  const activeVariant = useMemo(() => {
    if (!product) return null;
    return (
      product.variants.find((v) => v.color_name === selectedColor && v.size === selectedSize) ||
      sizesForColor[0] ||
      product.variants[0] ||
      null
    );
  }, [product, selectedColor, selectedSize, sizesForColor]);

  const unitPricePkr = useMemo(() => {
    if (!product) return 0;
    const raw = activeVariant?.price_override_pkr ?? product.base_price_pkr;
    return product.discount_percent > 0
      ? Math.round(raw * (1 - product.discount_percent / 100))
      : raw;
  }, [product, activeVariant]);

  if (loading) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 md:px-10 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-7 aspect-[4/3] bg-[#181A1D] animate-pulse" />
          <div className="lg:col-span-5 h-[520px] bg-[#181A1D] animate-pulse" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 md:px-10 py-20 text-center">
        <h1 className="font-display text-4xl text-white uppercase">Product Not Found</h1>
        <button
          type="button"
          onClick={() => navigate('/shop')}
          className="mt-6 h-11 px-6 bg-[#EF2929] text-white font-mono-tabular text-xs uppercase"
        >
          Back to Shop
        </button>
      </div>
    );
  }

  const activeImg = product.images?.[activeImgIdx] || product.images?.[0];
  const isWishlisted = wishlistIds.includes(product.id);
  const inStock = (activeVariant?.stock_qty ?? 0) > 0;
  const productUrl = `${window.location.origin}/product/${product.slug}`;
  const whatsappEnquiryMsg = `Hello PITLANE! I'm interested in the ${product.name} (SKU: ${
    activeVariant?.sku || product.sku_prefix
  }), size ${activeVariant?.size || 'Standard'}, colour ${
    activeVariant?.color_name || 'Default'
  }. Is it available? ${productUrl}`;

  const handleAddToCart = () => {
    if (!activeVariant || activeVariant.stock_qty <= 0) return;
    addToCart({
      productId: product.id,
      variantId: activeVariant.id,
      slug: product.slug,
      name: product.name,
      sku: activeVariant.sku,
      size: activeVariant.size,
      colorName: activeVariant.color_name,
      imageUrl: product.images?.[0]?.url || '',
      unitPricePkr,
      quantity: qty,
      maxStock: activeVariant.stock_qty,
    });
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRevSubmitting(true);
    try {
      const res = await fetch(`/api/products/${product.id}/reviews`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          authorName: revName,
          authorCity: revCity,
          rating: revRating,
          title: revTitle,
          comment: revComment,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setReviews((prev) => [data.review, ...prev]);
        setRevTitle('');
        setRevComment('');
        showToast('Thank you — review published.');
      } else {
        showToast(data.error || 'Unable to submit review.');
      }
    } finally {
      setRevSubmitting(false);
    }
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 md:px-10 py-8 md:py-12">
      {/* Breadcrumb */}
      <div className="flex flex-wrap items-center gap-2 text-xs font-mono-tabular text-[#71717A] mb-6">
        <button
          type="button"
          onClick={() => navigate('/shop')}
          className="min-h-[36px] inline-flex items-center gap-1.5 text-white hover:text-[#EF2929]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Shop</span>
        </button>
        <span>/</span>
        <button
          type="button"
          onClick={() => navigate(`/category/${product.category_slug}`)}
          className="min-h-[36px] inline-flex items-center hover:text-white"
        >
          {product.category_name}
        </button>
        <span>/</span>
        <span className="text-[#C6C6C7] truncate max-w-full">{product.name}</span>
      </div>

      {/* Main Split: Gallery Left + Sticky Purchase Module Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Gallery */}
        <div className="lg:col-span-7 space-y-3">
          <div
            className="relative aspect-[4/3] bg-[#090A0B] border border-[#27272A] overflow-hidden cursor-crosshair"
            onClick={() => setZoomPos((prev) => (prev ? null : {x: 50, y: 50}))}
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = ((e.clientX - rect.left) / rect.width) * 100;
              const y = ((e.clientY - rect.top) / rect.height) * 100;
              setZoomPos({x, y});
            }}
            onMouseLeave={() => setZoomPos(null)}
          >
            {activeImg ? (
              <img
                src={activeImg.url}
                alt={activeImg.alt_text}
                referrerPolicy="no-referrer"
                decoding="async"
                style={
                  zoomPos
                    ? {
                        transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                        transform: 'scale(1.65)',
                      }
                    : undefined
                }
                className="w-full h-full object-cover transition-transform duration-150"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-display text-3xl text-white/30">
                PITLANE
              </div>
            )}
            <span className="absolute bottom-3 right-3 bg-[#111315]/90 border border-[#27272A] px-2.5 py-1 text-[11px] font-mono-tabular text-[#C6C6C7]">
              {zoomPos ? 'Tap / Leave to Reset' : 'Hover or Tap to Inspect'}
            </span>
          </div>

          {product.images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-1">
              {product.images.map((img, idx) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => setActiveImgIdx(idx)}
                  className={`w-24 aspect-[4/3] bg-[#090A0B] border shrink-0 overflow-hidden ${
                    idx === activeImgIdx ? 'border-[#EF2929]' : 'border-[#27272A]'
                  }`}
                >
                  <img
                    src={img.url}
                    alt={img.alt_text}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Contiguous Sticky Purchase Module */}
        <div className="lg:col-span-5 lg:sticky lg:top-24 bg-[#181A1D] border border-[#27272A] p-4 sm:p-6 md:p-8 space-y-6">
          <div>
            <div className="flex items-center justify-between gap-2 text-xs font-mono-tabular uppercase text-[#71717A]">
              <span>
                {product.collection_name || product.category_name} ·{' '}
                {product.gender === 'MALE' ? 'Male' : product.gender === 'FEMALE' ? 'Female' : 'Unisex'}
                {product.edition_run ? ` · ${product.edition_run}` : ''}
              </span>
              <span>SKU: {activeVariant?.sku || product.sku_prefix}</span>
            </div>
            <h1 className="font-display text-3xl md:text-4xl text-white uppercase mt-2 leading-tight">
              {product.name}
            </h1>

            <div className="mt-3 flex items-center justify-between gap-4">
              <div className="flex items-baseline gap-3 font-mono-tabular">
                <span className="text-2xl font-semibold text-white">{formatPrice(unitPricePkr)}</span>
                {product.discount_percent > 0 && (
                  <>
                    <span className="text-sm text-[#71717A] line-through">
                      {formatPrice(activeVariant?.price_override_pkr ?? product.base_price_pkr)}
                    </span>
                    <span className="text-xs font-semibold text-[#EF2929]">
                      -{product.discount_percent}%
                    </span>
                  </>
                )}
              </div>

              {reviews.length > 0 && (
                <div className="flex items-center gap-1.5 text-xs font-mono-tabular text-white">
                  <Star className="w-3.5 h-3.5 fill-[#EF2929] text-[#EF2929]" />
                  <span>{product.avg_rating || 5.0}</span>
                  <span className="text-[#71717A]">({reviews.length})</span>
                </div>
              )}
            </div>
          </div>

          <p className="text-sm text-[#C6C6C7] leading-relaxed">{product.description}</p>

          {/* Colour Selector */}
          <div>
            <p className="font-mono-tabular text-xs uppercase text-[#71717A] mb-2">
              Colour: <span className="text-white">{selectedColor}</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {colors.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => {
                    setSelectedColor(c.name);
                    const match = product.variants.find((v) => v.color_name === c.name && v.size === selectedSize);
                    if (!match) {
                      const first = product.variants.find((v) => v.color_name === c.name);
                      if (first) setSelectedSize(first.size);
                    }
                  }}
                  className={`h-10 px-3 flex items-center gap-2 border text-xs font-mono-tabular transition-colors ${
                    selectedColor === c.name
                      ? 'border-white bg-[#111315] text-white'
                      : 'border-[#27272A] bg-[#090A0B] text-[#C6C6C7] hover:border-white'
                  }`}
                >
                  <span
                    className="w-3.5 h-3.5 border border-white/25"
                    style={{backgroundColor: c.hex}}
                    aria-hidden="true"
                  />
                  <span>{c.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Size Selector + Size Chart */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="font-mono-tabular text-xs uppercase text-[#71717A]">
                Size / Scale: <span className="text-white">{activeVariant?.size}</span>
              </p>
              <button
                type="button"
                onClick={() => setSizeChartOpen(true)}
                className="inline-flex items-center gap-1.5 text-xs font-mono-tabular uppercase text-[#C6C6C7] hover:text-white"
              >
                <Ruler className="w-3.5 h-3.5" />
                <span>Size Chart</span>
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {sizesForColor.map((v) => {
                const selected = v.id === activeVariant?.id;
                const available = v.stock_qty > 0;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => {
                      setSelectedSize(v.size);
                      setQty(1);
                    }}
                    className={`min-w-[54px] h-11 px-3 border font-mono-tabular text-xs font-semibold uppercase transition-colors ${
                      selected
                        ? 'bg-white text-[#111315] border-white'
                        : available
                          ? 'bg-[#090A0B] text-white border-[#27272A] hover:border-white'
                          : 'bg-[#090A0B] text-[#71717A] border-[#27272A] line-through'
                    }`}
                  >
                    {v.size}
                  </button>
                );
              })}
            </div>
            <p className="mt-2 font-mono-tabular text-xs text-[#C6C6C7]">
              {inStock
                ? `${activeVariant?.stock_qty} units in stock · Ready to ship`
                : 'Currently out of stock in this variant'}
            </p>
          </div>

          {/* Quantity + Add to Bag + Wishlist */}
          <div className="flex items-stretch gap-2">
            <div className="inline-flex items-center border border-[#27272A] bg-[#090A0B]">
              <button
                type="button"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                aria-label="Decrease quantity"
                className="w-11 h-12 text-white hover:bg-[#27272A]"
              >
                -
              </button>
              <span className="w-10 text-center font-mono-tabular text-sm text-white">{qty}</span>
              <button
                type="button"
                onClick={() => setQty((q) => Math.min(activeVariant?.stock_qty || 1, q + 1))}
                aria-label="Increase quantity"
                className="w-11 h-12 text-white hover:bg-[#27272A]"
              >
                +
              </button>
            </div>

            <button
              type="button"
              disabled={!inStock}
              onClick={handleAddToCart}
              className={`flex-1 h-12 font-mono-tabular text-xs font-semibold uppercase tracking-wider transition-colors ${
                inStock
                  ? 'bg-[#EF2929] hover:bg-white text-white hover:text-[#111315]'
                  : 'bg-[#27272A] text-[#71717A] cursor-not-allowed'
              }`}
            >
              {inStock ? 'Add to Bag' : 'Out of Stock'}
            </button>

            <button
              type="button"
              onClick={() => toggleWishlist(product.id)}
              aria-label="Save to wishlist"
              className="w-12 h-12 border border-[#27272A] hover:border-white flex items-center justify-center text-white"
            >
              <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-[#EF2929] text-[#EF2929]' : ''}`} />
            </button>
          </div>

          {/* Ask on WhatsApp CTA */}
          <a
            href={buildWhatsAppUrl(whatsappEnquiryMsg)}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full min-h-[44px] px-3 py-2.5 border border-[#27272A] hover:border-[#25D366] bg-[#111315] text-white flex items-center justify-center gap-2 font-mono-tabular text-xs uppercase tracking-wider text-center transition-colors"
          >
            <MessageCircle className="w-4 h-4 text-[#25D366] shrink-0" />
            <span>Ask on WhatsApp ({activeVariant?.size} · {activeVariant?.color_name})</span>
          </a>

          {/* Technical Material & Care Specs */}
          <div className="pt-4 border-t border-[#27272A] space-y-3 text-xs">
            <div>
              <p className="font-mono-tabular uppercase text-[#71717A]">Materials &amp; Construction</p>
              <p className="text-[#C6C6C7] mt-1">{product.material_info}</p>
            </div>
            <div>
              <p className="font-mono-tabular uppercase text-[#71717A]">Fit Profile</p>
              <p className="text-[#C6C6C7] mt-1">{product.fit_notes}</p>
            </div>
            <div>
              <p className="font-mono-tabular uppercase text-[#71717A]">Care Instructions</p>
              <p className="text-[#C6C6C7] mt-1">{product.washing_instructions}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Reviews + Review Form */}
      <section className="mt-16 pt-12 border-t border-[#27272A] grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-7 space-y-4">
          <h2 className="font-display text-3xl text-white uppercase">
            Customer Reviews ({reviews.length})
          </h2>
          {reviews.length === 0 ? (
            <p className="text-sm text-[#71717A]">No reviews yet. Be the first to review this piece.</p>
          ) : (
            <div className="space-y-4">
              {reviews.map((r) => (
                <div key={r.id} className="bg-[#181A1D] border border-[#27272A] p-5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1 text-[#EF2929]">
                      {Array.from({length: r.rating}).map((_, idx) => (
                        <Star key={idx} className="w-3.5 h-3.5 fill-current" />
                      ))}
                    </div>
                    <span className="font-mono-tabular text-[11px] text-[#71717A]">
                      {r.verified_purchase ? 'Verified Buyer · ' : ''}
                      {new Date(r.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-white mt-2">{r.title}</h3>
                  <p className="text-xs text-[#C6C6C7] mt-1.5 leading-relaxed">{r.comment}</p>
                  <p className="font-mono-tabular text-[11px] text-[#71717A] mt-3">
                    {r.author_name} {r.author_city ? `· ${r.author_city}` : ''}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <form
          onSubmit={handleReviewSubmit}
          className="lg:col-span-5 bg-[#181A1D] border border-[#27272A] p-4 sm:p-6 space-y-4 self-start"
        >
          <h3 className="font-display text-2xl text-white uppercase">Write a Review</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="review-name" className="sr-only">
                Your Name
              </label>
              <input
                id="review-name"
                type="text"
                required
                value={revName}
                onChange={(e) => setRevName(e.target.value)}
                placeholder="Your Name"
                className="w-full h-11 px-3 bg-[#090A0B] border border-[#27272A] text-sm text-white"
              />
            </div>
            <div>
              <label htmlFor="review-city" className="sr-only">
                City
              </label>
              <input
                id="review-city"
                type="text"
                value={revCity}
                onChange={(e) => setRevCity(e.target.value)}
                placeholder="City (e.g. Lahore)"
                className="w-full h-11 px-3 bg-[#090A0B] border border-[#27272A] text-sm text-white"
              />
            </div>
          </div>
          <div>
            <label htmlFor="review-rating" className="block font-mono-tabular text-xs uppercase text-[#71717A] mb-1.5">
              Rating
            </label>
            <select
              id="review-rating"
              value={revRating}
              onChange={(e) => setRevRating(Number(e.target.value))}
              className="w-full h-11 px-3 bg-[#090A0B] border border-[#27272A] text-sm text-white"
            >
              <option value={5}>5 Stars — Exceptional</option>
              <option value={4}>4 Stars — Solid</option>
              <option value={3}>3 Stars — Good</option>
              <option value={2}>2 Stars — Fair</option>
              <option value={1}>1 Star — Poor</option>
            </select>
          </div>
          <div>
            <label htmlFor="review-title" className="sr-only">
              Review Headline
            </label>
            <input
              id="review-title"
              type="text"
              required
              value={revTitle}
              onChange={(e) => setRevTitle(e.target.value)}
              placeholder="Headline"
              className="w-full h-11 px-3 bg-[#090A0B] border border-[#27272A] text-sm text-white"
            />
          </div>
          <div>
            <label htmlFor="review-comment" className="sr-only">
              Review Details
            </label>
            <textarea
              id="review-comment"
              required
              rows={3}
              value={revComment}
              onChange={(e) => setRevComment(e.target.value)}
              placeholder="Share fit, fabric weight, and delivery experience..."
              className="w-full p-3 bg-[#090A0B] border border-[#27272A] text-sm text-white"
            />
          </div>
          <button
            type="submit"
            disabled={revSubmitting}
            className="w-full min-h-[44px] bg-[#EF2929] hover:bg-white text-white hover:text-[#111315] font-mono-tabular text-xs font-semibold uppercase tracking-wider transition-colors"
          >
            {revSubmitting ? 'Publishing...' : 'Submit Review'}
          </button>
        </form>
      </section>

      {/* Related Products */}
      {related.length > 0 && (
        <section className="mt-16 pt-12 border-t border-[#27272A]">
          <h2 className="font-display text-3xl text-white uppercase mb-6">Related Equipment</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Recently Viewed */}
      {recentlyViewed.length > 1 && (
        <section className="mt-14 pt-10 border-t border-[#27272A]">
          <h2 className="font-mono-tabular text-xs uppercase tracking-widest text-[#71717A] mb-4">
            Recently Viewed
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
            {recentlyViewed
              .filter((v) => v.slug !== product.slug)
              .slice(0, 5)
              .map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => navigate(`/product/${v.slug}`)}
                  className="text-left bg-[#181A1D] border border-[#27272A] hover:border-white p-2"
                >
                  <img
                    src={v.imageUrl}
                    alt={v.name}
                    referrerPolicy="no-referrer"
                    className="aspect-[4/3] w-full object-cover bg-[#090A0B]"
                  />
                  <p className="text-xs font-medium text-white mt-2 truncate">{v.name}</p>
                  <p className="font-mono-tabular text-[11px] text-[#71717A]">{formatPrice(v.pricePkr)}</p>
                </button>
              ))}
          </div>
        </section>
      )}

      {/* Size Chart Modal */}
      {sizeChartOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Garment size chart">
          <div className="fixed inset-0 bg-black/80" onClick={() => setSizeChartOpen(false)} />
          <div className="relative z-10 w-full max-w-lg bg-[#181A1D] border border-[#27272A] p-4 sm:p-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#27272A]">
              <h3 className="font-display text-xl sm:text-2xl text-white uppercase">PITLANE Garment Size Chart (Inches)</h3>
              <button
                type="button"
                onClick={() => setSizeChartOpen(false)}
                aria-label="Close size chart"
                className="min-w-[44px] min-h-[44px] flex items-center justify-center text-white shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left font-mono-tabular text-xs">
                <thead>
                  <tr className="border-b border-[#27272A] text-[#71717A]">
                    <th className="py-2 pr-4">Size</th>
                    <th className="py-2 pr-4">Chest (in)</th>
                    <th className="py-2 pr-4">Length (in)</th>
                    <th className="py-2">Shoulder (in)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#27272A] text-white">
                  {[
                    ['S', '42', '27', '20.5'],
                    ['M', '44', '28', '21.5'],
                    ['L', '46', '29', '22.5'],
                    ['XL', '48.5', '30', '23.5'],
                  ].map((row) => (
                    <tr key={row[0]}>
                      <td className="py-2.5 pr-4 font-semibold text-[#EF2929]">{row[0]}</td>
                      <td className="py-2.5 pr-4">{row[1]}</td>
                      <td className="py-2.5 pr-4">{row[2]}</td>
                      <td className="py-2.5">{row[3]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
