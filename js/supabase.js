// ==========================================================================
// AZ STORE — Configuration Supabase
// ==========================================================================
// Ce fichier initialise le client Supabase utilisé par toutes les pages.
// Il est chargé APRÈS le script CDN de Supabase (voir <script> dans le HTML).

const SUPABASE_URL = "https://yitjlcwylwwepfdodegz.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpdGpsY3d5bHd3ZXBmZG9kZWd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ5MDkyMDYsImV4cCI6MjEwMDQ4NTIwNn0.OS3T8m1DInURJMtKg9b3WbrofShgCQowfx5tPBJQTTA";

// Email autorisé pour l'accès à l'espace admin.
// IMPORTANT : garde cette valeur identique à celle utilisée dans
// supabase-schema.sql (policies RLS) sinon l'admin ne pourra plus
// ajouter/modifier/supprimer de produits.
const ADMIN_EMAIL = "admin@azstore.com";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
