import { NextResponse } from 'next/server';
import { sendTelegramMessage, getTelegramSettings } from '@/lib/telegram/telegram-service';
import { verifyAdminAccess } from '@/lib/store/security';

export async function POST(request: Request) {
  const { authorized, store } = await verifyAdminAccess(request);
  if (!authorized || !store) {
    return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
  }

  try {
    const settings = await getTelegramSettings(store.id);
    if (!settings.adminChatId) {
      return NextResponse.json({ error: 'ID чата администратора не настроен' }, { status: 400 });
    }

    const testText = `🔔 <b>Тестовое сообщение от ${store.name} (Тестовый Заказ #TEST)</b>\n\n` +
      'Ваши настройки уведомлений Telegram успешно проверены и работают.\n\n' +
      'Ниже представлены тестовые кнопки для проверки изменения статуса:';

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

    const success = await sendTelegramMessage(settings.adminChatId, testText, replyMarkup, store.id);

    if (success) {
      return NextResponse.json({ success: true, message: 'Тестовое сообщение успешно отправлено!' });
    } else {
      return NextResponse.json({ error: 'Не удалось отправить сообщение. Проверьте токен бота и ID чата.' }, { status: 500 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: 'Ошибка сервера: ' + (error.message || error) }, { status: 500 });
  }
}
