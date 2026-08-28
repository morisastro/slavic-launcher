// Slavic Launcher — server-side hooks for PocketBase 0.23
// Redeem code logic: marks codes as used, assigns cosmetics.

// POST /api/redeem  body: { "code": "WELCOME10", "user": "player-uuid" }
routerAdd("POST", "/api/redeem", (c) => {
  try {
    const data = c.requestInfo().body || {};
    const code = data.code || "";
    const user = data.user || "";

    if (!code || !user) {
      return c.json(400, { ok: false, message: "code and user are required" });
    }

    let record;
    try {
      record = $app.dao().findFirstRecordByData("redeem_codes", "code", code);
    } catch (err) {
      return c.json(404, { ok: false, message: "Invalid code" });
    }

    if (record.getBool("used")) {
      return c.json(409, { ok: false, message: "Code already used" });
    }

    const reward = record.getString("reward") || "Mystery Cosmetic";

    record.set("used", true);
    record.set("used_by", user);
    $app.dao().saveRecord(record);

    // Try to find the cosmetic by name and assign it
    let cosmeticAssigned = false;
    try {
      const cosmetic = $app.dao().findFirstRecordByData("cosmetics", "name", reward);
      const ucCol = $app.dao().findCollectionByNameOrId("user_cosmetics");
      const uc = new Record(ucCol);
      uc.set("user", user);
      uc.set("cosmetic", cosmetic.id);
      uc.set("equipped", false);
      $app.dao().saveRecord(uc);
      cosmeticAssigned = true;
    } catch (err) {
      console.log("[slavic] cosmetic '" + reward + "' not found, code redeemed without assignment");
    }

    return c.json(200, { ok: true, message: "Unlocked: " + reward, reward: reward, cosmeticAssigned: cosmeticAssigned });
  } catch (err) {
    console.log("[slavic] redeem error:", err);
    return c.json(500, { ok: false, message: "Internal error", detail: err + "" });
  }
});

// GET /api/user-cosmetics/:uuid  — returns cosmetics owned by a user
routerAdd("GET", "/api/user-cosmetics/:uuid", (c) => {
  const uuid = c.pathParam("uuid");
  let records = [];
  try {
    records = $app.dao().findRecordsByFilter("user_cosmetics", "user = {:uuid}", { uuid: uuid });
  } catch (err) {
    return c.json(200, { items: [] });
  }

  const items = records.map((r) => {
    let cosmeticName = "";
    let cosmeticType = "";
    try {
      const cid = r.getString("cosmetic");
      const cos = $app.dao().findRecordById("cosmetics", cid);
      cosmeticName = cos.getString("name");
      cosmeticType = cos.getString("type");
    } catch (e) {}
    return {
      id: r.id,
      cosmetic: cosmeticName,
      type: cosmeticType,
      equipped: r.getBool("equipped"),
    };
  });

  return c.json(200, { items: items });
});