#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import json
import urllib.request

import websocket

t = [x for x in json.load(urllib.request.urlopen("http://127.0.0.1:9333/json"))
     if x.get("type") == "page"][0]
ws = websocket.create_connection(t["webSocketDebuggerUrl"], timeout=15,
                                 suppress_origin=True)


def js(expr):
    ws.send(json.dumps({"id": 1, "method": "Runtime.evaluate",
                        "params": {"expression": expr, "returnByValue": True}}))
    while True:
        m = json.loads(ws.recv())
        if m.get("id") == 1:
            return m["result"]


expr = (
    "try{"
    "document.querySelector('[data-go=\"vocab\"]').click();"
    "'clicked'"
    "}catch(e){'ERR: '+e.message+' @ '+(e.stack||'').split(String.fromCharCode(10))[0]}"
)
r = js(expr)
print(json.dumps(r, ensure_ascii=False)[:800])
