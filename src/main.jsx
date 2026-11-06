import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AdminProvider } from './context/AdminContext';
import { CartProvider } from './context/CartContext';
import { ProductsProvider } from './context/ProductsContext';
import { WishlistProvider } from './context/WishlistContext';
import { RecentlyViewedProvider } from './context/RecentlyViewedContext';
import { ThemeProvider } from './context/ThemeContext';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AdminProvider>
          <ProductsProvider>
            <WishlistProvider>
              <RecentlyViewedProvider>
                <CartProvider>
                  <App />
                </CartProvider>
              </RecentlyViewedProvider>
            </WishlistProvider>
          </ProductsProvider>
        </AdminProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>
);
