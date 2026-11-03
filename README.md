# Molten Stories

Storefront for Molten Stories, a handmade candle shop. Customers browse the catalogue, fill a bag, and send their order over WhatsApp.

Built with React 18, React Router 6 and Vite 5.

## Getting started

```bash
npm install
npm run dev       # start the dev server
npm run build     # production build into dist/
npm run preview   # serve the production build locally
```

## Pages

| Route | Page |
| --- | --- |
| `/` | Home |
| `/shop` | Product catalogue with category filters |
| `/product/:id` | Product detail and gallery |
| `/bag` | Bag and WhatsApp checkout |
| `/about` | About |
| `/contact` | Contact |
| `/admin` | Passcode-protected product management |

## How it works

- **Ordering:** there is no payment backend. The bag builds a pre-filled message and opens WhatsApp ([`src/utils/whatsapp.js`](src/utils/whatsapp.js)). Contact details (WhatsApp number, email, Instagram) are defined in that file.
- **Products:** the default catalogue lives in [`src/data/products.js`](src/data/products.js). Images are in `public/img/`.
- **Persistence:** the bag, theme (light/dark) and any products edited in the admin page are stored in the browser's `localStorage`. Nothing is sent to a server.

## Admin

`/admin` lets you add and edit products, including image uploads, which are downscaled and stored in the browser. The default passcode is `molten-admin`. Set your own at build time:

```bash
VITE_ADMIN_PASSCODE=your-passcode npm run build
```

The passcode check runs in the browser and is **not real security**. It only keeps casual visitors out, and the passcode is visible in the built JavaScript. Because edits are stored in `localStorage`, they apply only to the browser where they were made.

## Deployment

The build output is static. [`public/_redirects`](public/_redirects) rewrites all routes to `index.html` so client-side routing works on hosts that support this format (for example Netlify or Cloudflare Pages).
