'use strict';

const c = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
  cyan: '\x1b[38;5;51m',
  green: '\x1b[38;5;46m',
  red: '\x1b[38;5;196m',
  amber: '\x1b[38;5;214m',
  grey: '\x1b[38;5;240m',
};

function color(text, code) {
  if (!process.stdout.isTTY) return text;
  return `${code}${text}${c.reset}`;
}

function stripLen(str) {
  return str.replace(/\x1b\[[0-9;]*m/g, '').length;
}

function frame(lines) {
  const width = Math.max(...lines.map((l) => stripLen(l)), 24) + 4;
  const mid = '─'.repeat(Math.max(width - 2, 0));
  const out = [color(`┌${mid}┐`, c.grey)];
  for (const line of lines) {
    const pad = width - 2 - stripLen(line);
    out.push(`${color('│', c.grey)} ${line}${' '.repeat(Math.max(pad - 1, 0))}${color('│', c.grey)}`);
  }
  out.push(color(`└${mid}┘`, c.grey));
  return out.join('\n');
}

function header(title) {
  const bar = color('◢◤', c.cyan);
  return `${bar} ${color(title, `${c.bold}${c.cyan}`)} ${bar}`;
}

function bar(pct, width = 24) {
  const filled = Math.round((pct / 100) * width);
  return color('█'.repeat(filled), c.cyan) + color('░'.repeat(Math.max(width - filled, 0)), c.grey);
}

module.exports = { c, color, frame, header, bar, stripLen };
