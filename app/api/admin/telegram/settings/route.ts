import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAdminAccess } from '@/lib/store/security';

export async function GET(request: Request) {
  const { authorized, store } = await verifyAdminAccess(request);
  if (!authorized || !store) {
    return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
  }

  try {
    let settings = await prisma.telegramSettings.findUnique({
      where: { storeId: store.id },
    });
    if (!settings) {
      settings = await prisma.telegramSettings.create({
        data: {
          storeId: store.id,
          botToken: null,
          adminChatId: null,
          notificationsEnabled: true,
          botUsername: null,
          miniAppUrl: null,
        },
      });
    }

    // Mask botToken
    let maskedToken = '';
    if (settings.botToken) {
      const parts = settings.botToken.split(':');
      if (parts.length > 1) {
        maskedToken = `${parts[0]}:${parts[1].slice(0, 3)}...${parts[1].slice(-3)}`;
      } else {
        maskedToken = `${settings.botToken.slice(0, 5)}...${settings.botToken.slice(-5)}`;
      }
    }

    return NextResponse.json({
      settings: {
        ...settings,
        botToken: maskedToken,
      }
    });
  } catch (error) {
    console.error('Error fetching Telegram settings:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const { authorized, store } = await verifyAdminAccess(request);
  if (!authorized || !store) {
    return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
  }

  try {
    const data = await request.json();
    let settings = await prisma.telegramSettings.findUnique({
      where: { storeId: store.id },
    });

    let updatedToken = data.botToken;
    // If token is masked, do not update it
    if (updatedToken && (updatedToken.includes('...') || updatedToken === '')) {
      updatedToken = settings?.botToken || null;
    }

    const payload = {
      botToken: updatedToken || null,
      adminChatId: data.adminChatId || null,
      notificationsEnabled: data.notificationsEnabled ?? true,
      botUsername: data.botUsername || null,
      miniAppUrl: data.miniAppUrl || null,
    };

    if (!settings) {
      settings = await prisma.telegramSettings.create({
        data: {
          ...payload,
          storeId: store.id,
        },
      });
    } else {
      settings = await prisma.telegramSettings.update({
        where: { storeId: store.id },
        data: payload,
      });
    }

    // Automatically set Telegram webhook in background if botToken and miniAppUrl are configured
    if (payload.botToken && payload.miniAppUrl) {
      try {
        const webhookUrl = `${payload.miniAppUrl.replace(/\/$/, '')}/api/telegram/webhook/${store.slug}`;
        const secretToken = process.env.TELEGRAM_WEBHOOK_SECRET;
        let tgApiUrl = `https://api.telegram.org/bot${payload.botToken}/setWebhook?url=${encodeURIComponent(webhookUrl)}`;
        if (secretToken) {
          tgApiUrl += `&secret_token=${encodeURIComponent(secretToken)}`;
        }
        const tgRes = await fetch(tgApiUrl);
        const tgData = await tgRes.json();
        console.log('Auto webhook set result:', tgData);
      } catch (err) {
        console.error('Failed to auto-set telegram webhook in settings put:', err);
      }
    }

    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error('Error updating Telegram settings:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
