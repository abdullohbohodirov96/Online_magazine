import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { signJWT } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { phone, code } = await request.json();

    if (!phone || !code) {
      return NextResponse.json({ error: 'Телефон и код обязательны' }, { status: 400 });
    }

    // Find valid OTP
    const otp = await prisma.otpCode.findFirst({
      where: {
        phone,
        code,
        isUsed: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otp) {
      return NextResponse.json({ error: 'Неверный или просроченный код' }, { status: 400 });
    }

    // Mark as used
    await prisma.otpCode.update({
      where: { id: otp.id },
      data: { isUsed: true },
    });

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { phone },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          phone,
          role: 'CUSTOMER',
        },
      });
    }

    // Sign JWT
    const token = await signJWT({
      userId: user.id,
      phone: user.phone,
      role: user.role,
    });

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    console.error('Error verifying OTP:', error);
    return NextResponse.json({ error: 'Ошибка сервера при проверке кода' }, { status: 500 });
  }
}
