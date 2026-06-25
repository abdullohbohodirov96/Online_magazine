import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('auth_token');
    return NextResponse.json({ success: true, message: 'Вышли из системы' });
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
