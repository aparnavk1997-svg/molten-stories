// Product data (names, prices, photos) lives in the Supabase `products` table — see ProductsContext.
// This file only holds the collection names shared by the shop and admin pages.
export const categories = ['All', 'Floral', 'Decorative', 'Everyday', 'Gifting'];

// A product can sit in several collections via `categories`; older entries only have a single `category`.
export const categoriesOf = (p) =>
  Array.isArray(p.categories) && p.categories.length ? p.categories : [p.category];
