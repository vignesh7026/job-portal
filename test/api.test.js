'use strict';
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { open } = require('../db');
const { seedJobs } = require('../seed');
const { createApp } = require('../server');

let server, base, token;
const call = async (method, path, body, tok = token) => {
  const res = await fetch(base + path, {
    method, headers: { 'Content-Type': 'application/json', ...(tok ? { Authorization: 'Bearer ' + tok } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : null };
};

before(async () => {
  const db = open(':memory:');
  seedJobs(db);
  server = createApp(db, { secret: 'test', noRateLimit: true });
  await new Promise((r) => server.listen(0, r));
  base = `http://localhost:${server.address().port}`;
});
after(() => server.close());

test('registration validates input and rejects duplicates', async () => {
  let r = await call('POST', '/api/auth/register', { name: 'A', email: 'nope', password: 'short' });
  assert.equal(r.status, 400);
  assert.ok(r.body.fields.name && r.body.fields.email && r.body.fields.password);
  r = await call('POST', '/api/auth/register', { name: 'Asha Rao', email: 'Asha@Example.com', password: 'secret123' });
  assert.equal(r.status, 201);
  token = r.body.token;
  r = await call('POST', '/api/auth/register', { name: 'Asha Rao', email: 'asha@example.com', password: 'secret123' });
  assert.equal(r.status, 409);
});

test('login works and bad credentials are rejected', async () => {
  assert.equal((await call('POST', '/api/auth/login', { email: 'asha@example.com', password: 'wrongpass1' })).status, 401);
  assert.equal((await call('POST', '/api/auth/login', { email: 'ghost@example.com', password: 'secret123' })).status, 401);
  const ok = await call('POST', '/api/auth/login', { email: 'asha@example.com', password: 'secret123' });
  assert.equal(ok.status, 200);
  assert.ok(ok.body.token);
});

test('protected routes require a valid token', async () => {
  assert.equal((await call('GET', '/api/me', null, null)).status, 401);
  assert.equal((await call('GET', '/api/me', null, 'garbage.token')).status, 401);
  assert.equal((await call('GET', '/api/me')).status, 200);
});

test('profile update validates and computes completeness', async () => {
  let r = await call('PUT', '/api/profile', { name: 'Asha Rao', phone: 'abc', links: { github: 'not-a-url' } });
  assert.equal(r.status, 400);
  assert.ok(r.body.fields.phone && r.body.fields['links.github']);
  r = await call('PUT', '/api/profile', {
    name: 'Asha Rao', headline: 'Full stack dev', phone: '+91 98765 43210', location: 'Coimbatore',
    bio: 'Curious engineer who loves building useful products end to end.', skills: ['JavaScript', 'Node.js', 'SQL', 'Git', 'javascript'],
    experienceYears: 1, expectedSalary: 3, education: [{ school: 'PSG Tech', degree: 'B.E. CSE', year: '2026' }],
    experience: [{ title: 'Intern', company: 'Acme', period: '2025', description: 'Built APIs' }],
    links: { github: 'https://github.com/asha' },
  });
  assert.equal(r.status, 200);
  assert.deepEqual(r.body.profile.skills, ['JavaScript', 'Node.js', 'SQL', 'Git']); // deduped
  assert.equal(r.body.profile.completeness, 90); // only resume missing
});

test('job search, filters, sorting and pagination', async () => {
  let r = await call('GET', '/api/jobs?q=react');
  assert.ok(r.body.total > 0 && r.body.items.every((j) => JSON.stringify(j).toLowerCase().includes('react')));
  r = await call('GET', '/api/jobs?type=internship&mode=onsite');
  assert.ok(r.body.items.length > 0 && r.body.items.every((j) => j.type === 'internship' && j.mode === 'onsite'));
  r = await call('GET', '/api/jobs?salaryMin=40');
  assert.ok(r.body.items.every((j) => j.salaryMax >= 40));
  r = await call('GET', '/api/jobs?pageSize=5&page=2');
  assert.equal(r.body.items.length, 5);
  assert.equal(r.body.page, 2);
  r = await call('GET', "/api/jobs?q=%25%27%3B--"); // injection-ish / wildcard input is safe
  assert.equal(r.status, 200);
  assert.equal(r.body.total, 0);
  r = await call('GET', '/api/jobs?sort=match');
  assert.ok(r.body.items[0].match >= r.body.items[r.body.items.length - 1].match);
});

test('saving jobs toggles', async () => {
  assert.equal((await call('POST', '/api/jobs/1/save')).body.saved, true);
  assert.equal((await call('GET', '/api/jobs?saved=1')).body.total, 1);
  assert.equal((await call('POST', '/api/jobs/1/save')).body.saved, false);
});

test('apply requires resume, prevents duplicates and tracks status', async () => {
  let r = await call('POST', '/api/jobs/12/apply', { coverLetter: 'Hi' });
  assert.equal(r.status, 400); // no resume yet
  const up = await call('POST', '/api/profile/resume', { name: 'resume.pdf', data: Buffer.from('%PDF-1.4 test').toString('base64') });
  assert.equal(up.status, 200);
  assert.equal((await call('POST', '/api/profile/resume', { name: 'evil.exe', data: 'AAAA' })).status, 400);
  r = await call('POST', '/api/jobs/12/apply', { coverLetter: 'I would love to join.' });
  assert.equal(r.status, 201);
  assert.equal(r.body.status, 'applied');
  const id = r.body.id;
  assert.equal((await call('POST', '/api/jobs/12/apply', {})).status, 409);

  r = await call('POST', `/api/applications/${id}/advance`, {});
  assert.equal(r.body.status, 'under_review');
  assert.equal(r.body.events.length, 2);
  r = await call('POST', `/api/applications/${id}/withdraw`);
  assert.equal(r.body.status, 'withdrawn');
  assert.equal((await call('POST', `/api/applications/${id}/withdraw`)).status, 409);
  assert.equal((await call('POST', `/api/applications/${id}/advance`, {})).status, 409);

  const list = await call('GET', '/api/applications');
  assert.equal(list.body.length, 1);
  assert.ok((await call('GET', '/api/notifications')).body.unread >= 3);
});

test('users cannot see each other\'s applications', async () => {
  const other = await call('POST', '/api/auth/register', { name: 'Bob Stone', email: 'bob@example.com', password: 'secret123' }, null);
  const list = await call('GET', '/api/applications', null, other.body.token);
  assert.equal(list.body.length, 0);
  assert.equal((await call('GET', '/api/applications/1', null, other.body.token)).status, 404);
});

test('dashboard summarises activity', async () => {
  const r = await call('GET', '/api/dashboard');
  assert.equal(r.body.totals.applications, 1);
  assert.equal(r.body.recommended.length, 4);
});

test('static frontend and unknown API routes', async () => {
  const html = await (await fetch(base + '/')).text();
  assert.ok(html.includes('<div id="app">'));
  assert.equal((await call('GET', '/api/nope')).status, 404);
  const trav = await fetch(base + '/..%2f..%2fserver.js');
  assert.ok((await trav.text()).includes('<div id="app">')); // falls back to index, never leaks source
});

// ---------- resume parsing, hiring team, auto-apply ----------
const fx = require('./fixtures');
const { extractText, parseResume } = require('../resume');
const b64 = (b) => b.toString('base64');

test('resume parser reads PDF, compressed PDF, DOCX and TXT identically', () => {
  for (const [name, buf] of [['a.txt', fx.txt(fx.RESUME)], ['a.docx', fx.docx(fx.RESUME)], ['a.pdf', fx.pdf(fx.RESUME)], ['b.pdf', fx.pdf(fx.RESUME, { compress: true })]]) {
    const { text, error } = extractText(buf, name);
    assert.equal(error, undefined, name);
    const p = parseResume(text);
    assert.equal(p.email, 'asha.rao@example.com', name);
    assert.equal(p.fields.phone, '+91 98765 43210', name);
    assert.equal(p.fields.location, 'Coimbatore, Tamil Nadu', name);
    assert.ok(['Node.js', 'React', 'PostgreSQL', 'Docker'].every((s) => p.fields.skills.includes(s)), name);
    assert.ok(!p.fields.skills.includes('GitHub'), 'skills must not come from URLs');
    assert.equal(p.fields.education[0].degree, 'B.E. Computer Science and Engineering', name);
    assert.equal(p.fields.education[0].year, '2026', name);
    assert.equal(p.fields.experience[0].title, 'Software Engineering Intern', name);
    assert.equal(p.fields.experience[0].company, 'Acme Labs', name);
    assert.equal(p.fields.links.github, 'https://github.com/asharao', name);
  }
  assert.ok(extractText(Buffer.from('tiny'), 'x.txt').error, 'too little text is reported');
  assert.ok(extractText(Buffer.from('whatever'), 'x.exe').error, 'unsupported formats are reported');
});

test('uploading a resume auto-fills only empty profile fields', async () => {
  const bob = (await call('POST', '/api/auth/register', { name: 'Carol Dev', email: 'carol@example.com', password: 'secret123' }, null)).body.token;
  await call('PUT', '/api/profile', { name: 'Carol Dev', headline: 'My own headline', skills: ['Rust'] }, bob);
  const r = await call('POST', '/api/profile/resume', { name: 'carol.pdf', data: b64(fx.pdf(fx.RESUME, { compress: true })) }, bob);
  assert.equal(r.status, 200);
  assert.equal(r.body.scan.ok, true);
  const p = r.body.profile;
  assert.equal(p.headline, 'My own headline', 'existing values are never overwritten');
  assert.ok(p.skills.includes('Rust') && p.skills.includes('React'), 'skills are merged');
  assert.equal(p.phone, '+91 98765 43210');
  assert.equal(p.education.length, 1);
  assert.equal(p.links.github, 'https://github.com/asharao');
  assert.ok(r.body.scan.filled.some((x) => x.startsWith('Skills')));
  const re = await call('POST', '/api/profile/resume/scan', { overwrite: true }, bob);
  assert.equal(re.body.profile.headline, 'Full Stack Developer | React, Node.js', 'overwrite replaces fields');
  const bad = await call('POST', '/api/profile/resume', { name: 'scan.pdf', data: b64(Buffer.from('%PDF-1.4 nothing here')) }, bob);
  assert.equal(bad.body.scan.ok, false);
});

test('jobs expose the recruiter and a hiring team with founder', async () => {
  const list = await call('GET', '/api/jobs?pageSize=3', null, null);
  for (const j of list.body.items) assert.ok(j.postedBy.name && j.postedBy.email.endsWith('.example'));
  const d = await call('GET', '/api/jobs/12', null, null);
  assert.equal(d.body.team.length, 3);
  assert.ok(d.body.team.some((t) => t.role === 'founder'));
  assert.ok(d.body.team.some((t) => t.id === d.body.postedBy.id));
});

test('auto-apply: eligible list respects fit, then bulk apply personalises and skips duplicates', async () => {
  const tok = (await call('POST', '/api/auth/register', { name: 'Dev Kumar', email: 'dev@example.com', password: 'secret123' }, null)).body.token;
  await call('PUT', '/api/profile', { name: 'Dev Kumar', skills: ['JavaScript', 'Node.js', 'SQL', 'Git'] }, tok);
  assert.equal((await call('POST', '/api/applications/bulk', { jobIds: [12] }, tok)).status, 400, 'resume required');
  await call('POST', '/api/profile/resume', { name: 'dev.txt', data: b64(fx.txt('Dev Kumar resume. ' + 'Built things with JavaScript. '.repeat(5))) }, tok);
  const el = await call('GET', '/api/jobs?eligible=1&minMatch=75', null, tok);
  assert.ok(el.body.items.length > 0 && el.body.items.every((j) => j.match >= 75));
  assert.ok(el.body.items[0].match >= el.body.items[el.body.items.length - 1].match);
  const ids = el.body.items.slice(0, 3).map((j) => j.id);
  const r = await call('POST', '/api/applications/bulk', { jobIds: [...ids, 99999] }, tok);
  assert.equal(r.status, 201);
  assert.equal(r.body.applied, ids.length);
  assert.equal(r.body.results.at(-1).ok, false);
  const apps = await call('GET', '/api/applications', null, tok);
  assert.equal(apps.body.length, ids.length);
  const detail = await call('GET', `/api/applications/${apps.body[0].id}`, null, tok);
  assert.ok(detail.body.coverLetter.includes('Dev Kumar') && !detail.body.coverLetter.includes('{{'));
  assert.ok(detail.body.recruiter.email);
  const again = await call('POST', '/api/applications/bulk', { jobIds: ids }, tok);
  assert.equal(again.body.applied, 0);
  assert.ok(again.body.results.every((x) => x.error === 'Already applied'));
  assert.equal((await call('GET', '/api/jobs?eligible=1&minMatch=0', null, tok)).body.items.some((j) => ids.includes(j.id)), false, 'applied jobs leave the eligible list');
});
