import { NextResponse } from 'next/server';
import { getTelegramSettings } from '@/lib/telegram/telegram-service';
import { verifyAdminAccess } from '@/lib/store/security';

export async function POST(request: Request) {
  const { authorized, store } = await verifyAdminAccess(request);
  if (!authorized || !store) {
    return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
  }

  try {
    const settings = await getTelegramSettings(store.id);
    if (!settings.botToken) {
      return NextResponse.json({ error: 'Токен бота не настроен' }, { status: 400 });
    }
    if (!settings.miniAppUrl) {
      return NextResponse.json({ error: 'URL приложения (Mini App URL / NEXT_PUBLIC_APP_URL) не настроен' }, { status: 400 });
    }

    const webhookUrl = `${settings.miniAppUrl}/api/telegram/webhook/${store.slug}`;
    const secretToken = process.env.TELEGRAM_WEBHOOK_SECRET;

    let tgApiUrl = `https://api.telegram.org/bot${settings.botToken}/setWebhook?url=${encodeURIComponent(webhookUrl)}`;
    if (secretToken) {
      tgApiUrl += `&secret_token=${encodeURIComponent(secretToken)}`;
    }

    const response = await fetch(tgApiUrl);
    const data = await response.json();

    if (response.ok && data.ok) {
      return NextResponse.json({ success: true, message: `Вебхук для ${store.name} успешно установлен в Telegram: ${data.description}` });
    } else {
      return NextResponse.json({ error: 'Ошибка при установке вебхука: ' + (data.description || 'Неизвестная ошибка') }, { status: 500 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: 'Ошибка сервера: ' + (error.message || error) }, { status: 500 });
  }
}
