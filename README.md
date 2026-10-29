# PesaLink

Compare your grocery basket across Kenyan supermarkets. Build your basket once,
see what it costs at Naivas, Quickmart, Carrefour — or any store you add.

## Run it

Just open `index.html` in a browser. No build step, no dependencies.
(Or serve it from this repo with GitHub Pages: repo Settings → Pages → deploy from the `main` branch.)

## What v2 does

- Store list starting with Naivas, Quickmart, Carrefour — add your own store by name.
- Add prices: item, size/brand, price in KSh, store. Prices and stores are
  SHARED for everyone via Supabase (project `pesalink`) — a price you add
  shows up for every visitor.
- Basket builder: items + quantities. Your basket stays private in your own
  browser (localStorage) — it is never shared.
- Comparison view: basket total per store using the latest price per item per
  store, cheapest store highlighted. Items with no price at a store are shown as
  missing — prices are never guessed.

## Data note

The seeded prices are clearly-labelled **examples** so the comparison works on
first open. Replace them with real prices from shelves and receipts.

The Supabase anon key in `app.js` is public by design (a client key) — the data
is guarded by Row Level Security policies (anon select/insert/delete, v1 open
rules). Never put the `service_role` key in frontend code. Tighter rules
(auth + ownership) are a later slice.

## Roadmap (later slices)

- Receipt-photo scanning (snap a receipt → items + prices).
- Accounts + ownership, so people can only delete their own prices.
- Price history per item per store.
