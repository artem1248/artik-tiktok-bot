const { Bot, InlineKeyboard } = require("grammy");

const token = process.env.BOT_TOKEN;
const adminId = Number(process.env.ADMIN_ID || "548699148");
const groupId = process.env.GROUP_ID || "-3757851939";
const liveUrl = process.env.LIVE_URL || "https://tiktok.com/@artik_sp/live";

if (!token) {
  console.error("Missing BOT_TOKEN environment variable.");
  process.exit(1);
}

const bot = new Bot(token);
const keyboard = () => new InlineKeyboard()
  .text("🔴 Я в эфире", "announce_live")
  .row()
  .text("⚫ Эфир завершён", "announce_offline");

bot.command("start", async (ctx) => {
  if (ctx.from?.id !== adminId) {
    await ctx.reply("Этот бот предназначен только для администратора.");
    return;
  }
  await ctx.reply("Панель управления эфиром. Выбери действие:", {
    reply_markup: keyboard()
  });
});

bot.callbackQuery("announce_live", async (ctx) => {
  if (ctx.from?.id !== adminId) {
    await ctx.answerCallbackQuery({ text: "Нет доступа." });
    return;
  }
  try {
    await bot.api.sendMessage(
      groupId,
      `🔴 <b>Я уже в эфире!</b>\n\nЗаходите смотреть и поддержать меня 👇\n${liveUrl}`,
      { parse_mode: "HTML" }
    );
    await ctx.answerCallbackQuery({ text: "Сообщение отправлено в группу!" });
    await ctx.reply("✅ Сообщение об эфире отправлено.", { reply_markup: keyboard() });
  } catch (err) {
    console.error("Failed to post live announcement:", err);
    await ctx.answerCallbackQuery({ text: "Не удалось отправить сообщение." });
    await ctx.reply("❌ Не получилось отправить сообщение. Убедись, что бот добавлен в группу и может писать сообщения.");
  }
});

bot.callbackQuery("announce_offline", async (ctx) => {
  if (ctx.from?.id !== adminId) {
    await ctx.answerCallbackQuery({ text: "Нет доступа." });
    return;
  }
  try {
    await bot.api.sendMessage(groupId, "⚫ Эфир завершён. Спасибо всем, кто заходил! ❤️");
    await ctx.answerCallbackQuery({ text: "Сообщение отправлено." });
    await ctx.reply("✅ Сообщение о завершении эфира отправлено.", { reply_markup: keyboard() });
  } catch (err) {
    console.error("Failed to post offline announcement:", err);
    await ctx.answerCallbackQuery({ text: "Не удалось отправить сообщение." });
    await ctx.reply("❌ Не получилось отправить сообщение. Проверь права бота в группе.");
  }
});

bot.catch((err) => console.error("Bot error:", err));
bot.start({ onStart: (info) => console.log(`Bot @${info.username} started.`) });
