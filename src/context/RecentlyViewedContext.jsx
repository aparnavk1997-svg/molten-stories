import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useProducts } from './ProductsContext';

const RecentlyViewedContext = createContext(null);
const STORAGE_KEY = 'molten-stories-recent-v1';
const MAX_RECENT = 8;

function loadInitial() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (Array.isArray(saved)) return saved.filter((id) => Number.isInteger(id)).slice(0, MAX_RECENT);
  } catch {
    /* ignore corrupt storage */
  }
  return [];
}

export function RecentlyViewedProvider({ children }) {
  const { getProduct } = useProducts();
  const [ids, setIds] = useState(loadInitial);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    } catch {
      /* storage unavailable */
    }
  }, [ids]);

  // Most recent first; viewing a candle again moves it to the front
  const record = useCallback(
    (id) =>
      setIds((list) => (list[0] === id ? list : [id, ...list.filter((x) => x !== id)].slice(0, MAX_RECENT))),
    []
  );

  const value = useMemo(() => {
    // Skip entries whose product was removed in the admin page
    const items = ids.map((id) => getProduct(id)).filter(Boolean);
    return { items, record };
  }, [ids, getProduct, record]);

  return <RecentlyViewedContext.Provider value={value}>{children}</RecentlyViewedContext.Provider>;
}

export function useRecentlyViewed() {
  const ctx = useContext(RecentlyViewedContext);
  if (!ctx) throw new Error('useRecentlyViewed must be used within RecentlyViewedProvider');
  return ctx;
}
