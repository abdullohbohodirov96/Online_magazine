import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const { name } = await request.json();
    if (name === undefined) {
      return NextResponse.json({ error: 'Имя не указано' }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { name },
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
