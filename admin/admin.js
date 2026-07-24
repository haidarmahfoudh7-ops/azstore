// ==========================================================================
// AZ STORE — Logique de la lobe admin (admin/admin.js)
// Accès réservé à ADMIN_EMAIL (voir js/supabase.js + policies RLS).
// ==========================================================================

let allProducts = [];
let allOrders = [];
let editingProductId = null;

// --------------------------------------------------------------------------
// Protection de la route
// --------------------------------------------------------------------------
async function guardAdmin() {
  const user = await Auth.getUser();
  if (!user || user.email !== ADMIN_EMAIL) {
    window.location.href = "../login.html";
    return false;
  }
  return true;
}

// --------------------------------------------------------------------------
// Chargement des données
// --------------------------------------------------------------------------
async function loadProducts() {
  const { data, error } = await supabaseClient.from("products").select("*").order("created_at", { ascending: false });
  if (error) { console.error(error); return; }
  allProducts = data;
  renderProductsTable();
  renderStats();
}

async function loadOrders() {
  const { data, error } = await supabaseClient.from("orders").select("*").order("created_at", { ascending: false });
  if (error) { console.error(error); return; }
  allOrders = data;
  renderOrdersTable();
  renderStats();
}

function renderStats() {
  const revenue = allOrders.filter(o => o.status === "paid" || o.status === "delivered")
    .reduce((sum, o) => sum + Number(o.amount), 0);
  document.getElementById("statProducts").textContent = allProducts.length;
  document.getElementById("statOrders").textContent = allOrders.length;
  document.getElementById("statPending").textContent = allOrders.filter(o => o.status === "pending").length;
  document.getElementById("statRevenue").textContent = `${revenue.toFixed(2)} €`;
}

// --------------------------------------------------------------------------
// Tableau produits
// --------------------------------------------------------------------------
function renderProductsTable() {
  const tbody = document.getElementById("productsTableBody");
  if (!tbody) return;

  if (allProducts.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7">Aucun produit pour le moment.</td></tr>`;
    return;
  }

  tbody.innerHTML = allProducts.map(p => `
    <tr>
      <td>${escapeHtml(p.title)}</td>
      <td>${escapeHtml(p.category)}</td>
      <td>${formatPrice(p.price)}</td>
      <td>${p.old_price ? formatPrice(p.old_price) : "—"}</td>
      <td>${p.in_stock ? '<span class="badge-status paid">En stock</span>' : '<span class="badge-status cancelled">Rupture</span>'}</td>
      <td>${escapeHtml(p.badge || "—")}</td>
      <td>
        <div class="table-actions">
          <button data-edit="${p.id}" title="Modifier">
            <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5Z"/></svg>
          </button>
          <button data-del="${p.id}" class="del" title="Supprimer">
            <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6"/></svg>
          </button>
        </div>
      </td>
    </tr>
  `).join("");

  tbody.querySelectorAll("[data-edit]").forEach(b => b.addEventListener("click", () => openProductModal(b.getAttribute("data-edit"))));
  tbody.querySelectorAll("[data-del]").forEach(b => b.addEventListener("click", () => deleteProduct(b.getAttribute("data-del"))));
}

function openProductModal(id = null) {
  editingProductId = id;
  const p = id ? allProducts.find(x => x.id === id) : null;

  document.getElementById("modalTitle").textContent = p ? "Modifier l'objet" : "Ajouter un objet";
  document.getElementById("pTitle").value = p?.title || "";
  document.getElementById("pGame").value = p?.game || "Roblox";
  document.getElementById("pCategory").value = p?.category || "";
  document.getElementById("pPrice").value = p?.price || "";
  document.getElementById("pOldPrice").value = p?.old_price || "";
  document.getElementById("pRegion").value = p?.region || "Global";
  document.getElementById("pIcon").value = p?.icon || "box";
  document.getElementById("pImgClass").value = p?.img_class || "grad-green";
  document.getElementById("pBadge").value = p?.badge || "";
  document.getElementById("pDescription").value = p?.description || "";
  document.getElementById("pInStock").checked = p ? p.in_stock : true;

  document.getElementById("productModalOverlay").classList.add("open");
}

function closeProductModal() {
  document.getElementById("productModalOverlay").classList.remove("open");
  editingProductId = null;
}

async function saveProduct(e) {
  e.preventDefault();
  const payload = {
    title: document.getElementById("pTitle").value.trim(),
    game: document.getElementById("pGame").value.trim(),
    category: document.getElementById("pCategory").value.trim(),
    price: parseFloat(document.getElementById("pPrice").value),
    old_price: document.getElementById("pOldPrice").value ? parseFloat(document.getElementById("pOldPrice").value) : null,
    region: document.getElementById("pRegion").value.trim(),
    icon: document.getElementById("pIcon").value.trim(),
    img_class: document.getElementById("pImgClass").value.trim(),
    badge: document.getElementById("pBadge").value.trim() || null,
    description: document.getElementById("pDescription").value.trim(),
    in_stock: document.getElementById("pInStock").checked
  };

  const saveBtn = document.getElementById("saveProductBtn");
  saveBtn.disabled = true;
  saveBtn.textContent = "Enregistrement...";

  try {
    if (editingProductId) {
      const { error } = await supabaseClient.from("products").update(payload).eq("id", editingProductId);
      if (error) throw error;
      showToast("Objet mis à jour");
    } else {
      const { error } = await supabaseClient.from("products").insert(payload);
      if (error) throw error;
      showToast("Objet ajouté");
    }
    closeProductModal();
    await loadProducts();
  } catch (err) {
    console.error(err);
    alert("Erreur : " + err.message);
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = "Enregistrer";
  }
}

async function deleteProduct(id) {
  if (!confirm("Supprimer définitivement cet objet ?")) return;
  const { error } = await supabaseClient.from("products").delete().eq("id", id);
  if (error) { alert("Erreur : " + error.message); return; }
  showToast("Objet supprimé");
  await loadProducts();
}

// --------------------------------------------------------------------------
// Tableau commandes
// --------------------------------------------------------------------------
function renderOrdersTable() {
  const tbody = document.getElementById("ordersTableBody");
  if (!tbody) return;

  if (allOrders.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6">Aucune commande pour le moment.</td></tr>`;
    return;
  }

  tbody.innerHTML = allOrders.map(o => `
    <tr>
      <td>${escapeHtml(o.product_title)}</td>
      <td>${escapeHtml(o.contact || "—")}</td>
      <td>${formatPrice(o.amount)}</td>
      <td>${escapeHtml(o.payment_method || "—")}</td>
      <td>
        <select data-status="${o.id}" class="select-mini">
          <option value="pending" ${o.status === "pending" ? "selected" : ""}>En attente</option>
          <option value="paid" ${o.status === "paid" ? "selected" : ""}>Payée</option>
          <option value="delivered" ${o.status === "delivered" ? "selected" : ""}>Livrée</option>
          <option value="cancelled" ${o.status === "cancelled" ? "selected" : ""}>Annulée</option>
        </select>
      </td>
      <td>
        <div class="table-actions">
          <button data-del-order="${o.id}" class="del" title="Supprimer">
            <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6"/></svg>
          </button>
        </div>
      </td>
    </tr>
  `).join("");

  tbody.querySelectorAll("[data-status]").forEach(sel => {
    sel.addEventListener("change", async () => {
      const { error } = await supabaseClient.from("orders").update({ status: sel.value }).eq("id", sel.getAttribute("data-status"));
      if (error) { alert("Erreur : " + error.message); return; }
      showToast("Statut mis à jour");
      await loadOrders();
    });
  });
  tbody.querySelectorAll("[data-del-order]").forEach(b => {
    b.addEventListener("click", async () => {
      if (!confirm("Supprimer cette commande ?")) return;
      const { error } = await supabaseClient.from("orders").delete().eq("id", b.getAttribute("data-del-order"));
      if (error) { alert("Erreur : " + error.message); return; }
      showToast("Commande supprimée");
      await loadOrders();
    });
  });
}

// --------------------------------------------------------------------------
// Navigation entre panneaux
// --------------------------------------------------------------------------
function initAdminNav() {
  document.querySelectorAll(".admin-nav [data-panel]").forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      document.querySelectorAll(".admin-nav a").forEach(a => a.classList.remove("active"));
      link.classList.add("active");
      document.querySelectorAll(".admin-panel").forEach(p => p.style.display = "none");
      document.getElementById(link.getAttribute("data-panel")).style.display = "block";
    });
  });
}

// --------------------------------------------------------------------------
// Init
// --------------------------------------------------------------------------
document.addEventListener("DOMContentLoaded", async () => {
  const ok = await guardAdmin();
  if (!ok) return;

  document.getElementById("adminShell").style.display = "flex";
  initAdminNav();
  await loadProducts();
  await loadOrders();

  document.getElementById("addProductBtn").addEventListener("click", () => openProductModal());
  document.getElementById("productForm").addEventListener("submit", saveProduct);
  document.getElementById("closeProductModal").addEventListener("click", closeProductModal);
  document.getElementById("cancelProductModal").addEventListener("click", closeProductModal);
  document.getElementById("logoutBtnAdmin").addEventListener("click", () => Auth.logout());
  document.getElementById("mobileMenuToggle")?.addEventListener("click", () => {
    document.getElementById("adminSide").classList.toggle("open");
  });
});
