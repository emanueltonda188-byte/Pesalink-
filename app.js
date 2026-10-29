// PesaLink v2 — prices and stores are SHARED via Supabase; each visitor's
// basket stays private in their own browser (localStorage).
// The anon key below is public by design (Supabase client key) — the data is
// protected by Row Level Security policies, not by hiding this key.
// Seeded prices are EXAMPLES, clearly labelled, not real shelf prices.
const SUPABASE_URL = "https://baucxuimppcajcafdsqx.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhdWN4dWltcHBjYWpjYWZkc3F4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMzMDU5MzMsImV4cCI6MjEwODg4MTkzM30.RFUIyH8tSGoQodpCEdijiisXJniUwsZYpmUF_KI-u9k";
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const norm = (s) => (s || "").trim().toLowerCase();
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const ksh = (n) => "KSh " + Number(n).toLocaleString("en-KE");
const fmtDate = (iso) => { try { return new Date(iso).toLocaleDateString(); } catch (e) { return ""; } };

let stores = []; // store names
let prices = []; // {id, item, size, price, store, date, example}

const BASKET_KEY = "pesabasket-basket";
let basket;
try {
  basket = JSON.parse(localStorage.getItem(BASKET_KEY)) || [
    { item: "Maize Flour", qty: 1 },
    { item: "Sugar", qty: 1 },
    { item: "Cooking Oil", qty: 1 },
  ];
} catch (e) {
  basket = [
    { item: "Maize Flour", qty: 1 },
    { item: "Sugar", qty: 1 },
    { item: "Cooking Oil", qty: 1 },
  ];
}
const saveBasket = () => localStorage.setItem(BASKET_KEY, JSON.stringify(basket));

const SEED_ITEMS = [
  ["Maize Flour", "2kg", [185, 180, 190]],
  ["Sugar", "2kg", [310, 305, 315]],
  ["Cooking Oil", "3L", [620, 615, 630]],
  ["Fresh Milk", "500ml", [65, 60, 65]],
  ["Bread", "800g", [75, 70, 80]],
  ["Rice", "5kg", [620, 610, 640]],
  ["Eggs", "Tray of 30", [480, 470, 490]],
  ["Tea Leaves", "250g", [240, 235, 250]],
];
const SEED_STORES = ["Naivas", "Quickmart", "Carrefour"];

async function loadAll() {
  const [sRes, pRes] = await Promise.all([
    sb.from("stores").select("*").order("id"),
    sb.from("prices").select("*").order("id"),
  ]);
  if (sRes.error) throw sRes.error;
  if (pRes.error) throw pRes.error;
  stores = sRes.data.map((r) => r.name);
  prices = pRes.data.map((r) => ({
    id: r.id, item: r.item, size: r.size || "", price: Number(r.price),
    store: r.store, date: fmtDate(r.created_at), example: !!r.is_example,
  }));
  if (!prices.length) {
    const rows = [];
    SEED_ITEMS.forEach(([item, size, byStore]) => {
      byStore.forEach((price, i) => {
        rows.push({ item, size, price, store: SEED_STORES[i], is_example: true });
      });
    });
    const ins = await sb.from("prices").insert(rows);
    if (ins.error) throw ins.error;
    const again = await sb.from("prices").select("*").order("id");
    if (again.error) throw again.error;
    prices = again.data.map((r) => ({
      id: r.id, item: r.item, size: r.size || "", price: Number(r.price),
      store: r.store, date: fmtDate(r.created_at), example: !!r.is_example,
    }));
  }
}

function latestPrice(item, store) {
  const found = prices.filter((p) => norm(p.item) === norm(item) && p.store === store);
  return found.length ? found[found.length - 1] : null;
}
function distinctItems() {
  const seen = new Set(), out = [];
  prices.forEach((p) => { if (!seen.has(norm(p.item))) { seen.add(norm(p.item)); out.push(p.item); } });
  return out;
}

function renderStores() {
  document.getElementById("store-chips").innerHTML =
    stores.map((s) => `<span class="chip">${esc(s)}</span>`).join("");
  document.getElementById("price-store").innerHTML =
    stores.map((s) => `<option>${esc(s)}</option>`).join("");
}

function renderPrices() {
  const list = document.getElementById("price-list");
  list.innerHTML = prices.map((p) => `
    <li>
      <span>${esc(p.item)} <small>${esc(p.size || "")}</small> — <strong>${ksh(p.price)}</strong> @ ${esc(p.store)}
      ${p.example ? '<span class="badge">example</span>' : ""} <small>(${esc(p.date)})</small></span>
      <button class="danger" data-del-price="${p.id}">×</button>
    </li>`).join("");
  list.querySelectorAll("[data-del-price]").forEach((b) =>
    b.addEventListener("click", async () => {
      await sb.from("prices").delete().eq("id", Number(b.dataset.delPrice));
      await refresh();
    }));
}

function renderBasket() {
  document.getElementById("basket-item").innerHTML =
    distinctItems().map((i) => `<option>${esc(i)}</option>`).join("");
  const list = document.getElementById("basket-list");
  if (!basket.length) {
    list.innerHTML = "<li><span class='hint'>Your basket is empty — add an item above.</span></li>";
    return;
  }
  list.innerHTML = basket.map((b, i) => `
    <li><span>${esc(b.item)} × ${b.qty}</span>
    <button class="danger" data-del-basket="${i}">×</button></li>`).join("");
  list.querySelectorAll("[data-del-basket]").forEach((btn) =>
    btn.addEventListener("click", () => {
      basket.splice(Number(btn.dataset.delBasket), 1);
      saveBasket(); renderAll();
    }));
}

function renderComparison() {
  const box = document.getElementById("comparison");
  if (!basket.length) {
    box.innerHTML = "<p class='hint'>Add items to your basket to see the comparison.</p>";
    return;
  }
  const results = stores.map((store) => {
    let total = 0;
    const missing = [];
    const lines = basket.map((b) => {
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

async function refresh() {
  try {
    await loadAll();
    renderAll();
  } catch (e) {
    document.getElementById("comparison").innerHTML =
      "<p class='hint'>Couldn't reach the shared price list — check your connection and reload.</p>";
  }
}

document.getElementById("add-store-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const input = document.getElementById("new-store");
  const name = input.value.trim();
  if (name && !stores.includes(name)) {
    try { await sb.from("stores").insert({ name }); } catch (e) { /* duplicate: ignore */ }
    await refresh();
  }
  input.value = "";
});

document.getElementById("add-price-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    await sb.from("prices").insert({
      item: document.getElementById("price-item").value.trim(),
      size: document.getElementById("price-size").value.trim(),
      price: Number(document.getElementById("price-value").value),
      store: document.getElementById("price-store").value,
      is_example: false,
    });
  } catch (e) { /* shown on next refresh if it failed */ }
  await refresh();
  document.getElementById("price-item").value = "";
  document.getElementById("price-size").value = "";
  document.getElementById("price-value").value = "";
});

document.getElementById("add-basket-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const item = document.getElementById("basket-item").value;
  const qty = Math.max(1, Number(document.getElementById("basket-qty").value) || 1);
  const existing = basket.find((b) => norm(b.item) === norm(item));
  if (existing) existing.qty += qty;
  else basket.push({ item, qty });
  saveBasket(); renderAll();
});

document.getElementById("comparison").innerHTML = "<p class='hint'>Loading shared prices…</p>";
refresh();
