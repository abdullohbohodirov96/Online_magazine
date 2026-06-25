import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

async function checkAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'ADMIN') {
    return false;
  }
  return true;
}

export async function GET() {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
  }

  try {
    let settings = await prisma.telegramSettings.findFirst();
    if (!settings) {
      settings = await prisma.telegramSettings.create({
        data: {
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
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
  }

  try {
    const data = await request.json();
    let settings = await prisma.telegramSettings.findFirst();

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
        data: payload,
      });
    } else {
      settings = await prisma.telegramSettings.update({
        where: { id: settings.id },
        data: payload,
      });
    }

    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error('Error updating Telegram settings:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
