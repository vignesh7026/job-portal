# Jobs Territory - Mini Candidate Job Portal

A candidate-facing job platform: register, build a profile, search and filter jobs, apply, and track every application through the hiring pipeline.

**Run it** (Node 22.5+; zero npm dependencies - uses built-in `node:sqlite`):

```bash
npm start          # http://localhost:3000  (PORT, DB_FILE, APP_SECRET are optional env vars)
npm test           # 14 API tests
```

Demo data: 36 seeded jobs. Register any account (no email verification in this demo).

## Features

| Requirement | What is built |
|---|---|
| 1. Registration, login, profile | Validated sign-up, scrypt-hashed passwords, signed 7-day tokens, login rate limiting, show/hide + strength meter, change password, delete account. Profile: headline, bio, skills tags, education, experience, links, expected salary, open-to-work, **resume upload/download**, **live profile-completeness score** |
| 2. Listings, search, filters | Multi-keyword search (title/company/skills/location/description), filters for type, work mode, level, category, location, min salary, date posted, hide-applied; sort by best match/newest/salary/title; pagination; removable filter chips; URL-synced filters |
| 3. Apply + status tracking | One-click apply with cover letter, duplicate prevention, required resume, closed-job handling, 6-stage visual tracker (Applied > In review > Shortlisted > Interview > Offer > Hired) plus Rejected/Withdrawn, full status history timeline, withdraw flow |

**Design:** a "field guide" identity built around the *territory* idea - warm paper palette, serif headings, generated topographic contour art, a sentence-style search ("I'm looking for ___ jobs in ___"), a compass-style skills-fit gauge, a pay-vs-market bar ("Pay compass"), and each application shown as a winding **trail** with waypoints (list or board view). Job details open in a side drawer.

**Resume parsing & auto-fill:** upload a PDF, DOCX, RTF or TXT resume and the server reads it (no third-party libraries - PDF streams are inflated and DOCX is unzipped in `resume.js`), then fills the profile: headline, phone, location, summary, skills, education, experience/projects, links and years of experience. Only empty fields are filled (or "Re-scan & replace" overwrites on request). Limits: scanned/image-only PDFs and legacy `.doc` files have no readable text and fall back to manual entry; extraction is heuristic, so the UI asks the user to review.

**Hiring team & auto-apply:** every job shows who posted it plus the company founder/leadership and recruiters, each with name, title, email (copy / mailto) and a LinkedIn search link. "Auto-apply to matches" takes the current search, lists every unapplied job above a chosen skills-fit threshold with its recruiter, lets the user edit the cover-letter template ({{name}} {{title}} {{company}} {{recruiter}} {{skills}}), and only then sends up to 25 applications. Contacts are fictional demo data on the reserved `.example` domain, and no real email is sent.

**Extras beyond the brief:** skill-match % per job with matched/missing skills, recommended jobs, saved jobs, dashboard with pipeline funnel, in-app notifications for every status change, similar jobs, dark mode, responsive/mobile layout, accessibility (skip link, labels, focus rings, aria-live toasts, reduced motion), a demo "recruiter simulator" to advance/reject an application, security headers + CSP.

## AI-assisted development

**Tool:** Claude Code (in VS Code). It works directly on the file system and shell, so it can write code, run the server, run tests and read failures in one loop - better than copy-pasting from a chat window.

**Prompt structure** - each prompt had: (1) context/goal, (2) explicit constraints, (3) acceptance criteria, (4) the output I expected.

1. *Planning prompt:* "Here is the assignment PDF. Build a candidate job portal covering registration/login/profile, job search with filters, and applications with status tracking. Then enhance it ~10x: think about what a real candidate would expect. Constraints: no build step, minimal dependencies so it deploys anywhere, secure by default. Start by proposing the data model and API, then implement."
2. *Feature prompt:* "Add application tracking. Rules: one application per user per job, resume required, every status change writes an event row and a notification, only the owner can read it, withdrawn/rejected/hired are terminal. Expose a demo-only endpoint that simulates the recruiter side. Write API tests for each rule."
3. *Debug prompt:* "Test `profile update validates and computes completeness` fails: skills `['JavaScript','javascript']` were not de-duplicated. Find the root cause and fix it without changing the API shape."

**How I developed & debugged:** designed the schema/API first, built the backend, wrote tests alongside it, then the UI against the tested API. Failures were fed back verbatim to the AI with the failing assertion; e.g. the test run caught a case-sensitive skill dedupe bug that was fixed at its root.

**How I reviewed & tested AI code:** I read every generated file rather than trusting it; targeted security checks (parameterised SQL only, LIKE wildcard escaping, ownership checks on every application route, path-traversal check on static files, HMAC token verification with timing-safe compare, output escaping in the UI); 10 automated API tests covering validation, auth, authorisation boundaries, search/filters, duplicate-apply, and the status state machine; plus manual exploratory testing in the browser.

## Deploying

Any Node host works (Render, Railway, Fly.io). Build: none. Start: `npm start`. Set `APP_SECRET` to a long random string and put `DB_FILE` on a persistent disk.

## Layout

```
server.js   HTTP server, routes, validation, auth      db.js    SQLite schema
seed.js     36 demo jobs                                test/    API tests
public/     index.html, styles.css, app.js (SPA)
```
