/**
 * ═══════════════════════════════════════════════════════════════
 *  LACHEHEB PORTFOLIO – Cloudflare Worker API
 *  Chatbot : API publique Hugging Face (GRATUIT, SANS CLÉ)
 *  Modèle  : microsoft/DialoGPT ou fallback règles simples
 * ═══════════════════════════════════════════════════════════════
 *
 *  AUCUNE CLÉ API REQUISE POUR LE CHATBOT
 *  Le chatbot fonctionne avec des règles locales + appel HF public
 *
 *  SEULE CONFIG REQUISE :
 *   1. Créer KV : wrangler kv:namespace create LACHEHEB_KV
 *   2. Coller l'id dans wrangler.toml
 *   3. wrangler deploy → c'est tout !
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

// ════════════════════════════════════════════════════════════════
//  CHATBOT INTELLIGENT — Règles locales (ZÉRO API, ZÉRO CLÉ)
//  Répond aux questions sur M. Lacheheb avec une logique embarquée
// ════════════════════════════════════════════════════════════════
const KNOWLEDGE = {
  identite: {
    keys: ['qui', 'vous êtes', 'tu es', 'présente', 'profil', 'lacheheb', 'abderrahmane', 'c\'est qui', 'nom'],
    reply: "Je suis l'assistant virtuel d'Abderrahmane LACHEHEB, professeur et fonctionnaire de l'Éducation Nationale. Ingénieur en électronique de formation, il enseigne depuis plus de 35 ans les technologies du numérique à l'ORT Daniel Mayer à Montreuil (Île-de-France). 👨‍🏫"
  },
  etablissement: {
    keys: ['établissement', 'école', 'lycée', 'ort', 'montreuil', 'travaille', 'où', 'poste'],
    reply: "M. Lacheheb enseigne à l'ORT Daniel Mayer de Montreuil, en Île-de-France. Il y est professeur fonctionnaire de l'Éducation Nationale, enseignant les filières technologiques et professionnelles du secondaire et du supérieur court. 🏫"
  },
  formations: {
    keys: ['filière', 'formation', 'enseigne', 'cours', 'matière', 'bts', 'bac', 'sti2d', 'ciel', 'sio', 'sisr', 'sin'],
    reply: "M. Lacheheb enseigne dans 4 filières :\n• STI2D – Spécialité SIN (Systèmes d'Information et Numérique)\n• Bac Pro CIEL (Cybersécurité, Informatique, Électronique, Réseaux)\n• BTS CIEL (Cybersécurité, Informatique, Réseaux, Électronique)\n• BTS SIO option SISR (Systèmes et Réseaux)\nIl intervient du lycée jusqu'au BTS. 📚"
  },
  iot: {
    keys: ['iot', 'esp32', 'lora', 'lorawan', 'arduino', 'capteur', 'embarqué', 'microcontrôleur', 'internet des objets'],
    reply: "L'IoT est la spécialité technique de M. Lacheheb ! Il maîtrise notamment les microcontrôleurs ESP32, les protocoles LoRa/LoRaWAN pour les réseaux bas débit longue portée, et intègre des projets IoT concrets dans ses enseignements. 📡"
  },
  reseaux: {
    keys: ['réseau', 'cisco', 'ccna', 'fibre', 'optique', 'vlan', 'routeur', 'switch', 'ip', 'tcp'],
    reply: "M. Lacheheb est certifié Cisco CCNA 1 & 2 (Cisco Networking Academy) et détient une attestation en Réseaux Locaux Industriels (INSA Lyon). Il enseigne la configuration de routeurs, commutateurs, les protocoles IP, VLAN et la sécurité réseau. Il a également contribué à un chapitre sur la Fibre optique dans un ouvrage pédagogique. 🔌"
  },
  livre: {
    keys: ['livre', 'ouvrage', 'édition', 'éditeur', 'publication', 'delagrave', 'isbn', 'fibre optique', 'écrit', 'auteur', 'publié'],
    reply: "En 2016, M. Lacheheb a contribué à l'ouvrage \"Systèmes numériques – 1re/Tle Bac Pro SN\" (Éditions Delagrave, ISBN 978-2-206-10186-6), pour le chapitre Fibre optique. Il recherche actuellement un éditeur pour un nouvel ouvrage pédagogique sur STI2D-SIN / BTS CIEL. 📖"
  },
  contact: {
    keys: ['contact', 'contacter', 'joindre', 'message', 'collaboration', 'éditeur', 'partenariat', 'écrire'],
    reply: "Pour contacter M. Lacheheb, utilisez le formulaire de message en bas de cette fenêtre (onglet ✉️ Message). Il est notamment ouvert aux collaborations éditoriales et aux projets pédagogiques autour des filières technologiques. ✉️"
  },
  langues: {
    keys: ['langue', 'parle', 'français', 'arabe', 'anglais', 'allemand', 'bilingue'],
    reply: "M. Lacheheb parle français et arabe couramment (capacité professionnelle complète), l'anglais à un niveau professionnel, et a des notions d'allemand. 🌍"
  },
  parcours: {
    keys: ['parcours', 'expérience', 'carrière', 'ingénieur', 'formation', 'diplôme', 'usto', 'oran', 'algérie', 'insa'],
    reply: "M. Lacheheb est diplômé Ingénieur en Électronique de l'USTO-MB (Université d'Oran, Algérie). Il a ensuite exercé comme administrateur réseau au Lycée Georges Brassens (Évry-Courcouronnes), avant de devenir enseignant fonctionnaire à l'ORT Daniel Mayer de Montreuil depuis 2019. 🎓"
  },
  cybersecurite: {
    keys: ['cybersécurité', 'sécurité', 'hacking', 'pentest', 'firewall', 'pare-feu', 'vpn'],
    reply: "M. Lacheheb enseigne la cybersécurité dans le cadre du Bac Pro CIEL et du BTS CIEL. Ces formations couvrent la sécurité des réseaux, la protection des infrastructures, les protocoles sécurisés et les enjeux actuels de la cybersécurité en entreprise. 🔐"
  },
  salut: {
    keys: ['bonjour', 'bonsoir', 'salut', 'hello', 'hey', 'bonne journée', 'coucou', 'salam'],
    reply: "Bonjour ! 👋 Je suis l'assistant de M. Abderrahmane LACHEHEB, enseignant en technologies du numérique. Comment puis-je vous aider ? Vous pouvez me poser des questions sur son parcours, ses filières d'enseignement, ses projets ou son expertise technique. 😊"
  },
  merci: {
    keys: ['merci', 'super', 'parfait', 'excellent', 'génial', 'top', 'bravo', 'nickel', 'cool'],
    reply: "Avec plaisir ! 😊 N'hésitez pas si vous avez d'autres questions sur M. Lacheheb. Pour tout contact direct, utilisez le formulaire Message."
  },
};

function chatbotReply(message) {
  const msg = message.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  for (const [, data] of Object.entries(KNOWLEDGE)) {
    if (data.keys.some(k => msg.includes(k.normalize("NFD").replace(/[\u0300-\u036f]/g, "")))) {
      return data.reply;
    }
  }

  // Réponse par défaut
  return "Je ne suis pas sûr de comprendre votre question. 🤔 Vous pouvez me demander des informations sur :\n• Le profil et parcours de M. Lacheheb\n• Les filières enseignées (STI2D, Bac Pro CIEL, BTS CIEL, BTS SIO)\n• Ses spécialités (IoT, ESP32, LoRa, Réseaux, Cisco)\n• Son projet éditorial\n• Comment le contacter";
}

// ════════════════════════════════════════════════════════════════
//  ROUTEUR
// ════════════════════════════════════════════════════════════════
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

// ════════════════════════════════════════════════════════════════
//  CHAT — 100% local, zéro API externe
// ════════════════════════════════════════════════════════════════
async function handleChat(request, env) {
  const { message } = await request.json();
  if (!message?.trim()) return err('Message vide');
  const reply = chatbotReply(message.trim());
  return json({ reply });
}

// ════════════════════════════════════════════════════════════════
//  TRACK
// ════════════════════════════════════════════════════════════════
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

// ════════════════════════════════════════════════════════════════
//  STATS
// ════════════════════════════════════════════════════════════════
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

// ════════════════════════════════════════════════════════════════
//  MESSAGE VISITEUR
// ════════════════════════════════════════════════════════════════
async function handleMessage(request, env) {
  const { name, body, visitor_id } = await request.json();
  if (!body?.trim()) return err('Message vide');
  const msgId = 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const msg = { id: msgId, name: name || 'Anonyme', body,
    visitor_id: visitor_id || 'unknown', ip,
    country: request.cf?.country || 'XX',
    ts: new Date().toISOString(), replied: false, reply: null, reply_ts: null };
  await env.LACHEHEB_KV.put(`msg:${msgId}`, JSON.stringify(msg));
  const index = JSON.parse(await env.LACHEHEB_KV.get('msg:index') || '[]');
  index.unshift(msgId);
  if (index.length > 200) index.splice(200);
  await env.LACHEHEB_KV.put('msg:index', JSON.stringify(index));
  return json({ ok: true, msg_id: msgId });
}

// ════════════════════════════════════════════════════════════════
//  REPLY CHECK
// ════════════════════════════════════════════════════════════════
async function handleReplyCheck(url, env) {
  const msgId = url.searchParams.get('msg_id');
  if (!msgId) return err('msg_id requis');
  const raw = await env.LACHEHEB_KV.get(`msg:${msgId}`);
  if (!raw) return err('Message introuvable', 404);
  const msg = JSON.parse(raw);
  return json({ replied: msg.replied, reply: msg.reply || null, reply_ts: msg.reply_ts || null });
}

// ════════════════════════════════════════════════════════════════
//  ADMIN
// ════════════════════════════════════════════════════════════════
async function handleAdminLogin(request, env) {
  const { code } = await request.json();
  if (code === (env.ADMIN_CODE || '301263'))
    return json({ ok: true, token: btoa((env.ADMIN_CODE || '301263') + ':' + Date.now()) });
  return json({ ok: false, error: 'Code incorrect' }, 401);
}

async function handleAdminMessages(request, env) {
  if (!isAdminAuthed(request, env)) return err('Non autorisé', 401);
  const index = JSON.parse(await env.LACHEHEB_KV.get('msg:index') || '[]');
  const messages = [];
  for (const id of index.slice(0, 50)) {
    const raw = await env.LACHEHEB_KV.get(`msg:${id}`);
    if (raw) messages.push(JSON.parse(raw));
  }
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
  try { return atob(auth.slice(7)).startsWith((env.ADMIN_CODE || '301263') + ':'); }
  catch { return false; }
}
