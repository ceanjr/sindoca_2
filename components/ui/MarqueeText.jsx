'use client';

import React, { useRef, useEffect, useState } from 'react';

/**
 * MarqueeText Component
 * Displays text with a scrolling marquee effect when it overflows
 * Similar to Spotify's behavior for long text
 */
export default function MarqueeText({
  children,
  className = '',
  speed = 30, // pixels per second
  pauseOnHover = true,
  delay = 1000 // delay before starting animation (ms)
}) {
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const textRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const checkOverflow = () => {
      if (textRef.current && containerRef.current) {
        const isOverflow = textRef.current.scrollWidth > containerRef.current.clientWidth;
        setIsOverflowing(isOverflow);

        // Start animation after delay if overflowing
        if (isOverflow) {
          const timer = setTimeout(() => {
            setShouldAnimate(true);
          }, delay);
          return () => clearTimeout(timer);
        }
      }
    };

    checkOverflow();

    // Recheck on window resize
    window.addEventListener('resize', checkOverflow);
    return () => window.removeEventListener('resize', checkOverflow);
  }, [children, delay]);

  // Calculate animation duration based on text length
  const animationDuration = isOverflowing && textRef.current
    ? (textRef.current.scrollWidth / speed)
    : 0;

  return (
    <div
      ref={containerRef}
      className={`overflow-hidden ${className}`}
      style={{ position: 'relative' }}
    >
      <div
        ref={textRef}
        className={`whitespace-nowrap ${
          isOverflowing && shouldAnimate ? 'animate-marquee' : ''
        } ${pauseOnHover ? 'hover:animation-paused' : ''}`}
        style={
          isOverflowing && shouldAnimate
            ? {
                display: 'inline-block',
                paddingRight: '2rem',
                animation: `marquee ${animationDuration}s linear infinite`,
              }
            : {}
        }
      >
        {children}
        {/* Duplicate text for seamless loop */}
        {isOverflowing && shouldAnimate && (
          <span className="ml-8">{children}</span>
        )}
      </div>

      <style jsx>{`
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        .animate-marquee {
          animation: marquee linear infinite;
        }

        .hover\\:animation-paused:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}
