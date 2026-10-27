#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Watch Runtime exceptions/console errors on the page for 8s with full detail."""
import json
import time
import urllib.request

import websocket

t = [x for x in json.load(urllib.request.urlopen("http://127.0.0.1:9333/json"))
     if x.get("type") == "page"][0]
ws = websocket.create_connection(t["webSocketDebuggerUrl"], timeout=10,
                                 suppress_origin=True)
mid = 0


def send(method, params=None):
    global mid
    mid += 1
    ws.send(json.dumps({"id": mid, "method": method, "params": params or {}}))


send("Runtime.enable")
send("Log.enable")
send("Runtime.evaluate", {"expression":
     "document.querySelector('[data-go=\"words\"]').click(),'go'"})
deadline = time.time() + 8
ws.settimeout(2)
while time.time() < deadline:
    try:
        m = json.loads(ws.recv())
    except Exception:
        continue
    if m.get("method") == "Runtime.exceptionThrown":
        d = m["params"]["exceptionDetails"]
        exc = d.get("exception", {})
        print("EXC:", d.get("text"), "|", exc.get("className"), "|",
              str(exc.get("description"))[:300], "| scriptId", d.get("scriptId"),
              "line", d.get("lineNumber"))
    if m.get("method") == "Log.entryAdded":
        e = m["params"]["entry"]
        print("LOG:", e.get("level"), "|", str(e.get("text"))[:200],
              "| url", e.get("url"), "line", e.get("lineNumber"))
print("watch done")
