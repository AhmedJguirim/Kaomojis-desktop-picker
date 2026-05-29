# Kaomoji Picker

A lightweight Windows desktop app. Press a global keyboard shortcut to pop up a
search box, type a word like `shrug`, pick a text emoji, and it's copied to your
clipboard.

## Setup

You need [Node.js](https://nodejs.org) installed (which includes `npm`).

1. Open a terminal (PowerShell or Command Prompt) in this folder.
2. Install dependencies:
   ```
   npm install
   ```
3. Run the app:
   ```
   npm start
   ```

The app launches and waits in the background. Nothing visible appears until you
press the shortcut.

## Usage

- Press **Alt + Space** to toggle the picker window.
- Type to filter (e.g. `shrug`, `flip`, `hug`, `cry`).
- **↑ / ↓** to move the selection.
- **Enter** or **click** to copy the selected kaomoji and close.
- **Esc** (or clicking away) to dismiss without copying.

## Customizing

Right-click the **tray icon** (near the clock) for the menu: open the picker,
**Manage kaomoji…**, **Settings…**, or **Quit**.

### Change the shortcut
Open **Settings…** from the tray menu, click the shortcut field, then press your
combo (hold a modifier like Ctrl/Alt/Shift/Win, then a key). It's saved instantly
to `%AppData%\emojis\config.json` and takes effect right away.

### Add or edit kaomoji
Open **Manage kaomoji…** from the tray menu. Add, edit, filter, and delete
entries, then click **Save changes** (or Ctrl+S). No code editing or backslash
escaping needed.

Your kaomoji live in a plain JSON file you can also edit by hand or back up:
```
%AppData%\emojis\kaomoji.json
```
Each entry is `{ "text": "...", "keywords": "space separated terms" }`. The file
is created from a default set the first time the app runs.

## Building a standalone .exe (optional)

To turn this into a double-clickable app that doesn't need a terminal, install a
packager:
```
npm install --save-dev electron-builder
```
Then add to `package.json` scripts: `"dist": "electron-builder"`, and run
`npm run dist`. The installer appears in a `dist/` folder.

## Running on startup (optional)

Press **Win + R**, type `shell:startup`, and put a shortcut to your built `.exe`
(or a `.bat` that runs `npm start`) in that folder so the picker is always ready
when you log in.