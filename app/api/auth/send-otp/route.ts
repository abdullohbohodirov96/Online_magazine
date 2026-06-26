import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendOtpSms } from '@/lib/sms';

export async function POST(request: Request) {
  try {
    const { phone } = await request.json();

    if (!phone) {
      return NextResponse.json({ error: 'Номер телефона обязателен' }, { status: 400 });
    }

    // Normalize phone number (save in +9989... format)
    const rawPhone = phone.trim();
    const normalizedPhone = rawPhone.startsWith('+') 
      ? '+' + rawPhone.slice(1).replace(/\D/g, '') 
      : '+' + rawPhone.replace(/\D/g, '');

    // Generate 4-digit code
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Save to DB
    await prisma.otpCode.create({
      data: {
        phone: normalizedPhone,
        code,
        expiresAt,
      },
    });

    // Send OTP SMS
    try {
      await sendOtpSms(normalizedPhone, code);
    } catch (err) {
      console.error("SMS sending failed:", err);
      return NextResponse.json(
        { error: "SMS yuborishda xatolik. Keyinroq urinib ko‘ring." },
        { status: 500 }
      );
    }

    // Mock state logging
    if (process.env.SMS_PROVIDER !== 'eskiz') {
      console.log(`OTP code for ${normalizedPhone}: ${code}`);
    }

    return NextResponse.json({ success: true, message: 'Код отправлен' });
  } catch (error: any) {
    console.error('Error sending OTP:', error);
    return NextResponse.json({ error: 'Ошибка сервера при отправке кода' }, { status: 500 });
  }
}
