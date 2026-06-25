import { put } from '@vercel/blob';
import fs from 'fs';
import path from 'path';

export async function uploadFile(file: File) {
  console.log("Blob token exists:", Boolean(process.env.BLOB_READ_WRITE_TOKEN));
  console.log("Storage provider:", process.env.STORAGE_PROVIDER);
  console.log("Node env:", process.env.NODE_ENV);

  const isProduction = process.env.NODE_ENV === "production";
  const hasBlobToken = Boolean(process.env.BLOB_READ_WRITE_TOKEN);

  if (isProduction) {
    if (!hasBlobToken) {
      throw new Error("Storage не настроен. Добавьте BLOB_READ_WRITE_TOKEN в Vercel ENV.");
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");

    const blob = await put(`uploads/${Date.now()}-${safeName}`, file, {
      access: "public",
    });

    return blob.url;
  }

  return uploadLocalFile(file);
}

// Local upload only for development (NODE_ENV !== "production")
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
