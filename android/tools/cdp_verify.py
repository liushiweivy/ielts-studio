#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""CDP verification of the IELTS Studio WebView app on the emulator.

Assumes: adb forward tcp:9333 localabstract:webview_devtools_remote_<pid>
already established and the app is in the foreground.

Checks:
 1. polyfill active (speechSynthesis bridged to AndroidTts)
 2. voices list non-empty and en-GB present
 3. speak() reaches native bridge (AndroidTts.speak returns an id)
 4. localStorage writable (progress persistence)
 5. mediaDevices/MediaRecorder availability (speaking module)
 6. navigation to each of the 6 modules renders without page errors
"""
import json
import sys
import time

import urllib.request

import websocket


def get_ws_url():
    with urllib.request.urlopen("http://127.0.0.1:9333/json") as r:
        targets = json.load(r)
    for t in targets:
        if t.get("type") == "page" and "index.html" in t.get("url", ""):
            return t["webSocketDebuggerUrl"]
    raise SystemExit("page target not found")


class Cdp:
    def __init__(self, url):
        self.ws = websocket.create_connection(url, timeout=15,
                                              suppress_origin=True)
        self.mid = 0
        self.console_errors = []

    def cmd(self, method, params=None):
        self.mid += 1
        self.ws.send(json.dumps({"id": self.mid, "method": method,
                                 "params": params or {}}))
        deadline = time.time() + 15
        while time.time() < deadline:
            msg = json.loads(self.ws.recv())
            if msg.get("method") == "Log.entryAdded":
                e = msg["params"]["entry"]
                if e.get("level") == "error":
                    self.console_errors.append(e.get("text", ""))
            if msg.get("method") == "Runtime.exceptionThrown":
                d = msg["params"]["exceptionDetails"]
                self.console_errors.append(str(d.get("text", "")))
            if msg.get("id") == self.mid:
                return msg.get("result", {})
        raise TimeoutError(method)

    def js(self, expr):
        r = self.cmd("Runtime.evaluate", {
            "expression": expr, "returnByValue": True, "awaitPromise": True})
        if "exceptionDetails" in r:
            return f"JS-ERROR: {r['exceptionDetails'].get('text')}"
        return r.get("result", {}).get("value")


def main():
    cdp = Cdp(get_ws_url())
    cdp.cmd("Runtime.enable")
    cdp.cmd("Log.enable")
    cdp.cmd("Page.enable")

    results = []

    def check(name, expr, expect):
        v = cdp.js(expr)
        ok = (v == expect) if not callable(expect) else bool(expect(v))
        results.append((name, ok, v))

    check("polyfill active",
          "window.AndroidTts ? (speechSynthesis.getVoices() !== undefined && "
          "String(speechSynthesis.speak).indexOf('native code') === -1) : 'NO_BRIDGE'",
          True)
    check("voices list", "speechSynthesis.getVoices().map(v=>v.lang).join(',')",
          lambda v: isinstance(v, str) and "en-GB" in v)
    check("utterance ctor", "String(new SpeechSynthesisUtterance('hello').text)",
          "hello")
    check("localStorage", "localStorage.setItem('t','1'),localStorage.getItem('t')",
          "1")
    check("mediaDevices", "!!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)",
          True)
    check("MediaRecorder", "typeof MediaRecorder", "function")

    # speak reaches native bridge: stub the bridge call counter via polyfill path
    v = cdp.js("AndroidTts.speak('verification tone', 1)")
    results.append(("native TTS speak returns id",
                    isinstance(v, str) and v.startswith("u"), v))

    # walk the six modules
    pages = ["dashboard", "words", "listening", "reading", "writing", "speaking"]
    for p in pages:
        ok = cdp.js(
            f"document.querySelector('[data-go=\"{p}\"]').click(),"
            f"document.getElementById('page-{p}').classList.contains('on')")
        results.append((f"nav {p}", ok is True, ok))
        time.sleep(0.2)

    time.sleep(0.5)
    errs = [e for e in cdp.console_errors if e]
    passed = sum(1 for _, ok, _ in results if ok)
    print(f"CDP checks: {passed}/{len(results)} passed")
    for name, ok, v in results:
        print(f"  [{'PASS' if ok else 'FAIL'}] {name}: {str(v)[:80]}")
    if errs:
        print("console errors:")
        for e in errs[:10]:
            print("  -", e[:120])
    else:
        print("console errors: none")
    return 0 if passed == len(results) and not errs else 1


if __name__ == "__main__":
    sys.exit(main())
