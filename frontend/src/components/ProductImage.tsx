import React, { useEffect, useState } from 'react';
import { Package } from 'lucide-react';
import { getProductImage } from '../assets/products';

type Size = 'xs' | 'sm' | 'md' | 'lg';

const BOX: Record<Size, string> = {
  xs: 'w-7 h-7 rounded',
  sm: 'w-11 h-11 rounded-md',
  md: 'w-14 h-14 rounded-lg',
  lg: 'w-20 h-20 rounded-xl',
};

const ICON: Record<Size, string> = {
  xs: 'w-3.5 h-3.5',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-7 h-7',
};

interface ProductLike {
  sku?: string | null;
  name?: string | null;
  category?: string | null;
}

interface ProductImageProps {
  product?: ProductLike | null;
  /** Used for the alt text when the product record is missing. */
  fallbackLabel?: string;
  size?: Size;
  /** Adds a subtle lift on hover - for rows that are themselves clickable. */
  interactive?: boolean;
  className?: string;
}

/**
 * Square product thumbnail with a skeleton while loading and a graceful icon
 * fallback when the artwork is missing or fails to decode. The box keeps its
 * dimensions in every state, so rows never reflow.
 */
export const ProductImage: React.FC<ProductImageProps> = ({
  product,
  fallbackLabel,
  size = 'sm',
  interactive = false,
  className = '',
}) => {
  const src = getProductImage(product);
  const label = product?.name || fallbackLabel || 'Product';

  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>(src ? 'loading' : 'error');

  // A different product may be rendered into the same slot (pagination,
  // filtering), so reset the state whenever the source changes.
  useEffect(() => {
    setStatus(src ? 'loading' : 'error');
  }, [src]);

  const frame =
    `${BOX[size]} relative overflow-hidden flex-shrink-0 border ` +
    'bg-slate-100 border-slate-200 dark:bg-night-750 dark:border-night-700 ' +
    (interactive ? 'transition-transform duration-300 hover:scale-105 ' : '') +
    className;

  if (status === 'error') {
    return (
      <div
        className={`${frame} flex items-center justify-center text-slate-400 dark:text-slate-500`}
        data-testid="product-image-fallback"
        role="img"
        aria-label={label}
        title={label}
      >
        <Package className={ICON[size]} aria-hidden="true" />
      </div>
    );
  }

  return (
    <div className={frame} data-testid="product-image" title={label}>
      {status === 'loading' && (
        <div
          className="absolute inset-0 animate-pulse bg-slate-200 dark:bg-night-700"
          aria-hidden="true"
        />
      )}
      <img
        src={src!}
        alt={label}
        loading="lazy"
        decoding="async"
        draggable={false}
        onLoad={() => setStatus('ready')}
        onError={() => setStatus('error')}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          status === 'ready' ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
};
