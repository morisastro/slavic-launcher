import { Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes } from "discord.js";
import "dotenv/config";
import { saveCode } from "./api.js";

const TOKEN = process.env.DISCORD_TOKEN;
const GUILD_ID = process.env.GUILD_ID;

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

client.once("ready", async () => {
  console.log(`Logged in as ${client.user?.tag}`);
  const rest = new REST().setToken(TOKEN);
  await rest.put(Routes.applicationGuildCommands(client.user.id, GUILD_ID), { body: commands });
  console.log("Slash commands registered.");
});

client.on("interactionCreate", async (i) => {
  if (!i.isChatInputCommand()) return;
  try {
    if (i.commandName === "ping") {
      await i.reply("Pong! Slavic Launcher bot is online.");
    } else if (i.commandName === "code") {
      const code = i.options.getString("code");
      const reward = i.options.getString("reward");
      await saveCode(code, reward);
      await i.reply(`Code registered: **${code}** — reward: ${reward}`);
    } else if (i.commandName === "giveaway") {
      const members = (await i.guild.members.fetch()).filter((m) => !m.user.bot);
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