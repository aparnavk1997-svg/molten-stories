import { Routes, Route, Link } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import BagDrawer from './components/BagDrawer';
import { BlownOutCandleIllustration } from './components/EmptyIllustrations';
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import About from './pages/About';
import Contact from './pages/Contact';
import Admin from './pages/Admin';
import Account from './pages/Account';
import Track from './pages/Track';
import Policy from './pages/Policy';
import GiftBox from './pages/GiftBox';
import Saved from './pages/Saved';
import Review from './pages/Review';

function NotFound() {
  return (
    <div className="container page center-text empty-cart notfound-wrap">
      <BlownOutCandleIllustration />
      <h1>Page not found</h1>
      <p className="muted">The page you're looking for has blown out.</p>
      <Link to="/" className="btn">Back to home</Link>
    </div>
  );
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Header />
      <BagDrawer />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/bag" element={<Cart />} />
          <Route path="/gift-box" element={<GiftBox />} />
          <Route path="/saved" element={<Saved />} />
          <Route path="/review" element={<Review />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/policies/:slug" element={<Policy />} />
          <Route path="/account" element={<Account />} />
          <Route path="/track" element={<Track />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </>
  );
}
