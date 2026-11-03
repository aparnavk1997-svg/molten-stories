import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState } from 'react';
import { useProducts } from './ProductsContext';
import { MAX_QTY } from '../utils/pricing';

const CartContext = createContext(null);
const STORAGE_KEY = 'molten-stories-bag-v1';

// state = [{ id, qty }]
function reducer(state, action) {
  switch (action.type) {
    case 'ADD': {
      const exists = state.find((i) => i.id === action.id);
      return exists
        ? state.map((i) => (i.id === action.id ? { ...i, qty: Math.min(i.qty + 1, MAX_QTY) } : i))
        : [...state, { id: action.id, qty: 1 }];
    }
    case 'SET_QTY':
      return action.qty <= 0
        ? state.filter((i) => i.id !== action.id)
        : state.map((i) => (i.id === action.id ? { ...i, qty: Math.min(action.qty, MAX_QTY) } : i));
    case 'REMOVE':
      return state.filter((i) => i.id !== action.id);
    case 'CLEAR':
      return [];
    default:
      return state;
  }
}

function loadInitial() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (Array.isArray(saved)) return saved.filter((i) => i.qty > 0);
  } catch {
    /* ignore corrupt storage */
  }
  return [];
}

export function CartProvider({ children }) {
  const { getProduct } = useProducts();
  const [state, dispatch] = useReducer(reducer, undefined, loadInitial);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const value = useMemo(() => {
    // Skip bag entries whose product was removed in the admin page
    const items = state
      .filter((i) => getProduct(i.id))
      .map((i) => ({ ...getProduct(i.id), qty: i.qty }));
    return {
      items,
      count: items.reduce((n, i) => n + i.qty, 0),
      subtotal: items.reduce((s, i) => s + i.price * i.qty, 0),
      drawerOpen,
      openDrawer,
      closeDrawer,
      // Adding from a product card / page also opens the bag slider
      add: (id) => {
        dispatch({ type: 'ADD', id });
        setDrawerOpen(true);
      },
      setQty: (id, qty) => dispatch({ type: 'SET_QTY', id, qty }),
      remove: (id) => dispatch({ type: 'REMOVE', id }),
      clear: () => dispatch({ type: 'CLEAR' }),
    };
  }, [state, drawerOpen, openDrawer, closeDrawer, getProduct]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
