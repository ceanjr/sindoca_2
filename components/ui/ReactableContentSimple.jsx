'use client';

import { useCallback, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useReactions } from '@/hooks/useReactions';
import { Smile } from 'lucide-react';

const AVAILABLE_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏', '🤔'];

/**
 * Versão simplificada para debug - com botão visível
 */
export default function ReactableContentSimple({
  contentId,
  contentType,
  contentTitle,
  authorId,
  url,
  children,
  className = '',
}) {
  const { user } = useAuth();
  const { myReaction, addReaction, removeReaction } = useReactions(contentId);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleReact = useCallback(
    async (emoji) => {
      if (!user || !contentId) return;

      if (emoji === null || myReaction === emoji) {
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
            console.error('Failed to send notification:', err);
          });
        }
      }

      setIsMenuOpen(false);
    },
    [contentId, user, authorId, contentType, contentTitle, url, myReaction, addReaction, removeReaction]
  );

  const canReact = !!user;

  if (!canReact) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={`relative ${className}`}>
      {children}
      
      {/* Botão de Reagir - Sempre Visível para Debug */}
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="absolute top-2 right-2 z-20 bg-white hover:bg-gray-50 rounded-full p-2 shadow-lg border border-gray-200 transition-all"
        title="Reagir"
      >
        {myReaction || <Smile size={20} className="text-gray-600" />}
      </button>
      
      {/* Menu de Emojis */}
      {isMenuOpen && (
        <div 
          className="absolute top-14 right-2 z-50 bg-white rounded-2xl shadow-2xl px-3 py-2 flex items-center gap-1 border border-gray-200"
          onClick={(e) => e.stopPropagation()}
        >
          {AVAILABLE_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleReact(emoji)}
              className={`w-10 h-10 flex items-center justify-center text-2xl rounded-full transition-all duration-200 ${
                myReaction === emoji
                  ? 'bg-primary/10 ring-2 ring-primary scale-110'
                  : 'hover:bg-gray-100 hover:scale-110'
              }`}
              title={`Reagir com ${emoji}`}
            >
              {emoji}
            </button>
          ))}
          
          {/* Botão Fechar */}
          <button
            onClick={() => setIsMenuOpen(false)}
            className="w-10 h-10 flex items-center justify-center text-sm rounded-full hover:bg-red-100 text-gray-500"
            title="Fechar"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
