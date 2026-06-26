import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    const token = process.env.BLOB_READ_WRITE_TOKEN;

    return NextResponse.json({
      nodeEnv: process.env.NODE_ENV,
      storageProvider: process.env.STORAGE_PROVIDER || null,
      hasBlobReadWriteToken: Boolean(token),
      blobTokenPrefix: token ? token.slice(0, 15) : null
    });
  } catch (error: any) {
    console.error('Error in debug route:', error);
    return NextResponse.json({ error: error.message || 'Ошибка сервера' }, { status: 500 });
  }
}
