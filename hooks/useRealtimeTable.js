'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

/**
 * Hook genérico para sincronização em tempo real de tabelas Supabase
 * Permite especificar tabela, filtros e ordenação
 */
export function useRealtimeTable({
  table,
  filters = {},
  orderBy = { column: 'created_at', ascending: false },
  enabled = true,
}) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    const supabase = createClient();
    setLoading(true);

    // Initial load
    const loadData = async () => {
      try {
        let query = supabase.from(table).select('*');

        // Apply filters
        Object.entries(filters).forEach(([key, value]) => {
          query = query.eq(key, value);
        });

        // Apply ordering
        if (orderBy) {
          query = query.order(orderBy.column, { ascending: orderBy.ascending });
        }

        const { data: fetchedData, error: fetchError } = await query;

        if (fetchError) throw fetchError;

        setData(fetchedData || []);
        setLoading(false);
      } catch (err) {
        console.error(`Error loading data from ${table}:`, err);
        setError(err.message);
        setLoading(false);
      }
    };

    loadData();

    // Build filter string for subscription
    let filterString = '';
    Object.entries(filters).forEach(([key, value], index) => {
      if (index > 0) filterString += ',';
      filterString += `${key}=eq.${value}`;
    });

    // Subscribe to realtime changes
    const channel = supabase
      .channel(`${table}-changes`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table,
          ...(filterString && { filter: filterString }),
        },
        (payload) => {
          console.log(`🔄 Realtime ${table} change:`, payload);

          if (payload.eventType === 'INSERT') {
            setData((prev) => {
              // Check if item matches filters
              const matchesFilters = Object.entries(filters).every(
                ([key, value]) => payload.new[key] === value
              );
              if (!matchesFilters) return prev;

              // Add to beginning or end based on ordering
              if (orderBy?.ascending === false) {
                return [payload.new, ...prev];
              } else {
                return [...prev, payload.new];
              }
            });
          } else if (payload.eventType === 'UPDATE') {
            setData((prev) =>
              prev.map((item) =>
                item.id === payload.new.id ? payload.new : item
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setData((prev) => prev.filter((item) => item.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    // Cleanup
    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, JSON.stringify(filters), JSON.stringify(orderBy), enabled]);

  return { data, loading, error };
}
