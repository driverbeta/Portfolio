# 📋 GUIDE DE DÉPLOIEMENT — A. Lacheheb Portfolio
# Chatbot : GROQ (100% GRATUIT)

## 📁 FICHIERS

| Fichier      | Rôle                                    |
|--------------|-----------------------------------------|
| index.html   | Site principal (Cloudflare Pages)       |
| admin.html   | Panel admin → accès via /admin          |
| worker.js    | API Cloudflare Worker (backend)         |
| wrangler.toml| Config du Worker                        |

---

## ✅ ÉTAPE 1 — Clé Groq GRATUITE (pour le chatbot)

1. Allez sur https://console.groq.com
2. Créez un compte (gratuit, pas de CB)
3. API Keys → "Create API Key"
4. Copiez votre clé (commence par gsk_...)

---

## ✅ ÉTAPE 2 — Installer Wrangler

```bash
npm install -g wrangler
wrangler login
```

---

## ✅ ÉTAPE 3 — Créer le KV (base de données)

```bash
wrangler kv:namespace create LACHEHEB_KV
```

Copiez l'id retourné et collez-le dans wrangler.toml :
```toml
[[kv_namespaces]]
binding = "LACHEHEB_KV"
id = "VOTRE_ID_ICI"
```

---

## ✅ ÉTAPE 4 — Ajouter la clé Groq

```bash
wrangler secret put GROQ_API_KEY
# → Entrez votre clé gsk_...
```

---

## ✅ ÉTAPE 5 — Déployer le Worker

```bash
wrangler deploy
```

Notez l'URL affichée, ex: https://lacheheb-api.pseudo.workers.dev

---

## ✅ ÉTAPE 6 — Mettre à jour l'URL dans les fichiers HTML

Dans index.html ET admin.html, remplacez :
  const API_BASE = 'https://lacheheb-api.VOTRE_SOUS_DOMAINE.workers.dev';
Par votre URL réelle.

---

## ✅ ÉTAPE 7 — Déployer le site sur Cloudflare Pages

Via le dashboard Cloudflare → Pages → Upload
Uploadez index.html et admin.html (renommez admin.html en admin/index.html)

---

## 🔐 ACCÈS ADMIN

- URL  : https://votre-site.pages.dev/admin
- Code : 301263

---

## 📊 FONCTIONNEMENT STATISTIQUES

- Visiteur unique : 1 comptage par IP sur 365 jours
- Visite du jour  : 1 comptage par IP par jour (repart à 0 le lendemain)
- IPs visibles seulement dans l'admin, jamais côté public

---

## 🤖 CHATBOT GROQ — Limites gratuites

- 6 000 tokens/minute (largement suffisant)
- 500 000 tokens/jour
- 14 400 requêtes/jour
→ Totalement gratuit, sans CB, sans limite de durée
