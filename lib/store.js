'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

const DIR = path.join(os.homedir(), '.beacon');
const FILE = path.join(DIR, 'sessions.json');

function ensure() {
  if (!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive: true });
  if (!fs.existsSync(FILE)) fs.writeFileSync(FILE, JSON.stringify({ segments: [] }, null, 2));
}

function load() {
  ensure();
  try {
    return JSON.parse(fs.readFileSync(FILE, 'utf8'));
  } catch {
    return { segments: [] };
  }
}

function save(data) {
  ensure();
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}

function logSegment({ app, title, category, startedAt, endedAt }) {
  const data = load();
  const minutes = (new Date(endedAt) - new Date(startedAt)) / 60000;
  data.segments.push({
    app,
    title,
    category,
    startedAt,
    endedAt,
    minutes: Math.round(minutes * 100) / 100,
    date: startedAt.slice(0, 10),
  });
  save(data);
  return data;
}

function dayTotals(dateStr, segments) {
  const totals = { work: 0, play: 0, unknown: 0 };
  const byApp = {};
  for (const s of segments) {
    if (s.date !== dateStr) continue;
    totals[s.category] = (totals[s.category] || 0) + s.minutes;
    byApp[s.app] = (byApp[s.app] || 0) + s.minutes;
  }
  return { totals, byApp };
}

function lastNDays(n) {
  const days = [];
  const cursor = new Date();
  for (let i = 0; i < n; i += 1) {
    days.push(cursor.toISOString().slice(0, 10));
    cursor.setDate(cursor.getDate() - 1);
  }
  return days.reverse();
}

module.exports = { load, save, logSegment, dayTotals, lastNDays, FILE };
