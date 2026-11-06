import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { EmptySearchIllustration } from '../components/EmptyIllustrations';
import { categories, categoriesOf } from '../data/products';
import { useProducts } from '../context/ProductsContext';

export default function Shop() {
  const { products } = useProducts();
  const [params] = useSearchParams();
  const initial = categories.includes(params.get('c')) && params.get('c') !== 'All' ? [params.get('c')] : [];
  const [selected, setSelected] = useState(initial); // empty = all collections
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('featured');

  const toggle = (c) =>
    setSelected((s) => (s.includes(c) ? s.filter((x) => x !== c) : [...s, c]));

  const list = useMemo(() => {
    let out = products.filter(
      (p) =>
        (selected.length === 0 || categoriesOf(p).some((c) => selected.includes(c))) &&
        (p.name + ' ' + p.desc + ' ' + categoriesOf(p).join(' ')).toLowerCase().includes(query.trim().toLowerCase())
    );
    if (sort === 'low') out = [...out].sort((a, b) => a.price - b.price);
    if (sort === 'high') out = [...out].sort((a, b) => b.price - a.price);
    if (sort === 'name') out = [...out].sort((a, b) => a.name.localeCompare(b.name));
    return out;
  }, [products, selected, query, sort]);

  return (
    <div className="container page">
      <h1>Shop candles</h1>

      <div className="toolbar">
        <div className="chips" role="group" aria-label="Filter by collection (select one or more)">
          {categories.map((c) => {
            const active = c === 'All' ? selected.length === 0 : selected.includes(c);
            return (
              <button
                key={c}
                className={`chip ${active ? 'active' : ''}`}
                aria-pressed={active}
                onClick={() => (c === 'All' ? setSelected([]) : toggle(c))}
              >
                {c}
              </button>
            );
          })}
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
        <div className="center-text empty-cart empty-search-state">
          <EmptySearchIllustration />
          <h2>No candles match your search</h2>
          <p className="muted">Try searching with a different scent, note, or clear your filters.</p>
          <button type="button" className="btn btn-outline" onClick={() => { setSelected([]); setQuery(''); }}>
            View all candles
          </button>
        </div>
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
