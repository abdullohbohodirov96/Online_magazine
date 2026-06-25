import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { sendTelegramMessage, getTelegramSettings } from '@/lib/telegram/telegram-service';

async function checkAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'ADMIN') {
    return false;
  }
  return true;
}

export async function POST() {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
  }

  try {
    const settings = await getTelegramSettings();
    if (!settings.adminChatId) {
      return NextResponse.json({ error: 'ID чата администратора не настроен' }, { status: 400 });
    }

    const testText = '🔔 <b>Тестовое сообщение от BozorMarket!</b>\n\n' +
      'Ваши настройки уведомлений Telegram успешно проверены и работают.';

    const success = await sendTelegramMessage(settings.adminChatId, testText);

    if (success) {
      return NextResponse.json({ success: true, message: 'Тестовое сообщение успешно отправлено!' });
    } else {
      return NextResponse.json({ error: 'Не удалось отправить сообщение. Проверьте токен бота и ID чата.' }, { status: 500 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: 'Ошибка сервера: ' + (error.message || error) }, { status: 500 });
  }
}
