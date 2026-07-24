// ==========================================================================
// AZ STORE — Système d'authentification (js/auth.js)
// Utilise Supabase Auth. Confirmation d'e-mail désactivée côté projet
// (Authentication > Settings > Confirm email = OFF).
// ==========================================================================

const Auth = {
  /** Retourne la session active (ou null) */
  async getSession() {
    const { data, error } = await supabaseClient.auth.getSession();
    if (error) { console.error(error); return null; }
    return data.session;
  },

  /** Retourne l'utilisateur courant (ou null) */
  async getUser() {
    const session = await this.getSession();
    return session ? session.user : null;
  },

  /** true si l'utilisateur courant est l'admin */
  async isAdmin() {
    const user = await this.getUser();
    return !!user && user.email === ADMIN_EMAIL;
  },

  /** Création de compte */
  async register(email, password, pseudo) {
    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,
      options: { data: { pseudo: pseudo || "" } }
    });
    if (error) throw error;
    // Comme la confirmation d'e-mail est désactivée, Supabase renvoie
    // directement une session active -> connexion immédiate.
    return data;
  },

  /** Connexion */
  async login(email, password) {
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  /** Déconnexion */
  async logout() {
    await supabaseClient.auth.signOut();
    window.location.href = "index.html";
  },

  /** Messages d'erreur Supabase traduits en français */
  translateError(error) {
    const msg = (error && error.message) || "";
    if (msg.includes("Invalid login credentials")) return "E-mail ou mot de passe incorrect.";
    if (msg.includes("User already registered")) return "Un compte existe déjà avec cet e-mail.";
    if (msg.includes("Password should be at least")) return "Le mot de passe doit contenir au moins 6 caractères.";
    if (msg.includes("Unable to validate email")) return "Adresse e-mail invalide.";
    return msg || "Une erreur est survenue. Réessaie.";
  }
};

// --------------------------------------------------------------------------
// Mise à jour de la navbar selon l'état de connexion
// (appelé automatiquement si un élément #navAuthSlot existe sur la page)
// --------------------------------------------------------------------------
async function renderNavAuth() {
  const slot = document.getElementById("navAuthSlot");
  if (!slot) return;

  const user = await Auth.getUser();
  const isAdmin = user && user.email === ADMIN_EMAIL;

  if (user) {
    slot.innerHTML = `
      ${isAdmin ? `<a href="${location.pathname.includes('/admin/') ? '' : 'admin/'}index.html" class="nav-links-admin">Admin</a>` : ""}
      <button id="logoutBtn" class="icon-btn" title="Se déconnecter" aria-label="Se déconnecter">
        <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
      </button>
    `;
    document.getElementById("logoutBtn").addEventListener("click", () => Auth.logout());
  } else {
    slot.innerHTML = `<a href="${location.pathname.includes('/admin/') ? '../' : ''}login.html" class="nav-links-login">Se connecter</a>`;
  }
}

document.addEventListener("DOMContentLoaded", renderNavAuth);
