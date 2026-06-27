import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { hashPassword } from '@/lib/auth/password';

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const { name, phone, password } = await request.json();

    const data: any = {};
    if (name !== undefined) data.name = name;
    
    if (phone !== undefined && phone.trim()) {
      const cleanPhone = phone.trim();
      if (cleanPhone !== user.phone) {
        // Check uniqueness
        const existing = await prisma.user.findUnique({
          where: { phone: cleanPhone },
        });
        if (existing) {
          return NextResponse.json({ error: 'Этот телефон уже используется' }, { status: 400 });
        }
        data.phone = cleanPhone;
      }
    }

    if (password !== undefined && password.trim()) {
      if (password.length < 6) {
        return NextResponse.json({ error: 'Пароль должен быть не менее 6 символов' }, { status: 400 });
      }
      data.passwordHash = await hashPassword(password);
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data,
    });

    return NextResponse.json({ success: true, user: { id: updated.id, name: updated.name, phone: updated.phone } });
  } catch (error: any) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: error.message || 'Ошибка сервера' }, { status: 500 });
  }
}
