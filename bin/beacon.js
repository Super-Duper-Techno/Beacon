#!/usr/bin/env node
'use strict';

const { c, color, frame, header, bar } = require('../lib/theme');
const config = require('../lib/config');
const store = require('../lib/store');
const { getActiveWindow } = require('../lib/watcher');

const args = process.argv.slice(2);
const cmd = args[0];

function fmtMinutes(mins) {
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

function catLabel(cat) {
  if (cat === 'work') return color('work', c.cyan);
  if (cat === 'play') return color('play', c.amber);
  return color('unknown', c.grey);
}

// ---------- start ----------

async function start() {
  const intervalFlagIdx = args.indexOf('--interval');
  const intervalSec = intervalFlagIdx !== -1 ? Number(args[intervalFlagIdx + 1]) || 5 : 5;
  const MIN_SEGMENT_SEC = 3;

  if (process.platform === 'linux') {
    try {
      require('child_process').execSync('which xdotool', { stdio: 'ignore' });
    } catch {
      console.log(color('xdotool not found. Install it first:', c.red));
      console.log(color('  Debian/Ubuntu: sudo apt install xdotool', c.dim));
      console.log(color('  Arch:          sudo pacman -S xdotool', c.dim));
      console.log(color('  Note: only works under X11, not native Wayland.', c.dim));
      process.exit(1);
    }
  }

  console.log(header('BEACON // WATCHING'));
  console.log(color(`  polling every ${intervalSec}s — Ctrl+C to stop`, c.dim));
  console.log('');

  let segment = null; // { app, title, category, startedAt: Date }
  let running = true;

  function closeSegment(endDate) {
    if (!segment) return;
    const durationSec = (endDate - segment.startedAt) / 1000;
    if (durationSec >= MIN_SEGMENT_SEC) {
      store.logSegment({
        app: segment.app,
        title: segment.title,
        category: segment.category,
        startedAt: segment.startedAt.toISOString(),
        endedAt: endDate.toISOString(),
      });
    }
    segment = null;
  }

  process.on('SIGINT', () => {
    running = false;
    closeSegment(new Date());
    process.stdout.write('\n\n');
    console.log(header('BEACON // STOPPED'));
    printToday();
    process.exit(0);
  });

  const tick = () => {
    if (!running) return;
    const win = getActiveWindow();
    const now = new Date();

    if (win && win.app) {
      const category = config.categorize(win.app);
      if (!segment || segment.app !== win.app) {
        closeSegment(now);
        segment = { app: win.app, title: win.title, category, startedAt: now };
      }
      const elapsedSec = Math.round((now - segment.startedAt) / 1000);
      process.stdout.write(
        `\r  ${catLabel(segment.category)}  ${color(segment.app, c.bold)}  ${color(
          `${elapsedSec}s`,
          c.dim
        )}                    `
      );
    } else {
      process.stdout.write(`\r  ${color('(no active window detected)', c.grey)}                    `);
    }

    setTimeout(tick, intervalSec * 1000);
  };
  tick();
}

// ---------- today / week ----------

function printToday() {
  const data = store.load();
  const today = new Date().toISOString().slice(0, 10);
  const { totals, byApp } = store.dayTotals(today, data.segments);
  const grandTotal = totals.work + totals.play + totals.unknown || 1;

  const lines = [header('TODAY'), ''];
  for (const cat of ['work', 'play', 'unknown']) {
    const pct = Math.round((totals[cat] / grandTotal) * 100);
    lines.push(`${catLabel(cat).padEnd(20)} ${bar(pct, 18)}  ${fmtMinutes(totals[cat])}`);
  }
  lines.push('');
  const topApps = Object.entries(byApp)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  if (topApps.length) {
    lines.push(color('top apps', c.dim));
    for (const [app, mins] of topApps) {
      lines.push(`  ${app}  ${color(fmtMinutes(mins), c.dim)}`);
    }
  }
  console.log(frame(lines));
}

function printWeek() {
  const data = store.load();
  const days = store.lastNDays(7);
  const lines = [header('LAST 7 DAYS'), ''];
  for (const day of days) {
    const { totals } = store.dayTotals(day, data.segments);
    const dayTotal = totals.work + totals.play + totals.unknown;
    const workPct = dayTotal ? Math.round((totals.work / dayTotal) * 100) : 0;
    lines.push(
      `${day}  ${bar(workPct, 16)}  ${color('work', c.cyan)} ${fmtMinutes(totals.work).padEnd(8)} ${color(
        'play',
        c.amber
      )} ${fmtMinutes(totals.play)}`
    );
  }
  console.log(frame(lines));
}

// ---------- categorize / config ----------

function categorize() {
  const [appName, category] = args.slice(1);
  if (!appName || !category) {
    console.log(color('usage: beacon categorize <appName> <work|play>', c.red));
    process.exit(1);
  }
  config.addMapping(appName, category);
  console.log(`${color('✓', c.green)} "${appName}" mapped to ${catLabel(category)}`);
}

function showConfig() {
  const cfg = config.load();
  console.log(header('CONFIG'));
  console.log(color(`  file: ${config.FILE}`, c.dim));
  console.log('');
  console.log(color('  work:', c.cyan), cfg.work.join(', '));
  console.log(color('  play:', c.amber), cfg.play.join(', '));
}

// ---------- help ----------

function help() {
  console.log(header('BEACON'));
  console.log(color('  automatic play-time vs work-time tracker\n', c.dim));
  console.log('  beacon start [--interval seconds]   start watching (default 5s poll)');
  console.log('  beacon today                        today\'s work/play breakdown');
  console.log('  beacon week                         last 7 days breakdown');
  console.log('  beacon categorize <app> <work|play> map an app name to a category');
  console.log('  beacon config                        show current category mappings');
  console.log('  beacon help                          show this message');
}

(async () => {
  switch (cmd) {
    case 'start':
      await start();
      break;
    case 'today':
      printToday();
      break;
    case 'week':
      printWeek();
      break;
    case 'categorize':
      categorize();
      break;
    case 'config':
      showConfig();
      break;
    case 'help':
    case '--help':
    case '-h':
    case undefined:
      help();
      break;
    default:
      console.log(color(`unknown command: ${cmd}`, c.red));
      help();
      process.exit(1);
  }
})();
