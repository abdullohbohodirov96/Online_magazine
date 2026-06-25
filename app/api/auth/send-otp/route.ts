import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { phone } = await request.json();

    if (!phone) {
      return NextResponse.json({ error: 'Номер телефона обязателен' }, { status: 400 });
    }

    // Generate 4-digit code
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Save to DB
    await prisma.otpCode.create({
      data: {
        phone,
        code,
        expiresAt,
      },
    });

    // Mock SMS provider - log code to console
    console.log('\n======================================');
    console.log(`[SMS MOCK] Код для ${phone}: ${code}`);
    console.log('======================================\n');

    return NextResponse.json({ success: true, message: 'Код отправлен' });
  } catch (error: any) {
    console.error('Error sending OTP:', error);
    return NextResponse.json({ error: 'Ошибка сервера при отправке кода' }, { status: 500 });
  }
}
