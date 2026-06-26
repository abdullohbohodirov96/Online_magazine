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

    let addressText = `📍 <b>Адрес:</b> ${order.address}`;
    if (order.latitude && order.longitude) {
      const mapLink = `https://yandex.com/maps/?ll=${order.longitude},${order.latitude}&z=17&pt=${order.longitude},${order.latitude},pm2rdm`;
      addressText += `\n🗺 <b>Карта:</b> <a href="${mapLink}">Yandex Maps</a>`;
    }

    let deliveryDetails = '';
    if (order.deliveryEntrance) deliveryDetails += `Подъезд: ${order.deliveryEntrance} `;
    if (order.deliveryFloor) deliveryDetails += `Этаж: ${order.deliveryFloor} `;
    if (order.deliveryApartment) deliveryDetails += `Кв: ${order.deliveryApartment} `;
    if (order.deliveryIntercom) deliveryDetails += `Домофон: ${order.deliveryIntercom}`;

    if (deliveryDetails) {
      addressText += `\n📦 <b>Детали доставки:</b> ${deliveryDetails.trim()}`;
    }
    if (order.addressComment) {
      addressText += `\n💬 <b>Уточнение адреса:</b> ${order.addressComment}`;
    }

    const text = `🛒 <b>Новый заказ #${order.id.slice(-6).toUpperCase()}</b>\n\n` +
      `👤 <b>Клиент:</b> ${order.customerName}\n` +
      `📞 <b>Телефон:</b> ${order.phone}\n` +
      `${addressText}\n` +
      `💬 <b>Комментарий:</b> ${order.comment || 'нет'}\n\n` +
      `📦 <b>Товары:</b>\n${itemsText}\n\n` +
      `💰 <b>Итого:</b> <b>${order.totalAmount.toLocaleString('ru-RU')} UZS</b>\n\n` +
      `<b>Статус:</b> ${statusNames[order.status] || order.status}`;

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || settings.miniAppUrl;
    const replyMarkup = {
      inline_keyboard: [
        [
          { text: '✅ Принять', callback_data: `order:accept:${order.id}` },
          { text: '🚚 В доставку', callback_data: `order:delivery:${order.id}` }
        ],
        [
          { text: '🏁 Завершить', callback_data: `order:complete:${order.id}` },
          { text: '❌ Отменить', callback_data: `order:cancel:${order.id}` }
        ],
        [
          { text: '🔗 Открыть заказ', url: `${appUrl}/admin?orderId=${order.id}` }
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
