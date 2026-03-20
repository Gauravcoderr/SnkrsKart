'use client';

import { useState, useRef } from 'react';
import { Product } from '@/types';
import SizeSelector from '@/components/product-detail/SizeSelector';
import AddToCartButton from '@/components/product-detail/AddToCartButton';
import PurchaseModal from '@/components/product-detail/PurchaseModal';
import SizeGuideModal from '@/components/product-detail/SizeGuideModal';
import { formatPrice } from '@/lib/utils';

interface ProductDetailClientProps {
  product: Product;
}

export default function ProductDetailClient({ product }: ProductDetailClientProps) {
  const [selectedSize, setSelectedSize] = useState<number | null>(null);
  const [showSizeError, setShowSizeError] = useState(false);
  const [currentPrice, setCurrentPrice] = useState(product.price);
  const [showModal, setShowModal] = useState(false);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [currentOriginalPrice, setCurrentOriginalPrice] = useState(product.originalPrice);
  const sizeSectionRef = useRef<HTMLDivElement>(null);

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
      <div className="flex items-baseline gap-3 pb-6 border-b border-zinc-100">
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
      <AddToCartButton
        product={effectiveProduct}
        selectedSize={selectedSize}
        onRequireSize={handleRequireSize}
      />

      {/* Purchase inquiry CTA */}
      <button
        type="button"
        onClick={() => setShowModal(true)}
        className="w-full py-3.5 border-2 border-zinc-900 text-sm font-bold tracking-widest uppercase text-zinc-900 hover:bg-zinc-900 hover:text-white transition-colors duration-200"
      >
        Want to Purchase? — Enquire Now
      </button>

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
    </div>
  );
}
