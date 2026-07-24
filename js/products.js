// ==========================================================================
// AZ STORE — Produits (js/products.js)
// Récupération depuis Supabase + rendu des cartes + filtres/recherche.
// Aucune émoji : tout est en SVG (bibliothèque ICONS ci-dessous).
// ==========================================================================

const ICONS = {
  dominus: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 2 3 7v6c0 5 4 8.5 9 9 5-.5 9-4 9-9V7l-9-5Z"/><path d="M8 11h8M8 15h5"/></svg>`,
  robux:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 2 2 8.5 12 15l10-6.5L12 2Z"/><path d="M2 15.5 12 22l10-6.5"/><path d="M2 12l10 6.5L22 12"/></svg>`,
  gamepass:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="7" width="18" height="12" rx="3"/><circle cx="8" cy="13" r="1.6"/><path d="M14 11h4M14 15h2"/></svg>`,
  helm:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 13a8 8 0 0 1 16 0v4H4v-4Z"/><path d="M4 17h16M9 13v-2M15 13v-2"/></svg>`,
  fedora:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><ellipse cx="12" cy="15" rx="9" ry="2.4"/><path d="M8 15c0-4 1.5-8 4-8s4 4 4 8"/></svg>`,
  box:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="m21 8-9-5-9 5 9 5 9-5Z"/><path d="M3 8v8l9 5 9-5V8M12 13v8"/></svg>`,
  gem:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="m6 3 12 0 4 6-10 12L2 9l4-6Z"/><path d="M2 9h20M12 3l-3 6 3 12 3-12-3-6Z"/></svg>`
};

function getIcon(name) {
  return ICONS[name] || ICONS.box;
}

const Products = {
  /** Récupère tous les produits (avec filtres optionnels) */
  async fetchAll({ category = null, search = null } = {}) {
    let query = supabaseClient.from("products").select("*").order("created_at", { ascending: false });
    if (category && category !== "all") query = query.eq("category", category);
    if (search) query = query.ilike("title", `%${search}%`);
    const { data, error } = await query;
    if (error) { console.error(error); return []; }
    return data;
  },

  /** Récupère un produit par id */
  async fetchOne(id) {
    const { data, error } = await supabaseClient.from("products").select("*").eq("id", id).single();
    if (error) { console.error(error); return null; }
    return data;
  },

  /** Liste des catégories distinctes présentes en base */
  async fetchCategories() {
    const { data, error } = await supabaseClient.from("products").select("category");
    if (error) return [];
    return [...new Set(data.map(p => p.category))];
  }
};

function formatPrice(value) {
  return `${Number(value).toFixed(2)} €`;
}

function renderProductCard(p) {
  const outClass = p.in_stock ? "" : "out";
  const badgeHtml = !p.in_stock
    ? `<span class="card-badge out">Rupture</span>`
    : (p.badge ? `<span class="card-badge">${escapeHtml(p.badge)}</span>` : "");

  return `
    <div class="card" data-id="${p.id}">
      <a href="product.html?id=${p.id}" class="card-link">
        <div class="card-visual ${p.img_class || 'grad-green'}">
          ${badgeHtml}
          ${getIcon(p.icon)}
        </div>
        <div class="card-body">
          <span class="card-category">${escapeHtml(p.category)}</span>
          <h3 class="card-title">${escapeHtml(p.title)}</h3>
        </div>
      </a>
      <div class="card-body" style="padding-top:0;">
        <div class="card-footer">
          <div class="card-price">
            <span class="now">${formatPrice(p.price)}</span>
            ${p.old_price ? `<span class="old">${formatPrice(p.old_price)}</span>` : ""}
          </div>
          <button class="card-add" data-add-id="${p.id}" ${!p.in_stock ? "disabled" : ""} aria-label="Ajouter au panier" title="Ajouter au panier">
            <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6h15l-1.5 9h-12L5 3H2"/><circle cx="9" cy="20" r="1"/><circle cx="18" cy="20" r="1"/></svg>
          </button>
        </div>
      </div>
    </div>
  `;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

// --------------------------------------------------------------------------
// Logique de la page d'accueil (index.html)
// --------------------------------------------------------------------------
let currentCategory = "all";
let currentSearch = "";
let searchDebounce = null;

async function loadAndRenderProducts() {
  const grid = document.getElementById("productsGrid");
  if (!grid) return;

  grid.innerHTML = Array.from({ length: 8 }).map(() => `<div class="skeleton"></div>`).join("");

  const items = await Products.fetchAll({ category: currentCategory, search: currentSearch });

  document.getElementById("resultCount") && (document.getElementById("resultCount").textContent = `${items.length} objet${items.length > 1 ? "s" : ""}`);

  if (items.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
        <p>Aucun objet ne correspond à ta recherche.</p>
      </div>`;
    return;
  }

  grid.innerHTML = items.map(renderProductCard).join("");

  grid.querySelectorAll("[data-add-id]").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const id = btn.getAttribute("data-add-id");
      const item = items.find(i => i.id === id);
      if (item) { Cart.add(item); showToast("Ajouté au panier"); }
    });
  });
}

async function initCategoryChips() {
  const bar = document.getElementById("categoryChips");
  if (!bar) return;
  const categories = await Products.fetchCategories();

  bar.innerHTML = [`<button class="chip active" data-cat="all">Tous</button>`]
    .concat(categories.map(c => `<button class="chip" data-cat="${escapeHtml(c)}">${escapeHtml(c)}</button>`))
    .join("");

  bar.querySelectorAll(".chip").forEach(chip => {
    chip.addEventListener("click", () => {
      bar.querySelectorAll(".chip").forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      currentCategory = chip.getAttribute("data-cat");
      loadAndRenderProducts();
    });
  });
}

function initSearch() {
  const input = document.getElementById("searchInput");
  if (!input) return;
  input.addEventListener("input", () => {
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(() => {
      currentSearch = input.value.trim();
      loadAndRenderProducts();
    }, 300);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("productsGrid")) {
    initCategoryChips();
    initSearch();
    loadAndRenderProducts();
  }
});
