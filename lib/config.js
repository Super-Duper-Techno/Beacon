'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

const DIR = path.join(os.homedir(), '.beacon');
const FILE = path.join(DIR, 'config.json');

const DEFAULTS = {
  work: [
    'code', // VS Code
    'devenv', // Visual Studio
    'idea64', // IntelliJ
    'pycharm64',
    'webstorm64',
    'sublime_text',
    'vim',
    'nvim',
    'windowsterminal',
    'powershell',
    'cmd.exe',
    'gnome-terminal',
    'konsole',
    'alacritty',
    'terminal',
    'figma',
    'blender',
    'unity',
    'unrealeditor',
  ],
  play: [
    'steam',
    'epicgameslauncher',
    'battle.net',
    'discord',
    'minecraft',
    'lutris',
    'heroic',
  ],
};

function ensure() {
  if (!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive: true });
  if (!fs.existsSync(FILE)) fs.writeFileSync(FILE, JSON.stringify(DEFAULTS, null, 2));
}

function load() {
  ensure();
  try {
    return JSON.parse(fs.readFileSync(FILE, 'utf8'));
  } catch {
    return DEFAULTS;
  }
}

function save(cfg) {
  ensure();
  fs.writeFileSync(FILE, JSON.stringify(cfg, null, 2));
}

function categorize(appName) {
  const cfg = load();
  const lower = (appName || '').toLowerCase();
  if (cfg.work.some((w) => lower.includes(w.toLowerCase()))) return 'work';
  if (cfg.play.some((p) => lower.includes(p.toLowerCase()))) return 'play';
  return 'unknown';
}

function addMapping(appName, category) {
  if (category !== 'work' && category !== 'play') {
    throw new Error('category must be "work" or "play"');
  }
  const cfg = load();
  const lower = appName.toLowerCase();
  cfg.work = cfg.work.filter((w) => w.toLowerCase() !== lower);
  cfg.play = cfg.play.filter((p) => p.toLowerCase() !== lower);
  cfg[category].push(appName);
  save(cfg);
  return cfg;
}

module.exports = { load, save, categorize, addMapping, FILE };
