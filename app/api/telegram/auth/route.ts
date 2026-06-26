import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getTelegramSettings, verifyTelegramInitData } from '@/lib/telegram/telegram-service';
import { getCurrentUser, signJWT } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { initData } = await request.json();

    if (!initData) {
      return NextResponse.json({ error: 'initData обязателен' }, { status: 400 });
    }

    const settings = await getTelegramSettings();
    if (!settings.botToken) {
      return NextResponse.json({ error: 'Telegram-бот не настроен на сервере' }, { status: 500 });
    }

    // Verify signature
    const isValid = verifyTelegramInitData(initData, settings.botToken);
    if (!isValid) {
      return NextResponse.json({ error: 'Невалидная подпись Telegram initData' }, { status: 400 });
    }

    // Parse initData params
    const params = new URLSearchParams(initData);
    const userJson = params.get('user');
    if (!userJson) {
      return NextResponse.json({ error: 'Пользователь не найден в initData' }, { status: 400 });
    }

    const tgUserObj = JSON.parse(userJson);
    const telegramId = String(tgUserObj.id);

    // Get current logged-in web user (if any)
    const currentWebUser = await getCurrentUser();

    let tgUser = await prisma.telegramUser.findUnique({
      where: { telegramId },
      include: { user: true },
    });

    let resolvedUser = tgUser?.user || null;

    if (tgUser) {
      // 1. Telegram user exists
      let updateData: any = {
        username: tgUserObj.username || null,
        firstName: tgUserObj.first_name || null,
        lastName: tgUserObj.last_name || null,
        photoUrl: tgUserObj.photo_url || null,
        authDate: new Date(),
      };

      // Link to currently logged in web user if not linked yet
      if (!tgUser.userId && currentWebUser) {
        updateData.userId = currentWebUser.id;
        resolvedUser = currentWebUser;
      }

      tgUser = await prisma.telegramUser.update({
        where: { id: tgUser.id },
        data: updateData,
        include: { user: true },
      });
      if (!resolvedUser && tgUser.user) {
        resolvedUser = tgUser.user;
      }
    } else {
      // 2. Create new TelegramUser
      let userId = currentWebUser?.id || null;

      if (!userId) {
        // Create user with phone placeholder
        const phonePlaceholder = `tg_${telegramId}`;
        
        let user = await prisma.user.findUnique({
          where: { phone: phonePlaceholder },
        });

        if (!user) {
          user = await prisma.user.create({
            data: {
              phone: phonePlaceholder,
              name: [tgUserObj.first_name, tgUserObj.last_name].filter(Boolean).join(' ') || 'Покупатель Telegram',
              role: 'CUSTOMER',
            },
          });
        }
        userId = user.id;
        resolvedUser = user;
      } else {
        resolvedUser = currentWebUser;
      }

      tgUser = await prisma.telegramUser.create({
        data: {
          telegramId,
          userId,
          username: tgUserObj.username || null,
          firstName: tgUserObj.first_name || null,
          lastName: tgUserObj.last_name || null,
          photoUrl: tgUserObj.photo_url || null,
          authDate: new Date(),
        },
        include: { user: true },
      });
    }

    if (!resolvedUser) {
      return NextResponse.json({ error: 'Не удалось авторизовать пользователя' }, { status: 500 });
    }

    // Sign JWT and set cookie
    const token = await signJWT({
      userId: resolvedUser.id,
      phone: resolvedUser.phone,
      role: resolvedUser.role,
    });

    const isProd = process.env.NODE_ENV === 'production';
    const cookieStore = await cookies();
    cookieStore.set('auth_token', token, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    });

    return NextResponse.json({
      success: true,
      user: resolvedUser,
      telegramUser: tgUser,
    });
  } catch (error: any) {
    console.error('Error in telegram auth route:', error);
    return NextResponse.json({ error: error.message || 'Ошибка сервера при авторизации' }, { status: 500 });
  }
}
