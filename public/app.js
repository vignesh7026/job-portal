'use strict';
/* Jobs Territory candidate portal - dependency-free SPA (hash router).
   Design idea: your career is a territory you explore. Contour maps, a compass-style "fit" gauge,
   a trail that shows each application's progress, and a sentence-style search. */
const STEPS = [['applied', 'Applied'], ['under_review', 'In review'], ['shortlisted', 'Shortlisted'], ['interview', 'Interview'], ['offer', 'Offer'], ['hired', 'Hired']];
const STATUS = {
  applied: ['Applied', ''], under_review: ['In review', 'amber'], shortlisted: ['Shortlisted', 'blue'], interview: ['Interview', 'blue'],
  offer: ['Offer', 'green'], hired: ['Hired', 'green'], rejected: ['Not selected', 'red'], withdrawn: ['Withdrawn', ''],
};
const SKILLS = ['JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'Java', 'SQL', 'PostgreSQL', 'Git', 'HTML', 'CSS', 'Docker', 'AWS', 'Excel', 'Communication', 'Figma', 'SEO', 'Power BI', 'Django', 'REST', 'Sourcing', 'Analytics', 'CRM', 'Recruitment'];
const COLORS = ['#1f5c43', '#b4451f', '#2f5d8a', '#7a4e9e', '#9a6b00', '#a03a5c', '#3b6b6b', '#5b6b2a', '#8a3b12', '#41567a'];
const SALARY = [['', 'any pay'], ['3', '₹3L+'], ['6', '₹6L+'], ['10', '₹10L+'], ['15', '₹15L+'], ['25', '₹25L+'], ['40', '₹40L+']];
const POSTED = [['', 'any time'], ['1', 'today'], ['3', 'last 3 days'], ['7', 'this week'], ['30', 'this month']];

// ---------- icons & generated art ----------
const P = {
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>', pin: '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18"/>', clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  bookmark: '<path d="M6 3h12v18l-6-4-6 4z"/>', bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 8 3 8H3s3-1 3-8M10 20a2 2 0 0 0 4 0"/>', user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  check: '<path d="m5 12 5 5 9-10"/>', building: '<rect x="5" y="3" width="14" height="18" rx="1"/><path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2"/>', x: '<path d="M6 6l12 12M18 6 6 18"/>', menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>', file: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/>', trend: '<path d="m3 17 6-6 4 4 8-8M15 7h6v6"/>',
  layout: '<rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>', arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>', code: '<path d="m8 8-5 4 5 4M16 8l5 4-5 4M14 5l-4 14"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>', pen: '<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>', people: '<circle cx="9" cy="8" r="3.5"/><path d="M2 20a7 7 0 0 1 14 0M17 4.5a3.5 3.5 0 0 1 0 7M22 20a7 7 0 0 0-4-6.3"/>',
  inbox: '<path d="M3 13l3-8h12l3 8v6H3z"/><path d="M3 13h5l1 3h6l1-3h5"/>', alert: '<circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16.5v.1"/>', download: '<path d="M12 4v11M7 11l5 5 5-5M5 20h14"/>', plus: '<path d="M12 5v14M5 12h14"/>',
  list: '<path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"/>', board: '<rect x="3" y="4" width="5" height="16" rx="1"/><rect x="10" y="4" width="5" height="10" rx="1"/><rect x="17" y="4" width="4" height="13" rx="1"/>',
  ext: '<path d="M14 4h6v6M20 4l-9 9M18 14v5H5V6h5"/>', mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>', copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h8"/>',
  spark: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z"/>', upload: '<path d="M12 16V4M7 9l5-5 5 5M5 20h14"/>',
};
const ico = (n, cls = '') => `<svg class="i ${cls}" viewBox="0 0 24 24" aria-hidden="true">${P[n] || P.briefcase}</svg>`;
const CAT_ICON = { Engineering: 'code', Data: 'chart', Design: 'pen', HR: 'people', Sales: 'trend', Marketing: 'trend', Support: 'people', Finance: 'chart', Product: 'layout', Operations: 'briefcase' };
const COMPASS = '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="16" cy="16" r="13"/><path d="M22 10l-4 8.5L10 22l4-8.5z" fill="#cf5428" stroke-width="1.6" stroke-linejoin="round"/></svg>';

// Wobbly closed contour lines, like a topographic map. Deterministic from the seed.
function contours(seed = 1, { n = 9, cx = 0, cy = 0, step = 34, w = 1000, h = 600 } = {}) {
  let d = '';
  for (let k = 1; k <= n; k++) {
    const r = step * k, pts = [];
    for (let a = 0; a < 16; a++) {
      const t = (a / 16) * Math.PI * 2, rr = r * (1 + 0.14 * Math.sin(3 * t + seed + k * 0.35) + 0.09 * Math.cos(5 * t + seed * 1.7));
      pts.push([cx + Math.cos(t) * rr * 1.25, cy + Math.sin(t) * rr]);
    }
    const mid = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
    d += `M${mid(pts[15], pts[0]).map((v) => v.toFixed(1))}`;
    pts.forEach((p, i) => { const m = mid(p, pts[(i + 1) % 16]); d += `Q${p[0].toFixed(1)} ${p[1].toFixed(1)} ${m[0].toFixed(1)} ${m[1].toFixed(1)}`; });
    d += 'Z';
  }
  return `<svg class="contours" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true"><path d="${d}"/></svg>`;
}
const sigil = (name, size = '') => {
  const c = color(name), h = [...name].reduce((a, ch) => a + ch.charCodeAt(0), 0);
  return `<div class="sigil ${size}" style="background:repeating-radial-gradient(circle at ${20 + (h % 60)}% ${20 + ((h * 7) % 60)}%, ${c} 0 5px, color-mix(in srgb, ${c} 72%, #fff) 5px 10px)" aria-hidden="true">${esc(name[0])}</div>`;
};
function gauge(score) {
  const ang = -90 + Math.min(100, score) * 1.8;
  return `<svg class="gauge" viewBox="0 0 200 138" role="img" aria-label="Skills fit ${score} percent"><path class="tr" d="M20 100A80 80 0 0 1 180 100" fill="none" stroke-width="14" stroke-linecap="round"/>
    <path class="pr" d="M20 100A80 80 0 0 1 180 100" fill="none" stroke-width="14" stroke-linecap="round" pathLength="100" stroke-dasharray="${score} 100"/>
    <g transform="rotate(${ang} 100 100)"><path class="needle" d="M100 100V34"/></g><circle class="hub" cx="100" cy="100" r="7"/>
    <text x="100" y="134" text-anchor="middle" font-size="24" font-weight="700" font-family="var(--serif)">${score}%</text></svg>`;
}
function trailSVG(cur, mode = 'live') {
  const xs = (i) => 50 + i * 124, ys = (i) => (i % 2 ? 54 : 98), won = mode === 'won', dead = mode === 'dead';
  let d = `M${xs(0)} ${ys(0)}`; for (let i = 0; i < 5; i++) d += ` C${xs(i) + 62} ${ys(i)}, ${xs(i + 1) - 62} ${ys(i + 1)}, ${xs(i + 1)} ${ys(i + 1)}`;
  const pct = (won ? 5 : cur) / 5 * 100;
  const nodes = STEPS.map(([, l], i) => {
    const done = i < cur || (won && i <= cur), now = i === cur && !won, cls = done ? 'done' : now ? (dead ? 'dead' : 'now') : '';
    return `<g class="${cls}">${now ? `<circle class="halo" cx="${xs(i)}" cy="${ys(i)}" r="15"/>` : ''}<circle class="wp" cx="${xs(i)}" cy="${ys(i)}" r="15"/>
      <text class="n" x="${xs(i)}" y="${ys(i) + 4.5}">${done ? '✓' : dead && now ? '✕' : i + 1}</text><text class="l" x="${xs(i)}" y="${ys(i) + 36}">${l}</text></g>`;
  }).join('');
  return `<div class="trail"><svg viewBox="0 0 720 150" role="img" aria-label="Application progress: ${STEPS[cur][1]}"><path class="base" d="${d}"/><path class="prog" d="${d}" pathLength="100" stroke-dasharray="${pct} 100"/>
    ${nodes}<path class="flag" d="M${xs(5)} ${ys(5) - 16}v-24l18 7-18 7"/></svg></div>`;
}

// ---------- helpers ----------
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const store = { get(k) { try { return localStorage.getItem(k); } catch { return null; } }, set(k, v) { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch { /* private mode */ } } };
const state = { token: store.get('token'), user: null, profile: null, notifs: [], unread: 0, menu: null };
const jobCache = {};
const savedHooks = [];

function toast(msg, isErr) {
  const t = document.createElement('div'); t.className = 'toast' + (isErr ? ' err' : ''); t.innerHTML = `${ico(isErr ? 'alert' : 'check')}<span></span>`; $('span', t).textContent = msg;
  $('#toasts').append(t); setTimeout(() => t.remove(), 3800);
}
async function api(method, path, body, raw) {
  const res = await fetch('/api' + path, { method, headers: { 'Content-Type': 'application/json', ...(state.token ? { Authorization: 'Bearer ' + state.token } : {}) }, body: body ? JSON.stringify(body) : undefined });
  if (raw && res.ok) return res;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && state.token && !path.startsWith('/auth/')) logout(true);
    const e = new Error(data.error || 'Request failed'); e.fields = data.fields || {}; e.status = res.status; throw e;
  }
  return data;
}
const ago = (iso) => {
  const s = (Date.now() - new Date(iso)) / 1000;
  if (s < 3600) return Math.max(1, Math.floor(s / 60)) + 'm ago'; if (s < 86400) return Math.floor(s / 3600) + 'h ago';
  const d = Math.floor(s / 86400); return d === 1 ? 'Yesterday' : d < 30 ? d + ' days ago' : new Date(iso).toLocaleDateString();
};
const dt = (iso) => new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
const lpa = (n) => (Number.isInteger(n) ? n : +n.toFixed(1));
const salary = (j) => (j.salaryMin || j.salaryMax ? `₹${lpa(j.salaryMin)}–${lpa(j.salaryMax)} LPA` : 'Not disclosed');
const color = (s) => COLORS[[...s].reduce((a, c) => a + c.charCodeAt(0), 0) % COLORS.length];
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ');
const initials = (n) => n.split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
const loc = (j) => (j.location.toLowerCase() === j.mode ? cap(j.mode) : `${j.location} · ${cap(j.mode)}`);
const score = (c) => (c && c.rating ? `<span class="score" title="Employee rating from ${c.reviews} reviews">${c.rating.toFixed(1)}<small>/5</small></span>` : '');
const badge = (status) => { const [t, c] = STATUS[status] || [status, '']; return `<span class="badge ${c}">${esc(t)}</span>`; };
const fieldErr = (e, k) => (e && e[k] ? `<div class="err" role="alert">${esc(e[k])}</div>` : '');
const parseHash = () => { const [p, qs] = (location.hash.slice(1) || '/').split('?'); return { path: p || '/', query: Object.fromEntries(new URLSearchParams(qs || '')) }; };
const go = (h) => { location.hash = h; };
const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
const busy = async (btn, fn) => { const old = btn.innerHTML; btn.disabled = true; btn.textContent = 'Please wait…'; try { return await fn(); } finally { btn.disabled = false; btn.innerHTML = old; } };
const skeletons = (n = 4, h = 130) => Array.from({ length: n }, () => `<div class="skel" style="height:${h}px"></div>`).join('');
const empty = (icon, title, text, cta = '') => `<div class="empty"><div class="ico">${ico(icon)}</div><h3>${title}</h3><p class="muted" style="max-width:380px;margin:6px auto 16px">${text}</p>${cta}</div>`;
const opts = (list, cur, any) => `<option value="">${any}</option>` + list.map((i) => `<option value="${esc(i.v)}" ${i.v === cur ? 'selected' : ''}>${esc(cap(i.v))}</option>`).join('');

// ---------- people, templates, copy ----------
const avatarC = (name, size = '') => `<span class="pav ${size}" style="background:${color(name)}" aria-hidden="true">${esc(initials(name))}</span>`;
const DEFAULT_COVER = "Hi {{recruiter}},\n\nI'm {{name}} and I'm excited to apply for the {{title}} role at {{company}}. My background in {{skills}} lines up well with what you're looking for, and I'd love to contribute to the team.\n\nMy resume is attached. Thank you for your time.\n\nBest regards,\n{{name}}";
const fillTpl = (tpl, v) => tpl.replace(/\{\{(\w+)\}\}/g, (_, k) => v[k] ?? '');
function coverVars(j) {
  const mine = (state.profile && state.profile.skills) || [], jobSkills = j.skills || [], hit = jobSkills.filter((s) => mine.some((m) => m.toLowerCase() === s.toLowerCase()));
  const rec = j.postedBy || { name: 'there' };
  return { name: state.user ? state.user.name : '', title: j.title, company: j.company, recruiter: rec.name.split(' ')[0], skills: (hit.length ? hit : mine).slice(0, 3).join(', ') || 'this field' };
}
function personCard(c, { posted, compact } = {}) {
  return `<div class="person${compact ? ' compact' : ''}">${avatarC(c.name, 'lg')}<div class="pinfo"><div class="row" style="gap:6px"><b>${esc(c.name)}</b>${posted ? '<span class="badge accent">Posted this job</span>' : c.role === 'founder' ? '<span class="badge blue">Leadership</span>' : ''}</div>
    <div class="small muted">${esc(c.title)}</div><div class="mailrow"><a href="mailto:${esc(c.email)}" class="mail">${ico('mail')} ${esc(c.email)}</a><button type="button" class="copybtn" data-copy="${esc(c.email)}" aria-label="Copy email address" title="Copy email">${ico('copy')}</button></div></div>
    <a class="btn sm outline" href="${esc(c.linkedin)}" target="_blank" rel="noopener noreferrer">${ico('ext')} LinkedIn</a></div>`;
}
const teamBlock = (j) => (j.team && j.team.length ? `<div class="sec-t">Meet the hiring team</div><div class="team">${j.team.map((t) => personCard(t, { posted: j.postedBy && t.id === j.postedBy.id })).join('')}</div>
  <p class="xs muted" style="margin-top:8px">Demo contacts - fictional people with reserved ".example" addresses. No real emails are sent.</p>` : '');
document.addEventListener('click', async (e) => {
  const b = e.target.closest('[data-copy]'); if (!b) return;
  e.preventDefault();
  try { await navigator.clipboard.writeText(b.dataset.copy); toast('Email address copied'); }
  catch { const t = document.createElement('textarea'); t.value = b.dataset.copy; document.body.append(t); t.select(); try { document.execCommand('copy'); toast('Email address copied'); } catch { toast(b.dataset.copy); } t.remove(); }
});
// query string for the job filters; shared by the results list and the auto-apply review
function filterQS(f, extra = {}) {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(f)) { const s = Array.isArray(v) ? v.join(',') : v; if (s !== '' && s != null && !(k === 'page' && s === 1)) qs.set(k, s); }
  for (const [k, v] of Object.entries(extra)) qs.set(k, v);
  return qs;
}

// ---------- session ----------
async function loadMe() {
  if (!state.token) return;
  try { const d = await api('GET', '/me'); state.user = d.user; state.profile = d.profile; refreshNotifs(); } catch (e) { /* a 401 already signed out in api(); a network blip or server error must not discard a good token */ if (e && e.status === 401) { state.token = null; store.set('token', null); } }
}
function logout(expired) {
  state.token = null; state.user = null; state.profile = null; state.notifs = []; state.unread = 0; state.menu = null; store.set('token', null);
  if (expired) toast('Your session expired. Please sign in again.', true);
  go('#/login'); render();
}
async function refreshNotifs() {
  if (!state.token) return;
  try { const d = await api('GET', '/notifications'); state.notifs = d.items; state.unread = d.unread; paintHeader(); } catch { /* offline */ }
}
setInterval(refreshNotifs, 30000);

// ---------- shell ----------
const BRAND = `<a class="brand" href="#/">${COMPASS}<span>Jobs <em>Territory</em></span></a>`;
function paintHeader() {
  const { path } = parseHash(), u = state.user, on = (p) => (path === p || path.startsWith(p + '/') ? 'active' : '');
  $('#hdr').innerHTML = `<div class="container">${BRAND}
    <nav class="navlinks" id="nav" aria-label="Main"><a href="#/jobs" class="${on('/jobs')}">Explore jobs</a><a href="#/companies" class="${path.startsWith('/compan') ? 'active' : ''}">Companies</a>
      ${u ? `<a href="#/applications" class="${on('/applications')}">My trail</a><a href="#/saved" class="${on('/saved')}">Saved</a><a class="m-only" href="#/dashboard">Base camp</a><a class="m-only" href="#/profile">Profile</a><a class="m-only" href="#" data-act="logout">Sign out</a>`
        : '<a class="m-only" href="#/login">Sign in</a><a class="m-only" href="#/register">Create account</a>'}</nav>
    <div class="row nw actions right">
      ${u ? `<div class="menu-wrap"><button class="ibtn" data-act="notifs" aria-label="Notifications">${ico('bell')}${state.unread ? `<span class="dot">${state.unread > 9 ? '9+' : state.unread}</span>` : ''}</button>
        ${state.menu === 'notifs' ? `<div class="popover notifs">${state.notifs.length ? state.notifs.map((n) => `<a href="${esc(n.link || '#/')}" class="${n.read ? '' : 'unread'}"><div>${esc(n.message)}</div><div class="xs muted">${ago(n.at)}</div></a>`).join('') : '<div class="empty small muted" style="padding:28px">You are all caught up.</div>'}</div>` : ''}</div>
        <div class="menu-wrap"><button class="ibtn" data-act="acct" aria-label="Account menu"><span class="avatar">${esc(initials(u.name))}</span></button>
        ${state.menu === 'acct' ? `<div class="popover"><div class="head"><div class="bold">${esc(u.name)}</div><div class="xs muted">${esc(u.email)}</div></div><hr>
          <a href="#/dashboard">${ico('layout')} Base camp</a><a href="#/profile">${ico('user')} My profile</a><a href="#/applications">${ico('briefcase')} My trail</a><a href="#/saved">${ico('bookmark')} Saved jobs</a><hr>
          <button class="mi" data-act="theme">${ico('moon')} Dark mode</button><button class="mi" data-act="logout">${ico('logout')} Sign out</button></div>` : ''}</div>`
      : `<button class="ibtn" data-act="theme" aria-label="Toggle dark mode">${ico('moon')}</button><a class="btn ghost" href="#/login">Sign in</a><a class="btn primary" href="#/register">Create account</a>`}
    </div><button class="ibtn menu-btn" data-act="menu" aria-label="Menu">${ico('menu')}</button></div>`;
}
function paintFooter() {
  $('#ftr').innerHTML = `<div class="container"><div class="cols"><div>${BRAND}<p class="muted small" style="max-width:300px;margin-top:12px">A candidate-first portal from the team behind the Jobs Territory CRM and ATS. Know where you stand at every step.</p></div>
    <div><h4>Explore</h4><a href="#/jobs">All jobs</a><a href="#/jobs?mode=remote">Remote work</a><a href="#/jobs?level=intern">Internships &amp; freshers</a><a href="#/companies">Companies</a></div>
    <div><h4>Your account</h4><a href="#/dashboard">Base camp</a><a href="#/applications">My trail</a><a href="#/profile">Profile</a></div>
    <div><h4>Jobs Territory</h4><a href="#/company/Jobs%20Territory">About us</a><a href="#/jobs?company=Jobs%20Territory">Careers</a></div></div>
    <div class="copy">© ${new Date().getFullYear()} Jobs Territory. Demo project - company ratings and listings are illustrative sample data.</div></div>`;
}
document.addEventListener('click', async (e) => {
  const a = e.target.closest('[data-act]');
  if (!e.target.closest('.menu-wrap') && state.menu) { state.menu = null; paintHeader(); }
  if (!a) return;
  const act = a.dataset.act;
  if (act === 'logout') { e.preventDefault(); logout(); toast('You have been signed out'); }
  if (act === 'theme') { const t = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'; store.set('theme', t); document.documentElement.dataset.theme = t; }
  if (act === 'menu') $('#nav').classList.toggle('open');
  if (act === 'acct') { state.menu = state.menu === 'acct' ? null : 'acct'; paintHeader(); }
  if (act === 'notifs') {
    state.menu = state.menu === 'notifs' ? null : 'notifs'; paintHeader();
    if (state.menu === 'notifs' && state.unread) { await api('POST', '/notifications/read').catch(() => {}); state.unread = 0; setTimeout(() => state.notifs.forEach((n) => { n.read = 1; }), 0); paintHeader(); }
  }
  e.stopPropagation();
}, true);
// save / unsave (global, so cards and the open drawer stay in sync)
document.addEventListener('click', async (e) => {
  const b = e.target.closest('[data-save]'); if (!b) return;
  e.preventDefault(); e.stopPropagation();
  if (!state.token) { toast('Sign in to save jobs', true); closeDrawer(); return go('#/login?next=' + encodeURIComponent(location.hash)); }
  try {
    const r = await api('POST', `/jobs/${b.dataset.save}/save`);
    $$(`[data-save="${b.dataset.save}"]`).forEach((x) => { x.classList.toggle('on', r.saved); x.setAttribute('aria-pressed', r.saved); const t = $('.lbl', x); if (t) t.textContent = r.saved ? 'Saved' : 'Save'; });
    if (jobCache[b.dataset.save]) jobCache[b.dataset.save].saved = r.saved;
    toast(r.saved ? 'Job saved' : 'Removed from saved jobs'); savedHooks.forEach((h) => h(b.dataset.save, r.saved));
  } catch (err) { toast(err.message, true); }
});
document.addEventListener('click', async (e) => {
  const b = e.target.closest('[data-apply]'); if (!b) return;
  if (!state.user) { toast('Sign in to apply'); closeDrawer(); return go('#/login?next=' + encodeURIComponent(location.hash)); }
  const j = jobCache[b.dataset.apply] || (await api('GET', '/jobs/' + b.dataset.apply)); applyModal(j);
});
// any job card opens the detail drawer
const openCard = (e) => { const c = e.target.closest('.jcard'); if (c && !e.target.closest('[data-save]')) { e.preventDefault(); openDrawer(c.dataset.job); } };
document.addEventListener('click', openCard);
document.addEventListener('keydown', (e) => { if ((e.key === 'Enter' || e.key === ' ') && e.target.classList && e.target.classList.contains('jcard')) { e.preventDefault(); openDrawer(e.target.dataset.job); } if (e.key === 'Escape') closeDrawer(); });

// ---------- components ----------
function modal(html) {
  const bg = document.createElement('div'); bg.className = 'scrim'; bg.innerHTML = `<div class="card modal" role="dialog" aria-modal="true">${html}</div>`;
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  const close = () => { bg.remove(); document.removeEventListener('keydown', onKey); };
  document.addEventListener('keydown', onKey); bg.addEventListener('mousedown', (e) => { if (e.target === bg) close(); });
  document.body.append(bg); const f = $('input,textarea,button', bg); if (f) f.focus(); return { el: bg.firstElementChild, close };
}
const saveBtn = (j) => `<button class="savebtn ${j.saved ? 'on' : ''}" data-save="${j.id}" aria-pressed="${!!j.saved}" aria-label="Save job" title="Save job">${ico('bookmark')}</button>`;
function jobCard(j) {
  const c = j.companyInfo || {};
  return `<article class="jcard" data-job="${j.id}" tabindex="0" role="button" aria-label="${esc(j.title)} at ${esc(j.company)}">${saveBtn(j)}
    <div class="row nw" style="gap:12px">${sigil(j.company, 'sm')}<div class="co" style="min-width:0"><b>${esc(j.company)}</b>${score(c)}</div></div>
    <h3 class="t">${esc(j.title)}</h3>
    ${j.postedBy ? `<div class="by">${avatarC(j.postedBy.name, 'sm')}<span>${esc(j.postedBy.name)} <span class="muted">· ${esc(j.postedBy.title)}</span></span></div>` : ''}
    <div class="pay">${j.salaryMin ? `₹${lpa(j.salaryMin)}–${lpa(j.salaryMax)} <small>LPA</small>` : 'Pay not disclosed'}</div>
    <div class="tags"><span class="badge">${ico('pin')} ${esc(loc(j))}</span><span class="badge">${esc(cap(j.type))}</span><span class="badge">${esc(cap(j.level))}</span></div>
    <div class="foot"><span>${ico('clock')} ${ago(j.postedAt)}</span><span class="row" style="gap:6px">${j.match > 0 ? `<span class="badge accent">${j.match}% fit</span>` : ''}${j.applied ? `<span class="badge green">${ico('check')} Applied</span>` : ''}</span></div></article>`;
}
function payBlock(j) {
  const m = j.market; if (!m || !m.n || !j.salaryMax) return '';
  const top = Math.max(m.high, j.salaryMax) * 1.12, p = (v) => (v / top) * 100;
  const mid = (j.salaryMin + j.salaryMax) / 2, mm = (m.low + m.high) / 2, diff = Math.round((mid / mm - 1) * 100);
  const verdict = diff >= 6 ? `<b style="color:var(--green)">${diff}% above</b>` : diff <= -6 ? `<b style="color:var(--amber)">${-diff}% below</b>` : '<b>in line with</b>';
  return `<div class="sec-t">Pay compass</div><div class="card tight"><p class="small" style="margin:0">This role pays ${verdict} the typical band for ${esc(m.scope)} roles on Jobs Territory.</p>
    <div class="paytrack" role="img" aria-label="Pay range versus market"><div class="mk" style="left:${p(m.low)}%;width:${p(m.high - m.low)}%"></div><div class="me" style="left:${p(j.salaryMin)}%;width:${Math.max(4, p(j.salaryMax - j.salaryMin))}%"></div></div>
    <div class="row xs muted" style="gap:14px"><span><span style="display:inline-block;width:18px;height:6px;background:var(--accent);border-radius:3px"></span> This job <b>₹${lpa(j.salaryMin)}–${lpa(j.salaryMax)} LPA</b></span><span><span style="display:inline-block;width:18px;height:6px;background:var(--line);border:1px solid var(--muted);border-radius:3px"></span> Typical ₹${lpa(m.low)}–${lpa(m.high)} LPA (${m.n} listings)</span></div></div>`;
}
const jobActions = (j) => {
  const app = j.application;
  const cta = app ? `<a class="btn outline lg" href="#/applications/${app.id}">View application</a>${badge(app.status)}` : j.closed ? '<button class="btn lg" disabled>Applications closed</button>' : `<button class="btn accent lg" data-apply="${j.id}">Apply now</button>`;
  return `${cta}<button class="btn ghost ${j.saved ? 'on' : ''}" data-save="${j.id}" aria-pressed="${!!j.saved}">${ico('bookmark')}<span class="lbl">${j.saved ? 'Saved' : 'Save'}</span></button><span class="right small muted">${salary(j)}</span>`;
};
function jobDetail(j) {
  const m = j.match, c = j.companyInfo;
  return `<div class="jd"><div class="row nw" style="align-items:flex-start;gap:16px">${sigil(j.company, 'lg')}<div style="min-width:0"><div class="row" style="gap:8px"><a href="#/company/${encodeURIComponent(j.company)}" class="bold">${esc(j.company)}</a>${score(c)}</div>
      <h1>${esc(j.title)}</h1><div class="muted small">${ico('pin')} ${esc(loc(j))} · ${ico('clock')} Posted ${ago(j.postedAt)}${j.deadline ? ` · Apply by ${new Date(j.deadline).toLocaleDateString()}` : ''}</div></div></div>
    <div class="facts"><div class="fact"><span>Salary</span><b>${salary(j)}</b></div><div class="fact"><span>Type</span><b>${esc(cap(j.type))}</b></div><div class="fact"><span>Work mode</span><b>${esc(cap(j.mode))}</b></div><div class="fact"><span>Level</span><b>${esc(cap(j.level))}</b></div></div>
    ${j.postedBy ? `<div class="poster"><span class="xs muted bold" style="text-transform:uppercase;letter-spacing:.1em">Posted by</span>${personCard(j.postedBy, { posted: false }).replace('class="person"', 'class="person flat"')}</div>` : ''}
    <div class="sec-t">Your fit</div>
    ${m ? `<div class="fit">${gauge(m.score)}<div><div class="bold serif" style="font-size:1.15rem">${m.score >= 70 ? 'Strong fit' : m.score >= 40 ? 'Worth a shot' : 'A stretch - but possible'}</div><div class="small muted" style="margin-bottom:8px">You have ${m.matched.length} of ${j.skills.length} listed skills.${m.missing.length ? '' : ' Nothing missing!'}</div>
        <div class="tags">${j.skills.map((s) => `<span class="tag ${m.matched.includes(s) ? 'hit' : ''}">${m.matched.includes(s) ? '✓ ' : ''}${esc(s)}</span>`).join('')}</div></div></div>`
    : `<div class="card tight"><div class="tags mb">${j.skills.map((s) => `<span class="tag">${esc(s)}</span>`).join('')}</div><p class="small muted" style="margin:0"><a href="#/login" class="bold">Sign in</a> to see how your skills line up with this role.</p></div>`}
    ${payBlock(j)}
    <div class="sec-t">The role</div><p>${esc(j.description)}</p><h3>What you will do</h3><ul class="dots">${j.responsibilities.map((r) => `<li>${esc(r)}</li>`).join('')}</ul>
    <h3>What we look for</h3><ul class="dots">${j.requirements.map((r) => `<li>${esc(r)}</li>`).join('')}</ul>
    ${c.benefits && c.benefits.length ? `<div class="sec-t">Perks</div><div class="tags">${c.benefits.map((b) => `<span class="badge green">${ico('check')} ${esc(b)}</span>`).join('')}</div>` : ''}
    ${teamBlock(j)}
    <div class="sec-t">About ${esc(j.company)}</div><div class="card tight"><div class="row small muted" style="gap:6px 14px;margin-bottom:8px">${score(c)}<span>${esc(c.industry)}</span><span>${esc(c.size)} people</span>${c.recommend ? `<span>${c.recommend}% would recommend</span>` : ''}</div>
      <p class="small">${esc(c.about || '')}</p><a href="#/company/${encodeURIComponent(j.company)}" class="small bold">Company profile ${ico('arrow')}</a></div></div>
  <div class="sticky-apply">${jobActions(j)}</div>`;
}
const cocard = (c) => `<a class="card cocard tight" href="#/company/${encodeURIComponent(c.name)}"><div class="row nw" style="align-items:flex-start;gap:12px">${sigil(c.name)}<div><h3>${esc(c.name)}</h3><div class="row" style="gap:8px;margin-top:4px">${score(c)}<span class="xs muted">${c.reviews} reviews</span></div>
  <div class="xs muted" style="margin-top:6px">${esc(c.industry)} · ${esc(c.hq || 'Remote')}</div></div></div><div class="small bold" style="margin-top:12px;color:var(--accent)">${c.openJobs} open role${c.openJobs === 1 ? '' : 's'} ${ico('arrow')}</div></a>`;

// drawer
function closeDrawer() { $$('.drawer, .drawer-bg').forEach((n) => n.remove()); document.body.style.overflow = ''; }
async function openDrawer(id) {
  closeDrawer();
  const bg = document.createElement('div'); bg.className = 'drawer-bg'; bg.onclick = closeDrawer;
  const dr = document.createElement('aside'); dr.className = 'drawer'; dr.setAttribute('aria-label', 'Job details');
  dr.innerHTML = `<div class="bar-top"><button class="btn sm ghost" id="dclose">${ico('x')} Close</button><a class="btn sm ghost" href="#/jobs/${id}">Open full page ${ico('ext')}</a></div><div style="padding:26px">${skeletons(3, 120)}</div>`;
  document.body.append(bg, dr); document.body.style.overflow = 'hidden'; $('#dclose', dr).onclick = closeDrawer; $('#dclose', dr).focus();
  try {
    const j = await api('GET', '/jobs/' + id); jobCache[id] = j;
    if (!dr.isConnected) return;
    dr.innerHTML = `<div class="bar-top"><button class="btn sm ghost" id="dclose">${ico('x')} Close</button><a class="btn sm ghost" href="#/jobs/${id}">Open full page ${ico('ext')}</a></div>${jobDetail(j)}`;
    $('#dclose', dr).onclick = closeDrawer; $$('a[href^="#/"]', dr).forEach((a) => a.addEventListener('click', closeDrawer));
  } catch (e) { dr.innerHTML += `<p style="padding:26px">${esc(e.message)}</p>`; }
}

function applyModal(j) {
  const p = state.profile, has = !!p.resumeName;
  const { el, close } = modal(`<div class="row nw between" style="align-items:flex-start"><div class="row nw">${sigil(j.company, 'sm')}<div><h2>Apply to ${esc(j.title)}</h2><div class="muted small">${esc(j.company)} · ${esc(j.location)}</div></div></div><button class="ibtn" id="x" aria-label="Close">${ico('x')}</button></div>
    <div class="card tight flat mt"><div class="row nw between"><div>${has ? `${ico('file')} <b>${esc(p.resumeName)}</b>` : `${ico('alert')} <b>Resume required</b>`}<div class="xs muted">${has ? 'This resume will be sent with your application.' : 'Add one to your profile before applying.'}</div></div>${has ? '' : '<a class="btn sm outline" href="#/profile">Add resume</a>'}</div>
      <div class="bar" style="margin-top:12px"><i style="width:${p.completeness}%"></i></div><div class="xs muted" style="margin-top:4px">Profile ${p.completeness}% complete</div></div>
    ${j.postedBy ? `<div class="row nw small" style="margin-top:14px">${avatarC(j.postedBy.name, 'sm')}<span>Goes to <b>${esc(j.postedBy.name)}</b>, ${esc(j.postedBy.title)} <span class="muted">(${esc(j.postedBy.email)})</span></span></div>` : ''}
    <div class="field mt"><div class="row between"><label for="cl" style="margin:0">Cover letter <span class="muted">(optional)</span></label><button type="button" class="btn sm ghost" id="gen">${ico('spark')} Write it for me</button></div><textarea id="cl" maxlength="3000" placeholder="Why are you a great fit for this role?"></textarea><div class="xs muted" id="clc" style="text-align:right">0 / 3000</div></div>
    <div class="row" style="justify-content:flex-end"><button class="btn" id="cancel">Cancel</button><button class="btn accent" id="submit" ${has ? '' : 'disabled'}>Submit application</button></div>`);
  $('#x', el).onclick = $('#cancel', el).onclick = close;
  $('#cl', el).oninput = (e) => { $('#clc', el).textContent = `${e.target.value.length} / 3000`; };
  $('#gen', el).onclick = () => { const t = $('#cl', el); t.value = fillTpl(DEFAULT_COVER, coverVars(j)); t.dispatchEvent(new Event('input')); };
  $('#submit', el).onclick = (e) => busy(e.target, async () => {
    try { const a = await api('POST', `/jobs/${j.id}/apply`, { coverLetter: $('#cl', el).value }); close(); closeDrawer(); toast('Application submitted. Your trail begins!'); refreshNotifs(); go('#/applications/' + a.id); } catch (err) { toast(err.message, true); }
  });
}

// Auto-apply: review every eligible match for the current search, then send personalised applications in one go.
function autoApplyModal(f, refresh) {
  const p = state.profile, has = !!p.resumeName;
  let items = [], chosen = new Set(), min = +(store.get('autoMin') || 60), tpl = store.get('autoTpl') || DEFAULT_COVER, step = 'review';
  const { el, close } = modal('<div id="aa"></div>'); el.style.maxWidth = '760px';
  const root = $('#aa', el);
  async function load() {
    $('#list', el) && ($('#list', el).innerHTML = skeletons(3, 54));
    try { const d = await api('GET', '/jobs?' + filterQS({ ...f, page: 1, sort: 'match' }, { eligible: 1, minMatch: min })); items = d.items; chosen = new Set(items.map((j) => j.id)); total = d.total; } catch (e) { toast(e.message, true); }
    drawList();
  }
  let total = 0;
  const preview = () => { const j = items.find((x) => chosen.has(x.id)); return j ? fillTpl(tpl, coverVars(j)) : ''; };
  function drawList() {
    const box = $('#list', el); if (!box) return;
    box.innerHTML = items.length ? items.map((j) => `<label class="pick"><input type="checkbox" data-id="${j.id}" ${chosen.has(j.id) ? 'checked' : ''}>${sigil(j.company, 'sm')}<div style="min-width:0;flex:1"><div class="bold serif" style="font-size:1rem">${esc(j.title)}</div>
      <div class="xs muted">${esc(j.company)} · ${esc(loc(j))} · ${salary(j)}</div><div class="xs" style="margin-top:2px">${avatarC(j.postedBy.name, 'sm')} <span class="muted">to</span> ${esc(j.postedBy.name)} <span class="muted">· ${esc(j.postedBy.email)}</span></div></div><span class="badge ${j.match >= 70 ? 'green' : 'accent'}">${j.match}% fit</span></label>`).join('')
      : '<div class="empty small muted" style="padding:28px">No unapplied jobs reach this fit level for your current search. Lower the fit slider or broaden the search.</div>';
    $('#cnt', el).textContent = `${chosen.size} selected${total > items.length ? ` (top ${items.length} of ${total} matches)` : ''}`;
    const go_ = $('#send', el); go_.disabled = !has || !chosen.size; go_.textContent = `Apply to ${chosen.size} job${chosen.size === 1 ? '' : 's'}`;
    const pv = $('#pv', el); if (pv) pv.textContent = preview() || 'Select a job to preview the letter.';
  }
  function drawReview() {
    root.innerHTML = `<div class="row nw between" style="align-items:flex-start"><div><div class="eyebrow">${ico('spark')} Auto-apply</div><h2>Apply to your best matches</h2><p class="muted small" style="margin:6px 0 0">We send your saved resume with a personalised cover letter to the recruiter on each job. Review before sending.</p></div><button class="ibtn" id="x" aria-label="Close">${ico('x')}</button></div>
      ${has ? '' : `<div class="card tight mt" style="border-color:var(--red)">${ico('alert')} <b>Resume needed.</b> Upload one in your profile first. <a href="#/profile" class="bold">Upload resume</a></div>`}
      <div class="mt"><div class="row between"><label for="min" style="margin:0">Only jobs with at least <b id="minv">${min}%</b> skills fit</label><span class="xs muted" id="cnt"></span></div><input id="min" type="range" min="0" max="100" step="5" value="${min}" style="padding:0;border:0;box-shadow:none"></div>
      <div class="pickbar"><button class="btn sm ghost" id="all">Select all</button><button class="btn sm ghost" id="none">Clear</button></div><div id="list" class="picklist">${skeletons(3, 54)}</div>
      <div class="field mt"><div class="row between"><label for="tpl" style="margin:0">Cover letter template</label><button class="btn sm ghost" id="rst">Reset</button></div><textarea id="tpl" style="min-height:130px">${esc(tpl)}</textarea>
        <div class="xs muted" style="margin-top:4px">Placeholders: {{name}} {{title}} {{company}} {{recruiter}} {{skills}}</div></div>
      <details class="small"><summary class="bold" style="cursor:pointer">Preview for the first selected job</summary><pre id="pv" class="preview"></pre></details>
      <p class="xs muted mt">Up to 25 applications per run. Applications are recorded in your trail with notifications; recruiter emails are simulated in this demo.</p>
      <div class="row stickyfoot" style="justify-content:flex-end"><span class="xs muted right" id="cnt2"></span><button class="btn" id="cancel">Cancel</button><button class="btn accent lg" id="send" disabled>Apply</button></div>`;
    $('#x', el).onclick = $('#cancel', el).onclick = close;
    $('#min', el).oninput = (e) => { min = +e.target.value; $('#minv', el).textContent = min + '%'; store.set('autoMin', String(min)); clearTimeout(drawReview.t); drawReview.t = setTimeout(load, 250); };
    $('#all', el).onclick = () => { chosen = new Set(items.map((j) => j.id)); drawList(); $$('#list input', el).forEach((i) => { i.checked = true; }); };
    $('#none', el).onclick = () => { chosen.clear(); drawList(); $$('#list input', el).forEach((i) => { i.checked = false; }); };
    $('#list', el).onchange = (e) => { const id = +e.target.dataset.id; e.target.checked ? chosen.add(id) : chosen.delete(id); drawList(); };
    $('#tpl', el).oninput = (e) => { tpl = e.target.value; store.set('autoTpl', tpl === DEFAULT_COVER ? null : tpl); const pv = $('#pv', el); if (pv) pv.textContent = preview(); };
    $('#rst', el).onclick = () => { tpl = DEFAULT_COVER; $('#tpl', el).value = tpl; store.set('autoTpl', null); drawList(); };
    $('#send', el).onclick = (e) => busy(e.target, async () => {
      try { const d = await api('POST', '/applications/bulk', { jobIds: [...chosen], coverLetter: tpl }); step = 'done'; drawDone(d); refreshNotifs(); } catch (er) { toast(er.message, true); }
    });
    load();
  }
  function drawDone(d) {
    root.innerHTML = `<div class="center" style="padding:10px 0"><div class="ico" style="width:68px;height:68px;margin:0 auto 12px;border-radius:50%;background:var(--green-soft);color:var(--green);border:1.5px solid var(--ink);display:grid;place-items:center;font-size:1.6rem">${ico('check')}</div>
      <h2>${d.applied} application${d.applied === 1 ? '' : 's'} sent</h2><p class="muted small">Each one now has its own trail. You will get an alert whenever a status changes.</p></div>
      <div class="picklist" style="max-height:280px">${d.results.map((r) => `<div class="pick" style="cursor:default"><span class="badge ${r.ok ? 'green' : 'red'}">${r.ok ? 'Sent' : esc(r.error)}</span><div style="flex:1;min-width:0"><div class="bold">${esc(r.title || 'Job ' + r.jobId)}</div><div class="xs muted">${esc(r.company || '')}${r.ok ? ` · to ${esc(r.recruiter.name)}` : ''}</div></div>${r.ok ? `<a class="small bold" href="#/applications/${r.applicationId}">View trail</a>` : ''}</div>`).join('')}</div>
      <div class="row mt" style="justify-content:flex-end"><button class="btn" id="stay">Keep searching</button><a class="btn primary" href="#/applications" id="goto">Open my trail</a></div>`;
    $('#stay', el).onclick = () => { close(); refresh && refresh(); }; $('#goto', el).onclick = close;
  }
  drawReview();
}

// ---------- pages ----------
const pages = {};
pages['/'] = async (main) => {
  main.innerHTML = `<section class="hero">${contours(2.3, { cx: 760, cy: 250, n: 12, step: 42 })}<div class="container"><div><div class="eyebrow">Candidate portal</div>
    <h1>Chart your <em class="scribble">next move.</em></h1><p class="lead">Every opening comes with its pay compared to the market and how well your skills fit. Then follow each application along a trail, step by step.</p>
    <form class="sentence" id="sform" role="search"><label for="sq" style="display:inline;font:inherit;color:inherit">I'm looking for</label> <input id="sq" placeholder="a role or skill" autocomplete="off"> <label for="sl" style="display:inline;font:inherit;color:inherit">work in</label> <input id="sl" placeholder="any city" autocomplete="off"> <button class="btn accent" style="vertical-align:middle;margin-left:6px">Go ${ico('arrow')}</button></form>
    <div class="popular"><span>Try:</span><a href="#/jobs?level=intern">Internships</a><a href="#/jobs?mode=remote">Remote</a><a href="#/jobs?q=react">React</a><a href="#/jobs?category=Data">Data</a><a href="#/jobs?q=design">Design</a></div></div>
    <div class="mapart" id="map" aria-label="Map of featured jobs">${contours(5.1, { cx: 480, cy: 260, n: 11, step: 38, w: 960, h: 960 }).replace('class="contours"', 'class="bg"')}</div></div></section>
    <section class="facts3"><div class="container" id="stats"></div></section>
    <section class="section"><div class="container"><div class="head"><div><div class="eyebrow">Territories</div><h2>Pick a region to explore</h2></div><a href="#/jobs" class="bold">All jobs ${ico('arrow')}</a></div><div class="territories" id="cats"></div></div></section>
    <section class="section"><div class="container"><div class="head"><div><div class="eyebrow">Companies</div><h2>Employers worth the climb</h2></div><a href="#/companies" class="bold">All companies ${ico('arrow')}</a></div><div class="grid g3" id="cos">${skeletons(3, 110)}</div></div></section>
    <section class="section"><div class="container"><div class="explain"><div><div class="eyebrow">The trail</div><h2 style="margin-bottom:12px">No more black hole after you hit apply.</h2>
      <p class="muted">Each application becomes a trail with clear waypoints. You see exactly where you are, what changed, and when - and you get an alert the moment it moves.</p>
      <ul class="dots"><li>Live status from applied to hired</li><li>Full history with timestamps</li><li>Alerts on every change</li></ul></div>
      <div class="card hard"><h4 style="margin-bottom:6px">Sample application</h4><div class="bold serif" style="font-size:1.2rem">Backend Developer · Cartly</div>${trailSVG(2)}<p class="small muted" style="margin:6px 0 0">Shortlisted - interview invite expected this week.</p></div></div></div></section>
    ${state.user ? '' : `<section class="section"><div class="container"><div class="cta">${contours(3.7, { cx: 700, cy: 120, n: 8, step: 40 })}<div><h2>Your next role starts with a profile.</h2><p>Free to join. Takes under a minute.</p></div><a class="btn lg" href="#/register">Create your account</a></div></div></section>`}`;
  $('#sform').onsubmit = (e) => { e.preventDefault(); const qs = new URLSearchParams(); if ($('#sq').value.trim()) qs.set('q', $('#sq').value.trim()); if ($('#sl').value.trim()) qs.set('location', $('#sl').value.trim()); go('#/jobs' + (qs.toString() ? '?' + qs : '')); };
  const [meta, jobs, cos] = await Promise.all([api('GET', '/meta'), api('GET', `/jobs?pageSize=3&sort=${state.user ? 'match' : 'newest'}`), api('GET', '/companies')]);
  const spots = [[30, 36], [70, 30], [52, 74]];
  $('#map').insertAdjacentHTML('beforeend', jobs.items.map((j, i) => `<button class="pin" style="left:${spots[i][0]}%;top:${spots[i][1]}%" data-job="${j.id}" onclick="openDrawer(${j.id})" aria-label="${esc(j.title)}"><span class="lbl"><b>${esc(j.title.length > 26 ? j.title.slice(0, 25) + '…' : j.title)}</b>${esc(j.company)} · ₹${lpa(j.salaryMin)}–${lpa(j.salaryMax)}L</span><span class="stem"></span><span class="pt"></span></button>`).join(''));
  $('#stats').innerHTML = [[meta.total, 'open roles'], [meta.companies, 'hiring companies'], [meta.categories.length, 'territories to explore'], ['Live', 'status on every application']].map(([n, l]) => `<div class="f"><b>${n}</b><span>${l}</span></div>`).join('');
  $('#cats').innerHTML = meta.categories.map((c, i) => `<a class="terr" style="--tc:${COLORS[i % COLORS.length]}" href="#/jobs?category=${encodeURIComponent(c.v)}">${contours(i * 1.9 + 1, { cx: 500, cy: 300, n: 6, step: 50 }).replace('class="contours"', 'class="c"')}<b>${esc(c.v)}</b><small>${c.c} open role${c.c === 1 ? '' : 's'}</small></a>`).join('');
  $('#cos').innerHTML = cos.slice(0, 6).map(cocard).join('');
};

pages['/jobs'] = async (main, query) => {
  const meta = await api('GET', '/meta');
  const f = { q: '', location: '', type: [], mode: [], category: [], level: [], salaryMin: '', posted: '', sort: state.user ? 'match' : 'newest', page: 1, saved: '', hideApplied: '', company: '', ...query };
  for (const k of ['type', 'mode', 'category', 'level']) if (typeof f[k] === 'string') f[k] = f[k] ? f[k].split(',') : [];
  if (query.sort === undefined && !state.user) f.sort = 'newest';
  if (f.location.toLowerCase() === 'remote') { f.location = ''; if (!f.mode.includes('remote')) f.mode.push('remote'); }
  let seq = 0;
  const sel = (id, list, cur, any) => `<select id="${id}" aria-label="${any}">${opts(list, cur, any)}</select>`;
  const salOpts = SALARY.map(([v, l]) => `<option value="${v}" ${String(f.salaryMin) === v ? 'selected' : ''}>${l}</option>`).join('');
  const postOpts = POSTED.map(([v, l]) => `<option value="${v}" ${String(f.posted) === v ? 'selected' : ''}>${l}</option>`).join('');
  main.innerHTML = `<section class="explore-top">${contours(4.2, { cx: 820, cy: 150, n: 9, step: 40, h: 400 })}<div class="container"><div class="eyebrow">${f.saved ? 'Your shortlist' : f.company ? esc(f.company) : 'Explore'}</div>
    <form class="sentence" id="sform">I'm looking for <input id="sq" placeholder="any role or skill" value="${esc(f.q)}" aria-label="Keyword"> ${sel('ftype', meta.types, f.type[0], 'any kind of')} jobs in ${sel('fcat', meta.categories, f.category[0], 'any field')},
      ${sel('fmode', meta.modes, f.mode[0], 'any work style')}, at ${sel('flevel', meta.levels, f.level[0], 'any')} level, near <input id="sl" placeholder="anywhere" value="${esc(f.location)}" aria-label="Location" style="min-width:110px">,
      paying <select id="fsal" aria-label="Minimum pay">${salOpts}</select>, posted <select id="fpost" aria-label="Posted">${postOpts}</select>.</form></div></section>
    <div class="container"><div class="resultbar"><div><h2 id="rtitle">${f.saved ? 'Saved jobs' : f.company ? 'Jobs at ' + esc(f.company) : 'Matching roles'}</h2><div class="muted small" id="count">Searching…</div></div>
      <div class="row"><button class="btn accent" id="auto">${ico('spark')} Auto-apply to matches</button>${state.user ? '<label class="check small" style="margin:0"><input type="checkbox" id="fhide"' + (f.hideApplied ? ' checked' : '') + '> Hide applied</label>' : ''}<button class="btn sm ghost" id="clearall">Reset</button>
        <label for="fsort" class="small muted" style="margin:0">Sort</label><select id="fsort" style="width:auto">${state.user ? '<option value="match">Best fit</option>' : ''}<option value="newest">Newest</option><option value="salary">Highest pay</option><option value="salary_low">Lowest pay</option><option value="title">A–Z</option></select></div></div>
      <div class="jgrid" id="results">${skeletons(6, 200)}</div><div class="pager" id="pager"></div></div>`;
  $('#fsort').value = f.sort; $('#sform').onsubmit = (e) => e.preventDefault();
  async function run() {
    const mine = ++seq, qs = filterQS(f);
    history.replaceState(null, '', '#/jobs' + (qs.toString() ? '?' + qs : '')); qs.set('pageSize', 12);
    let d; try { d = await api('GET', '/jobs?' + qs); } catch (e) { return toast(e.message, true); }
    if (mine !== seq) return;
    f.page = d.page; d.items.forEach((j) => { jobCache[j.id] = { ...(jobCache[j.id] || {}), ...j }; });
    $('#count').textContent = `${d.total} role${d.total === 1 ? '' : 's'} found${f.q ? ` for "${f.q}"` : ''}`;
    $('#results').innerHTML = d.items.length ? d.items.map(jobCard).join('') : `<div style="grid-column:1/-1">${empty('search', 'Nothing on the map here', 'Loosen a few of the blanks in the sentence above, or reset the search.', '<button class="btn outline" id="clearall2">Reset search</button>')}</div>`;
    const pg = []; for (let i = 1; i <= d.pages; i++) pg.push(`<button class="btn sm ${i === d.page ? 'primary' : ''}" data-page="${i}">${i}</button>`);
    $('#pager').innerHTML = d.pages > 1 ? `<button class="btn sm" data-page="${d.page - 1}" ${d.page === 1 ? 'disabled' : ''}>Prev</button>${pg.join('')}<button class="btn sm" data-page="${d.page + 1}" ${d.page === d.pages ? 'disabled' : ''}>Next</button>` : '';
  }
  const reset = () => { f.page = 1; run(); };
  const one = (id, key, arr) => { $(id).onchange = (e) => { f[key] = arr ? (e.target.value ? [e.target.value] : []) : e.target.value; reset(); }; };
  one('#ftype', 'type', 1); one('#fcat', 'category', 1); one('#fmode', 'mode', 1); one('#flevel', 'level', 1); one('#fsal', 'salaryMin'); one('#fpost', 'posted'); one('#fsort', 'sort');
  $('#sq').oninput = debounce((e) => { f.q = e.target.value.trim(); reset(); }, 300); $('#sl').oninput = debounce((e) => { f.location = e.target.value.trim(); reset(); }, 300);
  if ($('#fhide')) $('#fhide').onchange = (e) => { f.hideApplied = e.target.checked ? '1' : ''; reset(); };
  const clearAll = () => { Object.assign(f, { q: '', location: '', type: [], mode: [], category: [], level: [], salaryMin: '', posted: '', hideApplied: '', company: '', page: 1 }); $$('.sentence input').forEach((i) => { i.value = ''; }); $$('.sentence select').forEach((s) => { s.value = ''; }); run(); };
  main.addEventListener('click', (e) => {
    if (e.target.closest('#clearall') || e.target.closest('#clearall2')) return clearAll();
    if (e.target.closest('#auto')) { if (!state.user) { toast('Sign in to use auto-apply'); return go('#/login?next=' + encodeURIComponent(location.hash)); } return autoApplyModal(f, run); }
    const pg = e.target.closest('[data-page]'); if (pg && !pg.disabled) { f.page = +pg.dataset.page; run(); scrollTo({ top: 0, behavior: 'smooth' }); }
  });
  savedHooks.push((id, saved) => { if (f.saved && !saved) run(); });
  run();
};
pages['/saved'] = (main) => { if (!guard()) return; return pages['/jobs'](main, { saved: '1' }); };

pages['/jobs/:id'] = async (main, _q, params) => {
  main.innerHTML = `<div class="container page">${skeletons(1, 400)}</div>`;
  let j; try { j = await api('GET', '/jobs/' + params.id); } catch (e) { main.innerHTML = `<div class="container page">${empty('search', 'Job not found', esc(e.message), '<a class="btn primary" href="#/jobs">Browse jobs</a>')}</div>`; return; }
  jobCache[j.id] = j; document.title = `${j.title} - ${j.company} | Jobs Territory`;
  main.innerHTML = `<div class="container page"><p><a href="javascript:history.back()" class="small bold">← Back</a></p><div class="page-jd">${jobDetail(j)}</div>
    <h2 style="margin:36px 0 16px">More like this</h2><div class="jgrid">${j.similar.map((s) => jobCard({ ...s, saved: false })).join('')}</div></div>`;
};

pages['/companies'] = async (main) => {
  main.innerHTML = `<div class="container page"><div class="pagehead"><div class="eyebrow">Companies</div><h1>Know the place before you apply</h1><p class="muted">Ratings, perks and open roles.</p></div><div class="grid g3">${skeletons(6, 120)}</div></div>`;
  const cos = await api('GET', '/companies'); $('.grid', main).innerHTML = cos.map(cocard).join('');
};
pages['/company/:name'] = async (main, _q, params) => {
  main.innerHTML = `<div class="container page">${skeletons(1, 240)}</div>`;
  let c, jobs; try { [c, jobs] = await Promise.all([api('GET', '/companies/' + encodeURIComponent(params.name)), api('GET', '/jobs?pageSize=50&company=' + encodeURIComponent(params.name))]); }
  catch (e) { main.innerHTML = `<div class="container page">${empty('building', 'Company not found', esc(e.message), '<a class="btn primary" href="#/companies">All companies</a>')}</div>`; return; }
  document.title = `${c.name} - Company profile | Jobs Territory`;
  main.innerHTML = `<div class="chead">${contours(params.name.length, { cx: 800, cy: 120, n: 8, step: 38, h: 300 })}<div class="container"><div class="row nw" style="align-items:flex-start;gap:20px">${sigil(c.name, 'lg')}<div><h1>${esc(c.name)}</h1>
      <div class="row" style="gap:6px 16px;margin-top:10px">${score(c)}<span class="muted">${c.reviews} reviews</span><span class="muted">${esc(c.industry)}</span><span class="muted">${esc(c.size)} people</span>${c.hq ? `<span class="muted">${ico('pin')} ${esc(c.hq)}</span>` : ''}${c.founded ? `<span class="muted">Est. ${c.founded}</span>` : ''}</div></div></div></div></div>
    <div class="container page"><div class="two"><div><h2 class="mb">Open roles (${jobs.total})</h2><div class="grid g2">${jobs.items.map(jobCard).join('') || '<p class="muted">No open roles right now.</p>'}</div></div>
      <aside class="stack"><div class="card"><h4>About</h4><p style="margin-top:8px">${esc(c.about || 'No description yet.')}</p></div>
        ${c.team ? `<div class="card"><h4 class="mb">People</h4><div class="team">${c.team.map((t) => personCard(t, { compact: true })).join('')}</div></div>` : ''}
        ${c.rating ? `<div class="card"><h4>Employee rating</h4><div class="row nw" style="margin-top:10px;gap:14px"><div class="serif" style="font-size:3rem;font-weight:700;line-height:1">${c.rating.toFixed(1)}</div><div><div class="bold">out of 5</div><div class="xs muted">${c.reviews} reviews</div></div></div><div class="bar" style="margin-top:14px"><i style="width:${c.recommend}%;background:var(--green)"></i></div><div class="xs muted" style="margin-top:4px">${c.recommend}% would recommend to a friend</div></div>` : ''}
        ${c.benefits.length ? `<div class="card"><h4>Perks</h4><div class="tags" style="margin-top:10px">${c.benefits.map((b) => `<span class="badge green">${ico('check')} ${esc(b)}</span>`).join('')}</div></div>` : ''}</aside></div></div>`;
};

// ----- auth -----
const strength = (pw) => { let s = 0; if (pw.length >= 8) s++; if (pw.length >= 12) s++; if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++; if (/\d/.test(pw)) s++; if (/[^A-Za-z0-9]/.test(pw)) s++; return s; };
function authPage(mode) {
  return async (main, query) => {
    if (state.user) return go('#/dashboard');
    const reg = mode === 'register';
    const draw = (err = {}, vals = {}) => {
      main.innerHTML = `<div class="authwrap"><div class="authside">${contours(reg ? 1.2 : 6.4, { cx: 500, cy: 380, n: 11, step: 46, w: 800, h: 900 })}<div class="eyebrow" style="color:inherit">${reg ? 'Join' : 'Welcome back'}</div><h1>${reg ? 'Every journey starts with a good map.' : 'Pick up where you left off.'}</h1><p>${reg ? 'Build your profile once, then apply anywhere in seconds.' : 'Your saved jobs and application trails are waiting.'}</p>
        <ul><li>${ico('check')}<span>See pay compared to the market on every job</span></li><li>${ico('check')}<span>Know how well your skills fit before you apply</span></li><li>${ico('check')}<span>Follow each application along its trail</span></li></ul></div>
        <div class="authform"><div class="box"><h2 style="font-size:2rem">${reg ? 'Create your account' : 'Sign in'}</h2><p class="muted">${reg ? 'It takes less than a minute.' : 'Good to see you again.'}</p><form id="af" novalidate style="margin-top:22px">
        ${reg ? `<div class="field ${err.name ? 'bad' : ''}"><label for="n">Full name</label><input id="n" autocomplete="name" value="${esc(vals.name)}">${fieldErr(err, 'name')}</div>` : ''}
        <div class="field ${err.email ? 'bad' : ''}"><label for="e">Email address</label><input id="e" type="email" autocomplete="email" value="${esc(vals.email)}">${fieldErr(err, 'email')}</div>
        <div class="field ${err.password ? 'bad' : ''}"><div class="row between"><label for="p">Password</label><button type="button" class="btn sm ghost" id="showpw" style="margin-bottom:5px">Show</button></div><input id="p" type="password" autocomplete="${reg ? 'new-password' : 'current-password'}">
          ${reg ? '<div class="strength"><i id="sbar"></i></div><div class="xs muted" id="stxt" style="margin-top:4px">At least 8 characters with a letter and a number</div>' : ''}${fieldErr(err, 'password')}</div>
        ${err._ ? `<div class="badge red" style="margin-bottom:14px;white-space:normal" role="alert">${esc(err._)}</div>` : ''}
        <button class="btn accent lg block" id="sb">${reg ? 'Create account' : 'Sign in'}</button></form>
        <p class="small center mt">${reg ? 'Already registered? <a href="#/login" class="bold">Sign in</a>' : 'New here? <a href="#/register" class="bold">Create an account</a>'}</p></div></div></div>`;
      $('#showpw').onclick = (e) => { const i = $('#p'); i.type = i.type === 'password' ? 'text' : 'password'; e.target.textContent = i.type === 'password' ? 'Show' : 'Hide'; };
      if (reg) $('#p').oninput = (e) => { const s = strength(e.target.value), b = $('#sbar'); b.style.width = s * 20 + '%'; b.style.background = ['#b3261e', '#b3261e', '#d98a00', '#7cb518', '#1d7a4d', '#1d7a4d'][s]; $('#stxt').textContent = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong', 'Excellent'][s]; };
      $('#af').onsubmit = (e) => { e.preventDefault(); busy($('#sb'), async () => {
        const v = { name: reg ? $('#n').value : undefined, email: $('#e').value, password: $('#p').value };
        try {
          const d = await api('POST', reg ? '/auth/register' : '/auth/login', v); state.token = d.token; store.set('token', d.token); state.user = d.user; await loadMe();
          toast(reg ? 'Account created. Welcome aboard!' : 'Welcome back'); go(query.next ? decodeURIComponent(query.next) : reg ? '#/profile' : '#/dashboard');
        } catch (er) { draw({ ...er.fields, _: Object.keys(er.fields).length ? '' : er.message }, { name: v.name, email: v.email }); }
      }); };
    };
    draw();
  };
}
pages['/login'] = authPage('login'); pages['/register'] = authPage('register');
const guard = () => { if (!state.user) { go('#/login?next=' + encodeURIComponent(location.hash)); return false; } return true; };

// ----- base camp & applications -----
const arow = (a) => `<a class="arow" href="#/applications/${a.id}">${sigil(a.job.company, 'sm')}<div><div class="bold serif" style="font-size:1.05rem">${esc(a.job.title)}</div><div class="small muted">${esc(a.job.company)} · ${esc(a.job.location)} · Applied ${ago(a.appliedAt)}</div></div><div style="text-align:right">${badge(a.status)}<div class="xs muted" style="margin-top:4px">Updated ${ago(a.updatedAt)}</div></div></a>`;
pages['/dashboard'] = async (main) => {
  if (!guard()) return;
  main.innerHTML = `<div class="container page">${skeletons(3, 120)}</div>`;
  const d = await api('GET', '/dashboard'), t = d.totals, p = state.profile;
  const funnel = STEPS.map(([k, l]) => [l, d.byStatus[k] || 0]), maxF = Math.max(1, ...funnel.map((x) => x[1]));
  main.innerHTML = `<div class="container page"><div class="pagehead"><div class="eyebrow">Base camp</div><h1>Welcome back, ${esc(state.user.name.split(' ')[0])}.</h1><p class="muted">Here is where your search stands today.</p></div>
    <div class="grid g4 mb">${[[t.applications, 'Applications'], [t.active, 'In progress'], [t.interviews, 'Interviews'], [t.offers, 'Offers'], [t.saved, 'Saved jobs']].map(([n, l]) => `<div class="card tight stat"><b>${n}</b><span>${l}</span></div>`).join('')}</div>
    <div class="two"><div class="stack"><div><div class="row between mb"><h2>Recent activity</h2><a href="#/applications" class="bold small">Open my trail ${ico('arrow')}</a></div>
      ${d.recent.length ? d.recent.map(arow).join('') : `<div class="card">${empty('inbox', 'No applications yet', 'Find a role you like and apply in a few clicks.', '<a class="btn primary" href="#/jobs">Explore jobs</a>')}</div>`}</div>
      <div><h2 class="mb">Best fits for you</h2><div class="grid g2">${d.recommended.map((j) => jobCard({ ...j, saved: false })).join('')}</div></div></div>
    <aside class="stack"><div class="card hard"><div class="row nw" style="gap:16px"><div class="ring" style="--p:${d.profileCompleteness}"><span>${d.profileCompleteness}%</span></div><div><h3>Profile strength</h3><div class="small muted">A complete profile gets sharper fit scores.</div></div></div>
      ${p.missing.length ? `<ul class="dots small">${p.missing.slice(0, 4).map((m) => `<li>${esc(m)}</li>`).join('')}</ul><a class="btn primary block" style="margin-top:14px" href="#/profile">Improve profile</a>` : '<p class="small" style="margin-top:12px">Your profile is complete.</p>'}</div>
      <div class="card"><h3 class="mb">Pipeline</h3>${funnel.map(([l, n]) => `<div class="row nw small" style="margin:8px 0"><span style="width:84px">${l}</span><div class="bar" style="flex:1"><i style="width:${(n / maxF) * 100}%"></i></div><b style="width:18px;text-align:right">${n}</b></div>`).join('')}</div></aside></div></div>`;
};
pages['/applications'] = async (main) => {
  if (!guard()) return;
  main.innerHTML = `<div class="container page">${skeletons(3, 80)}</div>`;
  const all = await api('GET', '/applications'); let tab = 'all', view = store.get('appview') || 'list';
  const G = { all: () => true, active: (a) => !['rejected', 'withdrawn', 'hired'].includes(a.status), interview: (a) => ['interview', 'offer'].includes(a.status), closed: (a) => ['rejected', 'withdrawn', 'hired'].includes(a.status) };
  const draw = () => {
    const list = all.filter(G[tab]);
    const cols = [...STEPS.slice(0, 5).map(([k, l]) => [l, all.filter((a) => a.status === k)]), ['Closed', all.filter((a) => G.closed(a))]];
    main.innerHTML = `<div class="container page"><div class="pagehead row between"><div><div class="eyebrow">My trail</div><h1>Every application, mapped</h1></div><div class="tabs" style="margin:0"><button class="${view === 'list' ? 'on' : ''}" data-view="list">${ico('list')} List</button><button class="${view === 'board' ? 'on' : ''}" data-view="board">${ico('board')} Board</button></div></div>
      ${view === 'list' ? `<div class="tabs">${[['all', 'All'], ['active', 'In progress'], ['interview', 'Interview & offer'], ['closed', 'Closed']].map(([k, l]) => `<button class="${tab === k ? 'on' : ''}" data-tab="${k}">${l} (${all.filter(G[k]).length})</button>`).join('')}</div>
        ${list.length ? list.map(arow).join('') : `<div class="card">${empty('inbox', 'Nothing here yet', all.length ? 'No applications in this group.' : 'You have not applied to any jobs yet.', '<a class="btn primary" href="#/jobs">Find jobs</a>')}</div>`}`
      : `<div class="board">${cols.map(([l, items]) => `<div class="col"><h4>${l}<span>${items.length}</span></h4>${items.map((a) => `<a class="bcard" href="#/applications/${a.id}"><div class="bold serif">${esc(a.job.title)}</div><div class="xs muted">${esc(a.job.company)}</div><div class="xs muted" style="margin-top:4px">${ago(a.updatedAt)}${['rejected', 'withdrawn'].includes(a.status) ? ' · ' + STATUS[a.status][0] : a.status === 'hired' ? ' · Hired' : ''}</div></a>`).join('') || '<div class="xs muted">Empty</div>'}</div>`).join('')}</div>`}</div>`;
    $$('[data-tab]', main).forEach((b) => { b.onclick = () => { tab = b.dataset.tab; draw(); }; });
    $$('[data-view]', main).forEach((b) => { b.onclick = () => { view = b.dataset.view; store.set('appview', view); draw(); }; });
  };
  draw();
};
pages['/applications/:id'] = async (main, _q, params) => {
  if (!guard()) return;
  const draw = async () => {
    let a; try { a = await api('GET', '/applications/' + params.id); } catch (e) { main.innerHTML = `<div class="container page">${empty('search', 'Application not found', esc(e.message), '<a class="btn" href="#/applications">Back</a>')}</div>`; return; }
    const dead = ['rejected', 'withdrawn'].includes(a.status), reached = Math.max(...a.events.map((e) => STEPS.findIndex((s) => s[0] === e.status)));
    const cur = dead ? reached : STEPS.findIndex((s) => s[0] === a.status), final = a.status === 'hired', open = !dead && !final;
    main.innerHTML = `<div class="container page"><p><a href="#/applications" class="small bold">← My trail</a></p>
      <div class="card hard"><div class="row nw between" style="align-items:flex-start"><div class="row nw" style="align-items:flex-start;gap:14px">${sigil(a.job.company)}<div><h1 style="font-size:1.8rem"><a href="#/jobs/${a.jobId}" style="color:inherit">${esc(a.job.title)}</a></h1><div class="muted">${esc(a.job.company)} · ${esc(a.job.location)} · ${esc(cap(a.job.type))}</div></div></div>${badge(a.status)}</div>
        <div class="mt">${trailSVG(cur, final ? 'won' : dead ? 'dead' : 'live')}</div>
        ${dead ? `<p class="small" style="color:var(--red);margin:10px 0 0">${a.status === 'withdrawn' ? 'You withdrew this application.' : 'The hiring team decided not to move forward. Plenty of other roles are open.'}</p>` : final ? '<p class="small" style="color:var(--green);margin:10px 0 0">You reached the summit. Congratulations!</p>' : ''}</div>
      <div class="two mt"><div class="card"><h2 class="mb">What happened, step by step</h2><div class="timeline">${[...a.events].reverse().map((e) => `<div class="ev"><div class="bold">${esc(STATUS[e.status][0])}</div><div class="small">${esc(e.note)}</div><div class="xs muted">${dt(e.at)}</div></div>`).join('')}</div></div>
        <aside class="stack"><div class="card"><h3>Your submission</h3><p class="xs muted">Submitted ${dt(a.appliedAt)}</p><div class="row nw small">${ico('file')} ${esc(a.resumeName)}</div>
          ${a.coverLetter ? `<h4 style="margin-top:14px">Cover letter</h4><p class="small" style="white-space:pre-wrap;margin-top:6px">${esc(a.coverLetter)}</p>` : '<p class="muted small" style="margin-top:10px">No cover letter included.</p>'}
          ${open ? '<button class="btn danger sm" id="wd" style="margin-top:12px">Withdraw application</button>' : ''}</div>
        ${a.recruiter ? `<div class="card"><h4 class="mb">Your contact</h4>${personCard(a.recruiter, { posted: true, compact: true })}<p class="xs muted" style="margin:8px 0 0">Follow up politely after a week if you have not heard back.</p></div>` : ''}
        ${open ? `<div class="card flat" style="border-style:dashed"><span class="badge amber">Demo tool</span><p class="small muted" style="margin:8px 0 12px">In production, recruiters move candidates through the Jobs Territory ATS. Simulate that here to watch your trail update.</p>
          <div class="row"><button class="btn sm primary" id="adv">Advance stage</button><button class="btn sm" id="rej">Reject</button></div></div>` : ''}</aside></div></div>`;
    const act = (sel, path, body, msg) => { const b = $(sel); if (b) b.onclick = () => busy(b, async () => { try { await api('POST', `/applications/${params.id}/${path}`, body); toast(msg); refreshNotifs(); await draw(); } catch (e) { toast(e.message, true); } }); };
    act('#adv', 'advance', {}, 'Status updated'); act('#rej', 'advance', { reject: true }, 'Status updated');
    const wd = $('#wd'); if (wd) wd.onclick = () => { const m = modal('<h2>Withdraw this application?</h2><p class="muted">You will no longer be considered for this role. This cannot be undone.</p><div class="row" style="justify-content:flex-end"><button class="btn" id="no">Keep it</button><button class="btn danger" id="yes">Withdraw</button></div>');
      $('#no', m.el).onclick = m.close; $('#yes', m.el).onclick = async () => { m.close(); try { await api('POST', `/applications/${params.id}/withdraw`); toast('Application withdrawn'); refreshNotifs(); draw(); } catch (e) { toast(e.message, true); } }; };
  };
  main.innerHTML = `<div class="container page">${skeletons(1, 240)}</div>`; draw();
};

// ----- profile -----
pages['/profile'] = async (main) => {
  if (!guard()) return;
  await loadMe();
  const p = JSON.parse(JSON.stringify(state.profile)), u = state.user; let errs = {};
  const eduRow = (e, i) => `<div class="entry" data-edu="${i}"><div class="grid g2"><div><label>School / college</label><input data-k="school" value="${esc(e.school)}"></div><div><label>Degree</label><input data-k="degree" value="${esc(e.degree)}"></div></div>
    <div class="row between" style="margin-top:10px"><div style="width:140px"><label>Year</label><input data-k="year" value="${esc(e.year)}" placeholder="2026"></div><button type="button" class="btn sm danger" data-del-edu="${i}">Remove</button></div></div>`;
  const expRow = (e, i) => `<div class="entry" data-exp="${i}"><div class="grid g2"><div><label>Role</label><input data-k="title" value="${esc(e.title)}"></div><div><label>Company / project</label><input data-k="company" value="${esc(e.company)}"></div></div>
    <div class="field" style="margin-top:10px"><label>Period</label><input data-k="period" value="${esc(e.period)}" placeholder="Jun 2025 – Aug 2025"></div><div class="field"><label>What did you do?</label><textarea data-k="description" style="min-height:76px">${esc(e.description)}</textarea></div><button type="button" class="btn sm danger" data-del-exp="${i}">Remove</button></div>`;
  const sec = (id, title, body, action = '') => `<section class="card" id="sec-${id}"><div class="row between mb"><h2>${title}</h2>${action}</div>${body}</section>`;
  const resumeCard = () => (p.resumeName
    ? `<section class="card" id="sec-resume"><div class="row between"><div class="row nw">${ico('file')}<div><div class="bold">${esc(p.resumeName)}</div><div class="xs muted">Used for every application. Re-scan to fill in anything still empty.</div></div></div>
        <div class="row"><label class="btn sm" for="rf" style="cursor:pointer">${ico('upload')} Replace</label><button type="button" class="btn sm" id="rescan">${ico('spark')} Re-scan</button><button type="button" class="btn sm" id="rescan2" title="Overwrite profile fields with what the resume says">Re-scan &amp; replace</button><button type="button" class="btn sm" id="dl">${ico('download')}</button><button type="button" class="btn sm danger" id="rmres">Remove</button></div></div>
        <input type="file" id="rf" accept=".pdf,.docx,.txt,.rtf" hidden></section>`
    : `<section class="card hard" id="sec-resume"><label class="dz" id="dz" for="rf"><span class="dzi">${ico('upload')}</span><span class="serif" style="font-size:1.4rem;font-weight:700">Skip the typing - upload your resume</span>
        <span class="muted">We read it and fill in your skills, education, experience, links and contact details. You stay in control and can edit everything.</span><span class="btn accent" style="margin-top:6px">Choose a file</span>
        <span class="xs muted">PDF, DOCX, TXT or RTF · up to 1.5 MB · drag and drop works too</span></label><input type="file" id="rf" accept=".pdf,.docx,.txt,.rtf" hidden></section>`);
  function scanModal(scan, filename) {
    const m = modal(scan.ok
      ? `<div class="center"><div class="ico" style="width:64px;height:64px;margin:0 auto 12px;border-radius:50%;background:var(--green-soft);color:var(--green);border:1.5px solid var(--ink);display:grid;place-items:center;font-size:1.5rem">${ico('spark')}</div><h2>We read ${esc(filename)}</h2>
        <p class="muted small">${scan.filled.length ? 'These parts of your profile were filled in automatically:' : 'Everything we found is already on your profile.'}</p></div>
        ${scan.filled.length ? `<div class="scanlist">${scan.filled.map((x) => `<div>${ico('check')} ${esc(x)}</div>`).join('')}</div>` : ''}
        <div class="xs muted" style="margin:10px 0">Found: ${scan.detected.skills || 0} skills, ${scan.detected.education || 0} education, ${scan.detected.experience || 0} experience/projects, ${scan.detected.links || 0} links${scan.emailInResume ? ` · email ${esc(scan.emailInResume)}` : ''}.<br>Automatic reading is a best guess - please review each section.</div>
        <div class="row" style="justify-content:flex-end"><button class="btn primary" id="ok">Review my profile</button></div>`
      : `<div class="center"><div class="ico" style="width:64px;height:64px;margin:0 auto 12px;border-radius:50%;background:var(--amber-soft);color:var(--amber);border:1.5px solid var(--ink);display:grid;place-items:center;font-size:1.5rem">${ico('alert')}</div><h2>Resume saved, but not read</h2><p class="muted small">${esc(scan.error)}</p></div>
        <div class="row" style="justify-content:flex-end"><button class="btn primary" id="ok">Fill in manually</button></div>`);
    $('#ok', m.el).onclick = () => { m.close(); scrollTo({ top: 0, behavior: 'smooth' }); };
  }
  const draw = () => {
    main.innerHTML = `<div class="container page"><div class="pagehead row between"><div><div class="eyebrow">Your profile</div><h1>The story you bring</h1><p class="muted" style="margin:4px 0 0">Employers see this when you apply.</p></div>
      <div class="row nw" style="gap:14px"><div style="text-align:right"><div class="bold">${p.completeness}% complete</div>${p.missing.length ? `<div class="xs muted">Next: ${esc(p.missing[0])}</div>` : ''}</div><div class="ring" style="--p:${p.completeness}"><span>${p.completeness}</span></div></div></div>
      <div class="profile-grid"><nav class="sidenav" aria-label="Profile sections">${[['resume', 'Resume'], ['basics', 'Basics'], ['skills', 'Skills'], ['edu', 'Education'], ['exp', 'Experience'], ['links', 'Links'], ['security', 'Account']].map(([k, l]) => `<a href="#" data-scroll="sec-${k}">${l}</a>`).join('')}</nav>
      <div class="stack">${resumeCard()}<form id="pf" novalidate class="stack">
      ${sec('basics', 'Basics', `<div class="grid g2"><div class="field ${errs.name ? 'bad' : ''}"><label for="pn">Full name</label><input id="pn" value="${esc(u.name)}">${fieldErr(errs, 'name')}</div><div class="field"><label>Email</label><input value="${esc(u.email)}" disabled></div>
        <div class="field"><label for="ph">Headline</label><input id="ph" maxlength="120" placeholder="e.g. Final-year CSE student | Full stack developer" value="${esc(p.headline)}"></div><div class="field ${errs.phone ? 'bad' : ''}"><label for="pp">Phone</label><input id="pp" value="${esc(p.phone)}" placeholder="+91 98765 43210">${fieldErr(errs, 'phone')}</div>
        <div class="field"><label for="pl">Location</label><input id="pl" value="${esc(p.location)}" placeholder="City"></div><div class="field"><label for="py">Years of experience</label><input id="py" type="number" min="0" max="60" step="0.5" value="${p.experienceYears}"></div>
        <div class="field"><label for="ps">Expected salary (LPA)</label><input id="ps" type="number" min="0" step="0.1" value="${p.expectedSalary || ''}"></div><div class="field"><label class="check" style="margin-top:26px"><input type="checkbox" id="po" ${p.openToWork ? 'checked' : ''}>Open to work</label></div></div>
        <div class="field"><label for="pb">About you</label><textarea id="pb" maxlength="1500" placeholder="A short summary of who you are and what you are looking for">${esc(p.bio)}</textarea></div>`)}
      ${sec('skills', 'Skills', `<div class="tags mb">${p.skills.map((s, i) => `<span class="tag">${esc(s)}<button type="button" data-rs="${i}" aria-label="Remove ${esc(s)}">×</button></span>`).join('') || '<span class="muted small">No skills yet - these power your fit score.</span>'}</div>
        <input id="skin" list="skl" placeholder="Type a skill and press Enter" maxlength="40"><datalist id="skl">${SKILLS.map((s) => `<option value="${s}">`).join('')}</datalist>`)}
      ${sec('edu', 'Education', `<div>${p.education.map(eduRow).join('') || '<p class="muted small">No education added yet.</p>'}</div>`, `<button type="button" class="btn sm" id="adde">${ico('plus')} Add</button>`)}
      ${sec('exp', 'Experience & projects', `<div>${p.experience.map(expRow).join('') || '<p class="muted small">No experience added yet.</p>'}</div>`, `<button type="button" class="btn sm" id="addx">${ico('plus')} Add</button>`)}
      ${sec('links', 'Links', `<div class="grid g2">${[['linkedin', 'LinkedIn'], ['github', 'GitHub'], ['portfolio', 'Portfolio']].map(([k, l]) => `<div class="field ${errs['links.' + k] ? 'bad' : ''}"><label for="l_${k}">${l}</label><input id="l_${k}" value="${esc(p.links[k])}" placeholder="https://">${fieldErr(errs, 'links.' + k)}</div>`).join('')}</div>`)}
      <div class="row"><button class="btn accent lg" id="save">Save profile</button></div></form>
      ${sec('security', 'Account', `<form id="pwf" novalidate><h3 class="mb">Change password</h3><div class="grid g2"><div class="field"><label for="cp">Current password</label><input type="password" id="cp" autocomplete="current-password"></div><div class="field"><label for="np">New password</label><input type="password" id="np" autocomplete="new-password"></div></div>
        <div id="pwe" class="small" style="color:var(--red);margin-bottom:10px"></div><button class="btn">Update password</button></form><hr class="sep"><div class="row between"><div><h3>Delete account</h3><p class="small muted" style="margin:0">Permanently removes your profile, applications and saved jobs.</p></div><button class="btn danger" id="del">Delete account</button></div>`)}</div></div></div>`;
    bind();
  };
  const collect = () => {
    const v = (id) => $(id).value;
    Object.assign(p, { headline: v('#ph'), phone: v('#pp'), location: v('#pl'), bio: v('#pb'), experienceYears: +v('#py') || 0, expectedSalary: +v('#ps') || 0, openToWork: $('#po').checked,
      links: { linkedin: v('#l_linkedin'), github: v('#l_github'), portfolio: v('#l_portfolio') },
      education: $$('[data-edu]').map((n) => Object.fromEntries($$('[data-k]', n).map((i) => [i.dataset.k, i.value]))), experience: $$('[data-exp]').map((n) => Object.fromEntries($$('[data-k]', n).map((i) => [i.dataset.k, i.value]))) });
    u.name = v('#pn'); return { ...p, name: u.name };
  };
  const addSkill = (raw) => raw.split(',').map((s) => s.trim()).filter(Boolean).forEach((s) => { if (!p.skills.some((x) => x.toLowerCase() === s.toLowerCase())) p.skills.push(s); });
  const bind = () => {
    $$('[data-scroll]').forEach((a) => { a.onclick = (e) => { e.preventDefault(); $('#' + a.dataset.scroll).scrollIntoView({ behavior: 'smooth', block: 'start' }); }; });
    $('#skin').onkeydown = (e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); collect(); addSkill(e.target.value); draw(); $('#skin').focus(); } };
    $$('[data-rs]').forEach((b) => { b.onclick = () => { collect(); p.skills.splice(+b.dataset.rs, 1); draw(); }; });
    $('#adde').onclick = () => { collect(); p.education.push({ school: '', degree: '', year: '' }); draw(); };
    $('#addx').onclick = () => { collect(); p.experience.push({ title: '', company: '', period: '', description: '' }); draw(); };
    $$('[data-del-edu]').forEach((b) => { b.onclick = () => { collect(); p.education.splice(+b.dataset.delEdu, 1); draw(); }; });
    $$('[data-del-exp]').forEach((b) => { b.onclick = () => { collect(); p.experience.splice(+b.dataset.delExp, 1); draw(); }; });
    $('#pf').onsubmit = (e) => { e.preventDefault(); busy($('#save'), async () => {
      const body = collect(); const pending = $('#skin').value.trim(); if (pending) { addSkill(pending); body.skills = p.skills; }
      try { const d = await api('PUT', '/profile', body); state.profile = d.profile; state.user = d.user; Object.assign(p, JSON.parse(JSON.stringify(d.profile))); Object.assign(u, d.user); errs = {}; toast('Profile saved'); paintHeader(); draw(); }
      catch (er) { errs = er.fields || {}; toast(er.message, true); draw(); const f = $('.field.bad'); if (f) f.scrollIntoView({ block: 'center' }); }
    }); };
    const applyServer = (d) => { state.profile = d.profile; Object.assign(p, JSON.parse(JSON.stringify(d.profile))); errs = {}; };
    const handleFile = async (file) => {
      if (!file) return;
      if (!/\.(pdf|docx?|txt|rtf)$/i.test(file.name)) return toast('Please choose a PDF, DOCX, TXT or RTF file', true);
      if (file.size > 1.5 * 1024 * 1024) return toast('Resume must be under 1.5 MB', true);
      const wait = modal(`<div class="center" style="padding:24px 8px"><div class="spinner"></div><h2 style="margin-top:14px">Reading your resume…</h2><p class="muted small">Pulling out contact details, skills, education and experience.</p></div>`);
      try {
        try { await api('PUT', '/profile', collect()); } catch (er) { errs = er.fields || {}; wait.close(); toast('Fix the highlighted fields first, then upload', true); return draw(); }
        const data = await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result.split(',')[1]); r.onerror = rej; r.readAsDataURL(file); });
        const d = await api('POST', '/profile/resume', { name: file.name, data });
        wait.close(); applyServer(d); u.name = state.user.name; draw(); scanModal(d.scan, file.name);
      } catch (er) { wait.close(); toast(er.message, true); }
    };
    $('#rf').onchange = (e) => handleFile(e.target.files[0]);
    const dz = $('#dz');
    if (dz) { ['dragenter', 'dragover'].forEach((ev) => dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.add('over'); })); ['dragleave', 'drop'].forEach((ev) => dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.remove('over'); })); dz.addEventListener('drop', (e) => handleFile(e.dataTransfer.files[0])); }
    const rescan = (overwrite) => async () => {
      try { await api('PUT', '/profile', collect()); const d = await api('POST', '/profile/resume/scan', { overwrite }); applyServer(d); draw(); scanModal(d.scan, p.resumeName); } catch (er) { toast(er.message, true); }
    };
    const rs = $('#rescan'); if (rs) rs.onclick = rescan(false);
    const rs2 = $('#rescan2'); if (rs2) rs2.onclick = () => { const m = modal('<h2>Replace profile fields?</h2><p class="muted">This overwrites your headline, summary, skills, education, experience and links with what your resume says. Your name and email are not changed.</p><div class="row" style="justify-content:flex-end"><button class="btn" id="no">Cancel</button><button class="btn primary" id="yes">Replace from resume</button></div>'); $('#no', m.el).onclick = m.close; $('#yes', m.el).onclick = () => { m.close(); rescan(true)(); }; };
    const dl = $('#dl'); if (dl) dl.onclick = async () => { try { const res = await api('GET', '/profile/resume', null, true); const url = URL.createObjectURL(await res.blob()); const a = document.createElement('a'); a.href = url; a.download = p.resumeName; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); } catch (er) { toast(er.message, true); } };
    const rm = $('#rmres'); if (rm) rm.onclick = async () => { const body = collect(); const d = await api('DELETE', '/profile/resume'); state.profile = d.profile; Object.assign(p, body, { resumeName: '', completeness: d.profile.completeness, missing: d.profile.missing }); toast('Resume removed'); draw(); };
    $('#pwf').onsubmit = (e) => { e.preventDefault(); busy($('#pwf button'), async () => {
      try { await api('POST', '/auth/password', { current: $('#cp').value, next: $('#np').value }); toast('Password updated'); $('#cp').value = $('#np').value = ''; $('#pwe').textContent = ''; } catch (er) { $('#pwe').textContent = er.fields.next || er.fields.current || er.message; }
    }); };
    $('#del').onclick = () => { const m = modal('<h2>Delete your account?</h2><p class="muted">This permanently deletes everything. Enter your password to confirm.</p><div class="field"><input type="password" id="dp" placeholder="Password"><div class="err" id="dpe"></div></div><div class="row" style="justify-content:flex-end"><button class="btn" id="no">Cancel</button><button class="btn danger" id="yes">Delete forever</button></div>');
      $('#no', m.el).onclick = m.close;
      $('#yes', m.el).onclick = async () => { try { await api('DELETE', '/me', { password: $('#dp', m.el).value }); m.close(); state.token = null; store.set('token', null); state.user = null; state.profile = null; toast('Account deleted'); go('#/'); render(); } catch (er) { $('#dpe', m.el).textContent = er.message; } }; };
  };
  draw();
};

// ---------- router ----------
const routeTable = Object.keys(pages).map((p) => ({ p, re: new RegExp('^' + p.replace(/:(\w+)/g, '([^/]+)') + '$'), keys: [...p.matchAll(/:(\w+)/g)].map((m) => m[1]) }));
async function render() {
  const { path, query } = parseHash();
  document.documentElement.dataset.theme = store.get('theme') || 'light';
  closeDrawer();
  $('#app').innerHTML = '<header class="site" id="hdr"></header><main id="main"></main><footer class="site-f" id="ftr"></footer>';
  paintHeader(); paintFooter(); savedHooks.length = 0; state.menu = null;
  const main = $('#main'), hit = routeTable.find((r) => r.re.test(path));
  document.title = 'Jobs Territory - Chart your next move';
  if (!hit) { main.innerHTML = `<div class="container page">${empty('search', 'Off the map', 'That page does not exist.', '<a class="btn primary" href="#/">Back to start</a>')}</div>`; return; }
  const m = path.match(hit.re), params = Object.fromEntries(hit.keys.map((k, i) => [k, decodeURIComponent(m[i + 1])]));
  try { await pages[hit.p](main, query, params); } catch (e) { console.error(e); main.innerHTML = `<div class="container page">${empty('alert', 'Something went wrong', esc(e.message), '<button class="btn" onclick="location.reload()">Reload</button>')}</div>`; }
  scrollTo(0, 0);
}
window.addEventListener('hashchange', render);
loadMe().then(render);
