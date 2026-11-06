# Molten Stories

Storefront for Molten Stories, a handmade candle shop. Customers browse the catalogue, fill a bag, and send their order over WhatsApp.

Built with React 18, React Router 6 and Vite 5, with [Supabase](https://supabase.com) as the backend (database, admin login and image storage).

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in the two values (see "Connecting to the backend")
npm run dev                  # start the dev server
npm run build                # production build into dist/
npm run preview              # serve the production build locally
```

Without `.env.local` the app still starts, but the shop is empty and `/admin` is unavailable, because all product data comes from the database.

## Connecting to the backend

The app reads two variables, in `.env.local` for local work and in the host's environment settings for deployment:

| Variable | Where to find it |
| --- | --- |
| `VITE_SUPABASE_URL` | Supabase dashboard → Project Settings → API (Project URL) |
| `VITE_SUPABASE_ANON_KEY` | Same page, the `anon` / publishable key. It is safe to expose. |

Never put the `service_role` / secret key or the database password in this repo or in these variables.

### Use the existing project
Ask the project owner for the URL and anon key. Reading products needs nothing more. To use `/admin` you also need an admin login from the owner. It edits the **live** catalogue, even from your machine.

### Or set up your own project (recommended for development)
1. Create a free Supabase project.
2. In the SQL Editor, run [`supabase/migrations/0001_products.sql`](supabase/migrations/0001_products.sql). It creates the `products` table, the `product-images` storage bucket and the security rules.
3. Under Authentication → Sign In / Providers → Email, keep **Enable email provider** on and turn **Allow new users to sign up** off. The rules treat every signed-in user as an admin, so open sign-ups would let anyone edit products.
4. Under Authentication → Users, add your admin user (email and password, tick Auto Confirm User).
5. Put the project URL and anon key in `.env.local`, sign in at `/admin` and add your products.

## Pages

| Route | Page |
| --- | --- |
| `/` | Home |
| `/shop` | Product catalogue with category filters |
| `/product/:id` | Product detail and gallery |
| `/bag` | Bag and WhatsApp checkout |
| `/about` | About |
| `/contact` | Contact |
| `/admin` | Product management (admin login) |

## How it works

- **Ordering:** there is no payment backend. The bag builds a pre-filled message and opens WhatsApp ([`src/utils/whatsapp.js`](src/utils/whatsapp.js)). Contact details (WhatsApp number, email, Instagram) are defined in that file.
- **Products:** stored in the Supabase `products` table (name, price, collections, description, photo URLs). [`src/data/products.js`](src/data/products.js) only holds the collection names.
- **Images:** photos uploaded in `/admin` go to the `product-images` storage bucket. The original 29 products point to files in `public/img/products/`, served by the site itself.
- **Persistence:** the bag, wishlist and theme (light/dark) are kept in the browser's `localStorage`. Products come from the database.

## Admin

`/admin` signs in with a Supabase Auth email and password. Admins can add, edit, hide and delete products and upload photos. Changes appear for all visitors straight away. Security is enforced by the database rules in the migration, not by the browser: anyone can read enabled products, and only signed-in users can write.

## Deployment

The build output is static, so any static host works. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the host's environment settings (for Netlify: Site settings → Environment variables), then redeploy. Vite reads them at build time.

[`public/_redirects`](public/_redirects) rewrites all routes to `index.html` so client-side routing works on hosts that support this format (for example Netlify or Cloudflare Pages).
