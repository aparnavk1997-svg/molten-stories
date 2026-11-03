import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { categories } from '../data/products';
import { useProducts } from '../context/ProductsContext';

export default function Shop() {
  const { products } = useProducts();
  const [params] = useSearchParams();
  const initial = categories.includes(params.get('c')) ? params.get('c') : 'All';
  const [category, setCategory] = useState(initial);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('featured');

  const list = useMemo(() => {
    let out = products.filter(
      (p) =>
        (category === 'All' || p.category === category) &&
        (p.name + ' ' + p.desc + ' ' + p.category).toLowerCase().includes(query.trim().toLowerCase())
    );
    if (sort === 'low') out = [...out].sort((a, b) => a.price - b.price);
    if (sort === 'high') out = [...out].sort((a, b) => b.price - a.price);
    if (sort === 'name') out = [...out].sort((a, b) => a.name.localeCompare(b.name));
    return out;
  }, [products, category, query, sort]);

  return (
    <div className="container page">
      <h1>Shop candles</h1>

      <div className="toolbar">
        <div className="chips" role="group" aria-label="Filter by scent family">
          {categories.map((c) => (
            <button
              key={c}
              className={`chip ${c === category ? 'active' : ''}`}
              onClick={() => setCategory(c)}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="toolbar-right">
          <input
            type="search"
            placeholder="Search candles…"
            aria-label="Search candles"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort">
            <option value="featured">Featured</option>
            <option value="low">Price: low to high</option>
            <option value="high">Price: high to low</option>
            <option value="name">Name</option>
          </select>
        </div>
      </div>

      {list.length === 0 ? (
        <p className="muted">No candles match your search.</p>
      ) : (
        <div className="grid">
          {list.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
