'use strict';

const { execSync } = require('child_process');

function getActiveWindowLinux() {
  try {
    const id = execSync('xdotool getactivewindow 2>/dev/null', { encoding: 'utf8' }).trim();
    if (!id) return null;
    const app = execSync(`xdotool getwindowclassname ${id} 2>/dev/null`, { encoding: 'utf8' }).trim();
    const title = execSync(`xdotool getwindowname ${id} 2>/dev/null`, { encoding: 'utf8' }).trim();
    if (!app) return null;
    return { app, title };
  } catch {
    return null; // xdotool missing, or no X11 (e.g. Wayland without XWayland)
  }
}

function getActiveWindowWindows() {
  const script = [
    'Add-Type @"',
    'using System;',
    'using System.Runtime.InteropServices;',
    'using System.Text;',
    'public class BeaconWin32 {',
    '  [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();',
    '  [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);',
    '  [DllImport("user32.dll")] public static extern int GetWindowText(IntPtr hWnd, StringBuilder text, int count);',
    '}',
    '"@',
    '$hwnd = [BeaconWin32]::GetForegroundWindow()',
    '$sb = New-Object System.Text.StringBuilder 256',
    '[BeaconWin32]::GetWindowText($hwnd, $sb, 256) | Out-Null',
    '$procId = 0',
    '[BeaconWin32]::GetWindowThreadProcessId($hwnd, [ref]$procId) | Out-Null',
    '$proc = Get-Process -Id $procId -ErrorAction SilentlyContinue',
    'if ($proc) { Write-Output ("{0}|{1}" -f $proc.ProcessName, $sb.ToString()) }',
  ].join('\n');

  try {
    const out = execSync(`powershell -NoProfile -NonInteractive -Command "${script.replace(/"/g, '`"')}"`, {
      encoding: 'utf8',
    }).trim();
    if (!out) return null;
    const [app, ...rest] = out.split('|');
    return { app, title: rest.join('|') };
  } catch {
    return null;
  }
}

function getActiveWindow() {
  if (process.platform === 'win32') return getActiveWindowWindows();
  if (process.platform === 'linux') return getActiveWindowLinux();
  return null; // unsupported platform (e.g. macOS not in scope for v1)
}

module.exports = { getActiveWindow };
