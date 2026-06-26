import { put } from '@vercel/blob';
import fs from 'fs';
import path from 'path';

export async function uploadFile(file: File): Promise<string> {
  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction) {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      throw new Error("BLOB_READ_WRITE_TOKEN topilmadi. Vercel Environment Variables ichida BLOB_READ_WRITE_TOKEN qo‘shing va redeploy qiling.");
    }

    const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const blob = await put(`uploads/${Date.now()}-${safeFileName}`, file, {
      access: "public",
    });

    return blob.url;
  }

  return uploadLocalFile(file);
}

// Local upload only for development
async function uploadLocalFile(file: File): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const originalFilename = file.name || 'image.jpg';
  const extension = path.extname(originalFilename) || '.webp';
  const filename = `${Date.now()}-${Math.floor(Math.random() * 100000)}${extension}`;

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
