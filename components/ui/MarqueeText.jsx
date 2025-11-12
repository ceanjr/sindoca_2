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
  speed = 40, // pixels per second
  pauseOnHover = true,
  delay = 1500 // delay before starting animation (ms)
}) {
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const textRef = useRef(null);
  const containerRef = useRef(null);
  const animationTimerRef = useRef(null);

  useEffect(() => {
    const checkOverflow = () => {
      if (textRef.current && containerRef.current) {
        // Force a reflow to ensure accurate measurements
        void textRef.current.offsetWidth;
        void containerRef.current.offsetWidth;
        
        const textWidth = textRef.current.scrollWidth;
        const containerWidth = containerRef.current.clientWidth;
        const isOverflow = textWidth > containerWidth + 5; // 5px tolerance
        
        setIsOverflowing(isOverflow);
        setShouldAnimate(false);

        // Clear any existing timer
        if (animationTimerRef.current) {
          clearTimeout(animationTimerRef.current);
        }

        // Start animation after delay if overflowing
        if (isOverflow) {
          animationTimerRef.current = setTimeout(() => {
            setShouldAnimate(true);
          }, delay);
        }
      }
    };

    // Initial check with small delay to ensure render is complete
    const initialTimer = setTimeout(checkOverflow, 100);

    // Recheck on window resize with debounce
    let resizeTimer;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(checkOverflow, 150);
    };

    window.addEventListener('resize', handleResize);
    
    return () => {
      clearTimeout(initialTimer);
      clearTimeout(resizeTimer);
      if (animationTimerRef.current) {
        clearTimeout(animationTimerRef.current);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, [children, delay]);

  // Calculate animation duration based on text length
  const animationDuration = isOverflowing && textRef.current
    ? Math.max(textRef.current.scrollWidth / speed, 3) // minimum 3s
    : 0;

  return (
    <div
      ref={containerRef}
      className={`overflow-hidden w-full ${className}`}
      style={{ 
        position: 'relative',
        maxWidth: '100%'
      }}
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
                paddingRight: '3rem',
                animation: `marquee ${animationDuration}s linear infinite`,
                willChange: 'transform'
              }
            : {
                display: 'block',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }
        }
      >
        {children}
        {/* Duplicate text for seamless loop */}
        {isOverflowing && shouldAnimate && (
          <span style={{ marginLeft: '3rem' }}>{children}</span>
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
