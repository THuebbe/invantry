// frontend/src/hooks/useIngredientSearch.js

import { useState, useEffect, useCallback, useRef } from 'react';
import { searchIngredients } from '../services/ordersService';

/**
 * Hook for searching ingredients with debouncing
 * Used by OrderLineItem and other components that need ingredient search
 */
export function useIngredientSearch(initialQuery = '', debounceMs = 300) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const searchTimeoutRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Debounced search function
  const performSearch = useCallback(async (searchQuery) => {
    if (!searchQuery || searchQuery.length < 3) {
      setResults([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Cancel previous request if still pending
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const items = await searchIngredients(searchQuery);
      setResults(items);
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Ingredient search error:', err);
        setError(err.message);
        setResults([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Effect to handle debounced search
  useEffect(() => {
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout for search
    if (query && query.length >= 3) {
      searchTimeoutRef.current = setTimeout(() => {
        performSearch(query);
      }, debounceMs);
    } else {
      setResults([]);
      setLoading(false);
    }

    // Cleanup
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query, debounceMs, performSearch]);

  // Clear results
  const clearResults = useCallback(() => {
    setResults([]);
    setQuery('');
    setError(null);
  }, []);

  return {
    query,
    setQuery,
    results,
    loading,
    error,
    clearResults,
  };
}
