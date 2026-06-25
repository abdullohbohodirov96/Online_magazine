import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { uploadImage } from '@/lib/storage/storage-service';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Файл не найден в запросе' }, { status: 400 });
    }

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Размер файла превышает допустимый лимит 5 МБ' }, { status: 400 });
    }

    // Validate type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Неподдерживаемый формат файла. Разрешены только JPG, PNG, WEBP' }, { status: 400 });
    }

    const url = await uploadImage(file);
    return NextResponse.json({ success: true, url });
  } catch (error: any) {
    console.error('Error in upload route:', error);
    return NextResponse.json({ error: error.message || 'Ошибка сервера при загрузке' }, { status: 500 });
  }
}
