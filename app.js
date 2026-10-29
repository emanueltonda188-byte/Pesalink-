// PesaLink v1 — static app, prices saved in the visitor's browser (localStorage).
// Seeded prices are EXAMPLES, clearly labelled, not real shelf prices.
const KEY = "pesabasket-v1";
const norm = (s) => (s || "").trim().toLowerCase();
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const ksh = (n) => "KSh " + Number(n).toLocaleString("en-KE");

function seed() {
  const stores = ["Naivas", "Quickmart", "Carrefour"];
  const items = [
    ["Maize Flour", "2kg", [185, 180, 190]],
    ["Sugar", "2kg", [310, 305, 315]],
    ["Cooking Oil", "3L", [620, 615, 630]],
    ["Fresh Milk", "500ml", [65, 60, 65]],
    ["Bread", "800g", [75, 70, 80]],
    ["Rice", "5kg", [620, 610, 640]],
    ["Eggs", "Tray of 30", [480, 470, 490]],
    ["Tea Leaves", "250g", [240, 235, 250]],
  ];
  const prices = [];
  items.forEach(([item, size, byStore]) => {
    byStore.forEach((price, i) => {
      prices.push({ id: "ex-" + norm(item) + "-" + i, item, size, price, store: stores[i],
        date: new Date().toLocaleDateString(), example: true });
    });
  });
  return {
    stores,
    prices,
    basket: [
      { item: "Maize Flour", qty: 1 },
      { item: "Sugar", qty: 1 },
      { item: "Cooking Oil", qty: 1 },
    ],
  };
}

let state;
try {
  state = JSON.parse(localStorage.getItem(KEY)) || seed();
} catch (e) {
  state = seed();
}
const save = () => localStorage.setItem(KEY, JSON.stringify(state));
const uid = () => "p" + Date.now() + Math.floor(Math.random() * 1000);

function latestPrice(item, store) {
  const found = state.prices.filter((p) => norm(p.item) === norm(item) && p.store === store);
  return found.length ? found[found.length - 1] : null;
}
function distinctItems() {
  const seen = new Set(), out = [];
  state.prices.forEach((p) => { if (!seen.has(norm(p.item))) { seen.add(norm(p.item)); out.push(p.item); } });
  return out;
}

function renderStores() {
  document.getElementById("store-chips").innerHTML =
    state.stores.map((s) => `<span class="chip">${esc(s)}</span>`).join("");
  const sel = document.getElementById("price-store");
  sel.innerHTML = state.stores.map((s) => `<option>${esc(s)}</option>`).join("");
}

function renderPrices() {
  const list = document.getElementById("price-list");
  list.innerHTML = state.prices.map((p) => `
    <li>
      <span>${esc(p.item)} <small>${esc(p.size || "")}</small> — <strong>${ksh(p.price)}</strong> @ ${esc(p.store)}
      ${p.example ? '<span class="badge">example</span>' : ""} <small>(${esc(p.date)})</small></span>
      <button class="danger" data-del-price="${p.id}">×</button>
    </li>`).join("");
  list.querySelectorAll("[data-del-price]").forEach((b) =>
    b.addEventListener("click", () => {
      state.prices = state.prices.filter((p) => p.id !== b.dataset.delPrice);
      save(); renderAll();
    }));
}

function renderBasket() {
  const sel = document.getElementById("basket-item");
  sel.innerHTML = distinctItems().map((i) => `<option>${esc(i)}</option>`).join("");
  const list = document.getElementById("basket-list");
  if (!state.basket.length) {
    list.innerHTML = "<li><span class='hint'>Your basket is empty — add an item above.</span></li>";
    return;
  }
  list.innerHTML = state.basket.map((b, i) => `
    <li><span>${esc(b.item)} × ${b.qty}</span>
    <button class="danger" data-del-basket="${i}">×</button></li>`).join("");
  list.querySelectorAll("[data-del-basket]").forEach((btn) =>
    btn.addEventListener("click", () => {
      state.basket.splice(Number(btn.dataset.delBasket), 1);
      save(); renderAll();
    }));
}

function renderComparison() {
  const box = document.getElementById("comparison");
  if (!state.basket.length) {
    box.innerHTML = "<p class='hint'>Add items to your basket to see the comparison.</p>";
    return;
  }
  const results = state.stores.map((store) => {
    let total = 0;
    const missing = [];
    const lines = state.basket.map((b) => {
      const p = latestPrice(b.item, store);
      if (!p) { missing.push(b.item); return `${esc(b.item)} × ${b.qty} — <span class="missing">no price yet</span>`; }
      total += p.price * b.qty;
      return `${esc(b.item)} × ${b.qty} — ${ksh(p.price * b.qty)}`;
    });
    return { store, total, missing, lines };
  });
  const complete = results.filter((r) => !r.missing.length);
  const cheapest = complete.length ? complete.reduce((a, b) => (b.total < a.total ? b : a)) : null;
  box.innerHTML = results.map((r) => `
    <div class="store-result ${cheapest && r.store === cheapest.store ? "cheapest" : ""}">
      <h3>${esc(r.store)} ${cheapest && r.store === cheapest.store ? '<span class="badge">cheapest</span>' : ""}</h3>
      <div class="total">${ksh(r.total)}</div>
      <div>${r.lines.join("<br>")}</div>
      ${r.missing.length ? `<div class="missing">${r.missing.length} item(s) missing a price at this store.</div>` : ""}
    </div>`).join("");
  if (!cheapest) {
    box.innerHTML += "<p class='hint'>No store has a price for every basket item yet — add the missing prices to get a fair cheapest badge.</p>";
  }
}

function renderAll() { renderStores(); renderPrices(); renderBasket(); renderComparison(); }

document.getElementById("add-store-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const input = document.getElementById("new-store");
  const name = input.value.trim();
  if (name && !state.stores.includes(name)) { state.stores.push(name); save(); renderAll(); }
  input.value = "";
});

document.getElementById("add-price-form").addEventListener("submit", (e) => {
  e.preventDefault();
  state.prices.push({
    id: uid(),
    item: document.getElementById("price-item").value.trim(),
    size: document.getElementById("price-size").value.trim(),
    price: Number(document.getElementById("price-value").value),
    store: document.getElementById("price-store").value,
    date: new Date().toLocaleDateString(),
    example: false,
  });
  save(); renderAll();
  document.getElementById("price-item").value = "";
  document.getElementById("price-size").value = "";
  document.getElementById("price-value").value = "";
});

document.getElementById("add-basket-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const item = document.getElementById("basket-item").value;
  const qty = Math.max(1, Number(document.getElementById("basket-qty").value) || 1);
  const existing = state.basket.find((b) => norm(b.item) === norm(item));
  if (existing) existing.qty += qty;
  else state.basket.push({ item, qty });
  save(); renderAll();
});

renderAll();
