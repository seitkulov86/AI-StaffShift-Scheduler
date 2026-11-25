// Netlify Function: принимает заявку с сайта и отправляет в Telegram.
// Токен и chat_id хранятся в переменных окружения Netlify, а не в коде сайта.
//   TELEGRAM_BOT_TOKEN — токен от @BotFather
//   TELEGRAM_CHAT_ID   — id чата или группы, куда приходят заявки

const escapeHtml = (s) =>
  String(s ?? '')
    .slice(0, 1000)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    return { statusCode: 500, body: 'Server is not configured' };
  }

  let data;
  try {
    data = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, body: 'Bad JSON' };
  }

  const name = (data.name || '').trim();
  const venue = (data.venue || '').trim();
  const phone = (data.phone || '').trim();
  if (!name || !venue || !phone) {
    return { statusCode: 400, body: 'Missing required fields' };
  }

  const digits = phone.replace(/\D/g, '');
  const waLink = digits ? `https://wa.me/${digits}` : '';

  const text =
    `🔔 <b>Новая заявка AI-shift</b>\n\n` +
    `👤 <b>Имя:</b> ${escapeHtml(name)}\n` +
    `🏪 <b>Заведение:</b> ${escapeHtml(venue)}\n` +
    `📞 <b>Телефон:</b> ${escapeHtml(phone)}\n` +
    (waLink ? `💬 <b>WhatsApp:</b> ${waLink}\n` : '') +
    `🌐 <b>Instagram/сайт:</b> ${escapeHtml(data.instagram || '—')}\n\n` +
    `📝 <b>Процесс графиков:</b>\n${escapeHtml(data.message || '—')}`;

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true
      })
    });
    if (!res.ok) {
      return { statusCode: 502, body: 'Telegram error' };
    }
    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch {
    return { statusCode: 502, body: 'Telegram unreachable' };
  }
};
