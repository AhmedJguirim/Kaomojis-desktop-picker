# emojis — Kaomoji Picker

> A tiny, keyboard-driven kaomoji picker for Windows, macOS, and Linux. Hit a global shortcut, type a word like `shrug`, press Enter, and `¯\_(ツ)_/¯` is on your clipboard.

<p>
  <img alt="Platforms" src="https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-555">
  <img alt="Built with Electron" src="https://img.shields.io/badge/built%20with-Electron-47848F?logo=electron&logoColor=white">
  <img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-green">
</p>

It lives quietly in your system tray — the menu bar on macOS — and stays out of the way until you summon it.

<!--
  TIP: A screenshot or GIF sells this instantly. Drop one in `docs/` and embed it here, e.g.:
  ![The picker in action](docs/demo.gif)
-->

## Features

- **Global shortcut** — pop the picker from anywhere (default <kbd>Alt</kbd> + <kbd>Space</kbd>).
- **Fast fuzzy search** — type a keyword (`shrug`, `flip`, `hug`, `cry`) and the best match is pre-selected.
- **Copy & go** — <kbd>Enter</kbd> or click copies the kaomoji and hides the window.
- **System tray icon** — open the picker, manage your list, change settings, or quit — anytime.
- **Customizable shortcut** — a built-in recorder lets you set any combo (hold a modifier, press a key), saved instantly.
- **Manage your kaomoji in-app** — add, edit, filter, and delete entries from a dedicated window. No code, no escaping.
- **Plain-JSON storage** — your collection is a human-readable file you can edit by hand or back up.
- **Single-instance & tray-resident** — launching again just opens the picker; closing the window hides it instead of quitting.

## Install

### Option A — download a build (recommended)
Grab the latest build for your OS from the [Releases](https://github.com/AhmedJguirim/Kaomojis-desktop-picker/releases) page:

| OS | File |
| --- | --- |
| Windows | `emojis Setup x.y.z.exe` (installer) |
| macOS | `emojis-x.y.z.dmg` (drag to Applications) |
| Linux | `emojis-x.y.z.AppImage` (mark executable & run) or the `.deb` |

The app starts in the tray / menu bar and is ready to use.

### Option B — run from source
You'll need [Node.js](https://nodejs.org) 22.12+ (this project is developed on Node 24).

```bash
git clone https://github.com/AhmedJguirim/Kaomojis-desktop-picker.git
cd Kaomojis-desktop-picker
npm install
npm start
```

The app starts in the background — nothing appears until you press the shortcut or click the tray icon.

## Usage

| Action | How |
| --- | --- |
| Open / close the picker | <kbd>Alt</kbd> + <kbd>Space</kbd> (default) or click the tray icon |
| Filter | Start typing a keyword |
| Move selection | <kbd>↑</kbd> / <kbd>↓</kbd> |
| Copy & close | <kbd>Enter</kbd> or click a row |
| Dismiss without copying | <kbd>Esc</kbd> or click away |
| Quit completely | Tray icon → **Quit emojis** |

## Configuration

Right-click the **tray icon** (the menu-bar icon on macOS) for the menu: **Picker**, **Manage kaomoji…**, **Settings…**, **Quit**.

### Change the shortcut
Open **Settings…**, click the shortcut field, then press your combo — hold a modifier (<kbd>Ctrl</kbd>/<kbd>Alt</kbd>/<kbd>Shift</kbd>/<kbd>Win</kbd>, or <kbd>⌘</kbd>/<kbd>⌥</kbd> on macOS) and add a key. The recorder shows the right labels for your OS, and the combo is validated and saved immediately.

### Add / edit kaomoji
Open **Manage kaomoji…** to add, edit, filter, and delete entries, then **Save changes** (or <kbd>Ctrl</kbd> + <kbd>S</kbd>).

Your data lives in a plain JSON file you can also edit by hand or back up. The
location follows each OS's conventions:

| OS | Folder |
| --- | --- |
| Windows | `%AppData%\emojis\` |
| macOS | `~/Library/Application Support/emojis/` |
| Linux | `~/.config/emojis/` |

That folder holds `kaomoji.json` (your collection) and `config.json` (your settings).
Each kaomoji entry looks like:

```json
{ "text": "¯\\_(ツ)_/¯", "keywords": "shrug whatever dunno idk meh" }
```

`kaomoji.json` is seeded from a default set the first time the app runs.

## Build from source

The project uses [electron-builder](https://www.electron.build/) for packaging.

```bash
npm run icons   # generate app/tray icons into build/ and src/assets/
npm run dist    # build for the current OS into dist/
```

`npm run dist` produces the artifact for whatever OS you run it on:

- **Windows** → NSIS installer (`emojis Setup x.y.z.exe`). You can also run the
  one-step helper `./build-installer.ps1` (installs deps + builds).
- **macOS** → `.dmg` and `.zip`. (Building a Mac app requires running on macOS.)
- **Linux** → `.AppImage` and `.deb`.

electron-builder generally targets the OS it runs on, so build each platform on
that platform (or via CI) for best results.

> Note: `build/` is git-ignored, so run `npm run icons` once before `npm run dist`
> to (re)generate the icons.

## Run on startup (optional)

- **Windows** — press <kbd>Win</kbd> + <kbd>R</kbd>, type `shell:startup`, and drop a shortcut to the installed app into that folder.
- **macOS** — System Settings → General → Login Items → add **emojis**.
- **Linux** — add a `.desktop` entry to `~/.config/autostart/`.

## Project structure

```
src/
  main.js            app entry — wiring, IPC, single-instance lock
  config.js          load/save settings (userData/config.json)
  kaomoji-store.js   load/save the kaomoji list (userData/kaomoji.json)
  shortcuts.js       register / restore the global hotkey
  windows.js         picker, settings, and manager windows
  tray.js            tray icon + menu
  data/kaomoji.js    default kaomoji set (seed)
  picker/            the search popup (index.html, renderer.js)
  settings/          shortcut recorder UI
  manager/           add/edit/delete UI
  assets/            generated icons (colored + macOS template)
generate-icons.js    procedurally generates the app + tray icons
build-installer.ps1  one-step Windows build helper
```

## Tech stack

- [Electron](https://www.electronjs.org/) (desktop shell)
- [electron-builder](https://www.electron.build/) (packaging)
- Vanilla HTML/CSS/JS — no frontend framework, no build step for the UI

## Contributing

Issues and pull requests are welcome! If you're adding a feature:

1. Fork the repo and create a branch (`git checkout -b feature/my-thing`).
2. Keep the existing style (vanilla JS, small focused modules).
3. Run `npm start` to verify the app behaves.
4. Open a PR describing the change.

Bug reports should include your OS and version and steps to reproduce.

## License

Released under the [MIT License](LICENSE).
