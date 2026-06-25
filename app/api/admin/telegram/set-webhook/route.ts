import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getTelegramSettings } from '@/lib/telegram/telegram-service';

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
    if (!settings.botToken) {
      return NextResponse.json({ error: 'Токен бота не настроен' }, { status: 400 });
    }
    if (!settings.miniAppUrl) {
      return NextResponse.json({ error: 'URL приложения (Mini App URL / NEXT_PUBLIC_APP_URL) не настроен' }, { status: 400 });
    }

    const webhookUrl = `${settings.miniAppUrl}/api/telegram/webhook`;
    const secretToken = process.env.TELEGRAM_WEBHOOK_SECRET || 'secret';

    const tgApiUrl = `https://api.telegram.org/bot${settings.botToken}/setWebhook?url=${encodeURIComponent(webhookUrl)}&secret_token=${secretToken}`;

    const response = await fetch(tgApiUrl);
    const data = await response.json();

    if (response.ok && data.ok) {
      return NextResponse.json({ success: true, message: 'Вебхук успешно установлен в Telegram: ' + data.description });
    } else {
      return NextResponse.json({ error: 'Ошибка при установке вебхука: ' + (data.description || 'Неизвестная ошибка') }, { status: 500 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: 'Ошибка сервера: ' + (error.message || error) }, { status: 500 });
  }
}
