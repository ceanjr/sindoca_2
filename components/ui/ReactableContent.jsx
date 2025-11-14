'use client';

import { useCallback, useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useReactions } from '@/hooks/useReactions';
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
  const { myReaction, addReaction, removeReaction } = useReactions(contentId);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState('bottom'); // 'top' or 'bottom'
  const [menuCoords, setMenuCoords] = useState({ top: 0, left: 0 });
  const containerRef = useRef(null);
  const touchStartTime = useRef(null);
  const hoverTimeout = useRef(null);
  const longPressTimeout = useRef(null);
  const menuJustOpened = useRef(false);
  const lastMenuOpenTime = useRef(0);

  // Global state to track currently open menu
  useEffect(() => {
    if (isMenuOpen) {
      // Close any other open menus
      const event = new CustomEvent('close-reaction-menus', { detail: { exceptId: contentId } });
      window.dispatchEvent(event);
    }
  }, [isMenuOpen, contentId]);

  // Listen for close events from other menus
  useEffect(() => {
    const handleCloseMenus = (e) => {
      if (e.detail.exceptId !== contentId) {
        setIsMenuOpen(false);
      }
    };

    window.addEventListener('close-reaction-menus', handleCloseMenus);
    return () => window.removeEventListener('close-reaction-menus', handleCloseMenus);
  }, [contentId]);

  const handleReact = useCallback(
    async (emoji) => {
      if (!user || !contentId) return;

      if (emoji === null) {
        // Remove reaction using hook (optimistic update)
        await removeReaction();
      } else {
        // Add or update reaction using hook (optimistic update)
        await addReaction(emoji);

        // Send notification in background (only if not author)
        if (authorId && authorId !== user.id) {
          fetch('/api/reactions/notify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contentId,
              emoji,
              contentInfo: {
                type: contentType,
                title: contentTitle,
                authorId,
                url,
              },
            }),
          }).catch(err => {
            // Fail silently - notification is not critical
            console.error('[ReactableContent] Failed to send notification:', err);
          });
        }
      }

      setIsMenuOpen(false);
    },
    [contentId, user, authorId, contentType, contentTitle, url, addReaction, removeReaction]
  );

  // Everyone can react (including to own content)
  const canReact = !!user;

  // Mobile: Long press handlers
  const handleTouchStart = (e) => {
    if (!canReact) return;

    // Check if clicked on ignored element (like emoji picker button)
    const isIgnored = e.target.closest('[data-ignore-reactable="true"]');
    if (isIgnored) {
      return;
    }

    // Prevent new long press if menu was just opened (within 500ms)
    const timeSinceLastOpen = Date.now() - lastMenuOpenTime.current;
    if (timeSinceLastOpen < 500) {
      return;
    }

    touchStartTime.current = Date.now();
    menuJustOpened.current = false;

    longPressTimeout.current = setTimeout(() => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        // Calculate menu position
        const menuWidth = 300; // Approximate width of reaction menu
        const menuHeight = 60;

        const spaceBelow = window.innerHeight - rect.bottom;

        // Determine vertical position
        const position = spaceBelow >= menuHeight ? 'bottom' : 'top';
        setMenuPosition(position);

        // Calculate horizontal position
        // Check if element is more on right or left side of screen
        const elementCenter = rect.left + (rect.width / 2);
        const screenCenter = window.innerWidth / 2;

        let left;
        if (elementCenter > screenCenter) {
          // Element on right side - align menu to right edge of element
          left = rect.right - menuWidth;
          // Ensure menu doesn't go off left edge
          if (left < 8) {
            left = 8;
          }
        } else {
          // Element on left side - align menu to left edge of element
          left = rect.left;
          // Ensure menu doesn't go off right edge
          if (left + menuWidth > window.innerWidth - 8) {
            left = window.innerWidth - menuWidth - 8;
          }
        }

        let top = position === 'bottom' ? rect.bottom + 8 : rect.top - menuHeight - 8;

        setMenuCoords({ top, left });
        setIsMenuOpen(true);
        menuJustOpened.current = true;
        lastMenuOpenTime.current = Date.now(); // Track when menu was opened

        // Strong haptic feedback when menu opens
        // The Vibration API works in mobile browsers, not just PWA
        try {
          if ('vibrate' in navigator) {
            navigator.vibrate(100); // Single strong vibration (100ms)
          }
        } catch (err) {
          console.error('[ReactableContent] Vibration error:', err);
        }
      }
    }, 500);
  };

  const handleTouchEnd = (e) => {
    // Check if clicked on ignored element (like emoji picker button)
    const isIgnored = e.target.closest('[data-ignore-reactable="true"]');
    if (isIgnored) {
      if (longPressTimeout.current) {
        clearTimeout(longPressTimeout.current);
        longPressTimeout.current = null;
      }
      return;
    }

    // Clear timeout
    if (longPressTimeout.current) {
      clearTimeout(longPressTimeout.current);
      longPressTimeout.current = null;
    }

    // If touch was too short, prevent menu from opening
    const touchDuration = Date.now() - (touchStartTime.current || 0);
    if (touchDuration < 450) {
      // Was a tap, not a long press
      touchStartTime.current = null;
    }
  };

  const handleTouchMove = () => {
    // User is scrolling/moving, cancel long press
    if (longPressTimeout.current) {
      clearTimeout(longPressTimeout.current);
      longPressTimeout.current = null;
    }
  };

  // Desktop: Hover handlers (only on desktop, not mobile)
  const handleMouseEnter = () => {
    if (!canReact) return;

    // Skip hover behavior on touch devices
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
      return;
    }

    hoverTimeout.current = setTimeout(() => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        // Calculate menu position
        const menuWidth = 300; // Approximate width of reaction menu
        const menuHeight = 60;

        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceLeft = rect.left;
        const spaceRight = window.innerWidth - rect.right;

        // Determine vertical position
        const position = spaceBelow >= menuHeight ? 'bottom' : 'top';
        setMenuPosition(position);

        // Calculate horizontal position
        // Check if element is more on right or left side of screen
        const elementCenter = rect.left + (rect.width / 2);
        const screenCenter = window.innerWidth / 2;

        let left;
        if (elementCenter > screenCenter) {
          // Element on right side - align menu to right edge of element
          left = rect.right - menuWidth;
          // Ensure menu doesn't go off left edge
          if (left < 8) {
            left = 8;
          }
        } else {
          // Element on left side - align menu to left edge of element
          left = rect.left;
          // Ensure menu doesn't go off right edge
          if (left + menuWidth > window.innerWidth - 8) {
            left = window.innerWidth - menuWidth - 8;
          }
        }

        let top = position === 'bottom' ? rect.bottom + 8 : rect.top - menuHeight - 8;

        setMenuCoords({ top, left });
        setIsMenuOpen(true);
      }
    }, 1000); // Reduced from 2000ms to 1000ms
  };

  const handleMouseLeave = () => {
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

      {/* Reaction Menu - Fixed positioning */}
      {isMenuOpen && (
        <div
          className="fixed z-[9999]"
          style={{
            top: `${menuCoords.top}px`,
            left: `${menuCoords.left}px`,
          }}
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
            onClose={() => setIsMenuOpen(false)}
            position={menuPosition}
            isOpen={isMenuOpen}
            arrowOffset={containerRef.current ? containerRef.current.getBoundingClientRect().left - menuCoords.left : 0}
          />
        </div>
      )}
    </div>
  );
}
