# 🚀 GUIDE DE DÉPLOIEMENT — Lacheheb Portfolio
## ✅ CHATBOT INTÉGRÉ — ZÉRO CLÉ API, ZÉRO INSCRIPTION, GRATUIT À VIE

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 FICHIERS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  index.html      → Site principal
  admin.html      → Panel admin (/admin)
  admin/index.html→ Idem (pour Cloudflare Pages)
  worker.js       → API + Chatbot (backend)
  wrangler.toml   → Config Cloudflare Worker

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 DÉPLOIEMENT EN 4 ÉTAPES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ÉTAPE 1 — Installer Wrangler
  npm install -g wrangler
  wrangler login        ← ouvre le navigateur, connectez-vous à Cloudflare

ÉTAPE 2 — Créer la base de données KV
  wrangler kv:namespace create LACHEHEB_KV
  → Copiez l'id retourné dans wrangler.toml à la ligne :
    id = "REMPLACEZ_PAR_VOTRE_KV_ID"

ÉTAPE 3 — Déployer le Worker
  wrangler deploy
  → Notez l'URL affichée, ex: https://lacheheb-api.pseudo.workers.dev

ÉTAPE 4 — Mettre l'URL dans les HTML
  Dans index.html ET admin.html, remplacez :
    const API_BASE = 'https://lacheheb-api.VOTRE_SOUS_DOMAINE.workers.dev';
  Par votre URL réelle.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 METTRE LE SITE EN LIGNE (Cloudflare Pages)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  dash.cloudflare.com → Pages → Create → Upload
  Uploadez : index.html + le dossier admin/
  → Site accessible sur votre-site.pages.dev

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 ACCÈS ADMIN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  URL  : https://votre-site.pages.dev/admin
  Code : 301263

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 POURQUOI AUCUNE CLÉ API ?
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Le chatbot fonctionne avec une base de connaissances
  intégrée directement dans worker.js. Il reconnaît les
  questions sur le profil, les formations, l'IoT, les
  réseaux, le livre, le contact, etc.
  → 100% gratuit, 100% privé, 0 dépendance externe.

  Cloudflare Workers : 100 000 req/jour GRATUIT
  Cloudflare KV      : 100 000 lectures/jour GRATUIT
  Cloudflare Pages   : Sites illimités GRATUIT
