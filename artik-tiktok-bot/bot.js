const { Bot, InlineKeyboard } = require("grammy");
const http = require("http");

const token = process.env.BOT_TOKEN;
const adminId = Number(process.env.ADMIN_ID || "548699148");
const groupId = process.env.GROUP_ID || "-3757851939";
const liveUrl = process.env.LIVE_URL || "https://tiktok.com/@artik_sp/live";
const webhookSecret = process.env.WEBHOOK_SECRET;

if (!token || !webhookSecret) {
  console.error("Missing BOT_TOKEN or WEBHOOK_SECRET.");
  process.exit(1);
}

const bot = new Bot(token);

const keyboard = () => new InlineKeyboard()
  .text("🔴 Я в эфире", "announce_live")
  .row()
  .text("⚫ Эфир завершён", "announce_offline");

bot.command("start", async (ctx) => {
  if (ctx.from?.id !== adminId) {
    return ctx.reply("Этот бот предназначен только для администратора.");
  }
  await ctx.reply("Панель управления эфиром. Выбери действие:", {
    reply_markup: keyboard()
  });
});

bot.callbackQuery("announce_live", async (ctx) => {
  if (ctx.from?.id !== adminId) {
    return ctx.answerCallbackQuery({ text: "Нет доступа." });
  }
  try {
    await bot.api.sendMessage(
      groupId,
      `🔴 <b>Я уже в эфире!</b>\n\nЗаходите смотреть 👇\n${liveUrl}`,
      { parse_mode: "HTML" }
    );
    await ctx.answerCallbackQuery({ text: "Сообщение отправлено!" });
    await ctx.reply("✅ Объявление отправлено.", { reply_markup: keyboard() });
  } catch (err) {
    console.error(err);
    await ctx.answerCallbackQuery({ text: "Ошибка отправки." });
    await ctx.reply("❌ Не удалось отправить сообщение. Проверь, что бот добавлен в группу и может писать.");
  }
});

bot.callbackQuery("announce_offline", async (ctx) => {
  if (ctx.from?.id !== adminId) {
    return ctx.answerCallbackQuery({ text: "Нет доступа." });
  }
  try {
    await bot.api.sendMessage(groupId, "⚫ Эфир завершён. Спасибо всем! ❤️");
    await ctx.answerCallbackQuery({ text: "Сообщение отправлено!" });
    await ctx.reply("✅ Сообщение отправлено.", { reply_markup: keyboard() });
  } catch (err) {
    console.error(err);
    await ctx.answerCallbackQuery({ text: "Ошибка отправки." });
  }
});

bot.catch((err) => console.error("Bot error:", err));

const server = http.createServer((req, res) => {
  if (req.method === "GET" && req.url === "/") {
    res.writeHead(200, { "content-type": "text/plain" });
    return res.end("Artik Telegram bot is running");
  }

  if (req.method !== "POST" || req.url !== "/telegram-webhook") {
    res.writeHead(404);
    return res.end("Not found");
  }

  if (req.headers["x-telegram-bot-api-secret-token"] !== webhookSecret) {
    res.writeHead(403);
    return res.end("Forbidden");
  }

  let body = "";
  req.on("data", chunk => {
    body += chunk;
    if (body.length > 1_000_000) req.destroy();
  });

  req.on("end", async () => {
    try {
      await bot.handleUpdate(JSON.parse(body));
      res.writeHead(200);
      res.end("OK");
    } catch (err) {
      console.error("Webhook error:", err);
      res.writeHead(500);
      res.end("Internal Server Error");
    }
  });
});

const port = Number(process.env.PORT || 10000);
server.listen(port, "0.0.0.0", async () => {
  console.log(`Server listening on ${port}`);
  try {
    const url = process.env.RENDER_EXTERNAL_URL;
    if (url) {
      await bot.api.setWebhook(`${url}/telegram-webhook`, {
        secret_token: webhookSecret,
        allowed_updates: ["message", "callback_query"]
      });
      console.log("Telegram webhook configured.");
    } else {
      console.error("RENDER_EXTERNAL_URL is missing.");
    }
  } catch (err) {
    console.error("Webhook setup failed:", err);
  }
});
