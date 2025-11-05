'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

export default function OptimizedImage({
  src,
  alt,
  width = 800,
  height = 600,
  className = '',
  priority = false,
  onClick = null,
  ...props
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  // Placeholder blur data URL
  const shimmer = (w, h) => `
    <svg width="${w}" height="${h}" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
      <defs>
        <linearGradient id="g">
          <stop stop-color="#f3f4f6" offset="20%" />
          <stop stop-color="#e5e7eb" offset="50%" />
          <stop stop-color="#f3f4f6" offset="70%" />
        </linearGradient>
      </defs>
      <rect width="${w}" height="${h}" fill="#f3f4f6" />
      <rect id="r" width="${w}" height="${h}" fill="url(#g)" />
      <animate xlink:href="#r" attributeName="x" from="-${w}" to="${w}" dur="1s" repeatCount="indefinite"  />
    </svg>
  `;

  const toBase64 = (str) =>
    typeof window === 'undefined'
      ? Buffer.from(str).toString('base64')
      : window.btoa(str);

  if (error) {
    return (
      <div
        className={`bg-gray-200 rounded-2xl flex flex-col items-center justify-center p-4 ${className}`}
        style={{ minHeight: '200px' }}
      >
        <p className="text-gray-500 text-sm mb-2">Imagem não disponível</p>
        <p className="text-gray-400 text-xs break-all text-center px-2">
          {src}
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`relative overflow-hidden rounded-2xl bg-gray-100 ${className}`}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      {/* Loading skeleton */}
      {isLoading && (
        <div
          className="absolute inset-0 bg-gray-200 animate-pulse"
          style={{
            backgroundImage: `url('data:image/svg+xml;base64,${toBase64(
              shimmer(width, height)
            )}')`,
            backgroundSize: 'cover',
          }}
        />
      )}

      {/* Native img tag instead of next/image to avoid config issues */}
      <img
        src={src}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        onLoad={() => {
          console.log('✅ Image loaded:', src);
          setIsLoading(false);
        }}
        onError={(e) => {
          console.error('❌ Image failed to load:', src);
          console.error('Error event:', e);
          setIsLoading(false);
          setError(true);
        }}
        className={`transition-opacity duration-300 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        }`}
        style={{
          objectFit: 'cover',
          width: '100%',
          height: '100%',
          display: 'block',
        }}
        {...props}
      />
    </motion.div>
  );
}
