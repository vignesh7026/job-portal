'use strict';
const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');

function open(file) {
  const db = new DatabaseSync(file || path.join(__dirname, 'data.sqlite'));
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS users(
      id INTEGER PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL, created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS profiles(
      user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      headline TEXT DEFAULT '', phone TEXT DEFAULT '', location TEXT DEFAULT '', bio TEXT DEFAULT '',
      skills TEXT DEFAULT '[]', experience_years REAL DEFAULT 0, expected_salary REAL DEFAULT 0,
      education TEXT DEFAULT '[]', experience TEXT DEFAULT '[]', links TEXT DEFAULT '{}',
      open_to_work INTEGER DEFAULT 1, resume_name TEXT DEFAULT '', resume_data TEXT DEFAULT '',
      updated_at TEXT);
    CREATE TABLE IF NOT EXISTS jobs(
      id INTEGER PRIMARY KEY, title TEXT NOT NULL, company TEXT NOT NULL, location TEXT NOT NULL,
      mode TEXT NOT NULL, type TEXT NOT NULL, category TEXT NOT NULL, level TEXT NOT NULL,
      salary_min REAL, salary_max REAL, description TEXT NOT NULL, responsibilities TEXT DEFAULT '[]',
      requirements TEXT DEFAULT '[]', skills TEXT DEFAULT '[]', posted_at TEXT NOT NULL, deadline TEXT);
    CREATE TABLE IF NOT EXISTS saved_jobs(
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
      saved_at TEXT NOT NULL, PRIMARY KEY(user_id, job_id));
    CREATE TABLE IF NOT EXISTS applications(
      id INTEGER PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
      cover_letter TEXT DEFAULT '', status TEXT NOT NULL, resume_name TEXT DEFAULT '',
      applied_at TEXT NOT NULL, updated_at TEXT NOT NULL, UNIQUE(user_id, job_id));
    CREATE TABLE IF NOT EXISTS app_events(
      id INTEGER PRIMARY KEY, application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
      status TEXT NOT NULL, note TEXT DEFAULT '', at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS notifications(
      id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      message TEXT NOT NULL, link TEXT DEFAULT '', read INTEGER DEFAULT 0, at TEXT NOT NULL);
    CREATE INDEX IF NOT EXISTS idx_jobs_posted ON jobs(posted_at);
    CREATE INDEX IF NOT EXISTS idx_apps_user ON applications(user_id);
  `);
  return db;
}
module.exports = { open };
