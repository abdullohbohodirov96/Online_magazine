import { prisma } from '../db';
import crypto from 'crypto';

export async function getTelegramSettings() {
  const dbSettings = await prisma.telegramSettings.findFirst();
  return {
    botToken: process.env.TELEGRAM_BOT_TOKEN || dbSettings?.botToken || '',
    adminChatId: process.env.TELEGRAM_ADMIN_CHAT_ID || dbSettings?.adminChatId || '',
    notificationsEnabled: process.env.TELEGRAM_NOTIFICATIONS_ENABLED !== 'false' && (process.env.TELEGRAM_NOTIFICATIONS_ENABLED === 'true' || dbSettings?.notificationsEnabled || true),
    botUsername: process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || dbSettings?.botUsername || '',
    miniAppUrl: process.env.NEXT_PUBLIC_APP_URL || dbSettings?.miniAppUrl || 'http://localhost:3000',
  };
}

export async function sendTelegramMessage(chatId: string, text: string, replyMarkup?: any): Promise<boolean> {
  const settings = await getTelegramSettings();
  if (!settings.botToken || !settings.notificationsEnabled) {
    return false;
  }

  try {
    const payload: any = {
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
    };

    if (replyMarkup) {
      payload.reply_markup = replyMarkup;
    }

    const response = await fetch(`https://api.telegram.org/bot${settings.botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error('Failed to send Telegram message:', response.status, response.statusText);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error sending Telegram message:', error);
    return false;
  }
}

export async function editTelegramMessage(chatId: string, messageId: number, text: string, replyMarkup?: any): Promise<boolean> {
  const settings = await getTelegramSettings();
  if (!settings.botToken) {
    return false;
  }

  try {
    const payload: any = {
      chat_id: chatId,
      message_id: messageId,
      text,
      parse_mode: 'HTML',
    };

    if (replyMarkup) {
      payload.reply_markup = replyMarkup;
    }

    const response = await fetch(`https://api.telegram.org/bot${settings.botToken}/editMessageText`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    return response.ok;
  } catch (error) {
    console.error('Error editing Telegram message:', error);
    return false;
  }
}

export async function sendOrderNotification(orderId: string): Promise<boolean> {
  const settings = await getTelegramSettings();
  if (!settings.adminChatId || !settings.notificationsEnabled) {
    return false;
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) return false;

    const itemsText = order.items.map((item, idx) => {
      return `${idx + 1}. ${item.productName} x ${item.quantity} — ${item.total.toLocaleString('ru-RU')} сум`;
    }).join('\n');

    const statusNames: Record<string, string> = {
      NEW: 'Новый 🆕',
      ACCEPTED: 'Принят ✅',
      ASSEMBLING: 'Сборка 📦',
      DELIVERING: 'В пути 🚚',
      COMPLETED: 'Выполнен 🎉',
      CANCELLED: 'Отменен ❌',
    };

    const text = `🛒 <b>Новый заказ #${order.id.slice(-6).toUpperCase()}</b>

` +
      `👤 <b>Клиент:</b> ${order.customerName}
` +
      `📞 <b>Телефон:</b> ${order.phone}
` +
      `📍 <b>Адрес:</b> ${order.address}
` +
      `💬 <b>Комментарий:</b> ${order.comment || 'нет'}

` +
      `📦 <b>Товары:</b>
${itemsText}

` +
      `💰 <b>Итого:</b> <b>${order.totalAmount.toLocaleString('ru-RU')} UZS</b>

` +
      `<b>Статус:</b> ${statusNames[order.status] || order.status}`;

    const replyMarkup = {
      inline_keyboard: [
        [
          { text: '✅ Принять', callback_data: `status:ACCEPTED:${order.id}` },
          { text: '🚚 В доставку', callback_data: `status:DELIVERING:${order.id}` }
        ],
        [
          { text: '🏁 Завершить', callback_data: `status:COMPLETED:${order.id}` },
          { text: '❌ Отменить', callback_data: `status:CANCELLED:${order.id}` }
        ],
        [
          { text: '🔗 Открыть заказ', url: `${settings.miniAppUrl}/admin?tab=orders` }
        ]
      ]
    };

    return await sendTelegramMessage(settings.adminChatId, text, replyMarkup);
  } catch (error) {
    console.error('Error sending order notification:', error);
    return false;
  }
}

export function verifyTelegramInitData(initData: string, botToken: string): boolean {
  if (!initData || !botToken) return false;

  try {
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    if (!hash) return false;

    const keys = Array.from(params.keys()).filter(k => k !== 'hash').sort();
    const dataCheckString = keys.map(k => `${k}=${params.get(k)}`).join('\n');

    const secretKey = crypto.createHmac('sha256', 'WebApps').update(botToken).digest();
    const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

    return calculatedHash === hash;
  } catch (error) {
    console.error('Error verifying Telegram initData:', error);
    return false;
  }
}
