# djtech42.github.io

The personal site of Dan Turner, an iOS and mobile developer in Cincinnati, Ohio, served by GitHub Pages at <https://djtech42.github.io/>.

It's plain HTML, CSS and JavaScript with no build step and no dependencies. It also hosts **Lily Leap**, a small frog platformer that the frog in the footer links to.

## Layout

| Path | What it is |
| --- | --- |
| `index.html` | The whole site: intro, work history, side projects, contact. Includes Open Graph and JSON-LD metadata. |
| `style.css` | Site styles. Colours are CSS custom properties on `:root`, redefined for dark mode and print. |
| `favicon.svg`, `apple-touch-icon.png`, `og-image.png` | Icons and the social sharing image. |
| `pond/` | Lily Leap (see below). |

## Running locally

Any static file server works, for example:

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000/>. The game is at <http://localhost:8000/pond/>. Opening `index.html` straight from disk works too.

## Lily Leap

A canvas platformer with a tutorial and eight levels, the last a heron boss fight. The game is developed in the [Lily-Leap](https://github.com/djtech42/Lily-Leap) repository and `pond/` is a copy of it, the same apart from a `noindex` tag in `pond/index.html`. It plays with a keyboard, touch or a gamepad. All art is drawn in code and all sound is synthesized with Web Audio, so there are no asset files.

| File | What it holds |
| --- | --- |
| `pond/index.html` | The page, the canvas, and the on-screen touch controls. |
| `pond/levels.js` | Level maps as rows of characters, plus signpost text and Pip the snail's lines. The legend at the top of the file explains each tile character. |
| `pond/music.js` | One song per level theme, written as chord charts and note patterns. The comment at the top explains the format. |
| `pond/game.js` | Everything else: input, physics, enemies, the heron, audio, music sequencer, rendering, saving. |

### Editing levels and music

- **Levels**: each map row is a string of 32px tiles, and rows can have different lengths. Signposts (`?`) take their text from the level's `signs` list in order, left to right. Saved games find levels by `name`, so renaming a level drops any saved run that's partway through it.
- **Music**: songs are compiled on first use. A mistake (a bad note or chord, an unknown instrument, a bar of the wrong length) is logged to the console and turns the music off, but the game keeps running.

### Dev tools

- Press <kbd>`</kbd> on the title screen for dev mode. It can jump to any level, turn on invincibility, force the snail cameo, and play any song on a jukebox. Dev runs never save scores or progress.
- In the browser console, `window.lilyLeap` exposes the game state and a few helpers: `loadLevel(i)`, `press(code)` / `release(code)`, `step(n)`, `measure(kind, name)` for checking audio levels offline, and `exportSongs(...names)` to download songs as WAV files.

### Saved data

Progress is kept in `localStorage` under keys starting with `lilyleap.`: best score, tutorial and game completion, golden lilies found, music on or off, and the run in progress for **Continue**. The game still works when storage isn't available.
