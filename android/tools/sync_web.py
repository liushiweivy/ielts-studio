#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Sync the web app (../../web) into app/src/main/assets/www.

Copies index.html / css / js verbatim, adds tools/android-tts.js, and inserts
<script src="android-tts.js"></script> right before js/app.js so the TTS
polyfill is in place before the app logic runs. Idempotent.
"""
import pathlib
import shutil
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
WEB = ROOT.parent / "web"  # monorepo web/ directory
WWW = ROOT / "app" / "src" / "main" / "assets" / "www"
POLYFILL_TAG = '<script src="android-tts.js"></script>'
ANCHOR = '<script src="js/app.js'


def main() -> int:
    if not (WEB / "index.html").exists():
        print(f"[sync] web source missing: {WEB}", file=sys.stderr)
        return 1

    if WWW.exists():
        shutil.rmtree(WWW)
    (WWW / "js").mkdir(parents=True)
    (WWW / "css").mkdir(parents=True)

    for f in (WEB / "js").glob("*.js"):
        shutil.copy2(f, WWW / "js" / f.name)
    for f in (WEB / "css").glob("*.css"):
        shutil.copy2(f, WWW / "css" / f.name)
    shutil.copy2(ROOT / "tools" / "android-tts.js", WWW / "android-tts.js")

    html = (WEB / "index.html").read_text(encoding="utf-8")
    if POLYFILL_TAG in html:
        pass  # already patched upstream
    elif ANCHOR in html:
        html = html.replace(ANCHOR, POLYFILL_TAG + "\n" + ANCHOR, 1)
    else:
        print("[sync] WARN: app.js script tag not found, polyfill NOT injected",
              file=sys.stderr)
        return 2
    (WWW / "index.html").write_text(html, encoding="utf-8")

    n = sum(1 for _ in WWW.rglob("*") if _.is_file())
    print(f"[sync] OK: {n} files -> {WWW}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
