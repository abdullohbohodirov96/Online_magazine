import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { signJWT } from '@/lib/auth';
import { verifyPassword } from '@/lib/auth/password';
import { normalizePhone } from '@/lib/phone/normalize-phone';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { phone, password } = await request.json();

    if (!phone || !password) {
      return NextResponse.json({ error: 'Telefon raqam va parol kiritilishi shart' }, { status: 400 });
    }

    const normalizedPhone = normalizePhone(phone);

    // Find user
    const user = await prisma.user.findUnique({
      where: { phone: normalizedPhone }
    });

    if (!user) {
      return NextResponse.json({ error: 'Telefon raqam yoki parol noto‘g‘ri' }, { status: 400 });
    }

    if (!user.passwordHash) {
      return NextResponse.json({
        error: 'Bu account parol bilan ro‘yxatdan o‘tmagan. Parol tiklash yoki OTP orqali kirishni ishlating.'
      }, { status: 400 });
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.passwordHash);

    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Telefon raqam yoki parol noto‘g‘ri' }, { status: 400 });
    }

    // Sign JWT
    const token = await signJWT({
      userId: user.id,
      phone: user.phone,
      role: user.role,
    });

    // Set cookie
    const isProd = process.env.NODE_ENV === 'production';
    const cookieStore = await cookies();
    cookieStore.set('auth_token', token, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
    });

    // Exclude passwordHash from response
    const { passwordHash: _, ...userWithoutPassword } = user;

    return NextResponse.json({
      success: true,
      user: userWithoutPassword
    });
  } catch (error: any) {
    console.error('Error during login:', error);
    return NextResponse.json({ error: 'Ошибка сервера при входе' }, { status: 500 });
  }
}
