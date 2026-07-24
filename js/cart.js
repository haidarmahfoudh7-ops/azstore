// ==========================================================================
// AZ STORE — Panier (js/cart.js)
// Le panier est stocké dans localStorage (clé "azstore_cart").
// Structure : [{ id, title, price, icon, img_class, qty }]
// ==========================================================================

const CART_KEY = "azstore_cart";

const Cart = {
  getAll() {
    try {
      return JSON.parse(localStorage.getItem(CART_KEY)) || [];
    } catch {
      return [];
    }
  },

  save(items) {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
    updateCartUI();
  },

  add(product, qty = 1) {
    const items = this.getAll();
    const existing = items.find(i => i.id === product.id);
    if (existing) {
      existing.qty += qty;
    } else {
      items.push({
        id: product.id,
        title: product.title,
        price: product.price,
        icon: product.icon,
        img_class: product.img_class,
        qty
      });
    }
    this.save(items);
  },

  updateQty(id, qty) {
    let items = this.getAll();
    if (qty <= 0) {
      items = items.filter(i => i.id !== id);
    } else {
      const item = items.find(i => i.id === id);
      if (item) item.qty = qty;
    }
    this.save(items);
  },

  remove(id) {
    const items = this.getAll().filter(i => i.id !== id);
    this.save(items);
  },

  clear() {
    this.save([]);
  },

  count() {
    return this.getAll().reduce((sum, i) => sum + i.qty, 0);
  },

  total() {
    return this.getAll().reduce((sum, i) => sum + i.price * i.qty, 0);
  }
};

// --------------------------------------------------------------------------
// UI : drawer du panier (présent sur toutes les pages via partial nav)
// --------------------------------------------------------------------------
function renderCartDrawer() {
  const container = document.getElementById("cartItems");
  const footer = document.getElementById("cartFooter");
  if (!container) return;

  const items = Cart.getAll();

  if (items.length === 0) {
    container.innerHTML = `
      <div class="cart-empty">
        <svg viewBox="0 0 24 24" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6h15l-1.5 9h-12L5 3H2"/><circle cx="9" cy="20" r="1"/><circle cx="18" cy="20" r="1"/></svg>
        <p>Ton panier est vide.</p>
      </div>`;
    if (footer) footer.style.display = "none";
    return;
  }

  if (footer) footer.style.display = "block";

  container.innerHTML = items.map(i => `
    <div class="cart-item" data-id="${i.id}">
      <div class="cart-item-visual ${i.img_class || 'grad-green'}">${getIcon(i.icon)}</div>
      <div class="cart-item-info">
        <div class="title">${escapeHtml(i.title)}</div>
        <div class="price">${formatPrice(i.price * i.qty)}</div>
        <div class="cart-item-qty">
          <button class="qty-btn" data-decr="${i.id}">−</button>
          <span>${i.qty}</span>
          <button class="qty-btn" data-incr="${i.id}">+</button>
        </div>
      </div>
      <button class="cart-item-remove" data-remove="${i.id}" aria-label="Retirer">
        <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
  `).join("");

  container.querySelectorAll("[data-incr]").forEach(b => b.addEventListener("click", () => {
    const item = Cart.getAll().find(i => i.id === b.getAttribute("data-incr"));
    Cart.updateQty(item.id, item.qty + 1);
    renderCartDrawer();
  }));
  container.querySelectorAll("[data-decr]").forEach(b => b.addEventListener("click", () => {
    const item = Cart.getAll().find(i => i.id === b.getAttribute("data-decr"));
    Cart.updateQty(item.id, item.qty - 1);
    renderCartDrawer();
  }));
  container.querySelectorAll("[data-remove]").forEach(b => b.addEventListener("click", () => {
    Cart.remove(b.getAttribute("data-remove"));
    renderCartDrawer();
  }));

  const totalEl = document.getElementById("cartTotalAmount");
  if (totalEl) totalEl.textContent = formatPrice(Cart.total());
}

function updateCartUI() {
  const countEl = document.getElementById("cartCount");
  if (countEl) {
    const n = Cart.count();
    countEl.textContent = n;
    countEl.style.display = n > 0 ? "flex" : "none";
  }
  renderCartDrawer();
}

function openCartDrawer() {
  document.getElementById("cartOverlay")?.classList.add("open");
  document.getElementById("cartDrawer")?.classList.add("open");
}
function closeCartDrawer() {
  document.getElementById("cartOverlay")?.classList.remove("open");
  document.getElementById("cartDrawer")?.classList.remove("open");
}

function showToast(message) {
  let toast = document.getElementById("azToast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "azToast";
    toast.className = "toast";
    toast.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg><span></span>`;
    document.body.appendChild(toast);
  }
  toast.querySelector("span").textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.classList.remove("show"), 2200);
}

document.addEventListener("DOMContentLoaded", () => {
  updateCartUI();
  document.getElementById("cartToggle")?.addEventListener("click", openCartDrawer);
  document.getElementById("cartClose")?.addEventListener("click", closeCartDrawer);
  document.getElementById("cartOverlay")?.addEventListener("click", closeCartDrawer);
  document.getElementById("mobileNavToggle")?.addEventListener("click", () => {
    document.getElementById("navLinksMobile")?.classList.toggle("open");
  });
});
