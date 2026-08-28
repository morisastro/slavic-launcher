// Slavic Launcher — server-side hooks for PocketBase 0.23
// Handles redeem code logic securely (marks codes as used, assigns cosmetics).
// Docs: https://pocketbase.io/docs/js-overview/

onRecordAfterCreate((e) => {
  console.log(`[slavic] new record in ${e.collection?.name || "?"}: ${e.record?.id}`);
}, "user_cosmetics");

// Custom API route: POST /api/redeem
// Body: { "code": "WELCOME10", "user": "player-uuid" }
// Marks the code as used and assigns the cosmetic to the user.
routerAdd("POST", "/api/redeem", (c) => {
  const data = $apis.requestInfo(c).data || {};
  const code = data.code || "";
  const user = data.user || "";

  if (!code || !user) {
    return c.json(400, { ok: false, message: "code and user are required" });
  }

  // Find the code
  const col = $app.dao().findCollectionByNameOrId("redeem_codes");
  let record;
  try {
    record = $app.dao().findFirstRecordByFilter(
      col.id,
      `code = "${code}"`,
    );
  } catch (err) {
    return c.json(404, { ok: false, message: "Invalid code" });
  }

  if (record.getBool("used")) {
    return c.json(409, { ok: false, message: "Code already used" });
  }

  const reward = record.getString("reward") || "Mystery Cosmetic";

  // Mark code as used
  record.set("used", true);
  record.set("used_by", user);
  $app.dao().saveRecord(record);

  // Try to find the cosmetic by name and assign it
  try {
    const cosmeticCol = $app.dao().findCollectionByNameOrId("cosmetics");
    const cosmetic = $app.dao().findFirstRecordByFilter(
      cosmeticCol.id,
      `name = "${reward}"`,
    );
    const ucCol = $app.dao().findCollectionByNameOrId("user_cosmetics");
    const uc = new Record(ucCol);
    uc.set("user", user);
    uc.set("cosmetic", cosmetic.id);
    uc.set("equipped", false);
    $app.dao().saveRecord(uc);
  } catch (err) {
    // cosmetic not found — code is still redeemed, just no cosmetic record
    console.log(`[slavic] cosmetic "${reward}" not found, code redeemed without assignment`);
  }

  return c.json(200, { ok: true, message: `Unlocked: ${reward}`, reward });
});

// Custom API route: GET /api/user-cosmetics/:uuid
// Returns all cosmetics owned by a user.
routerAdd("GET", "/api/user-cosmetics/:uuid", (c) => {
  const uuid = c.pathParam("uuid");
  const col = $app.dao().findCollectionByNameOrId("user_cosmetics");

  let records;
  try {
    records = $app.dao().findRecordsByFilter(
      col.id,
      `user = "${uuid}"`,
    );
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

  return c.json(200, { items });
});
