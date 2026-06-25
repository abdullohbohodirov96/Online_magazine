import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendSms } from '@/lib/sms';

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

    // Send SMS via service abstraction (handles mock vs eskiz)
    const smsResult = await sendSms(phone, `BozorMarket: Ваш код подтверждения: ${code}`);

    if (!smsResult.success) {
      // Return clear error message to user if sending fails
      return NextResponse.json({ error: smsResult.error || 'Не удалось отправить SMS-код' }, { status: 500 });
    }

    // Mock mode also logs specifically
    if (process.env.SMS_PROVIDER !== 'eskiz') {
      console.log('\n======================================');
      console.log(`[SMS MOCK] Код для ${phone}: ${code}`);
      console.log('======================================\n');
    }

    return NextResponse.json({ success: true, message: 'Код отправлен' });
  } catch (error: any) {
    console.error('Error sending OTP:', error);
    return NextResponse.json({ error: 'Ошибка сервера при отправке кода' }, { status: 500 });
  }
}
