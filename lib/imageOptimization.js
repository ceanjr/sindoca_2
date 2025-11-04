/**
 * Image optimization utilities
 */

/**
 * Generate blur data URL for placeholder
 */
export function getBlurDataURL(width = 10, height = 10) {
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:rgb(255,107,157);stop-opacity:0.1" />
          <stop offset="100%" style="stop-color:rgb(255,182,193);stop-opacity:0.2" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#g)" />
    </svg>
  `

  const base64 = Buffer.from(svg).toString('base64')
  return `data:image/svg+xml;base64,${base64}`
}

/**
 * Get responsive image sizes
 */
export function getImageSizes(breakpoints = {
  mobile: 640,
  tablet: 768,
  desktop: 1024,
  wide: 1280,
}) {
  return `
    (max-width: ${breakpoints.mobile}px) 100vw,
    (max-width: ${breakpoints.tablet}px) 50vw,
    (max-width: ${breakpoints.desktop}px) 33vw,
    25vw
  `.trim()
}

/**
 * Preload critical images
 */
export function preloadImage(src) {
  if (typeof window === 'undefined') return

  const link = document.createElement('link')
  link.rel = 'preload'
  link.as = 'image'
  link.href = src
  document.head.appendChild(link)
}

/**
 * Lazy load images with Intersection Observer
 */
export function lazyLoadImage(element) {
  if (!('IntersectionObserver' in window)) {
    // Fallback for browsers without Intersection Observer
    element.src = element.dataset.src
    return
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const img = entry.target
        img.src = img.dataset.src
        img.classList.add('loaded')
        observer.unobserve(img)
      }
    })
  })

  observer.observe(element)
}

/**
 * Get optimized Firebase Storage URL with cache
 */
export function getOptimizedFirebaseUrl(url, options = {}) {
  const {
    width = 800,
    quality = 80,
    format = 'webp',
  } = options

  // Add cache control and optimization params
  const urlWithCache = new URL(url)
  urlWithCache.searchParams.set('cache', 'max-age=31536000') // 1 year

  // Note: Firebase Storage doesn't support automatic image transformation
  // You would need to use Firebase Extensions or Cloud Functions for this

  return urlWithCache.toString()
}
