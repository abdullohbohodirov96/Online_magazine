import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { signJWT } from '@/lib/auth';
import { hashPassword } from '@/lib/auth/password';
import { normalizePhone } from '@/lib/phone/normalize-phone';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { name, phone, password } = await request.json();

    if (!phone || !password) {
      return NextResponse.json({ error: 'Telefon raqam va parol kiritilishi shart' }, { status: 400 });
    }

    const normalizedPhone = normalizePhone(phone);

    if (password.length < 6) {
      return NextResponse.json({ error: 'Parol kamida 6 ta belgidan iborat bo‘lishi kerak' }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { phone: normalizedPhone }
    });

    if (existingUser) {
      return NextResponse.json({ error: 'Bu raqam bilan account allaqachon ochilgan' }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        phone: normalizedPhone,
        name: name?.trim() || null,
        passwordHash,
        role: 'CUSTOMER'
      }
    });

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
    console.error('Error during registration:', error);
    return NextResponse.json({ error: 'Ошибка сервера при регистрации' }, { status: 500 });
  }
}
