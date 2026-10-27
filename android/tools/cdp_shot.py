#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Click through key pages and tap the flashcard speaker to exercise TTS."""
import json
import time
import urllib.request

import websocket

t = [x for x in json.load(urllib.request.urlopen("http://127.0.0.1:9333/json"))
     if x.get("type") == "page"][0]
ws = websocket.create_connection(t["webSocketDebuggerUrl"], timeout=15,
                                 suppress_origin=True)
mid = 0


def js(expr):
    global mid
    mid += 1
    ws.send(json.dumps({"id": mid, "method": "Runtime.evaluate",
                        "params": {"expression": expr, "returnByValue": True}}))
    while True:
        m = json.loads(ws.recv())
        if m.get("id") == mid:
            r = m["result"]
            if "exceptionDetails" in r:
                return "JS-ERROR: " + str(r["exceptionDetails"].get("exception", {}).get("description"))[:200]
            return r.get("result", {}).get("value")


js("document.querySelector('[data-go=\"words\"]').click()")
time.sleep(0.6)
# tap the speaker button on the flashcard (TTS through the bridge)
btns = js("Array.from(document.querySelectorAll('#page-words button')).map(b=>b.textContent.trim()).join(' | ')")
print("word page buttons:", str(btns)[:150])
r = js("var b=Array.from(document.querySelectorAll('#page-words button')).find(x=>/喇叭|🔊|▶|听/.test(x.textContent)); b?(b.click(),'clicked '+b.textContent.trim()):'no speaker btn'")
print("speaker:", r)
time.sleep(1.0)
print("speaking state:", js("speechSynthesis.speaking"))
