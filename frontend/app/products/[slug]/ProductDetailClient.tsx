'use client';

import { useState, useRef } from 'react';
import { Product } from '@/types';
import SizeSelector from '@/components/product-detail/SizeSelector';
import AddToCartButton from '@/components/product-detail/AddToCartButton';

interface ProductDetailClientProps {
  product: Product;
}

export default function ProductDetailClient({ product }: ProductDetailClientProps) {
  const [selectedSize, setSelectedSize] = useState<number | null>(null);
  const [showSizeError, setShowSizeError] = useState(false);
  const sizeSectionRef = useRef<HTMLDivElement>(null);

  const handleRequireSize = () => {
    setShowSizeError(true);
    sizeSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => setShowSizeError(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Size selector */}
      <div ref={sizeSectionRef}>
        <SizeSelector
          sizes={product.sizes}
          availableSizes={product.availableSizes}
          selectedSize={selectedSize}
          onSizeSelect={setSelectedSize}
          showError={showSizeError}
        />
      </div>

      {/* Add to cart */}
      <AddToCartButton
        product={product}
        selectedSize={selectedSize}
        onRequireSize={handleRequireSize}
      />

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
    </div>
  );
}
