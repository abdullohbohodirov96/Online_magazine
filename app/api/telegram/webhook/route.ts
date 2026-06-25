import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getTelegramSettings, sendTelegramMessage, editTelegramMessage } from '@/lib/telegram/telegram-service';

export async function POST(request: Request) {
  try {
    const settings = await getTelegramSettings();
    if (!settings.botToken) {
      return NextResponse.json({ error: 'Бот не настроен' }, { status: 500 });
    }

    // Secret header check (optional)
    const secretToken = request.headers.get('x-telegram-bot-api-secret-token');
    const localSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
    if (localSecret && secretToken !== localSecret) {
      return NextResponse.json({ error: 'Доступ запрещен: неверный secret token' }, { status: 403 });
    }

    const payload = await request.json();

    // 1. Handle Inline Button Callbacks (callback_query)
    if (payload.callback_query) {
      const callbackQuery = payload.callback_query;
      const data = callbackQuery.data || '';
      const chatId = callbackQuery.message?.chat?.id;
      const messageId = callbackQuery.message?.message_id;

      if (data.startsWith('status:') && chatId && messageId) {
        const [_, status, orderId] = data.split(':');

        try {
          const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: { items: true },
          });

          if (!order) {
            await answerCallback(callbackQuery.id, 'Заказ не найден', settings.botToken);
            return NextResponse.json({ success: true });
          }

          // Update status
          const updatedOrder = await prisma.order.update({
            where: { id: orderId },
            data: { status: status as any },
            include: { items: true },
          });

          // Answer Telegram callback alert
          const statusNames: Record<string, string> = {
            NEW: 'Новый 🆕',
            ACCEPTED: 'Принят ✅',
            ASSEMBLING: 'Сборка 📦',
            DELIVERING: 'В пути 🚚',
            COMPLETED: 'Выполнен 🎉',
            CANCELLED: 'Отменен ❌',
          };
          
          await answerCallback(
            callbackQuery.id,
            `Статус заказа #${order.id.slice(-6).toUpperCase()} изменен на: ${statusNames[status] || status}`,
            settings.botToken
          );

          // Edit message text
          const itemsText = updatedOrder.items.map((item, idx) => {
            return `${idx + 1}. ${item.productName} x ${item.quantity} — ${item.total.toLocaleString('ru-RU')} сум`;
          }).join('\n');

          const text = `🛒 <b>Новый заказ #${updatedOrder.id.slice(-6).toUpperCase()}</b>

` +
            `👤 <b>Клиент:</b> ${updatedOrder.customerName}
` +
            `📞 <b>Телефон:</b> ${updatedOrder.phone}
` +
            `📍 <b>Адрес:</b> ${updatedOrder.address}
` +
            `💬 <b>Комментарий:</b> ${updatedOrder.comment || 'нет'}

` +
            `📦 <b>Товары:</b>
${itemsText}

` +
            `💰 <b>Итого:</b> <b>${updatedOrder.totalAmount.toLocaleString('ru-RU')} UZS</b>

` +
            `<b>Статус:</b> ${statusNames[updatedOrder.status] || updatedOrder.status}`;

          const replyMarkup = {
            inline_keyboard: [
              [
                { text: '✅ Принять', callback_data: `status:ACCEPTED:${updatedOrder.id}` },
                { text: '🚚 В доставку', callback_data: `status:DELIVERING:${updatedOrder.id}` }
              ],
              [
                { text: '🏁 Завершить', callback_data: `status:COMPLETED:${updatedOrder.id}` },
                { text: '❌ Отменить', callback_data: `status:CANCELLED:${updatedOrder.id}` }
              ],
              [
                { text: '🔗 Открыть заказ', url: `${settings.miniAppUrl}/admin?tab=orders` }
              ]
            ]
          };

          await editTelegramMessage(String(chatId), messageId, text, replyMarkup);

          // If the order came from a specific telegram user (checkout from telegram), notify them too!
          if (updatedOrder.telegramChatId) {
            const customerText = `🔔 <b>Статус вашего заказа #${updatedOrder.id.slice(-6).toUpperCase()} изменен!</b>

` +
              `Новый статус: <b>${statusNames[updatedOrder.status] || updatedOrder.status}</b>`;
            await sendTelegramMessage(updatedOrder.telegramChatId, customerText);
          }

        } catch (e: any) {
          console.error('Error handling callback:', e);
          await answerCallback(callbackQuery.id, 'Ошибка обновления статуса: ' + e.message, settings.botToken);
        }
      }
      return NextResponse.json({ success: true });
    }

    // 2. Handle Text Messages (commands)
    if (payload.message) {
      const message = payload.message;
      const text = message.text || '';
      const chatId = String(message.chat.id);
      const telegramId = String(message.from?.id);

      if (text.startsWith('/start')) {
        const welcomeText = `<b>Добро пожаловать в BozorMarket!</b>\n\nУ нас вы можете заказать самые свежие продукты питания с быстрой доставкой на дом.`;
        const replyMarkup = {
          inline_keyboard: [
            [
              { text: '🛒 Открыть магазин', web_app: { url: settings.miniAppUrl } }
            ]
          ]
        };
        await sendTelegramMessage(chatId, welcomeText, replyMarkup);
      } else if (text.startsWith('/orders')) {
        // Query user orders if linked
        const tgUser = await prisma.telegramUser.findUnique({
          where: { telegramId },
          include: { user: { include: { orders: { orderBy: { createdAt: 'desc' }, take: 5 } } } }
        });

        if (tgUser && tgUser.user && tgUser.user.orders.length > 0) {
          let ordersText = `<b>Ваши последние заказы:</b>\n\n`;
          tgUser.user.orders.forEach((o, i) => {
            const date = new Date(o.createdAt).toLocaleDateString('ru-RU');
            const statusNames: Record<string, string> = {
              NEW: 'Новый 🆕',
              ACCEPTED: 'Принят ✅',
              ASSEMBLING: 'Сборка 📦',
              DELIVERING: 'В пути 🚚',
              COMPLETED: 'Выполнен 🎉',
              CANCELLED: 'Отменен ❌',
            };
            ordersText += `${i + 1}. Заказ <b>#${o.id.slice(-6).toUpperCase()}</b> от ${date}
` +
              `   Сумма: ${o.totalAmount.toLocaleString('ru-RU')} сум
` +
              `   Статус: ${statusNames[o.status] || o.status}

`;
          });
          await sendTelegramMessage(chatId, ordersText);
        } else {
          const noOrdersText = 'У вас пока нет активных заказов или ваш профиль не привязан. Откройте магазин и оформите свой первый заказ!';
          const replyMarkup = {
            inline_keyboard: [
              [
                { text: '🛒 Перейти в магазин', web_app: { url: settings.miniAppUrl } }
              ]
            ]
          };
          await sendTelegramMessage(chatId, noOrdersText, replyMarkup);
        }
      } else if (text.startsWith('/help')) {
        const helpText = `<b>Доступные команды:</b>\n\n` +
          `/start — открыть главное меню и запустить магазин\n` +
          `/orders — посмотреть историю ваших заказов\n` +
          `/help — получить справку по командам`;
        await sendTelegramMessage(chatId, helpText);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in Telegram Webhook route:', error);
    return NextResponse.json({ success: true }); // Always return 200 to Telegram to prevent retry loops
  }
}

async function answerCallback(callbackQueryId: string, text: string, token: string) {
  try {
    await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        callback_query_id: callbackQueryId,
        text,
        show_alert: false,
      }),
    });
  } catch (err) {
    console.error('Error answering callback:', err);
  }
}
