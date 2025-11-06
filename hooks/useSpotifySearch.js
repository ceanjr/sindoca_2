/**
 * Hook for Spotify search with debouncing
 */
'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDebounce } from './useDebounce';

export function useSpotifySearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState(null);
  const debouncedQuery = useDebounce(query, 300);

  const search = useCallback(async (searchQuery) => {
    if (!searchQuery || searchQuery.trim() === '') {
      setResults([]);
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      const response = await fetch(`/api/spotify/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Search failed');
      }

      setResults(data.tracks || []);
    } catch (err) {
      console.error('Search error:', err);
      setError(err.message);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    if (debouncedQuery) {
      search(debouncedQuery);
    } else {
      setResults([]);
    }
  }, [debouncedQuery, search]);

  return {
    query,
    setQuery,
    results,
    isSearching,
    error,
  };
}
