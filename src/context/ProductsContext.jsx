import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { products as seedProducts } from '../data/products';

const ProductsContext = createContext(null);
const STORAGE_KEY = 'molten-stories-products-v3';

function loadInitial() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (Array.isArray(saved)) return saved;
  } catch {
    /* ignore corrupt storage */
  }
  return seedProducts;
}

export function ProductsProvider({ children }) {
  const [products, setProducts] = useState(loadInitial);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
      setSaveError('');
    } catch {
      setSaveError('Could not save: browser storage is full. Try fewer or smaller photos, or remove some products.');
    }
  }, [products]);

  const value = useMemo(
    () => ({
      // Storefront only sees enabled products; the admin page uses allProducts.
      products: products.filter((p) => !p.disabled),
      allProducts: products,
      saveError,
      getProduct: (id) => products.find((p) => p.id === Number(id) && !p.disabled),
      addProduct: (data) => {
        const id = products.reduce((m, p) => Math.max(m, p.id), 0) + 1;
        setProducts((list) => [...list, { ...data, id }]);
        return id;
      },
      updateProduct: (id, data) =>
        setProducts((list) =>
          list.map((p) => (p.id === id ? { ...data, id, ...(p.disabled ? { disabled: true } : {}) } : p))
        ),
      setProductEnabled: (id, enabled) =>
        setProducts((list) =>
          list.map((p) => {
            if (p.id !== id) return p;
            const { disabled, ...rest } = p;
            return enabled ? rest : { ...rest, disabled: true };
          })
        ),
      deleteProduct: (id) => setProducts((list) => list.filter((p) => p.id !== id)),
      resetProducts: () => setProducts(seedProducts),
    }),
    [products, saveError]
  );

  return <ProductsContext.Provider value={value}>{children}</ProductsContext.Provider>;
}

export function useProducts() {
  const ctx = useContext(ProductsContext);
  if (!ctx) throw new Error('useProducts must be used within ProductsProvider');
  return ctx;
}
