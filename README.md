# BEACON

> **SUPER DUPER TECHNO — BEACON**

[![Buy Me a Coffee](https://img.shields.io/badge/Support-Buy%20Me%20a%20Coffee-ffdd00?style=flat&logo=buy-me-a-coffee&logoColor=black)](https://buymeacoffee.com/superdupertechno)
[![Support SDT](https://img.shields.io/badge/Support-superdupertechno.com-00bcd4?style=flat)](https://superdupertechno.com/support)

Automatic play-time vs work-time tracker. Runs in the background, watches
your active window, and tells you where your hours actually went.

No accounts, no cloud, no npm dependencies — just local JSON files and a
terminal HUD.

```
◢◤ BEACON // WATCHING ◢◤
  polling every 5s — Ctrl+C to stop

  work  code  1h 12m
```

## Platforms (v1)

- **Windows** — uses the Win32 API via a small embedded PowerShell script (no install needed, ships with Windows)
- **Linux (X11)** — uses `xdotool`. Install it first:
  ```bash
  sudo apt install xdotool     # Debian/Ubuntu
  sudo pacman -S xdotool       # Arch
  ```
  **Note:** this only works under X11. Native Wayland sessions block window-title access for security reasons — if you're on Wayland, log into an "Xorg" session from your login screen, or wait for the Wayland-compatible version.
- Android support is planned for a later version.

## Install

```bash
git clone https://github.com/SuperDuperTechno/beacon.git
cd beacon
npm link
```

Or skip the link and run `node bin/beacon.js` directly.

## Usage

```bash
beacon start                       # start watching (polls every 5s)
beacon start --interval 10         # poll every 10s instead

beacon today                       # today's work/play split + top apps
beacon week                        # last 7 days, work vs play

beacon categorize discord play     # map an app name to a category
beacon config                      # show current category mappings
```

Categories are matched by a case-insensitive substring against the app/
process name. Anything not in your config falls into `unknown` — check
`beacon config` and add mappings for whatever shows up there.

## How it works

- Polls the OS for the currently focused window's process name and title
- When the focused app changes, the previous segment is closed and logged
  (segments under 3 seconds are dropped as noise)
- Everything is stored locally at `~/.beacon/sessions.json` and
  `~/.beacon/config.json` — plain JSON, nothing leaves your machine
- Zero runtime npm dependencies — pure Node.js + OS-native tools

## License

MIT — see [LICENSE](LICENSE).

---

Built by [Super Duper Techno](https://superdupertechno.com).
