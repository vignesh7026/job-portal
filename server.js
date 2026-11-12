'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { open } = require('./db');
const { seedJobs, COMPANIES, contactsFor, postedBy } = require('./seed');
const { extractText, parseResume } = require('./resume');

const PIPELINE = ['applied', 'under_review', 'shortlisted', 'interview', 'offer', 'hired'];
const STATUS_NOTE = {
  applied: 'Application submitted',
  under_review: 'A recruiter is reviewing your profile',
  shortlisted: 'You have been shortlisted',
  interview: 'Interview stage - expect a call or email to schedule',
  offer: 'Congratulations, an offer is being prepared',
  hired: 'Welcome aboard! You have been hired',
  rejected: 'Not moving forward at this time',
  withdrawn: 'You withdrew this application',
};
const MAX_BODY = 2.5 * 1024 * 1024;
const MAX_RESUME = 1.5 * 1024 * 1024;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.png': 'image/png' };

class HttpError extends Error {
  constructor(status, message, fields) { super(message); this.status = status; this.fields = fields; }
}
const bad = (msg, fields) => new HttpError(400, msg, fields);

// ---------- helpers ----------
const now = () => new Date().toISOString();
const json = (s, fallback) => { try { return JSON.parse(s); } catch { return fallback; } };
const str = (v, max = 500) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const num = (v, min, max) => { const n = Number(v); return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : 0; };
const strList = (v, maxItems, maxLen) => {
  const seen = new Set();
  return (Array.isArray(v) ? v : []).map((x) => str(x, maxLen)).filter((x) => x && !seen.has(x.toLowerCase()) && seen.add(x.toLowerCase())).slice(0, maxItems);
};
const emailOk = (e) => /^[^\s@]{1,64}@[^\s@]+\.[^\s@]{2,}$/.test(e) && e.length <= 254;

function hashPassword(pw) {
  const salt = crypto.randomBytes(16);
  return `${salt.toString('hex')}:${crypto.scryptSync(pw, salt, 64).toString('hex')}`;
}
function verifyPassword(pw, stored) {
  const [saltHex, hashHex] = stored.split(':');
  const a = crypto.scryptSync(pw, Buffer.from(saltHex, 'hex'), 64);
  return crypto.timingSafeEqual(a, Buffer.from(hashHex, 'hex'));
}
function passwordProblem(pw) {
  if (typeof pw !== 'string' || pw.length < 8) return 'Password must be at least 8 characters';
  if (pw.length > 100) return 'Password is too long';
  if (!/[A-Za-z]/.test(pw) || !/\d/.test(pw)) return 'Password needs at least one letter and one number';
  return null;
}

function loadSecret() {
  if (process.env.APP_SECRET) return process.env.APP_SECRET;
  const f = path.join(__dirname, '.secret');
  try { return fs.readFileSync(f, 'utf8').trim(); } catch { /* generate below */ }
  const s = crypto.randomBytes(32).toString('hex');
  try { fs.writeFileSync(f, s); } catch { /* read-only FS: ephemeral secret */ }
  return s;
}

function createApp(db, opts = {}) {
  const secret = opts.secret || loadSecret();
  const sign = (data) => crypto.createHmac('sha256', secret).update(data).digest('base64url');
  const issue = (uid) => {
    const body = Buffer.from(JSON.stringify({ uid, exp: Date.now() + 7 * 86400000 })).toString('base64url');
    return `${body}.${sign(body)}`;
  };
  function readToken(tok) {
    if (typeof tok !== 'string') return null;
    const [body, sig] = tok.split('.');
    if (!body || !sig) return null;
    const expected = sign(body);
    if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
    const p = json(Buffer.from(body, 'base64url').toString(), null);
    return p && p.exp > Date.now() ? p.uid : null;
  }

  // naive in-memory rate limiter for auth endpoints
  const hits = new Map();
  function rateLimit(key, limit, windowMs) {
    if (opts.noRateLimit) return;
    const t = Date.now();
    const arr = (hits.get(key) || []).filter((x) => t - x < windowMs);
    if (arr.length >= limit) throw new HttpError(429, 'Too many attempts. Please wait a minute and try again.');
    arr.push(t); hits.set(key, arr);
  }

  const q = {
    userByEmail: db.prepare('SELECT * FROM users WHERE email = ?'),
    userById: db.prepare('SELECT id,name,email,created_at FROM users WHERE id = ?'),
    profile: db.prepare('SELECT * FROM profiles WHERE user_id = ?'),
    notify: db.prepare('INSERT INTO notifications(user_id,message,link,at) VALUES(?,?,?,?)'),
    event: db.prepare('INSERT INTO app_events(application_id,status,note,at) VALUES(?,?,?,?)'),
  };
  const notify = (uid, message, link = '') => q.notify.run(uid, message, link, now());
  const tx = (fn) => {
    db.exec('BEGIN');
    try { const r = fn(); db.exec('COMMIT'); return r; } catch (e) { db.exec('ROLLBACK'); throw e; }
  };

  // ---------- resume scanning ----------
  function scanResume(uid, buf, filename, autofill, overwrite) {
    const { text, error } = extractText(buf, filename);
    if (error) return { ok: false, error, filled: [], detected: {} };
    const parsed = parseResume(text), f = parsed.fields, p = q.profile.get(uid), filled = [];
    const links = json(p.links, {}), upd = {};
    if (autofill) {
      const text1 = (key, col, val, label, max) => { val = str(val, max); if (val && (overwrite || !p[col])) { upd[col] = val; filled.push(label); } };
      text1('headline', 'headline', f.headline, 'Headline', 120);
      text1('location', 'location', f.location, 'Location', 80);
      text1('bio', 'bio', f.bio, 'About you', 1500);
      if (/^[+\d][\d\s\-()]{6,18}$/.test(f.phone) && (overwrite || !p.phone)) { upd.phone = f.phone; filled.push('Phone'); }
      if (f.experienceYears > 0 && (overwrite || !p.experience_years)) { upd.experience_years = num(f.experienceYears, 0, 60); filled.push('Experience years'); }
      const have = json(p.skills, []), merged = overwrite && f.skills.length ? [] : have.slice();
      const seen = new Set(merged.map((x) => x.toLowerCase())); let added = 0;
      for (const sk of f.skills) if (!seen.has(sk.toLowerCase()) && merged.length < 30) { merged.push(sk); seen.add(sk.toLowerCase()); added++; }
      if (added) { upd.skills = JSON.stringify(merged); filled.push(`Skills (${added})`); }
      if (f.education.length && (overwrite || !json(p.education, []).length)) { upd.education = JSON.stringify(f.education); filled.push(`Education (${f.education.length})`); }
      if (f.experience.length && (overwrite || !json(p.experience, []).length)) { upd.experience = JSON.stringify(f.experience); filled.push(`Experience & projects (${f.experience.length})`); }
      const nl = { ...links }; let li = 0;
      for (const k of ['linkedin', 'github', 'portfolio']) if (f.links[k] && /^https?:\/\//i.test(f.links[k]) && (overwrite || !links[k])) { nl[k] = f.links[k]; li++; }
      if (li) { upd.links = JSON.stringify(nl); filled.push(`Links (${li})`); }
      const cols = Object.keys(upd);
      if (cols.length) db.prepare(`UPDATE profiles SET ${cols.map((c) => c + ' = ?').join(', ')}, updated_at = ? WHERE user_id = ?`).run(...cols.map((c) => upd[c]), now(), uid);
    }
    return { ok: true, filled, detected: parsed.detected, emailInResume: parsed.email, nameInResume: parsed.name, characters: text.length };
  }

  // ---------- serializers ----------
  const companyOut = (name) => ({ name, ...(COMPANIES[name] || { industry: 'Business Services', size: '51-200', hq: '', founded: null, rating: null, reviews: 0, recommend: null, about: '', benefits: [] }) });
  const jobOut = (j, extra = {}) => ({
    id: j.id, title: j.title, company: j.company, location: j.location, mode: j.mode, type: j.type,
    category: j.category, level: j.level, salaryMin: j.salary_min, salaryMax: j.salary_max,
    description: j.description, responsibilities: json(j.responsibilities, []), requirements: json(j.requirements, []),
    skills: json(j.skills, []), postedAt: j.posted_at, deadline: j.deadline,
    closed: !!j.deadline && new Date(j.deadline) < new Date(), companyInfo: companyOut(j.company), postedBy: postedBy(j.company, j.id), ...extra,
  });
  function profileOut(uid) {
    const p = q.profile.get(uid) || {};
    const links = json(p.links, {});
    const out = {
      headline: p.headline || '', phone: p.phone || '', location: p.location || '', bio: p.bio || '',
      skills: json(p.skills, []), experienceYears: p.experience_years || 0, expectedSalary: p.expected_salary || 0,
      education: json(p.education, []), experience: json(p.experience, []),
      links: { linkedin: links.linkedin || '', github: links.github || '', portfolio: links.portfolio || '' },
      openToWork: p.open_to_work !== 0, resumeName: p.resume_name || '', updatedAt: p.updated_at || null,
    };
    const checks = [
      ['Add a headline', !!out.headline], ['Add your phone number', !!out.phone], ['Add your location', !!out.location],
      ['Write a short bio (30+ characters)', out.bio.length >= 30], ['List at least 3 skills', out.skills.length >= 3],
      ['Add an education entry', out.education.length > 0], ['Add work experience (or projects)', out.experience.length > 0],
      ['Add a profile link (LinkedIn/GitHub)', !!(out.links.linkedin || out.links.github || out.links.portfolio)],
      ['Upload your resume', !!out.resumeName], ['Set expected salary', out.expectedSalary > 0],
    ];
    out.completeness = Math.round((checks.filter((c) => c[1]).length / checks.length) * 100);
    out.missing = checks.filter((c) => !c[1]).map((c) => c[0]);
    return out;
  }
  function matchScore(jobSkills, mySkills) {
    if (!jobSkills.length || !mySkills.length) return { score: 0, matched: [], missing: jobSkills };
    const mine = new Set(mySkills.map((s) => s.toLowerCase()));
    const matched = jobSkills.filter((s) => mine.has(s.toLowerCase()));
    return { score: Math.round((matched.length / jobSkills.length) * 100), matched, missing: jobSkills.filter((s) => !mine.has(s.toLowerCase())) };
  }
  function appOut(a, withEvents) {
    const out = {
      id: a.id, jobId: a.job_id, status: a.status, coverLetter: a.cover_letter, resumeName: a.resume_name,
      appliedAt: a.applied_at, updatedAt: a.updated_at,
      job: { id: a.job_id, title: a.title, company: a.company, location: a.location, mode: a.mode, type: a.type },
    };
    if (withEvents) {
      out.recruiter = postedBy(a.company, a.job_id);
      out.events = db.prepare('SELECT status,note,at FROM app_events WHERE application_id = ? ORDER BY id').all(a.id);
    }
    return out;
  }
  const APP_SELECT = `SELECT a.*, j.title, j.company, j.location, j.mode, j.type FROM applications a JOIN jobs j ON j.id = a.job_id`;

  // ---------- route table ----------
  const routes = [];
  const route = (method, pattern, auth, handler) => {
    const keys = [];
    const re = new RegExp('^' + pattern.replace(/:(\w+)/g, (_, k) => { keys.push(k); return '([^/]+)'; }) + '$');
    routes.push({ method, re, keys, auth, handler });
  };

  // --- auth ---
  route('POST', '/api/auth/register', false, ({ body, ip }) => {
    rateLimit('reg:' + ip, 10, 60000);
    const name = str(body.name, 80), email = str(body.email, 254).toLowerCase(), fields = {};
    if (name.length < 2) fields.name = 'Please enter your full name';
    if (!emailOk(email)) fields.email = 'Enter a valid email address';
    const pw = passwordProblem(body.password);
    if (pw) fields.password = pw;
    if (Object.keys(fields).length) throw bad('Please fix the highlighted fields', fields);
    if (q.userByEmail.get(email)) throw new HttpError(409, 'An account with this email already exists', { email: 'Email already registered' });
    const id = tx(() => {
      const r = db.prepare('INSERT INTO users(name,email,password_hash,created_at) VALUES(?,?,?,?)').run(name, email, hashPassword(body.password), now());
      const uid = Number(r.lastInsertRowid);
      db.prepare('INSERT INTO profiles(user_id,updated_at) VALUES(?,?)').run(uid, now());
      notify(uid, `Welcome to Jobs Territory, ${name.split(' ')[0]}! Complete your profile to get better matches.`, '#/profile');
      return uid;
    });
    return { status: 201, data: { token: issue(id), user: q.userById.get(id) } };
  });
  route('POST', '/api/auth/login', false, ({ body, ip }) => {
    rateLimit('login:' + ip, 15, 60000);
    const u = q.userByEmail.get(str(body.email, 254).toLowerCase());
    // Always run a hash comparison to keep timing similar for unknown emails.
    const ok = u ? verifyPassword(String(body.password || ''), u.password_hash)
      : (verifyPassword('x', hashPassword('y')), false);
    if (!ok) throw new HttpError(401, 'Incorrect email or password');
    return { data: { token: issue(u.id), user: q.userById.get(u.id) } };
  });
  route('POST', '/api/auth/password', true, ({ body, uid }) => {
    const u = db.prepare('SELECT * FROM users WHERE id = ?').get(uid);
    if (!verifyPassword(String(body.current || ''), u.password_hash)) throw bad('Current password is incorrect', { current: 'Incorrect password' });
    const pw = passwordProblem(body.next);
    if (pw) throw bad(pw, { next: pw });
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hashPassword(body.next), uid);
    return { data: { ok: true } };
  });
  route('DELETE', '/api/me', true, ({ body, uid }) => {
    const u = db.prepare('SELECT * FROM users WHERE id = ?').get(uid);
    if (!verifyPassword(String(body.password || ''), u.password_hash)) throw bad('Password is incorrect', { password: 'Incorrect password' });
    db.prepare('DELETE FROM users WHERE id = ?').run(uid);
    return { data: { ok: true } };
  });

  // --- profile ---
  route('GET', '/api/me', true, ({ uid }) => ({ data: { user: q.userById.get(uid), profile: profileOut(uid) } }));
  route('PUT', '/api/profile', true, ({ body, uid }) => {
    const fields = {};
    const name = body.name === undefined ? null : str(body.name, 80);
    if (name !== null && name.length < 2) fields.name = 'Please enter your full name';
    const phone = str(body.phone, 20);
    if (phone && !/^[+\d][\d\s\-()]{6,18}$/.test(phone)) fields.phone = 'Enter a valid phone number';
    const links = {};
    for (const k of ['linkedin', 'github', 'portfolio']) {
      const v = str(body.links && body.links[k], 200);
      if (v && !/^https?:\/\/[^\s]+\.[^\s]+$/i.test(v)) fields['links.' + k] = 'Enter a full URL starting with http(s)://';
      links[k] = v;
    }
    if (Object.keys(fields).length) throw bad('Please fix the highlighted fields', fields);
    const education = (Array.isArray(body.education) ? body.education : []).slice(0, 10).map((e) => ({
      school: str(e.school, 120), degree: str(e.degree, 120), year: str(e.year, 20),
    })).filter((e) => e.school || e.degree);
    const experience = (Array.isArray(body.experience) ? body.experience : []).slice(0, 15).map((e) => ({
      title: str(e.title, 120), company: str(e.company, 120), period: str(e.period, 60), description: str(e.description, 600),
    })).filter((e) => e.title || e.company);
    tx(() => {
      if (name !== null) db.prepare('UPDATE users SET name = ? WHERE id = ?').run(name, uid);
      db.prepare(`UPDATE profiles SET headline=?, phone=?, location=?, bio=?, skills=?, experience_years=?, expected_salary=?,
        education=?, experience=?, links=?, open_to_work=?, updated_at=? WHERE user_id=?`).run(
        str(body.headline, 120), phone, str(body.location, 80), str(body.bio, 1500), JSON.stringify(strList(body.skills, 30, 40)),
        num(body.experienceYears, 0, 60), num(body.expectedSalary, 0, 1000), JSON.stringify(education), JSON.stringify(experience),
        JSON.stringify(links), body.openToWork === false ? 0 : 1, now(), uid);
    });
    return { data: { user: q.userById.get(uid), profile: profileOut(uid) } };
  });
  route('POST', '/api/profile/resume', true, ({ body, uid }) => {
    const name = str(body.name, 120).replace(/[^\w.\- ()]/g, '_');
    if (!/\.(pdf|docx?|txt|rtf)$/i.test(name)) throw bad('Resume must be a PDF, DOC, DOCX, TXT or RTF file');
    const data = typeof body.data === 'string' ? body.data : '';
    if (!data || !/^[A-Za-z0-9+/=]+$/.test(data)) throw bad('Invalid file data');
    if (data.length * 0.75 > MAX_RESUME) throw bad('Resume must be under 1.5 MB');
    db.prepare('UPDATE profiles SET resume_name=?, resume_data=?, updated_at=? WHERE user_id=?').run(name, data, now(), uid);
    const scan = scanResume(uid, Buffer.from(data, 'base64'), name, body.autofill !== false, false);
    return { data: { profile: profileOut(uid), scan } };
  });
  // Re-read the stored resume. overwrite=true replaces profile fields with what the resume says; otherwise only empty fields are filled.
  route('POST', '/api/profile/resume/scan', true, ({ body, uid }) => {
    const p = q.profile.get(uid);
    if (!p || !p.resume_data) throw bad('Upload a resume first');
    const scan = scanResume(uid, Buffer.from(p.resume_data, 'base64'), p.resume_name, true, body.overwrite === true);
    return { data: { profile: profileOut(uid), scan } };
  });
  route('DELETE', '/api/profile/resume', true, ({ uid }) => {
    db.prepare("UPDATE profiles SET resume_name='', resume_data='', updated_at=? WHERE user_id=?").run(now(), uid);
    return { data: { profile: profileOut(uid) } };
  });
  route('GET', '/api/profile/resume', true, ({ uid }) => {
    const p = q.profile.get(uid);
    if (!p || !p.resume_data) throw new HttpError(404, 'No resume uploaded');
    return { raw: Buffer.from(p.resume_data, 'base64'), filename: p.resume_name };
  });

  // --- jobs ---
  route('GET', '/api/meta', false, () => {
    const count = (col) => db.prepare(`SELECT ${col} v, COUNT(*) c FROM jobs GROUP BY ${col} ORDER BY c DESC`).all();
    return { data: {
      categories: count('category'), types: count('type'), modes: count('mode'), levels: count('level'),
      locations: count('location'), total: db.prepare('SELECT COUNT(*) c FROM jobs').get().c,
      companies: db.prepare('SELECT COUNT(DISTINCT company) c FROM jobs').get().c,
    } };
  });
  route('GET', '/api/companies', false, () => {
    const counts = Object.fromEntries(db.prepare('SELECT company c, COUNT(*) n FROM jobs GROUP BY company').all().map((r) => [r.c, r.n]));
    return { data: Object.keys(counts).map((n) => ({ ...companyOut(n), openJobs: counts[n] })).sort((a, b) => (b.rating || 0) - (a.rating || 0)) };
  });
  route('GET', '/api/companies/:name', false, ({ params }) => {
    const n = db.prepare('SELECT COUNT(*) c FROM jobs WHERE company = ?').get(params.name).c;
    if (!n && !COMPANIES[params.name]) throw new HttpError(404, 'Company not found');
    return { data: { ...companyOut(params.name), openJobs: n, team: contactsFor(params.name) } };
  });
  route('GET', '/api/jobs', 'optional', ({ query, uid }) => {
    const where = [], args = [];
    const terms = str(query.q, 100).toLowerCase().split(/\s+/).filter(Boolean).slice(0, 6);
    for (const t of terms) {
      where.push(`(LOWER(title) LIKE ? ESCAPE '\\' OR LOWER(company) LIKE ? ESCAPE '\\' OR LOWER(skills) LIKE ? ESCAPE '\\' OR LOWER(location) LIKE ? ESCAPE '\\' OR LOWER(description) LIKE ? ESCAPE '\\')`);
      const like = '%' + t.replace(/[\\%_]/g, '\\$&') + '%';
      args.push(like, like, like, like, like);
    }
    for (const [param, col] of [['type', 'type'], ['mode', 'mode'], ['category', 'category'], ['level', 'level']]) {
      const vals = str(query[param], 200).split(',').filter(Boolean).slice(0, 10);
      if (vals.length) { where.push(`${col} IN (${vals.map(() => '?').join(',')})`); args.push(...vals); }
    }
    if (query.company) { where.push('company = ?'); args.push(str(query.company, 100)); }
    const loc = str(query.location, 80);
    if (loc) { where.push('LOWER(location) LIKE ?'); args.push('%' + loc.toLowerCase() + '%'); }
    const minSal = Number(query.salaryMin);
    if (minSal > 0) { where.push('salary_max >= ?'); args.push(minSal); }
    const days = Number(query.posted);
    if (days > 0) { where.push('posted_at >= ?'); args.push(new Date(Date.now() - days * 86400000).toISOString()); }
    if (query.saved === '1' && uid) { where.push('id IN (SELECT job_id FROM saved_jobs WHERE user_id = ?)'); args.push(uid); }
    if (query.hideApplied === '1' && uid) { where.push('id NOT IN (SELECT job_id FROM applications WHERE user_id = ?)'); args.push(uid); }
    const W = where.length ? 'WHERE ' + where.join(' AND ') : '';
    const order = { newest: 'posted_at DESC', salary: 'salary_max DESC', salary_low: 'salary_min ASC', title: 'title ASC' }[query.sort] || 'posted_at DESC';
    if (query.eligible === '1' && uid) {
      const min = num(query.minMatch, 0, 100), mySkills = json(q.profile.get(uid)?.skills, []);
      const done = new Set(db.prepare('SELECT job_id FROM applications WHERE user_id = ?').all(uid).map((r) => r.job_id));
      const all = db.prepare(`SELECT * FROM jobs ${W} ORDER BY ${order}, id DESC LIMIT 300`).all(...args).filter((r) => !done.has(r.id))
        .map((r) => jobOut(r)).filter((j) => !j.closed).map((j) => ({ ...j, match: matchScore(j.skills, mySkills).score })).filter((j) => j.match >= min)
        .sort((a, b) => b.match - a.match || new Date(b.postedAt) - new Date(a.postedAt));
      return { data: { items: all.slice(0, 25), total: all.length, page: 1, pages: 1, pageSize: 25 } };
    }
    const pageSize = Math.min(50, Math.max(1, parseInt(query.pageSize, 10) || 9));
    const total = db.prepare(`SELECT COUNT(*) c FROM jobs ${W}`).get(...args).c;
    const pages = Math.max(1, Math.ceil(total / pageSize));
    const page = Math.min(pages, Math.max(1, parseInt(query.page, 10) || 1));
    let rows = db.prepare(`SELECT * FROM jobs ${W} ORDER BY ${order}, id DESC LIMIT ? OFFSET ?`).all(...args, pageSize, (page - 1) * pageSize);
    const mine = uid ? json(q.profile.get(uid)?.skills, []) : [];
    const saved = uid ? new Set(db.prepare('SELECT job_id FROM saved_jobs WHERE user_id = ?').all(uid).map((r) => r.job_id)) : new Set();
    const applied = uid ? new Set(db.prepare('SELECT job_id FROM applications WHERE user_id = ?').all(uid).map((r) => r.job_id)) : new Set();
    let items = rows.map((r) => {
      const j = jobOut(r);
      return { ...j, saved: saved.has(j.id), applied: applied.has(j.id), match: uid ? matchScore(j.skills, mine).score : null };
    });
    if (query.sort === 'match' && uid) items.sort((a, b) => b.match - a.match);
    return { data: { items, total, page, pages, pageSize } };
  });
  route('GET', '/api/jobs/:id', 'optional', ({ params, uid }) => {
    const r = db.prepare('SELECT * FROM jobs WHERE id = ?').get(params.id);
    if (!r) throw new HttpError(404, 'Job not found');
    const j = jobOut(r);
    const mine = uid ? json(q.profile.get(uid)?.skills, []) : [];
    const similar = db.prepare('SELECT * FROM jobs WHERE id != ? AND (category = ? OR company = ?) ORDER BY (category = ?) DESC, posted_at DESC LIMIT 3')
      .all(r.id, r.category, r.company, r.category).map((s) => jobOut(s));
    const app = uid ? db.prepare('SELECT id,status FROM applications WHERE user_id = ? AND job_id = ?').get(uid, r.id) : null;
    // Market benchmark: average pay band for the same category and level (falls back to category alone).
    let mk = db.prepare('SELECT AVG(salary_min) lo, AVG(salary_max) hi, COUNT(*) n FROM jobs WHERE category = ? AND level = ?').get(r.category, r.level);
    let scope = `${r.level}-level ${r.category}`;
    if (mk.n < 3) { mk = db.prepare('SELECT AVG(salary_min) lo, AVG(salary_max) hi, COUNT(*) n FROM jobs WHERE category = ?').get(r.category); scope = r.category; }
    const market = { low: mk.lo, high: mk.hi, n: mk.n, scope };
    return { data: {
      ...j, similar, market, team: contactsFor(r.company), match: uid ? matchScore(j.skills, mine) : null,
      saved: uid ? !!db.prepare('SELECT 1 x FROM saved_jobs WHERE user_id = ? AND job_id = ?').get(uid, r.id) : false,
      application: app ? { id: app.id, status: app.status } : null,
    } };
  });
  route('POST', '/api/jobs/:id/save', true, ({ params, uid }) => {
    if (!db.prepare('SELECT 1 x FROM jobs WHERE id = ?').get(params.id)) throw new HttpError(404, 'Job not found');
    const had = db.prepare('DELETE FROM saved_jobs WHERE user_id = ? AND job_id = ?').run(uid, params.id).changes > 0;
    if (!had) db.prepare('INSERT INTO saved_jobs(user_id,job_id,saved_at) VALUES(?,?,?)').run(uid, params.id, now());
    return { data: { saved: !had } };
  });

  // --- applications ---
  route('POST', '/api/jobs/:id/apply', true, ({ params, body, uid }) => {
    const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(params.id);
    if (!job) throw new HttpError(404, 'Job not found');
    if (job.deadline && new Date(job.deadline) < new Date()) throw new HttpError(410, 'Applications for this job are closed');
    if (db.prepare('SELECT 1 x FROM applications WHERE user_id = ? AND job_id = ?').get(uid, job.id)) throw new HttpError(409, 'You have already applied to this job');
    const p = q.profile.get(uid);
    if (!p.resume_name) throw bad('Please upload your resume in your profile before applying', { resume: 'Resume required' });
    const cover = str(body.coverLetter, 3000);
    const id = tx(() => {
      const t = now();
      const r = db.prepare('INSERT INTO applications(user_id,job_id,cover_letter,status,resume_name,applied_at,updated_at) VALUES(?,?,?,?,?,?,?)')
        .run(uid, job.id, cover, 'applied', p.resume_name, t, t);
      const aid = Number(r.lastInsertRowid);
      q.event.run(aid, 'applied', STATUS_NOTE.applied, t);
      notify(uid, `Application submitted for ${job.title} at ${job.company}.`, `#/applications/${aid}`);
      return aid;
    });
    return { status: 201, data: appOut(db.prepare(`${APP_SELECT} WHERE a.id = ?`).get(id), true) };
  });
  // Apply to several jobs at once (the "auto-apply" flow). The client shows a review step first; this endpoint just executes it.
  const DEFAULT_COVER = "Hi {{recruiter}},\n\nI'm {{name}} and I'm excited to apply for the {{title}} role at {{company}}. My background in {{skills}} lines up well with what you're looking for, and I'd love to contribute to the team.\n\nMy resume is attached. Thank you for your time.\n\nBest regards,\n{{name}}";
  route('POST', '/api/applications/bulk', true, ({ body, uid }) => {
    const ids = [...new Set((Array.isArray(body.jobIds) ? body.jobIds : []).map(Number).filter(Number.isInteger))].slice(0, 25);
    if (!ids.length) throw bad('Select at least one job');
    const p = q.profile.get(uid), me = q.userById.get(uid), mySkills = json(p.skills, []);
    if (!p.resume_name) throw bad('Please upload your resume in your profile before applying', { resume: 'Resume required' });
    const tpl = str(body.coverLetter, 3000) || DEFAULT_COVER;
    const results = ids.map((id) => {
      const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(id);
      if (!job) return { jobId: id, ok: false, error: 'Job not found' };
      const base = { jobId: id, title: job.title, company: job.company };
      if (job.deadline && new Date(job.deadline) < new Date()) return { ...base, ok: false, error: 'Applications closed' };
      if (db.prepare('SELECT 1 x FROM applications WHERE user_id = ? AND job_id = ?').get(uid, id)) return { ...base, ok: false, error: 'Already applied' };
      const rec = postedBy(job.company, job.id), m = matchScore(json(job.skills, []), mySkills);
      const vars = { name: me.name, title: job.title, company: job.company, recruiter: rec.name.split(' ')[0], skills: (m.matched.length ? m.matched : mySkills).slice(0, 3).join(', ') || 'this field' };
      const cover = tpl.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? '').slice(0, 3000);
      const aid = tx(() => {
        const t = now();
        const r = db.prepare('INSERT INTO applications(user_id,job_id,cover_letter,status,resume_name,applied_at,updated_at) VALUES(?,?,?,?,?,?,?)').run(uid, id, cover, 'applied', p.resume_name, t, t);
        const a = Number(r.lastInsertRowid);
        q.event.run(a, 'applied', STATUS_NOTE.applied, t);
        notify(uid, `Application submitted for ${job.title} at ${job.company}.`, `#/applications/${a}`);
        return a;
      });
      return { ...base, ok: true, applicationId: aid, recruiter: { name: rec.name, email: rec.email } };
    });
    return { status: 201, data: { results, applied: results.filter((r) => r.ok).length } };
  });
  route('GET', '/api/applications', true, ({ uid }) => ({
    data: db.prepare(`${APP_SELECT} WHERE a.user_id = ? ORDER BY a.updated_at DESC`).all(uid).map((a) => appOut(a, false)),
  }));
  const ownApp = (id, uid) => {
    const a = db.prepare(`${APP_SELECT} WHERE a.id = ? AND a.user_id = ?`).get(id, uid);
    if (!a) throw new HttpError(404, 'Application not found');
    return a;
  };
  route('GET', '/api/applications/:id', true, ({ params, uid }) => ({ data: appOut(ownApp(params.id, uid), true) }));
  const setStatus = (a, status, uid) => {
    const t = now();
    db.prepare('UPDATE applications SET status=?, updated_at=? WHERE id=?').run(status, t, a.id);
    q.event.run(a.id, status, STATUS_NOTE[status], t);
    notify(uid, `${a.title} at ${a.company}: ${STATUS_NOTE[status]}`, `#/applications/${a.id}`);
  };
  route('POST', '/api/applications/:id/withdraw', true, ({ params, uid }) => {
    const a = ownApp(params.id, uid);
    if (['withdrawn', 'rejected', 'hired'].includes(a.status)) throw new HttpError(409, `Cannot withdraw an application that is ${a.status}`);
    tx(() => setStatus(a, 'withdrawn', uid));
    return { data: appOut(ownApp(params.id, uid), true) };
  });
  // Demo-only: stands in for the recruiter side of the Jobs Territory ATS so status tracking can be explored.
  route('POST', '/api/applications/:id/advance', true, ({ params, body, uid }) => {
    const a = ownApp(params.id, uid);
    const i = PIPELINE.indexOf(a.status);
    if (i < 0 || i === PIPELINE.length - 1) throw new HttpError(409, `Application is already ${a.status}`);
    const next = body.reject ? 'rejected' : PIPELINE[i + 1];
    tx(() => setStatus(a, next, uid));
    return { data: appOut(ownApp(params.id, uid), true) };
  });

  // --- dashboard + notifications ---
  route('GET', '/api/dashboard', true, ({ uid }) => {
    const apps = db.prepare('SELECT status, COUNT(*) c FROM applications WHERE user_id = ? GROUP BY status').all(uid);
    const by = Object.fromEntries(apps.map((r) => [r.status, r.c]));
    const total = apps.reduce((s, r) => s + r.c, 0);
    const mine = json(q.profile.get(uid)?.skills, []);
    const recommended = db.prepare(`SELECT * FROM jobs WHERE id NOT IN (SELECT job_id FROM applications WHERE user_id = ?) AND (deadline IS NULL OR deadline > ?) ORDER BY posted_at DESC LIMIT 60`)
      .all(uid, now()).map((r) => { const j = jobOut(r); return { ...j, match: matchScore(j.skills, mine).score }; })
      .sort((a, b) => b.match - a.match || new Date(b.postedAt) - new Date(a.postedAt)).slice(0, 4);
    return { data: {
      totals: { applications: total, active: total - (by.rejected || 0) - (by.withdrawn || 0) - (by.hired || 0),
        interviews: (by.interview || 0), offers: (by.offer || 0) + (by.hired || 0),
        saved: db.prepare('SELECT COUNT(*) c FROM saved_jobs WHERE user_id = ?').get(uid).c },
      byStatus: by, recommended, profileCompleteness: profileOut(uid).completeness,
      recent: db.prepare(`${APP_SELECT} WHERE a.user_id = ? ORDER BY a.updated_at DESC LIMIT 3`).all(uid).map((a) => appOut(a, false)),
    } };
  });
  route('GET', '/api/notifications', true, ({ uid }) => ({
    data: { items: db.prepare('SELECT id,message,link,read,at FROM notifications WHERE user_id = ? ORDER BY id DESC LIMIT 30').all(uid),
      unread: db.prepare('SELECT COUNT(*) c FROM notifications WHERE user_id = ? AND read = 0').get(uid).c },
  }));
  route('POST', '/api/notifications/read', true, ({ uid }) => {
    db.prepare('UPDATE notifications SET read = 1 WHERE user_id = ?').run(uid);
    return { data: { ok: true } };
  });

  // ---------- HTTP plumbing ----------
  const PUBLIC = path.join(__dirname, 'public');
  const securityHeaders = {
    'X-Content-Type-Options': 'nosniff', 'X-Frame-Options': 'DENY', 'Referrer-Policy': 'same-origin',
    'Content-Security-Policy': "default-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; frame-ancestors 'none'",
  };
  function readBody(req) {
    return new Promise((resolve, reject) => {
      let size = 0; const chunks = [];
      req.on('data', (c) => {
        size += c.length;
        if (size > MAX_BODY) { reject(new HttpError(413, 'Request too large')); req.destroy(); return; }
        chunks.push(c);
      });
      req.on('end', () => {
        if (!chunks.length) return resolve({});
        try { const b = JSON.parse(Buffer.concat(chunks).toString('utf8')); resolve(b && typeof b === 'object' ? b : {}); }
        catch { reject(bad('Invalid JSON body')); }
      });
      req.on('error', reject);
    });
  }
  function send(res, status, data, headers = {}) {
    const body = typeof data === 'string' || Buffer.isBuffer(data) ? data : JSON.stringify(data);
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...securityHeaders, ...headers });
    res.end(body);
  }

  async function handle(req, res) {
    const url = new URL(req.url, 'http://localhost');
    const pathname = url.pathname.replace(/\/+$/, '') || '/';
    if (pathname.startsWith('/api/')) {
      try {
        const route_ = routes.find((r) => r.method === req.method && r.re.test(pathname));
        if (!route_) {
          if (routes.some((r) => r.re.test(pathname))) throw new HttpError(405, 'Method not allowed');
          throw new HttpError(404, 'Not found');
        }
        const m = pathname.match(route_.re);
        const params = Object.fromEntries(route_.keys.map((k, i) => [k, decodeURIComponent(m[i + 1])]));
        const auth = (req.headers.authorization || '').replace(/^Bearer\s+/i, '') || url.searchParams.get('token');
        let uid = readToken(auth);
        if (uid && !q.userById.get(uid)) uid = null;
        if (route_.auth === true && !uid) throw new HttpError(401, 'Please log in to continue');
        const body = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) ? await readBody(req) : {};
        const ip = req.socket.remoteAddress || 'x';
        const out = route_.handler({ params, body, uid, ip, query: Object.fromEntries(url.searchParams) });
        if (out.raw) {
          return send(res, 200, out.raw, { 'Content-Type': 'application/octet-stream',
            'Content-Disposition': `attachment; filename="${out.filename.replace(/"/g, '')}"` });
        }
        return send(res, out.status || 200, out.data);
      } catch (e) {
        if (e instanceof HttpError) return send(res, e.status, { error: e.message, fields: e.fields });
        console.error(e);
        return send(res, 500, { error: 'Something went wrong on our side' });
      }
    }
    if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, { error: 'Method not allowed' });
    // static files, SPA fallback to index.html
    let file = path.normalize(path.join(PUBLIC, pathname === '/' ? 'index.html' : pathname));
    if (!file.startsWith(PUBLIC + path.sep) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(PUBLIC, 'index.html');
    const ext = path.extname(file);
    send(res, 200, fs.readFileSync(file), { 'Content-Type': MIME[ext] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
  }

  return http.createServer((req, res) => { handle(req, res).catch((e) => { console.error(e); try { send(res, 500, { error: 'Server error' }); } catch { /* closed */ } }); });
}

if (require.main === module) {
  const db = open(process.env.DB_FILE);
  seedJobs(db);
  const port = Number(process.env.PORT) || 3000;
  createApp(db).listen(port, () => console.log(`Job portal running at http://localhost:${port}`));
}
module.exports = { createApp, PIPELINE };
