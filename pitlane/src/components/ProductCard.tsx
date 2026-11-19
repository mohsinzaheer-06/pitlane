import {useState} from 'react';
import {Heart} from 'lucide-react';
import type {Product} from '../types';
import {useApp} from '../context/AppContext';

export function ProductCard({product}: {product: Product}) {
  const {navigate, formatPrice, wishlistIds, toggleWishlist} = useApp();
  const [imgError, setImgError] = useState(false);

  const primaryImg = product.images?.[0]?.url || '';
  const isWishlisted = wishlistIds.includes(product.id);
  const inStock = product.total_stock > 0;
  const hasDiscount = product.discount_percent > 0;

  return (
    <article className="group flex flex-col bg-[#181A1D] border border-[#27272A] hover:border-[#EF2929] transition-colors duration-150">
      <div className="relative aspect-[4/3] bg-[#090A0B] overflow-hidden border-b border-[#27272A]">
        <button
          type="button"
          onClick={() => navigate(`/product/${product.slug}`)}
          className="block w-full h-full text-left focus-visible:outline-none"
          aria-label={`View ${product.name}`}
        >
          {primaryImg && !imgError ? (
            <img
              src={primaryImg}
              alt={product.images?.[0]?.alt_text || product.name}
              referrerPolicy="no-referrer"
              loading="lazy"
              onError={() => setImgError(true)}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#181A1D] to-[#090A0B] px-4 text-center">
              <span className="font-display text-2xl text-white/30 uppercase tracking-wider">
                PITLANE
              </span>
              <span className="font-mono-tabular text-xs text-[#71717A] mt-1">{product.sku_prefix}</span>
            </div>
          )}
        </button>

        {product.is_limited_edition === 1 && (
          <span className="absolute top-3 left-3 bg-[#EF2929] text-white font-mono-tabular text-[11px] font-semibold uppercase tracking-wider px-2 py-1">
            Limited Run
          </span>
        )}

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(product.id);
          }}
          aria-label={isWishlisted ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
          className="absolute top-3 right-3 w-10 h-10 flex items-center justify-center bg-[#111315]/85 border border-[#27272A] text-white hover:border-[#EF2929] transition-colors"
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-[#EF2929] text-[#EF2929]' : ''}`} />
        </button>
      </div>

      <div className="p-4 flex-1 flex flex-col justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#71717A] font-mono-tabular uppercase tracking-wider">
            <span className="truncate">{product.category_name}</span>
            <span aria-hidden="true">·</span>
            <span className="shrink-0 text-[#C6C6C7]">
              {product.gender === 'MALE' ? 'Male' : product.gender === 'FEMALE' ? 'Female' : 'Unisex'}
            </span>
            <span aria-hidden="true">·</span>
            <span className="truncate">{inStock ? 'In Stock' : 'Sold Out'}</span>
          </div>

          <button
            type="button"
            onClick={() => navigate(`/product/${product.slug}`)}
            className="mt-1.5 text-left text-[16px] font-semibold text-white group-hover:text-[#EF2929] transition-colors line-clamp-2"
          >
            {product.name}
          </button>
        </div>

        <div className="pt-2 border-t border-[#27272A] flex items-baseline justify-between gap-2">
          <div className="flex items-baseline gap-2 font-mono-tabular">
            <span className="text-[15px] font-semibold text-white">
              {formatPrice(product.effective_price_pkr)}
            </span>
            {hasDiscount && (
              <span className="text-xs text-[#71717A] line-through">
                {formatPrice(product.base_price_pkr)}
              </span>
            )}
          </div>
          <span className="text-xs font-mono-tabular text-[#71717A]">
            {product.variants?.length || 0} opt
          </span>
        </div>
      </div>
    </article>
  );
}
