// Debug version — returns what's available on the context
routerAdd("POST", "/api/redeem", (c) => {
  try {
    const keys = [];
    for (const k in c) { keys.push(k); }
    let bodyVal = null;
    let dataVal = null;
    try { bodyVal = c.requestInfo ? c.requestInfo().body : null; } catch(e) { bodyVal = "err:" + e; }
    try { dataVal = $apis.requestInfo(c).body; } catch(e) { dataVal = "err:" + e; }
    return c.json(200, {
      ctxKeys: keys,
      bodyFromCtx: bodyVal,
      bodyFromApis: dataVal,
    });
  } catch (err) {
    return c.json(500, { error: err + "" });
  }
});

routerAdd("GET", "/api/debug", (c) => {
  return c.json(200, { ok: true, msg: "debug route works" });
});