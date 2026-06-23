// Lectura pública del sitio + formularios públicos (Cabo Vírgenes).
//   GET  /api/public?what=site → { ok, settings, news, team, jobs, pages, legal }
//   POST /api/public { action:'contact'|'subscribe'|'apply', ... } → inserta
//
// Esto es lo que hace que el contenido del admin sea VISIBLE para los visitantes:
// el sitio público deja de leer localStorage y consume este endpoint.
// Lectura con service() (servidor); solo devuelve contenido publicado/visible.
import { json, preflight, safe } from './_lib.mjs';
import { service, configured } from './_supabase.mjs';

function mapNews(r) {
  return { id: r.id, slug: r.slug, title: r.title, excerpt: r.excerpt, body: r.body,
    category: r.category, image: r.image, status: r.status, pinned: r.pinned,
    order: r.sort_order, date: r.news_date, author: r.author };
}
function mapTeam(r) {
  return { id: r.id, key: r.member_key, name: r.name, role: r.role, area: r.area,
    bio: r.bio, photo: r.photo, hidden: r.hidden, order: r.sort_order };
}
function mapJob(r) {
  return { id: r.id, title: r.title, area: r.area, location: r.location, type: r.job_type,
    status: r.status, priority: r.priority, tags: r.tags, requirements: r.requirements,
    summary: r.summary, body: r.body };
}

async function getSite(db) {
  const [settings, news, team, jobs, pages, legal] = await Promise.all([
    db.from('cv_settings').select('value').eq('key', 'site').maybeSingle(),
    db.from('cv_news').select('*').eq('status', 'published').order('pinned', { ascending: false }).order('news_date', { ascending: false }),
    db.from('cv_team').select('*').eq('hidden', false).order('sort_order', { ascending: true }),
    db.from('cv_jobs').select('*').eq('status', 'open').order('sort_order', { ascending: true }),
    db.from('cv_pages').select('slug,layout'),
    db.from('cv_legal').select('*'),
  ]);
  const pagesObj = {}; (pages.data || []).forEach(p => { pagesObj[p.slug] = p.layout; });
  const legalObj = {}; (legal.data || []).forEach(l => { legalObj[l.key] = { title: l.title, html: l.html, updated: l.doc_updated }; });
  return {
    settings: (settings.data && settings.data.value) || {},
    news: (news.data || []).map(mapNews),
    team: (team.data || []).map(mapTeam),
    jobs: (jobs.data || []).map(mapJob),
    pages: pagesObj,
    legal: legalObj,
  };
}

export default async (req) => {
  const pf = preflight(req); if (pf) return pf;
  if (!configured()) return json({ ok: false, error: 'config', message: 'Base de datos no configurada.' }, 503);
  const db = service();

  if (req.method === 'GET') {
    const url = new URL(req.url);
    const what = url.searchParams.get('what') || 'site';
    if (what !== 'site') return json({ ok: false, error: 'what' }, 400);
    try {
      const site = await getSite(db);
      // Sin caché: este endpoint alimenta la web pública con lo que el admin
      // acaba de editar. Cualquier caché de CDN/navegador (antes max-age=30 +
      // s-maxage=60) hacía que los cambios tardaran ~60 s en verse → parecía
      // "no funcional". El sitio es de bajo tráfico; la frescura prima.
      return json({ ok: true, ...site }, 200, { 'cache-control': 'no-store, max-age=0, must-revalidate' });
    } catch (e) {
      return json({ ok: false, error: 'db', message: String((e && e.message) || e).slice(0, 200) }, 500);
    }
  }

  if (req.method === 'POST') {
    let body; try { body = await req.json(); } catch { return json({ error: 'bad-json' }, 400); }
    const action = String(body.action || '');
    // Honeypot anti-bot simple (campo oculto 'website2' debe venir vacío).
    if (body.website2) return json({ ok: true }); // finge éxito ante bots
    try {
      if (action === 'contact') {
        const row = {
          name: safe(body.name, 200), email: safe(body.email, 200), company: safe(body.company, 200),
          country: safe(body.country, 80), topic: safe(body.topic, 200), message: safe(body.message, 5000),
          source: 'contacto',
        };
        if (!row.email && !row.message) return json({ ok: false, error: 'empty' }, 400);
        const { error } = await db.from('cv_consultas').insert(row);
        if (error) throw error;
        return json({ ok: true });
      }
      if (action === 'subscribe') {
        const email = safe(body.email, 200).toLowerCase().trim();
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ ok: false, error: 'email' }, 400);
        const row = {
          email, name: safe(body.name, 200) || null, country: safe(body.country, 80) || null,
          interests: Array.isArray(body.interests) ? body.interests.slice(0, 20).map(s => safe(s, 60)) : [],
          outlet: safe(body.outlet, 200) || null, web: safe(body.web, 200) || null, phone: safe(body.phone, 60) || null,
          source: safe(body.source, 40) || 'web',
        };
        const { error } = await db.from('cv_subscribers').upsert(row, { onConflict: 'email' });
        if (error) throw error;
        return json({ ok: true });
      }
      if (action === 'apply') {
        const row = {
          job_id: body.jobId || null, job_title: safe(body.jobTitle, 200) || null,
          name: safe(body.name, 200), email: safe(body.email, 200), phone: safe(body.phone, 60),
          message: safe(body.message || body.coverLetter, 5000), cv_url: safe(body.cvUrl, 500) || null,
        };
        if (!row.name && !row.email) return json({ ok: false, error: 'empty' }, 400);
        const { error } = await db.from('cv_applications').insert(row);
        if (error) throw error;
        return json({ ok: true });
      }
      return json({ ok: false, error: 'action' }, 400);
    } catch (e) {
      return json({ ok: false, error: 'db', message: String((e && e.message) || e).slice(0, 200) }, 500);
    }
  }

  return json({ error: 'method' }, 405);
};
