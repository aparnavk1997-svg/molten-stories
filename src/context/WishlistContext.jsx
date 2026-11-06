import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useProducts } from './ProductsContext';

const WishlistContext = createContext(null);
const STORAGE_KEY = 'molten-stories-saved-v1';

function loadInitial() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (Array.isArray(saved)) return saved.filter((id) => Number.isInteger(id));
  } catch {
    /* ignore corrupt storage */
  }
  return [];
}

export function WishlistProvider({ children }) {
  const { getProduct } = useProducts();
  const [ids, setIds] = useState(loadInitial);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    } catch {
      /* storage unavailable */
    }
  }, [ids]);

  const toggle = useCallback(
    (id) => setIds((list) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id])),
    []
  );

  const value = useMemo(() => {
    // Skip saved entries whose product was removed in the admin page
    const items = ids.map((id) => getProduct(id)).filter(Boolean);
    return {
      items,
      count: items.length,
      isSaved: (id) => ids.includes(id),
      toggle,
    };
  }, [ids, getProduct, toggle]);

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider');
  return ctx;
}
