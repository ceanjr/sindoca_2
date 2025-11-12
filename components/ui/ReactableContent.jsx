'use client';

import { useCallback, useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useReactions } from '@/hooks/useReactions';
import { addReactionWithNotification, removeReactionWithNotification } from '@/lib/api/reactions';
import ReactionMenu from './ReactionMenu';

/**
 * Wrapper component that adds reaction functionality to any content
 * @param {object} props
 * @param {string} props.contentId - Content ID
 * @param {string} props.contentType - Content type (music, photo, love_reason, etc)
 * @param {string} props.contentTitle - Content title for notification
 * @param {string} props.authorId - Author ID (to check if user can react)
 * @param {string} props.url - URL to navigate when clicking notification
 * @param {React.ReactNode} props.children - Content to wrap
 * @param {string} props.position - Menu position ('auto', 'top', 'bottom')
 * @param {string} props.className - Additional CSS classes
 */
export default function ReactableContent({
  contentId,
  contentType,
  contentTitle,
  authorId,
  url,
  children,
  position = 'auto',
  className = '',
}) {
  const { user } = useAuth();
  const { myReaction } = useReactions(contentId);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState('bottom'); // 'top' or 'bottom'
  const containerRef = useRef(null);
  const touchStartTime = useRef(null);
  const hoverTimeout = useRef(null);
  const longPressTimeout = useRef(null);
  const menuJustOpened = useRef(false);

  const handleReact = useCallback(
    async (emoji) => {
      if (!user || !contentId) return;

      // User cannot react to their own content
      if (authorId === user.id) {
        return;
      }

      if (emoji === null) {
        // Remove reaction
        await removeReactionWithNotification(contentId, user.id);
      } else {
        // Add or update reaction
        await addReactionWithNotification(contentId, user.id, emoji, {
          type: contentType,
          title: contentTitle,
          authorId,
          url,
        });
      }
      
      setIsMenuOpen(false);
    },
    [contentId, user, authorId, contentType, contentTitle, url]
  );

  // Don't show reaction menu if user is the author
  const canReact = user && authorId && authorId !== user.id;

  // Mobile: Long press handlers
  const handleTouchStart = (e) => {
    if (!canReact) return;

    touchStartTime.current = Date.now();
    menuJustOpened.current = false;

    longPressTimeout.current = setTimeout(() => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        // Calculate if menu should appear above or below
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;
        const menuHeight = 60; // Approximate menu height

        setMenuPosition(spaceBelow >= menuHeight ? 'bottom' : 'top');
        setIsMenuOpen(true);
        menuJustOpened.current = true;

        // Strong haptic feedback when menu opens
        // The Vibration API works in mobile browsers, not just PWA
        try {
          if ('vibrate' in navigator) {
            const vibrated = navigator.vibrate(100); // Single strong vibration (100ms)
            console.log('[ReactableContent] Vibration API called, result:', vibrated);
            console.log('[ReactableContent] User agent:', navigator.userAgent);
          } else {
            console.log('[ReactableContent] Vibration API not available');
            console.log('[ReactableContent] User agent:', navigator.userAgent);
          }
        } catch (err) {
          console.error('[ReactableContent] Vibration error:', err);
        }

        console.log('[ReactableContent] Menu opened via long press');
      }
    }, 500);
  };

  const handleTouchEnd = () => {
    if (longPressTimeout.current) {
      clearTimeout(longPressTimeout.current);
    }
  };

  const handleTouchMove = () => {
    if (longPressTimeout.current) {
      clearTimeout(longPressTimeout.current);
    }
  };

  // Desktop: Hover handlers
  const handleMouseEnter = () => {
    if (!canReact) return;
    
    console.log('[ReactableContent] Mouse enter - starting 2s timer');
    
    hoverTimeout.current = setTimeout(() => {
      console.log('[ReactableContent] 2s elapsed - opening menu');
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        // Calculate if menu should appear above or below
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;
        const menuHeight = 60;
        
        setMenuPosition(spaceBelow >= menuHeight ? 'bottom' : 'top');
        setIsMenuOpen(true);
      }
    }, 2000);
  };

  const handleMouseLeave = () => {
    console.log('[ReactableContent] Mouse leave - cancelling timer');
    if (hoverTimeout.current) {
      clearTimeout(hoverTimeout.current);
    }
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (longPressTimeout.current) {
        clearTimeout(longPressTimeout.current);
      }
      if (hoverTimeout.current) {
        clearTimeout(hoverTimeout.current);
      }
    };
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isMenuOpen]);

  if (!canReact) {
    return <div className={className}>{children}</div>;
  }

  const handleClick = (e) => {
    // Prevent click if menu just opened (to avoid opening photo after long press)
    if (menuJustOpened.current || isMenuOpen) {
      console.log('[ReactableContent] Preventing click - menu is open');
      e.preventDefault();
      e.stopPropagation();
      menuJustOpened.current = false;
      return;
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      onContextMenu={(e) => {
        // Prevent context menu when long-pressing (helps with gallery images)
        if (canReact && Date.now() - (touchStartTime.current || 0) > 400) {
          e.preventDefault();
        }
      }}
      style={{
        WebkitTouchCallout: 'none',
        WebkitUserSelect: 'none',
        touchAction: 'manipulation', // Better touch handling
      }}
    >
      {children}
      
      {/* Reaction indicator */}
      {myReaction && !isMenuOpen && (
        <div className="absolute top-2 right-2 z-10 pointer-events-none">
          <div className="bg-white rounded-full shadow-md w-8 h-8 flex items-center justify-center text-lg border-2 border-primary">
            {myReaction}
          </div>
        </div>
      )}
      
      {/* Reaction Menu */}
      {isMenuOpen && (
        <div
          className={`absolute z-50 w-full flex ${
            menuPosition === 'bottom' 
              ? 'top-full mt-2 justify-end' 
              : 'bottom-full mb-2 justify-start'
          }`}
          onClick={(e) => e.stopPropagation()}
          onMouseLeave={() => {
            // Close menu when mouse leaves on desktop
            if (window.innerWidth >= 768) {
              setTimeout(() => setIsMenuOpen(false), 200);
            }
          }}
        >
          <ReactionMenu
            contentId={contentId}
            currentReaction={myReaction}
            onReact={handleReact}
            position={menuPosition}
            isOpen={isMenuOpen}
          />
        </div>
      )}
    </div>
  );
}
