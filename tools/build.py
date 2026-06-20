#!/usr/bin/env python3
"""Transpile Claude Design (.dc.html) canvas files into clean standalone static HTML.

Reads the design exports from ../design-src and writes the static pages to the
repository root. Run from anywhere:  python3 tools/build.py
"""
import re, os, html

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(REPO, "design-src")
OUT = REPO

# Bump to force browsers past cached CSS/JS/reel images after a deploy.
VERSION = "5"

PAGES = {
    "EMC Homepage.dc.html": {
        "out": "index.html",
        "title": "The Everyman Challenge — Revolutionize Your Church, One Man at a Time",
        "desc": "A 6-month guided discipleship challenge that activates the men already in your pews — and turns them into disciples who make disciples.",
    },
    "EMC Media Kit.dc.html": {
        "out": "media-kit.html",
        "title": "Church Media Kit — The Everyman Challenge",
        "desc": "Everything your church needs to launch the Every Man Challenge — films, graphics, print, and a step-by-step playbook. Free for churches.",
    },
    "EMC Stories.dc.html": {
        "out": "stories.html",
        "title": "Stories — The Everyman Challenge",
        "desc": "Real men, real change — stories from the Every Man Challenge, in their own words.",
    },
}

LINK_MAP = {
    "EMC Homepage.dc.html": "index.html",
    "EMC Media Kit.dc.html": "media-kit.html",
    "EMC Stories.dc.html": "stories.html",
}


def nav_html(active, home):
    """One canonical nav for every page. `home` is "" on the homepage and
    "index.html" elsewhere so the in-page anchors resolve correctly."""
    normal = ("font-family:Oswald,sans-serif;font-weight:500;text-transform:uppercase;"
              "letter-spacing:.1em;font-size:13.5px;color:#F6EEE1;text-decoration:none;transition:color .15s;")
    act = ("font-family:Oswald,sans-serif;font-weight:600;text-transform:uppercase;"
           "letter-spacing:.1em;font-size:13.5px;color:#E8842A;text-decoration:none;")

    def link(label, href, key):
        if key == active:
            return f'<a href="{href}" style="{act}">{label}</a>'
        return f'<a href="{href}" style="{normal}" style-hover="color:#E8842A;">{label}</a>'

    items = [
        link("Stories", "stories.html", "stories"),
        link("Why EMC", f"{home}#why", "why"),
        link("Church Media Kit", "media-kit.html", "mediakit"),
        link("Guide Login", "login.html", "login"),
    ]
    cta = (f'<a href="{home}#talk" style="background:#E8842A;color:#16120D;font-family:Oswald,sans-serif;'
           "font-weight:600;text-transform:uppercase;letter-spacing:.05em;font-size:13px;text-decoration:none;"
           'padding:11px 22px;border-radius:4px;border:2px solid #E8842A;transition:all .18s ease;" '
           'style-hover="background:transparent;color:#E8842A;">Let&#39;s Talk</a>')
    return ('<nav class="emc-nav" style="display:flex;align-items:center;gap:28px;flex-wrap:wrap;">'
            + "".join(items) + cta + "</nav>")


def extract_between(s, open_tag, close_tag):
    i = s.find(open_tag)
    j = s.find(close_tag, i + len(open_tag))
    return s[i + len(open_tag):j]


def get_helmet_style(helmet):
    m = re.search(r"<style>(.*?)</style>", helmet, re.S)
    return m.group(1).strip() if m else ""


def get_font_links(helmet):
    return re.findall(r"<link[^>]*googleapis[^>]*>|<link[^>]*gstatic[^>]*>", helmet)


def convert_image_slot(m):
    attrs = m.group(1)
    style = re.search(r'style="([^"]*)"', attrs)
    style = style.group(1) if style else ""
    placeholder = re.search(r'placeholder="([^"]*)"', attrs)
    placeholder = placeholder.group(1) if placeholder else "Image"
    # No image-slot in these designs has a usable src, so render an on-brand placeholder.
    return (f'<div class="emc-imgslot" style="{style}">'
            f'<span>{html.escape(placeholder)}</span></div>')


def transform_body(body):
    # sc-if -> div with data-sc; default-false branches hidden
    def sc_open(m):
        var, b = m.group(1), m.group(2)
        hidden = ' style="display:none"' if b == "false" else ""
        return f'<div data-sc="{var}"{hidden}>'
    body = re.sub(r'<sc-if value="\{\{ (\w+) \}\}" hint-placeholder-val="\{\{ (true|false) \}\}">',
                  sc_open, body)
    body = body.replace("</sc-if>", "</div>")

    # template bindings -> data-emc hooks
    body = body.replace('class="{{ navClass }}"', 'class="emc-nav"')
    body = body.replace('onClick="{{ toggleMenu }}"', 'data-emc="toggle-nav"')
    body = body.replace('onClick="{{ playVideo }}"', 'data-emc="play-video"')
    body = body.replace('onClick="{{ railPrev }}"', 'data-emc="rail-prev"')
    body = body.replace('onClick="{{ railNext }}"', 'data-emc="rail-next"')
    body = body.replace('ref="{{ railRef }}"', 'data-emc="rail-track"')
    body = body.replace('onSubmit="{{ ctaSubmit }}"', 'data-emc="lead-form"')
    body = body.replace('onSubmit="{{ onSubmit }}"', 'data-emc="lead-form"')
    body = body.replace("{{ year }}", '<span data-emc="year"></span>')

    # defer youtube iframe load until play
    body = body.replace('<iframe src="https://www.youtube.com/embed/',
                        '<iframe data-src="https://www.youtube.com/embed/')

    # image-slot custom element -> placeholder div
    body = re.sub(r'<image-slot\s+([^>]*?)>\s*</image-slot>', convert_image_slot, body, flags=re.S)

    # internal links
    for src, dst in LINK_MAP.items():
        body = body.replace(src, dst)

    # point the "Guide Login" nav link at the demo login page
    body = re.sub(r'(<a )href="#"([^>]*?>Guide Login</a>)', r'\1href="login.html"\2', body)

    # drop the confusing "The Reach" link wherever it appears (nav is regenerated
    # separately; this clears the footer "Explore" link). The section itself stays.
    body = re.sub(r'\s*<a\b[^>]*>The Reach</a>', '', body)

    # overflow-x:hidden on the page wrapper turns it into a scroll container, which
    # silently breaks position:sticky on the header. clip clips without that side effect.
    body = body.replace("overflow-x:hidden", "overflow-x:clip")

    # mark the header so the scroll-aware shrink/reveal animation can hook in
    body = body.replace('<header style="position:sticky;', '<header class="emc-header" style="position:sticky;', 1)

    # safety: strip empty hover attrs
    body = re.sub(r'\sstyle-hover=""', '', body)
    return body


def build(src_name, cfg):
    raw = open(os.path.join(SRC, src_name)).read()
    helmet = extract_between(raw, "<helmet>", "</helmet>")
    body = extract_between(raw, "</helmet>", "</x-dc>").strip()
    body = transform_body(body)

    # replace the per-page nav with the single canonical nav
    nav_active = {"media-kit.html": "mediakit", "stories.html": "stories"}.get(cfg["out"])
    nav_home = "" if cfg["out"] == "index.html" else "index.html"
    body = re.sub(r'<nav\b[^>]*>.*?</nav>',
                  lambda m: nav_html(nav_active, nav_home), body, count=1, flags=re.S)

    fonts = "\n".join(get_font_links(helmet))
    helmet_style = get_helmet_style(helmet)

    doc = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{html.escape(cfg['title'])}</title>
<meta name="description" content="{html.escape(cfg['desc'])}">
<link rel="icon" type="image/png" href="assets/emc-logo.png">
{fonts}
<link rel="stylesheet" href="styles.css">
<link rel="stylesheet" href="responsive.css">
<style>
{helmet_style}
</style>
</head>
<body>
{body}
<script src="emc.js"></script>
</body>
</html>
"""
    # cache-busting: version the files that change between deploys
    v = f"?v={VERSION}"
    doc = doc.replace('href="styles.css"', f'href="styles.css{v}"')
    doc = doc.replace('href="responsive.css"', f'href="responsive.css{v}"')
    doc = doc.replace('src="emc.js"', f'src="emc.js{v}"')
    doc = re.sub(r'src="(assets/reel-\d+\.jpg)"', rf'src="\1{v}"', doc)

    with open(os.path.join(OUT, cfg["out"]), "w") as f:
        f.write(doc)
    print(f"wrote {cfg['out']} ({len(doc)} bytes)")


if __name__ == "__main__":
    for name, cfg in PAGES.items():
        build(name, cfg)
