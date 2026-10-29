# PesaLink

Compare your grocery basket across Kenyan supermarkets. Build your basket once,
see what it costs at Naivas, Quickmart, Carrefour — or any store you add.

## Run it

Just open `index.html` in a browser. No build step, no dependencies.
(Or serve it from this repo with GitHub Pages: repo Settings → Pages → deploy from the `main` branch.)

## What v1 does

- Store list starting with Naivas, Quickmart, Carrefour — add your own store by name.
- Add prices: item, size/brand, price in KSh, store. Prices are saved in the
  visitor's browser (localStorage) — no account, no shared database yet.
- Basket builder: items + quantities.
- Comparison view: basket total per store using the latest price per item per
  store, cheapest store highlighted. Items with no price at a store are shown as
  missing — prices are never guessed.

## Data note

The seeded prices are clearly-labelled **examples** so the comparison works on
first open. Replace them with real prices from shelves and receipts.

## Roadmap (later slices)

- Receipt-photo scanning (snap a receipt → items + prices).
- Shared price database + accounts, so everyone's prices build one live list.
- Price history per item per store.
