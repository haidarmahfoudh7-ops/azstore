-- ============================================
-- AZ STORE — Supabase schema
-- A copier/coller dans Supabase > SQL Editor > New query > Run
-- ============================================

-- Extension utile pour générer des UUID
create extension if not exists "pgcrypto";

-- ============================================
-- TABLE: products
-- ============================================
create table if not exists public.products (
  id            uuid primary key default gen_random_uuid(),
  game          text not null,               -- ex: "Roblox"
  title         text not null,                -- nom de l'objet
  price         numeric(10,2) not null,       -- prix actuel
  old_price     numeric(10,2),                -- prix barré (promo), optionnel
  category      text not null,                -- ex: "Limited", "Dominus", "Robux", "Gamepass"
  region        text,                         -- ex: "Global", "FR"
  icon          text,                         -- nom d'icône SVG (voir js/products.js)
  badge         text,                         -- ex: "Nouveau", "Populaire", "Promo"
  img_class     text,                         -- classe css pour un dégradé/illustration
  in_stock      boolean not null default true,
  description   text,                         -- description longue (page produit)
  created_at    timestamptz not null default now()
);

-- ============================================
-- TABLE: orders
-- ============================================
create table if not exists public.orders (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references auth.users(id) on delete set null,
  product_id      uuid references public.products(id) on delete set null,
  product_title   text not null,
  amount          numeric(10,2) not null,
  status          text not null default 'pending', -- pending | paid | cancelled | delivered
  payment_method  text,                              -- ex: "whatsapp", "carte", "paypal", "crypto"
  contact         text,                               -- pseudo Roblox / contact du client
  created_at      timestamptz not null default now()
);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
alter table public.products enable row level security;
alter table public.orders   enable row level security;

-- --- PRODUCTS ---
-- Tout le monde (même non connecté) peut LIRE les produits
drop policy if exists "products_select_all" on public.products;
create policy "products_select_all"
  on public.products for select
  using (true);

-- Seul l'admin (email = admin@azstore.com) peut insérer / modifier / supprimer
drop policy if exists "products_admin_write" on public.products;
create policy "products_admin_write"
  on public.products for insert
  with check (auth.jwt() ->> 'email' = 'admin@azstore.com');

drop policy if exists "products_admin_update" on public.products;
create policy "products_admin_update"
  on public.products for update
  using (auth.jwt() ->> 'email' = 'admin@azstore.com');

drop policy if exists "products_admin_delete" on public.products;
create policy "products_admin_delete"
  on public.products for delete
  using (auth.jwt() ->> 'email' = 'admin@azstore.com');

-- --- ORDERS ---
-- Un utilisateur connecté peut créer une commande pour lui-même
drop policy if exists "orders_insert_own" on public.orders;
create policy "orders_insert_own"
  on public.orders for insert
  with check (auth.uid() = user_id);

-- Un utilisateur voit uniquement ses propres commandes, l'admin voit tout
drop policy if exists "orders_select_own_or_admin" on public.orders;
create policy "orders_select_own_or_admin"
  on public.orders for select
  using (auth.uid() = user_id or auth.jwt() ->> 'email' = 'admin@azstore.com');

-- Seul l'admin peut modifier le statut d'une commande
drop policy if exists "orders_admin_update" on public.orders;
create policy "orders_admin_update"
  on public.orders for update
  using (auth.jwt() ->> 'email' = 'admin@azstore.com');

-- Seul l'admin peut supprimer une commande
drop policy if exists "orders_admin_delete" on public.orders;
create policy "orders_admin_delete"
  on public.orders for delete
  using (auth.jwt() ->> 'email' = 'admin@azstore.com');

-- ============================================
-- DONNÉES DE DÉMO (à supprimer/modifier librement)
-- ============================================
insert into public.products (game, title, price, old_price, category, region, icon, badge, img_class, in_stock, description)
values
  ('Roblox', 'Dominus Empyreus', 899.00, 1199.00, 'Limited', 'Global', 'dominus', 'Promo', 'grad-gold', true,
   'Le légendaire Dominus Empyreus. Un des chapeaux Limited les plus recherchés de Roblox. Livraison rapide après paiement confirmé.'),
  ('Roblox', '1000 Robux', 8.50, null, 'Robux', 'Global', 'robux', 'Populaire', 'grad-green', true,
   'Recharge de 1000 Robux livrée directement sur votre compte via échange sécurisé ou gamepass.'),
  ('Roblox', 'Gamepass VIP — Blox Fruits', 4.99, 6.99, 'Gamepass', 'Global', 'gamepass', 'Nouveau', 'grad-teal', true,
   'Accès VIP au serveur Blox Fruits avec avantages exclusifs. Activation sous 24h.'),
  ('Roblox', 'Valkyrie Helm', 349.00, null, 'Limited', 'Global', 'helm', null, 'grad-silver', true,
   'Le casque Valkyrie, un classique intemporel de la collection Limited.'),
  ('Roblox', '2500 Robux', 19.90, 22.90, 'Robux', 'Global', 'robux', 'Promo', 'grad-green', true,
   'Recharge de 2500 Robux. Idéal pour débloquer vos objets préférés.'),
  ('Roblox', 'Sparkle Time Fedora', 129.00, null, 'Limited', 'Global', 'fedora', null, 'grad-pink', false,
   'Le Sparkle Time Fedora, une pièce de collection rare — actuellement en rupture de stock.')
on conflict do nothing;

-- ============================================
-- NOTE IMPORTANTE
-- ============================================
-- 1. Va dans Authentication > Settings et DÉSACTIVE "Confirm email".
-- 2. Crée un compte admin via la page register.html avec l'email : admin@azstore.com
--    (ou change cet email dans TOUTES les policies ci-dessus + js/auth.js pour qu'il corresponde à ton domaine réel)
-- 3. Les policies ci-dessus utilisent l'email exact 'admin@azstore.com' — remplace-le partout si besoin.
