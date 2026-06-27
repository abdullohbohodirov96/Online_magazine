import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getStoreBySlug } from '@/lib/store/resolve-store';
import { getTelegramSettings, sendTelegramMessage, editTelegramMessage } from '@/lib/telegram/telegram-service';

export async function POST(request: Request, { params }: { params: Promise<{ storeSlug: string }> }) {
  try {
    const { storeSlug } = await params;
    const store = await getStoreBySlug(storeSlug);
    if (!store) {
      return NextResponse.json({ error: 'Магазин не найден' }, { status: 404 });
    }

    const settings = await getTelegramSettings(store.id);
    if (!settings.botToken) {
      return NextResponse.json({ error: 'Бот не настроен' }, { status: 500 });
    }

    // Secret header check
    const secretToken = request.headers.get('x-telegram-bot-api-secret-token');
    const localSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
    
    if (localSecret) {
      if (secretToken !== localSecret) {
        console.warn('Webhook security warning: invalid secret token received:', secretToken);
        return NextResponse.json({ error: 'Доступ запрещен: неверный secret token' }, { status: 403 });
      }
    }

    const payload = await request.json();
    console.log(`TELEGRAM WEBHOOK UPDATE FOR STORE ${store.name}:`, JSON.stringify(payload, null, 2));

    // 1. Handle Inline Button Callbacks (callback_query)
    if (payload.callback_query) {
      const callbackQuery = payload.callback_query;
      const data = callbackQuery.data || '';
      console.log("TELEGRAM CALLBACK DATA", data);
      
      const chatId = callbackQuery.message?.chat?.id;
      const messageId = callbackQuery.message?.message_id;

      if (data.startsWith('order:') && chatId && messageId) {
        const [_, action, orderId] = data.split(':');
        
        let newStatus: any;
        if (action === 'accept') newStatus = 'ACCEPTED';
        else if (action === 'delivery') newStatus = 'DELIVERING';
        else if (action === 'complete') newStatus = 'COMPLETED';
        else if (action === 'cancel') newStatus = 'CANCELLED';

        try {
          const statusNames: Record<string, string> = {
            NEW: 'Новый 🆕',
            ACCEPTED: 'Принят ✅',
            ASSEMBLING: 'Сборка 📦',
            DELIVERING: 'В пути 🚚',
            COMPLETED: 'Выполнен 🎉',
            CANCELLED: 'Отменен ❌',
          };

          if (orderId === 'test_order_id') {
            await answerCallback(
              callbackQuery.id,
              `[ТЕСТ] Статус тестового заказа изменен на: ${statusNames[newStatus] || newStatus}`,
              settings.botToken
            );
            
            const text = `🔔 <b>Тестовое сообщение от ${store.name} (Тестовый Заказ #TEST)</b>\n\n` +
              'Ваши настройки уведомлений Telegram успешно проверены и работают.\n\n' +
              `<b>[ТЕСТ] Статус изменен на: ${statusNames[newStatus] || newStatus}</b>`;
              
            const replyMarkup = {
              inline_keyboard: [
                [
                  { text: '✅ Принять', callback_data: 'order:accept:test_order_id' },
                  { text: '🚚 В доставку', callback_data: 'order:delivery:test_order_id' }
                ],
                [
                  { text: '🏁 Завершить', callback_data: 'order:complete:test_order_id' },
                  { text: '❌ Отменить', callback_data: 'order:cancel:test_order_id' }
                ]
              ]
            };
            
            await editTelegramMessage(String(chatId), messageId, text, replyMarkup, store.id);
            return NextResponse.json({ success: true });
          }

          const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: { items: true },
          });

          if (!order || order.storeId !== store.id) {
            await answerCallback(callbackQuery.id, 'Заказ не найден', settings.botToken);
            return NextResponse.json({ success: true });
          }

          // Update status in DB
          const updatedOrder = await prisma.order.update({
            where: { id: orderId },
            data: { status: newStatus },
            include: { items: true },
          });

          // Answer Telegram callback alert
          await answerCallback(
            callbackQuery.id,
            `Статус заказа #${order.id.slice(-6).toUpperCase()} изменен на: ${statusNames[newStatus] || newStatus}`,
            settings.botToken
          );

          // Edit message text
          const itemsText = updatedOrder.items.map((item, idx) => {
            return `${idx + 1}. ${item.productName} x ${item.quantity} — ${item.total.toLocaleString('ru-RU')} сум`;
          }).join('\n');

          let addressText = `📍 <b>Адрес:</b> ${updatedOrder.address}`;
          if (updatedOrder.latitude && updatedOrder.longitude) {
            const mapLink = `https://yandex.com/maps/?ll=${updatedOrder.longitude},${updatedOrder.latitude}&z=17&pt=${updatedOrder.longitude},${updatedOrder.latitude},pm2rdm`;
            addressText += `\n🗺 <b>Карта:</b> <a href="${mapLink}">Yandex Maps</a>`;
          }

          let deliveryDetails = '';
          if (updatedOrder.deliveryEntrance) deliveryDetails += `Подъезд: ${updatedOrder.deliveryEntrance} `;
          if (updatedOrder.deliveryFloor) deliveryDetails += `Этаж: ${updatedOrder.deliveryFloor} `;
          if (updatedOrder.deliveryApartment) deliveryDetails += `Кв: ${updatedOrder.deliveryApartment} `;
          if (updatedOrder.deliveryIntercom) deliveryDetails += `Домофон: ${updatedOrder.deliveryIntercom}`;

          if (deliveryDetails) {
            addressText += `\n📦 <b>Детали доставки:</b> ${deliveryDetails.trim()}`;
          }
          if (updatedOrder.addressComment) {
            addressText += `\n💬 <b>Уточнение адреса:</b> ${updatedOrder.addressComment}`;
          }

          const text = `🛒 <b>Новый заказ #${updatedOrder.id.slice(-6).toUpperCase()}</b>\n\n` +
            `👤 <b>Клиент:</b> ${updatedOrder.customerName}\n` +
            `📞 <b>Телефон:</b> ${updatedOrder.phone}\n` +
            `${addressText}\n` +
            `💬 <b>Комментарий:</b> ${updatedOrder.comment || 'нет'}\n\n` +
            `📦 <b>Товары:</b>\n${itemsText}\n\n` +
            `💰 <b>Итого:</b> <b>${updatedOrder.totalAmount.toLocaleString('ru-RU')} UZS</b>\n\n` +
            `<b>Статус:</b> ${statusNames[updatedOrder.status] || updatedOrder.status}`;

          const appUrl = process.env.NEXT_PUBLIC_APP_URL || settings.miniAppUrl;
          const replyMarkup = {
            inline_keyboard: [
              [
                { text: '✅ Принять', callback_data: `order:accept:${updatedOrder.id}` },
                { text: '🚚 В доставку', callback_data: `order:delivery:${updatedOrder.id}` }
              ],
              [
                { text: '🏁 Завершить', callback_data: `order:complete:${updatedOrder.id}` },
                { text: '❌ Отменить', callback_data: `order:cancel:${updatedOrder.id}` }
              ],
              [
                { text: '🔗 Открыть заказ', url: `${appUrl}/admin?orderId=${updatedOrder.id}` }
              ]
            ]
          };

          await editTelegramMessage(String(chatId), messageId, text, replyMarkup, store.id);

          // If the order came from a specific telegram user (checkout from telegram), notify them too!
          if (updatedOrder.telegramChatId) {
            const customerText = `🔔 <b>Статус вашего заказа #${updatedOrder.id.slice(-6).toUpperCase()} изменен!</b>\n\n` +
              `Новый status: <b>${statusNames[updatedOrder.status] || updatedOrder.status}</b>`;
            await sendTelegramMessage(updatedOrder.telegramChatId, customerText, undefined, store.id);
          }

        } catch (e: any) {
          console.error('Error handling callback:', e);
          await answerCallback(callbackQuery.id, 'Ошибка: ' + e.message, settings.botToken);
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
        const welcomeText = `<b>Добро пожаловать в ${store.name}!</b>\n\nУ нас вы можете заказать самые свежие продукты питания с быстрой доставкой на дом.`;
        const replyMarkup = {
          inline_keyboard: [
            [
              { text: '🛒 Открыть магазин', web_app: { url: `${settings.miniAppUrl}/miniapp/${store.slug}` } }
            ]
          ]
        };
        await sendTelegramMessage(chatId, welcomeText, replyMarkup, store.id);
      } else if (text.startsWith('/orders')) {
        const tgUser = await prisma.telegramUser.findUnique({
          where: { telegramId },
          include: { 
            user: { 
              include: { 
                orders: { 
                  where: { storeId: store.id },
                  orderBy: { createdAt: 'desc' }, 
                  take: 5 
                } 
              } 
            } 
          }
        });

        if (tgUser && tgUser.user && tgUser.user.orders.length > 0) {
          let ordersText = `<b>Ваши последние заказы в ${store.name}:</b>\n\n`;
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
            ordersText += `${i + 1}. Заказ <b>#${o.id.slice(-6).toUpperCase()}</b> от ${date}\n` +
              `   Сумма: ${o.totalAmount.toLocaleString('ru-RU')} сум\n` +
              `   Статус: ${statusNames[o.status] || o.status}\n\n`;
          });
          await sendTelegramMessage(chatId, ordersText, undefined, store.id);
        } else {
          const noOrdersText = 'У вас пока нет активных заказов или ваш профиль не привязан. Откройте магазин и оформите свой первый заказ!';
          const replyMarkup = {
            inline_keyboard: [
              [
                { text: '🛒 Перейти в магазин', web_app: { url: `${settings.miniAppUrl}/miniapp/${store.slug}` } }
              ]
            ]
          };
          await sendTelegramMessage(chatId, noOrdersText, replyMarkup, store.id);
        }
      } else if (text.startsWith('/help')) {
        const helpText = `<b>Доступные команды:</b>\n\n` +
          `/start — открыть главное меню и запустить магазин\n` +
          `/orders — посмотреть историю ваших заказов\n` +
          `/help — получить справку по командам`;
        await sendTelegramMessage(chatId, helpText, undefined, store.id);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in Telegram Webhook route:', error);
    return NextResponse.json({ success: true });
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
