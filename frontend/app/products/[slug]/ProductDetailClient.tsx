'use client';

import { useState, useRef } from 'react';
import { Product } from '@/types';
import SizeSelector from '@/components/product-detail/SizeSelector';
import AddToCartButton from '@/components/product-detail/AddToCartButton';
import PurchaseModal from '@/components/product-detail/PurchaseModal';
import SizeGuideModal from '@/components/product-detail/SizeGuideModal';
import RestockNotify from '@/components/product-detail/RestockNotify';
import StickyCartBar from '@/components/product-detail/StickyCartBar';
import { formatPrice } from '@/lib/utils';
import { useWishlist } from '@/context/WishlistContext';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://snkrs-kart.vercel.app';

interface ProductDetailClientProps {
  product: Product;
}

export default function ProductDetailClient({ product }: ProductDetailClientProps) {
  const { toggle, isWishlisted } = useWishlist();
  const wishlisted = isWishlisted(product.slug);
  const [selectedSize, setSelectedSize] = useState<number | null>(null);
  const [showSizeError, setShowSizeError] = useState(false);
  const [currentPrice, setCurrentPrice] = useState(product.price);
  const [showModal, setShowModal] = useState(false);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [currentOriginalPrice, setCurrentOriginalPrice] = useState(product.originalPrice);
  const [shareState, setShareState] = useState<'idle' | 'copied'>('idle');
  const sizeSectionRef = useRef<HTMLDivElement>(null);
  const addToCartRef = useRef<HTMLDivElement>(null);

  const handleShare = async () => {
    const url = `${SITE_URL}/products/${product.slug}`;
    const title = `${product.brand} ${product.name}`;
    const text = `Check out the ${title} — ${formatPrice(currentPrice)} 🔥\n100% Authentic | Shop on SNKRS CART`;

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title, text, url });
      } catch {
        // user cancelled — do nothing
      }
    } else {
      await navigator.clipboard.writeText(url);
      setShareState('copied');
      setTimeout(() => setShareState('idle'), 2000);
    }
  };

  const hasVariants = (product.variants?.length ?? 0) > 0;

  const handleSizeSelect = (size: number) => {
    setSelectedSize(size);
    if (hasVariants) {
      const variant = product.variants!.find((v) => v.size === size);
      if (variant) {
        setCurrentPrice(variant.price);
        setCurrentOriginalPrice(variant.originalPrice);
      }
    }
  };

  const handleRequireSize = () => {
    setShowSizeError(true);
    sizeSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => setShowSizeError(false), 3000);
  };

  const discount = currentOriginalPrice
    ? Math.round(((currentOriginalPrice - currentPrice) / currentOriginalPrice) * 100)
    : null;

  const effectiveProduct = selectedSize && hasVariants
    ? { ...product, price: currentPrice, originalPrice: currentOriginalPrice }
    : product;

  return (
    <div className="space-y-6">
      {/* Price — dynamic based on selected size */}
      <div className="flex items-center justify-between gap-3 pb-6 border-b border-zinc-100">
        <div className="flex items-baseline gap-3">
          <span className="text-2xl font-bold text-zinc-900">{formatPrice(currentPrice)}</span>
          {currentOriginalPrice && currentOriginalPrice > currentPrice && (
            <>
              <span className="text-base text-zinc-400 line-through">{formatPrice(currentOriginalPrice)}</span>
              {discount && <span className="text-sm font-bold text-red-500">−{discount}%</span>}
            </>
          )}
          {hasVariants && !selectedSize && (
            <span className="text-xs text-zinc-400 ml-1">Select size for exact price</span>
          )}
        </div>
        <button
          type="button"
          onClick={handleShare}
          aria-label="Share product"
          className="flex items-center gap-1.5 px-3 py-2 border border-zinc-200 text-zinc-500 hover:border-zinc-900 hover:text-zinc-900 transition-colors text-xs font-semibold tracking-wider uppercase shrink-0"
        >
          {shareState === 'copied' ? (
            <>
              <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-emerald-500">Copied!</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Share
            </>
          )}
        </button>
      </div>

      {product.comingSoon ? (
        /* ── Coming soon layout ── */
        <div className="space-y-3">
          <div className="w-full py-4 bg-indigo-50 border border-indigo-200 text-center">
            <p className="text-sm font-bold tracking-widest uppercase text-indigo-700">Not yet available</p>
            <p className="text-xs text-indigo-500 mt-1">This drop hasn't landed yet. Save it or enquire below.</p>
          </div>
          <button
            type="button"
            onClick={() => toggle(product.slug)}
            className={`w-full py-3.5 border-2 text-sm font-bold tracking-widest uppercase transition-colors duration-200 flex items-center justify-center gap-2 ${
              wishlisted
                ? 'bg-red-500 border-red-500 text-white'
                : 'border-zinc-900 text-zinc-900 hover:bg-zinc-900 hover:text-white'
            }`}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} fill={wishlisted ? 'currentColor' : 'none'}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            {wishlisted ? 'Saved to Wishlist' : 'Save to Wishlist'}
          </button>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="w-full py-3.5 border-2 border-zinc-900 text-sm font-bold tracking-widest uppercase text-zinc-900 hover:bg-zinc-900 hover:text-white transition-colors duration-200"
          >
            Notify Me / Enquire
          </button>
        </div>
      ) : (
        /* ── Normal layout ── */
        <>
          {/* Size selector */}
          <div ref={sizeSectionRef}>
            <SizeSelector
              sizes={product.sizes}
              availableSizes={product.availableSizes}
              selectedSize={selectedSize}
              onSizeSelect={handleSizeSelect}
              showError={showSizeError}
              variants={product.variants}
              onSizeGuide={() => setShowSizeGuide(true)}
            />
          </div>

          {/* Add to cart */}
          <div ref={addToCartRef}>
            <AddToCartButton
              product={effectiveProduct}
              selectedSize={selectedSize}
              onRequireSize={handleRequireSize}
            />
          </div>

          {/* Restock notify — only if product is fully sold out */}
          {product.soldOut && (
            <RestockNotify productSlug={product.slug} selectedSize={selectedSize} />
          )}

          {/* Purchase inquiry CTA */}
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="w-full py-3.5 border-2 border-zinc-900 text-sm font-bold tracking-widest uppercase text-zinc-900 hover:bg-zinc-900 hover:text-white transition-colors duration-200"
          >
            Want to Purchase? — Enquire Now
          </button>
        </>
      )}

      {/* Trust badges */}
      <div className="grid grid-cols-3 gap-3 pt-2">
        {[
          { icon: '✓', text: '100% Authentic' },
          { icon: '↩', text: 'Easy Returns' },
          { icon: '🔒', text: 'Secure Checkout' },
        ].map((badge) => (
          <div key={badge.text} className="flex flex-col items-center text-center gap-1 p-3 border border-zinc-100">
            <span className="text-base">{badge.icon}</span>
            <span className="text-[10px] font-semibold tracking-wider uppercase text-zinc-500">{badge.text}</span>
          </div>
        ))}
      </div>
      {/* Size guide modal */}
      <SizeGuideModal
        open={showSizeGuide}
        onClose={() => setShowSizeGuide(false)}
        gender={product.gender}
      />
      {/* Purchase modal */}
      {showModal && (
        <PurchaseModal
          product={product}
          selectedSize={selectedSize}
          currentPrice={currentPrice}
          onClose={() => setShowModal(false)}
        />
      )}
      {/* Sticky add-to-cart bar — appears when main CTA scrolls off screen */}
      <StickyCartBar
        product={product}
        selectedSize={selectedSize}
        onSizeSelect={handleSizeSelect}
        onRequireSize={handleRequireSize}
        triggerRef={addToCartRef}
      />
    </div>
  );
}
