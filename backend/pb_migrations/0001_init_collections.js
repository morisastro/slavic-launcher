/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  // Helper to build a text field
  const textField = (name, opts = {}) => ({
    hidden: false,
    id: "text" + Math.random().toString().slice(2, 12),
    name,
    presentable: false,
    required: opts.required || false,
    system: false,
    type: "text",
    min: opts.min || 0,
    max: opts.max || 0,
    pattern: opts.pattern || "",
    autogeneratePattern: "",
  });

  const boolField = (name) => ({
    hidden: false,
    id: "bool" + Math.random().toString().slice(2, 12),
    name,
    presentable: false,
    required: false,
    system: false,
    type: "bool",
  });

  const numberField = (name) => ({
    hidden: false,
    id: "number" + Math.random().toString().slice(2, 12),
    name,
    presentable: false,
    required: false,
    system: false,
    type: "number",
    min: 0,
    max: 0,
  });

  const dateField = (name) => ({
    hidden: false,
    id: "date" + Math.random().toString().slice(2, 12),
    name,
    presentable: false,
    required: false,
    system: false,
    type: "date",
    min: "",
    max: "",
  });

  const fileField = (name) => ({
    hidden: false,
    id: "file" + Math.random().toString().slice(2, 12),
    name,
    presentable: false,
    required: false,
    system: false,
    type: "file",
    maxSelect: 1,
    maxSize: 5242880,
    mimeTypes: ["image/png", "image/jpeg"],
    thumbs: [],
    protected: false,
  });

  const collections = [
    {
      name: "users",
      fields: [
        textField("username", { required: true, max: 40 }),
        textField("uuid", { required: true, max: 64 }),
        textField("discord_id", { max: 32 }),
        textField("avatar_url", { max: 500 }),
      ],
    },
    {
      name: "cosmetics",
      listRule: "",
      viewRule: "",
      fields: [
        textField("name", { required: true, max: 60 }),
        textField("description", { max: 500 }),
        textField("type", { required: true, max: 20 }),
        textField("rarity", { max: 20 }),
        fileField("image"),
        textField("model_url", { max: 500 }),
      ],
    },
    {
      name: "user_cosmetics",
      fields: [
        textField("user", { required: true, max: 64 }),
        textField("cosmetic", { required: true, max: 64 }),
        boolField("equipped"),
      ],
    },
    {
      name: "redeem_codes",
      listRule: "",
      viewRule: "",
      fields: [
        textField("code", { required: true, max: 40 }),
        textField("reward", { max: 60 }),
        boolField("used"),
        textField("used_by", { max: 64 }),
      ],
    },
    {
      name: "news",
      listRule: "",
      viewRule: "",
      fields: [
        textField("title", { required: true, max: 120 }),
        textField("body", { required: true }),
        fileField("image"),
        dateField("date"),
      ],
    },
    {
      name: "servers",
      listRule: "",
      viewRule: "",
      fields: [
        textField("name", { required: true, max: 60 }),
        textField("ip", { required: true, max: 120 }),
        textField("description", { max: 500 }),
        boolField("online"),
        numberField("players"),
        numberField("maxPlayers"),
        fileField("icon"),
      ],
    },
  ];

  for (const c of collections) {
    let collection;
    try {
      collection = app.findCollectionByNameOrId(c.name);
    } catch (e) {
      collection = new Collection();
      collection.name = c.name;
      collection.type = "base";
    }
    collection.fields = c.fields;
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