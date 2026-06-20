# The Everyman Challenge

Marketing website for The Everyman Challenge — a 6-month guided discipleship
challenge that equips churches to activate the men already in their pews.

## Pages

| File             | Purpose                                                        |
| ---------------- | -------------------------------------------------------------- |
| `index.html`     | Homepage — hero, why EMC, watch/stories, the reach, "let's talk" form |
| `media-kit.html` | Church Media Kit — what's inside + "request the kit" form      |
| `stories.html`   | Stories — featured story + story grid                          |

Shared assets:

- `styles.css` — image-placeholder treatment and global helpers (per-page base
  styles are inlined in each page's `<head>`, carried over from the design).
- `emc.js` — vanilla-JS runtime: hover styles, mobile nav, video play, the
  story rail, lead-form submit, footer year, and graceful image fallbacks.
- `assets/` — logos, the brand seal, and story imagery.

The site is plain static HTML/CSS/JS — no build step or dependencies are
required to serve it.

## Running locally

```sh
python3 -m http.server 8765
# then open http://localhost:8765
```

## Provenance & rebuilding

These pages were generated from a [Claude Design](https://claude.ai/design)
project. The original canvas exports are kept in `design-src/` and the
transpiler that converts them to the clean static pages is `tools/build.py`.

```sh
python3 tools/build.py   # regenerates index.html / media-kit.html / stories.html
```

The transpiler resolves the design canvas's conditional blocks, rewrites its
template bindings into `data-emc` hooks that `emc.js` drives, swaps the
`<image-slot>` placeholders for styled boxes, and fixes inter-page links.

## Assets still needed

A few full-resolution images from the design project exceeded the import
tool's 256 KiB limit and could not be pulled in automatically. The pages
reference them and degrade gracefully (the slots show a dark placeholder)
until the originals are dropped into `assets/`:

- `assets/hero-summit.png` — only used by an alternate (hidden) hero variant.
- `assets/reel-2.jpg` … `assets/reel-6.jpg` — the short-form clips in the
  homepage "More stories from the field" rail. `assets/reel-1.jpg` imported
  successfully.

The `<image-slot>` placeholders on the Media Kit and Stories pages (flat-lay,
portraits) were never assigned images in the design and are intentional
drop-in spots — replace the `.emc-imgslot` divs with `<img>` tags when you have
the photography.

## License

All rights reserved.
