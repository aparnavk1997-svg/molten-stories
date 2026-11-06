import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState } from 'react';
import ThankYouMoment from '../components/ThankYouMoment';
import { useProducts } from './ProductsContext';
import { MAX_QTY, GIFT_WRAP_PRICE, GIFT_BOX_PRICE, GIFT_NOTE_MAX, deliveryInfo } from '../utils/pricing';
import { flyToBag } from '../utils/flyToBag';
import { placeOrderOnWhatsApp } from '../utils/whatsapp';

const CartContext = createContext(null);
const STORAGE_KEY = 'molten-stories-bag-v2';
const LEGACY_STORAGE_KEY = 'molten-stories-bag-v1';
const GIFT_KEY = 'molten-stories-bag-gift-v1';
const PIN_KEY = 'molten-stories-pincode-v1';
const ADDRESS_KEY = 'molten-stories-address-v1';

// state = { items: [{ id, qty }], hampers: [{ id, items: [{ id, qty }], note }] }
function reducer(state, action) {
  switch (action.type) {
    case 'ADD_ITEM': {
      const exists = state.items.find((i) => i.id === action.id);
      const nextItems = exists
        ? state.items.map((i) => (i.id === action.id ? { ...i, qty: Math.min(i.qty + 1, MAX_QTY) } : i))
        : [...state.items, { id: action.id, qty: 1 }];
      return { ...state, items: nextItems };
    }
    case 'SET_QTY': {
      const nextItems =
        action.qty <= 0
          ? state.items.filter((i) => i.id !== action.id)
          : state.items.map((i) => (i.id === action.id ? { ...i, qty: Math.min(action.qty, MAX_QTY) } : i));
      return { ...state, items: nextItems };
    }
    case 'REMOVE_ITEM': {
      return { ...state, items: state.items.filter((i) => i.id !== action.id) };
    }
    case 'ADD_HAMPER': {
      const newHamper = {
        id: action.hamper.id || 'hamper-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
        items: (action.hamper.items || []).map((i) => ({ id: i.id, qty: i.qty || 1 })),
        note: String(action.hamper.note || '').slice(0, GIFT_NOTE_MAX),
      };
      return { ...state, hampers: [...state.hampers, newHamper] };
    }
    case 'UPDATE_HAMPER': {
      const nextHampers = state.hampers.map((h) => {
        if (h.id !== action.id) return h;
        return {
          ...h,
          items: (action.items || []).map((i) => ({ id: i.id, qty: i.qty || 1 })),
          note: action.note !== undefined ? String(action.note).slice(0, GIFT_NOTE_MAX) : h.note,
        };
      });
      return { ...state, hampers: nextHampers };
    }
    case 'REMOVE_HAMPER': {
      return { ...state, hampers: state.hampers.filter((h) => h.id !== action.id) };
    }
    case 'UNPACK_HAMPER': {
      const hamper = state.hampers.find((h) => h.id === action.id);
      if (!hamper) return state;
      let nextItems = [...state.items];
      (hamper.items || []).forEach(({ id, qty }) => {
        const addQty = qty || 1;
        const exists = nextItems.find((i) => i.id === id);
        if (exists) {
          nextItems = nextItems.map((i) => (i.id === id ? { ...i, qty: Math.min(i.qty + addQty, MAX_QTY) } : i));
        } else {
          nextItems.push({ id, qty: Math.min(addQty, MAX_QTY) });
        }
      });
      return {
        ...state,
        items: nextItems,
        hampers: state.hampers.filter((h) => h.id !== action.id),
      };
    }
    case 'CLEAR':
      return { items: [], hampers: [] };
    default:
      return state;
  }
}

function loadInitial() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && typeof saved === 'object') {
      return {
        items: Array.isArray(saved.items) ? saved.items.filter((i) => i && i.id && i.qty > 0) : [],
        hampers: Array.isArray(saved.hampers) ? saved.hampers.filter((h) => h && h.items?.length > 0) : [],
      };
    }
    // Fallback: check legacy storage
    const legacy = JSON.parse(localStorage.getItem(LEGACY_STORAGE_KEY));
    if (Array.isArray(legacy)) {
      return { items: legacy.filter((i) => i && i.id && i.qty > 0), hampers: [] };
    }
  } catch {
    /* ignore corrupt storage */
  }
  return { items: [], hampers: [] };
}

function loadGift() {
  try {
    const saved = JSON.parse(localStorage.getItem(GIFT_KEY));
    if (saved && typeof saved === 'object') {
      return {
        wrap: !!saved.wrap,
        note: String(saved.note || '').slice(0, GIFT_NOTE_MAX),
      };
    }
  } catch {
    /* ignore corrupt storage */
  }
  return { wrap: false, note: '' };
}

function loadPin() {
  try {
    return String(localStorage.getItem(PIN_KEY) || '').replace(/\D/g, '').slice(0, 6);
  } catch {
    return '';
  }
}

function loadAddress() {
  try {
    const saved = JSON.parse(localStorage.getItem(ADDRESS_KEY));
    if (saved && typeof saved === 'object') {
      return {
        name: String(saved.name || '').slice(0, 100),
        phone: String(saved.phone || '').replace(/\D/g, '').slice(0, 10),
        street: String(saved.street || '').slice(0, 200),
        city: String(saved.city || '').slice(0, 60),
        state: String(saved.state || '').slice(0, 60),
        pin: String(saved.pin || '').replace(/\D/g, '').slice(0, 6),
      };
    }
  } catch {
    /* ignore corrupt storage */
  }
  return { name: '', phone: '', street: '', city: '', state: '', pin: '' };
}

export function CartProvider({ children }) {
  const { getProduct } = useProducts();
  const [state, dispatch] = useReducer(reducer, undefined, loadInitial);
  const [gift, setGift] = useState(loadGift);
  const [address, setAddress] = useState(loadAddress);
  const [pin, setPinState] = useState(() => address.pin || loadPin());
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);
  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  const setPin = useCallback((newPin) => {
    const cleaned = String(newPin || '').replace(/\D/g, '').slice(0, 6);
    setPinState(cleaned);
    setAddress((prev) => (prev.pin !== cleaned ? { ...prev, pin: cleaned } : prev));
  }, []);

  const updateAddress = useCallback((next) => {
    setAddress((prev) => {
      const updated = typeof next === 'function' ? next(prev) : { ...prev, ...next };
      const cleanedPin = String(updated.pin || '').replace(/\D/g, '').slice(0, 6);
      setPinState(cleanedPin);
      return {
        ...updated,
        phone: String(updated.phone || '').replace(/\D/g, '').slice(0, 10),
        pin: cleanedPin,
      };
    });
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    localStorage.setItem(GIFT_KEY, JSON.stringify(gift));
  }, [gift]);

  useEffect(() => {
    localStorage.setItem(PIN_KEY, pin);
  }, [pin]);

  useEffect(() => {
    localStorage.setItem(ADDRESS_KEY, JSON.stringify(address));
  }, [address]);

  // Derived state calculations
  const resolvedItems = useMemo(() => {
    return state.items
      .filter((i) => getProduct(i.id))
      .map((i) => ({ ...getProduct(i.id), qty: i.qty }));
  }, [state.items, getProduct]);

  const resolvedHampers = useMemo(() => {
    return state.hampers
      .map((h) => ({
        id: h.id,
        note: h.note || '',
        items: (h.items || [])
          .filter((i) => getProduct(i.id))
          .map((i) => ({ ...getProduct(i.id), qty: i.qty })),
        packagingFee: GIFT_BOX_PRICE,
      }))
      .filter((h) => h.items.length > 0);
  }, [state.hampers, getProduct]);

  const regularSubtotal = useMemo(() => {
    return resolvedItems.reduce((s, i) => s + i.price * i.qty, 0);
  }, [resolvedItems]);

  const hampersCandlesSubtotal = useMemo(() => {
    return resolvedHampers.reduce(
      (s, h) => s + h.items.reduce((hs, hi) => hs + hi.price * hi.qty, 0),
      0
    );
  }, [resolvedHampers]);

  const candlesSubtotal = regularSubtotal + hampersCandlesSubtotal;
  const hamperPackagingFee = resolvedHampers.length * GIFT_BOX_PRICE;
  const giftWrapFee = resolvedItems.length > 0 && gift.wrap ? GIFT_WRAP_PRICE : 0;
  const wrapFee = hamperPackagingFee + giftWrapFee;

  const totalCandlesCount = useMemo(() => {
    const regCount = resolvedItems.reduce((n, i) => n + i.qty, 0);
    const hCount = resolvedHampers.reduce((n, h) => n + h.items.reduce((hn, hi) => hn + hi.qty, 0), 0);
    return regCount + hCount;
  }, [resolvedItems, resolvedHampers]);

  const hasAnyItems = resolvedItems.length > 0 || resolvedHampers.length > 0;
  const delivery = hasAnyItems ? deliveryInfo(pin, candlesSubtotal) : null;
  const total = candlesSubtotal + wrapFee + (delivery?.fee ?? 0);

  const placeOrder = useCallback(
    (customItems, customGift) => {
      const orderPayload = {
        items: customItems || resolvedItems,
        hampers: resolvedHampers,
        gift: customGift || {
          wrap: gift.wrap,
          note: gift.note.trim(),
          pin,
          address,
        },
      };

      placeOrderOnWhatsApp(orderPayload.items, {
        ...orderPayload.gift,
        hampers: orderPayload.hampers,
      });

      setOrderSuccess({
        items: orderPayload.items,
        hampers: orderPayload.hampers,
        gift: orderPayload.gift,
        address,
        total,
      });
      setDrawerOpen(false);
    },
    [resolvedItems, resolvedHampers, gift, pin, address, total]
  );

  const value = useMemo(() => {
    return {
      items: resolvedItems,
      hampers: resolvedHampers,
      count: totalCandlesCount,
      subtotal: candlesSubtotal,
      regularSubtotal,
      hampersCandlesSubtotal,
      hamperPackagingFee,
      giftWrap: Boolean(gift.wrap),
      giftWrapFee,
      wrapFee,
      pin,
      setPin,
      delivery,
      total,
      address,
      setAddress: updateAddress,
      giftNote: gift.note,
      setGiftWrap: (wrap) => setGift((g) => ({ ...g, wrap })),
      setGiftNote: (note) => setGift((g) => ({ ...g, note: String(note || '').slice(0, GIFT_NOTE_MAX) })),
      giftOptions: { wrap: gift.wrap, note: gift.note.trim(), pin, address, hampers: resolvedHampers },
      drawerOpen,
      openDrawer,
      closeDrawer,

      // Adding an individual normal candle
      add: (id, source) => {
        dispatch({ type: 'ADD_ITEM', id });
        flyToBag(source).then((flew) => {
          if (flew) setTimeout(() => setDrawerOpen(true), 450);
          else setDrawerOpen(true);
        });
      },
      setQty: (id, qty) => dispatch({ type: 'SET_QTY', id, qty }),
      remove: (id) => dispatch({ type: 'REMOVE_ITEM', id }),

      // Hampers management
      addHamper: ({ items: hItems, note: hNote }) => {
        dispatch({
          type: 'ADD_HAMPER',
          hamper: {
            items: hItems.map((i) => ({ id: i.id, qty: i.qty || 1 })),
            note: hNote || '',
          },
        });
        setDrawerOpen(true);
      },
      updateHamper: (hamperId, { items: hItems, note: hNote }) => {
        dispatch({
          type: 'UPDATE_HAMPER',
          id: hamperId,
          items: hItems.map((i) => ({ id: i.id, qty: i.qty || 1 })),
          note: hNote,
        });
        setDrawerOpen(true);
      },
      removeHamper: (hamperId) => dispatch({ type: 'REMOVE_HAMPER', id: hamperId }),
      unpackHamper: (hamperId) => dispatch({ type: 'UNPACK_HAMPER', id: hamperId }),

      clear: () => dispatch({ type: 'CLEAR' }),
      placeOrder,
      orderSuccess,
      setOrderSuccess,
    };
  }, [
    resolvedItems,
    resolvedHampers,
    totalCandlesCount,
    candlesSubtotal,
    regularSubtotal,
    hampersCandlesSubtotal,
    hamperPackagingFee,
    gift,
    giftWrapFee,
    wrapFee,
    pin,
    setPin,
    delivery,
    total,
    address,
    updateAddress,
    drawerOpen,
    openDrawer,
    closeDrawer,
    placeOrder,
    orderSuccess,
  ]);

  return (
    <CartContext.Provider value={value}>
      {children}
      <ThankYouMoment order={orderSuccess} onClose={() => setOrderSuccess(null)} />
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
