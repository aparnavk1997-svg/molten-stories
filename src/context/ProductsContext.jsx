import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase, supabaseEnabled } from '../lib/supabase';

const ProductsContext = createContext(null);
// Render cache only: the database is the source of truth. It avoids a blank shop while the request is in flight.
const CACHE_KEY = 'molten-stories-products-cache-v4';

const fromRow = (r) => {
  const p = {
    id: r.id,
    name: r.name,
    category: r.category,
    categories: r.categories?.length ? r.categories : [r.category],
    price: Number(r.price),
    color: r.color || '#c9a95c',
    images: r.images || [],
    desc: r.description || '',
  };
  if (r.old_price != null && Number(r.old_price) > p.price) p.old = Number(r.old_price);
  if (r.disabled) p.disabled = true;
  return p;
};

const toRow = (p) => ({
  name: p.name,
  category: p.category,
  categories: p.categories || [],
  price: p.price,
  old_price: p.old && p.old > p.price ? p.old : null,
  color: p.color || null,
  images: p.images?.length ? p.images : p.image ? [p.image] : [],
  description: p.desc || '',
  disabled: !!p.disabled,
});

function loadInitial() {
  if (!supabaseEnabled) return [];
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY));
    if (Array.isArray(cached)) return cached;
  } catch {
    /* ignore corrupt cache */
  }
  return [];
}

const fail = (error) => {
  throw new Error(error.message || 'Something went wrong talking to the database.');
};

export function ProductsProvider({ children }) {
  const [products, setProducts] = useState(loadInitial);
  const [loading, setLoading] = useState(supabaseEnabled);
  const [loadError, setLoadError] = useState('');

  const refresh = useCallback(async () => {
    if (!supabaseEnabled) return;
    const { data, error } = await supabase.from('products').select('*').order('id');
    if (error) {
      setLoadError('Could not load the latest products.');
    } else {
      const list = data.map(fromRow);
      setProducts(list);
      setLoadError('');
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(list));
      } catch {
        /* cache is optional */
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    if (!supabaseEnabled) return undefined;
    // Admins can also see hidden products, so reload when someone signs in or out.
    const { data } = supabase.auth.onAuthStateChange(() => refresh());
    return () => data.subscription.unsubscribe();
  }, [refresh]);

  const value = useMemo(
    () => ({
      // Storefront only sees enabled products; the admin page uses allProducts.
      products: products.filter((p) => !p.disabled),
      allProducts: products,
      loading,
      loadError,
      getProduct: (id) => products.find((p) => p.id === Number(id) && !p.disabled),
      addProduct: async (data) => {
        const { error } = await supabase.from('products').insert(toRow(data));
        if (error) fail(error);
        await refresh();
      },
      updateProduct: async (id, data) => {
        const current = products.find((p) => p.id === id);
        const { error } = await supabase
          .from('products')
          .update(toRow({ ...data, disabled: current?.disabled }))
          .eq('id', id);
        if (error) fail(error);
        await refresh();
      },
      setProductEnabled: async (id, enabled) => {
        const { error } = await supabase.from('products').update({ disabled: !enabled }).eq('id', id);
        if (error) fail(error);
        await refresh();
      },
      deleteProduct: async (id) => {
        const { error } = await supabase.from('products').delete().eq('id', id);
        if (error) fail(error);
        await refresh();
      },
    }),
    [products, loading, loadError, refresh]
  );

  return <ProductsContext.Provider value={value}>{children}</ProductsContext.Provider>;
}

export function useProducts() {
  const ctx = useContext(ProductsContext);
  if (!ctx) throw new Error('useProducts must be used within ProductsProvider');
  return ctx;
}
