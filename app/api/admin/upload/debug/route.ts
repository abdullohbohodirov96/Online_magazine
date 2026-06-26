import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    return NextResponse.json({
      nodeEnv: process.env.NODE_ENV,
      storageProvider: process.env.STORAGE_PROVIDER || null,
      hasBlobReadWriteToken: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
      hasBlobStoreId: Boolean(process.env.BLOB_STORE_ID),
      hasBlobWebhookPublicKey: Boolean(process.env.BLOB_WEBHOOK_PUBLIC_KEY)
    });
  } catch (error: any) {
    console.error('Error in debug route:', error);
    return NextResponse.json({ error: error.message || 'Ошибка сервера' }, { status: 500 });
  }
}
