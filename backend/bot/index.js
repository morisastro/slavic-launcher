// Discord bot: gives redeem codes for joining / events.
// Free host on Render.com free tier, or run locally.
//
// Setup:
//   1. Create app at https://discord.com/developers/applications
//   2. Copy bot token -> set in .env as DISCORD_TOKEN
//   3. Copy server ID -> set as GUILD_ID
//   4. Invite bot with scopes: bot, applications.commands
//   5. npm install && npm start
//
// Commands:
//   /code <code>  -> save a redeem code into the backend
//   /giveaway     -> picks a random member, DMs them a code
//   /ping

import { Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes } from "discord.js";
import "dotenv/config";

const TOKEN = process.env.DISCORD_TOKEN!;
const GUILD_ID = process.env.GUILD_ID!;
const BACKEND = process.env.BACKEND_URL ?? "http://127.0.0.1:8090";
const PB_EMAIL = process.env.PB_ADMIN_EMAIL ?? "admin@slavic.local";
const PB_PASS = process.env.PB_ADMIN_PASSWORD ?? "changeme123";

let pbToken = null;

async function pbAuth() {
  const res = await fetch(`${BACKEND}/api/collections/_superusers/auth-with-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identity: PB_EMAIL, password: PB_PASS }),
  });
  if (!res.ok) throw new Error(`PocketBase auth failed: ${res.status}`);
  const json = await res.json();
  pbToken = json.token;
}

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers] });

const commands = [
  new SlashCommandBuilder().setName("ping").setDescription("Check the bot is alive."),
  new SlashCommandBuilder().setName("giveaway").setDescription("Pick a random member and generate a code."),
  new SlashCommandBuilder()
    .setName("code")
    .setDescription("Register a redeem code in the backend.")
    .addStringOption((o) => o.setName("code").setDescription("The code string").setRequired(true))
    .addStringOption((o) => o.setName("reward").setDescription("Cosmetic / reward name").setRequired(true)),
].map((c) => c.toJSON());

async function genCode() {
  return Math.random().toString(36).slice(2, 10).toUpperCase();
}

async function saveCode(code, reward) {
  if (!pbToken) await pbAuth();
  const res = await fetch(`${BACKEND}/api/collections/redeem_codes/records`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${pbToken}`,
    },
    body: JSON.stringify({ code, reward, used: false }),
  });
  if (!res.ok && res.status === 401) {
    // token expired, retry
    await pbAuth();
    await saveCode(code, reward);
    return;
  }
  if (!res.ok) throw new Error(`Failed to save code: ${res.status}`);
}

client.once("ready", async () => {
  console.log(`Logged in as ${client.user?.tag}`);
  const rest = new REST().setToken(TOKEN);
  await rest.put(Routes.applicationGuildCommands(client.user!.id, GUILD_ID), { body: commands });
  console.log("Slash commands registered.");
});

client.on("interactionCreate", async (i) => {
  if (!i.isChatInputCommand()) return;
  try {
    if (i.commandName === "ping") {
      await i.reply("Pong! Slavic Launcher bot is online.");
    } else if (i.commandName === "code") {
      const code = i.options.getString("code")!;
      const reward = i.options.getString("reward")!;
      await saveCode(code, reward);
      await i.reply(`Code registered: **${code}** — reward: ${reward}`);
    } else if (i.commandName === "giveaway") {
      const members = (await i.guild!.members.fetch()).filter((m) => !m.user.bot);
      const winner = members.random();
      const code = await genCode();
      await saveCode(code, "Mystery Cosmetic");
      await winner.send(`You won a giveaway! Your Slavic Launcher code: ${code}`);
      await i.reply(`Giveaway done — winner has been DM'd a code. Congrats ${winner}!`);
    }
  } catch (e) {
    console.error(e);
    await i.reply({ content: "Something went wrong.", ephemeral: true }).catch(() => {});
  }
});

client.login(TOKEN);
