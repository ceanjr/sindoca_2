'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';

export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  onClick = null,
  fill = false,
  sizes,
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

  const blurDataURL = `data:image/svg+xml;base64,${toBase64(
    shimmer(700, 475)
  )}`;

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
      {/* Next.js Image with automatic optimization */}
      <Image
        src={src}
        alt={alt}
        {...(fill
          ? { fill: true }
          : { width: width || 800, height: height || 600 })}
        sizes={
          sizes || '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
        }
        priority={priority}
        placeholder="blur"
        blurDataURL={blurDataURL}
        onLoad={() => {
          setIsLoading(false);
        }}
        onError={(e) => {
          setIsLoading(false);
          setError(true);
        }}
        className={`transition-opacity duration-300 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        }`}
        style={{
          objectFit: 'cover',
        }}
        {...props}
      />
    </motion.div>
  );
}
