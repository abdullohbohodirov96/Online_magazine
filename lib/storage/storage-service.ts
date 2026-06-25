import { put } from '@vercel/blob';
import fs from 'fs';
import path from 'path';

export async function uploadImage(file: File): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const originalFilename = file.name || 'image.jpg';
  const extension = path.extname(originalFilename) || '.webp';
  const filename = `${Date.now()}-${Math.floor(Math.random() * 100000)}${extension}`;

  // 1. Vercel Blob storage (Production preferred)
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const blobResult = await put(filename, buffer, {
        access: 'public',
        contentType: file.type,
      });
      return blobResult.url;
    } catch (error) {
      console.error('Error uploading to Vercel Blob:', error);
      throw new Error('Ошибка при загрузке в Vercel Blob: ' + (error instanceof Error ? error.message : String(error)));
    }
  }

  // 2. Local fallback storage (Development default)
  try {
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filepath = path.join(uploadDir, filename);
    fs.writeFileSync(filepath, buffer);

    return `/uploads/${filename}`;
  } catch (error) {
    console.error('Error saving file locally:', error);
    throw new Error('Ошибка при сохранении файла локально: ' + (error instanceof Error ? error.message : String(error)));
  }
}
