/**
 * ═══════════════════════════════════════════════════════════════
 *  LACHEHEB PORTFOLIO – Cloudflare Worker API
 *  Chatbot : GROQ API (100% GRATUIT — https://console.groq.com)
 *  Modèle  : llama-3.1-8b-instant (rapide & gratuit)
 *
 *  ENDPOINTS :
 *   POST /track          → Enregistre une visite (dédupliquée par IP)
 *   GET  /stats          → Statistiques de visites
 *   POST /chat           → Chatbot IA via Groq (GRATUIT)
 *   POST /message        → Envoi message visiteur → admin
 *   GET  /reply-check    → Vérifie si l'admin a répondu
 *   POST /admin/login    → Connexion admin (code 301263)
 *   GET  /admin/messages → Liste messages (auth requise)
 *   POST /admin/reply    → Répondre à un message (auth requise)
 * ═══════════════════════════════════════════════════════════════
 *
 *  VARIABLES À CONFIGURER :
 *   GROQ_API_KEY  → Clé GRATUITE sur https://console.groq.com
 *   ADMIN_CODE    → Déjà défini dans wrangler.toml : 301263
 *   LACHEHEB_KV   → Namespace KV Cloudflare (voir README)
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}
function err(msg, status = 400) { return json({ error: msg }, status); }

const SYSTEM_PROMPT = `Tu es l'assistant virtuel d'Abderrahmane LACHEHEB, enseignant et fonctionnaire de l'Éducation Nationale française.

PROFIL :
- Professeur en technologies du numérique depuis 35+ ans
- Établissement actuel : ORT Daniel Mayer, Montreuil (Île-de-France)
- Formation initiale : Ingénieur en Électronique, USTO-MB (Oran, Algérie)
- Spécialité : IoT, ESP32, LoRa/LoRaWAN, réseaux, systèmes communicants

FILIÈRES ENSEIGNÉES :
- STI2D spécialité SIN (Systèmes d'Information et Numérique)
- Bac Pro CIEL (Cybersécurité, Informatique, Électronique, Réseaux)
- BTS CIEL (Cybersécurité, Informatique, Réseaux, Électronique)
- BTS SIO option SISR (Solutions d'Infrastructure, Systèmes et Réseaux)

CERTIFICATIONS : Cisco CCNA 1 & 2, Réseaux Locaux Industriels (INSA Lyon)

PROJET ÉDITORIAL :
- 2016 : contribution au livre "Systèmes numériques 1re/Tle Bac Pro SN" (Delagrave), chapitre Fibre optique
- ISBN : 978-2-206-10186-6
- Projet actuel : recherche d'éditeur pour un ouvrage STI2D-SIN / BTS CIEL

LANGUES : Français (courant), Arabe (courant), Anglais (professionnel), Allemand (notions)

RÈGLES :
- Réponds TOUJOURS en français, de façon professionnelle et courtoise
- Sois concis (2-3 phrases max sauf si explication détaillée demandée)
- Pour contacter M. Lacheheb, invite à utiliser le formulaire de contact
- Ne réponds qu'aux questions en lien avec son profil`;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    if (request.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
    try {
      if (path === '/track'          && request.method === 'POST') return handleTrack(request, env);
      if (path === '/stats'          && request.method === 'GET')  return handleStats(env);
      if (path === '/chat'           && request.method === 'POST') return handleChat(request, env);
      if (path === '/message'        && request.method === 'POST') return handleMessage(request, env);
      if (path === '/reply-check'    && request.method === 'GET')  return handleReplyCheck(url, env);
      if (path === '/admin/login'    && request.method === 'POST') return handleAdminLogin(request, env);
      if (path === '/admin/messages' && request.method === 'GET')  return handleAdminMessages(request, env);
      if (path === '/admin/reply'    && request.method === 'POST') return handleAdminReply(request, env);
      return err('Route introuvable', 404);
    } catch (e) { return err('Erreur serveur : ' + e.message, 500); }
  }
};

async function handleTrack(request, env) {
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const today = new Date().toISOString().slice(0, 10);
  const country = request.cf?.country || 'XX';
  const ipKey = `ip:${ip}`;
  if (!await env.LACHEHEB_KV.get(ipKey)) {
    const total = parseInt(await env.LACHEHEB_KV.get('stats:total_unique') || '0');
    await env.LACHEHEB_KV.put('stats:total_unique', String(total + 1));
    await env.LACHEHEB_KV.put(ipKey, '1', { expirationTtl: 31536000 });
  }
  const todayIpKey = `today:${today}:${ip}`;
  if (!await env.LACHEHEB_KV.get(todayIpKey)) {
    const todayCount = parseInt(await env.LACHEHEB_KV.get(`stats:today:${today}`) || '0');
    await env.LACHEHEB_KV.put(`stats:today:${today}`, String(todayCount + 1));
    await env.LACHEHEB_KV.put(todayIpKey, '1', { expirationTtl: 86400 });
  }
  const cCount = parseInt(await env.LACHEHEB_KV.get(`stats:country:${country}`) || '0');
  await env.LACHEHEB_KV.put(`stats:country:${country}`, String(cCount + 1));
  return json({ ok: true });
}

async function handleStats(env) {
  const today = new Date().toISOString().slice(0, 10);
  const totalUnique = parseInt(await env.LACHEHEB_KV.get('stats:total_unique') || '0');
  const todayVisits = parseInt(await env.LACHEHEB_KV.get(`stats:today:${today}`) || '0');
  const week = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const ds = d.toISOString().slice(0, 10);
    week.push({ date: ds, visits: parseInt(await env.LACHEHEB_KV.get(`stats:today:${ds}`) || '0') });
  }
  return json({ unique_visitors: totalUnique, today_visits: todayVisits, week });
}

async function handleChat(request, env) {
  const { message } = await request.json();
  if (!message?.trim()) return err('Message vide');
  if (!env.GROQ_API_KEY) return json({ reply: "Le chatbot n'est pas encore configuré. Utilisez le formulaire de contact." });

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${env.GROQ_API_KEY}` },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      max_tokens: 350,
      temperature: 0.6,
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: message }],
    }),
  });

  if (!response.ok) return json({ reply: "Je ne peux pas répondre pour l'instant. Essayez le formulaire de contact." });
  const data = await response.json();
  return json({ reply: data.choices?.[0]?.message?.content || "Pas de réponse disponible." });
}

async function handleMessage(request, env) {
  const { name, body, visitor_id } = await request.json();
  if (!body?.trim()) return err('Message vide');
  const msgId = 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const msg = { id: msgId, name: name || 'Anonyme', body, visitor_id: visitor_id || 'unknown',
    ip, country: request.cf?.country || 'XX', ts: new Date().toISOString(),
    replied: false, reply: null, reply_ts: null };
  await env.LACHEHEB_KV.put(`msg:${msgId}`, JSON.stringify(msg));
  const index = JSON.parse(await env.LACHEHEB_KV.get('msg:index') || '[]');
  index.unshift(msgId);
  if (index.length > 200) index.splice(200);
  await env.LACHEHEB_KV.put('msg:index', JSON.stringify(index));
  return json({ ok: true, msg_id: msgId });
}

async function handleReplyCheck(url, env) {
  const msgId = url.searchParams.get('msg_id');
  if (!msgId) return err('msg_id requis');
  const raw = await env.LACHEHEB_KV.get(`msg:${msgId}`);
  if (!raw) return err('Message introuvable', 404);
  const msg = JSON.parse(raw);
  return json({ replied: msg.replied, reply: msg.reply || null, reply_ts: msg.reply_ts || null });
}

async function handleAdminLogin(request, env) {
  const { code } = await request.json();
  if (code === (env.ADMIN_CODE || '301263')) return json({ ok: true, token: btoa((env.ADMIN_CODE || '301263') + ':' + Date.now()) });
  return json({ ok: false, error: 'Code incorrect' }, 401);
}

async function handleAdminMessages(request, env) {
  if (!isAdminAuthed(request, env)) return err('Non autorisé', 401);
  const index = JSON.parse(await env.LACHEHEB_KV.get('msg:index') || '[]');
  const messages = [];
  for (const id of index.slice(0, 50)) { const raw = await env.LACHEHEB_KV.get(`msg:${id}`); if (raw) messages.push(JSON.parse(raw)); }
  return json({ messages });
}

async function handleAdminReply(request, env) {
  if (!isAdminAuthed(request, env)) return err('Non autorisé', 401);
  const { msg_id, reply } = await request.json();
  if (!msg_id || !reply) return err('msg_id et reply requis');
  const raw = await env.LACHEHEB_KV.get(`msg:${msg_id}`);
  if (!raw) return err('Message introuvable', 404);
  const msg = JSON.parse(raw);
  msg.replied = true; msg.reply = reply; msg.reply_ts = new Date().toISOString();
  await env.LACHEHEB_KV.put(`msg:${msg_id}`, JSON.stringify(msg));
  return json({ ok: true });
}

function isAdminAuthed(request, env) {
  const auth = request.headers.get('Authorization') || '';
  if (!auth.startsWith('Bearer ')) return false;
  try { return atob(auth.slice(7)).startsWith((env.ADMIN_CODE || '301263') + ':'); } catch { return false; }
}
