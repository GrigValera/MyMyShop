import { useState } from 'react';
import styles from './ProductImage.module.css';

const ProductImage = ({ src, alt = '', className = '', loading = 'lazy', width = 400, height = 300 }) => {
  const [loadedSrc, setLoadedSrc] = useState(null);
  const [failedSrc, setFailedSrc] = useState(null);
  const imageSrc = typeof src === 'string' ? src.trim() : '';
  const failed = !imageSrc || failedSrc === imageSrc;
  const loaded = loadedSrc === imageSrc;

  return (
    <div
      className={`${styles.slot} ${className}`}
      data-image-state={failed ? 'fallback' : loaded ? 'loaded' : 'loading'}
      role={failed && alt ? 'img' : undefined}
      aria-label={failed ? alt || undefined : undefined}
    >
      {failed ? (
        <svg className={styles.fallback} viewBox="0 0 64 64" fill="none" aria-hidden="true" focusable="false">
          <rect x="7" y="12" width="50" height="40" rx="6" stroke="currentColor" strokeWidth="2" />
          <circle cx="23" cy="25" r="4" fill="currentColor" />
          <path d="m12 45 13-13 9 9 7-7 11 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <img
          src={imageSrc}
          alt={alt}
          width={width}
          height={height}
          loading={loading}
          decoding="async"
          className={`${styles.image} ${loaded ? styles.loaded : ''}`}
          onLoad={() => setLoadedSrc(imageSrc)}
          onError={() => setFailedSrc(imageSrc)}
        />
      )}
    </div>
  );
};

export default ProductImage;
