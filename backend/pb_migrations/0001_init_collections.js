/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collections = [
    {
      name: "users",
      fields: [
        { name: "username", type: "text", required: true, options: { max: 40 } },
        { name: "uuid", type: "text", required: true, options: { max: 64 } },
        { name: "discord_id", type: "text", options: { max: 32 } },
        { name: "avatar_url", type: "text", options: { max: 500 } },
      ],
    },
    {
      name: "cosmetics",
      listRule: "",
      viewRule: "",
      fields: [
        { name: "name", type: "text", required: true, options: { max: 60 } },
        { name: "description", type: "text", options: { max: 500 } },
        { name: "type", type: "text", required: true, options: { max: 20 } },
        { name: "rarity", type: "text", options: { max: 20 } },
        { name: "image", type: "file", options: { maxSelect: 1, mimeTypes: ["image/png", "image/jpeg"] } },
        { name: "model_url", type: "text", options: { max: 500 } },
      ],
    },
    {
      name: "user_cosmetics",
      fields: [
        { name: "user", type: "text", required: true, options: { max: 64 } },
        { name: "cosmetic", type: "text", required: true, options: { max: 64 } },
        { name: "equipped", type: "bool" },
      ],
    },
    {
      name: "redeem_codes",
      listRule: "",
      viewRule: "",
      fields: [
        { name: "code", type: "text", required: true, options: { max: 40 } },
        { name: "reward", type: "text", options: { max: 60 } },
        { name: "used", type: "bool" },
        { name: "used_by", type: "text", options: { max: 64 } },
      ],
    },
    {
      name: "news",
      listRule: "",
      viewRule: "",
      fields: [
        { name: "title", type: "text", required: true, options: { max: 120 } },
        { name: "body", type: "text", required: true },
        { name: "image", type: "file", options: { maxSelect: 1, mimeTypes: ["image/png", "image/jpeg"] } },
        { name: "date", type: "date" },
      ],
    },
    {
      name: "servers",
      listRule: "",
      viewRule: "",
      fields: [
        { name: "name", type: "text", required: true, options: { max: 60 } },
        { name: "ip", type: "text", required: true, options: { max: 120 } },
        { name: "description", type: "text", options: { max: 500 } },
        { name: "online", type: "bool" },
        { name: "players", type: "number" },
        { name: "maxPlayers", type: "number" },
        { name: "icon", type: "file", options: { maxSelect: 1, mimeTypes: ["image/png", "image/jpeg"] } },
      ],
    },
  ];

  for (const c of collections) {
    let collection;
    try {
      collection = app.findCollectionByNameOrId(c.name);
    } catch (e) {
      collection = new Collection(c);
    }
    // Apply listRule/viewRule for public-read collections
    if (c.listRule !== undefined) collection.listRule = c.listRule;
    if (c.viewRule !== undefined) collection.viewRule = c.viewRule;
    app.save(collection);
    console.log("[slavic] collection ready: " + c.name);
  }
}, (app) => {
  for (const name of ["user_cosmetics", "redeem_codes", "cosmetics", "users", "news", "servers"]) {
    try {
      const col = app.findCollectionByNameOrId(name);
      app.delete(col);
    } catch (e) {}
  }
})