import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { signJWT, getCurrentUser } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { phone, code } = await request.json();

    if (!phone || !code) {
      return NextResponse.json({ error: 'Телефон и код обязательны' }, { status: 400 });
    }

    const cleanPhone = phone.trim();
    const cleanCode = code.trim();

    // Verify OTP code exists and is not used
    const otp = await prisma.otpCode.findFirst({
      where: {
        phone: cleanPhone,
        code: cleanCode,
        isUsed: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otp) {
      return NextResponse.json({ error: 'Неверный или просроченный SMS-код' }, { status: 400 });
    }

    // Mark as used
    await prisma.otpCode.update({
      where: { id: otp.id },
      data: { isUsed: true },
    });

    // Check if we have a placeholder Telegram user session currently logged in
    const currentWebUser = await getCurrentUser();

    let user = await prisma.user.findUnique({
      where: { phone: cleanPhone },
    });

    if (currentWebUser && currentWebUser.phone.startsWith('tg_')) {
      // Current session is a placeholder user
      if (user) {
        // Real user already exists. We bind the TelegramUser of the placeholder user to this real user.
        const tgUser = await prisma.telegramUser.findUnique({
          where: { userId: currentWebUser.id }
        });
        if (tgUser) {
          // Delete any existing link on the destination user to avoid unique constraint violation
          await prisma.telegramUser.deleteMany({
            where: { userId: user.id }
          });

          await prisma.telegramUser.update({
            where: { id: tgUser.id },
            data: { userId: user.id }
          });

          // Clean up the placeholder user
          try {
            await prisma.user.delete({ where: { id: currentWebUser.id } });
          } catch (e) {
            console.error('Failed to delete placeholder user:', e);
          }
        }
      } else {
        // Real user doesn't exist, we can just update the placeholder user's phone to the real phone.
        user = await prisma.user.update({
          where: { id: currentWebUser.id },
          data: { phone: cleanPhone }
        });
      }
    } else {
      // Normal flow (no placeholder user session)
      if (!user) {
        user = await prisma.user.create({
          data: {
            phone: cleanPhone,
            role: 'CUSTOMER',
          },
        });
      }
    }

    // Sign JWT
    const token = await signJWT({
      userId: user.id,
      phone: user.phone,
      role: user.role,
    });

    // Set cookie (30 days SameSite: 'none' inside iframe environments)
    const isProd = process.env.NODE_ENV === 'production';
    const cookieStore = await cookies();
    cookieStore.set('auth_token', token, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    });

    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    console.error('Error verifying OTP:', error);
    return NextResponse.json({ error: 'Ошибка сервера при проверке кода' }, { status: 500 });
  }
}
