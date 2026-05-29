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

### Change the shortcut
Open `main.js` and edit this line:
```js
const shortcut = 'Alt+Space'
```
Examples: `'Control+Shift+E'`, `'Super+E'` (Super = Windows key), `'Alt+K'`.
See Electron's accelerator format for all options.

### Add or edit kaomoji
Open `kaomoji.js`. Each entry has the kaomoji text and a list of search keywords:
```js
{ text: '¯\\_(ツ)_/¯', keywords: 'shrug whatever dunno idk meh' },
```
Add your own lines following the same pattern. Note that a backslash in the text
must be written as `\\`.

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