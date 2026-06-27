import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { uploadFile } from '@/lib/storage/storage-service';
import { put } from '@vercel/blob';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'STORE_OWNER' && user.role !== 'STORE_ADMIN' && user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    console.log("UPLOAD DEBUG TOKEN", {
      nodeEnv: process.env.NODE_ENV,
      storageProvider: process.env.STORAGE_PROVIDER,
      hasBlobReadWriteToken: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
    });

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Файл не найден в запросе' }, { status: 400 });
    }

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File hajmi 5MB dan katta' }, { status: 400 });
    }

    // Validate type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Faqat JPG, PNG, WEBP yuklash mumkin' }, { status: 400 });
    }

    const isProduction = process.env.NODE_ENV === 'production';
    if (isProduction) {
      if (!process.env.BLOB_READ_WRITE_TOKEN) {
        return NextResponse.json({ error: 'Vercel Blob token topilmadi. Vercel Environment Variables ichida BLOB_READ_WRITE_TOKEN qo‘shing va redeploy qiling.' }, { status: 500 });
      }

      const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const blob = await put(`uploads/${Date.now()}-${safeFileName}`, file, {
        access: 'public',
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });

      return NextResponse.json({ url: blob.url });
    }

    // In development, call uploadFile
    const url = await uploadFile(file);
    return NextResponse.json({ url });
  } catch (error: any) {
    console.error('Error in upload route:', error);
    return NextResponse.json({ error: error.message || 'Ошибка сервера при загрузке' }, { status: 500 });
  }
}
