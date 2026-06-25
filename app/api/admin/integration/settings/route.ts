import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

async function checkAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'ADMIN') {
    return false;
  }
  return true;
}

export async function GET() {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
  }

  try {
    let settings = await prisma.integrationSettings.findFirst();
    if (!settings) {
      settings = await prisma.integrationSettings.create({
        data: {
          integrationEnabled: false,
          integrationMode: 'disabled',
        },
      });
    }
    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
  }

  try {
    const data = await request.json();
    let settings = await prisma.integrationSettings.findFirst();

    const payload = {
      integrationEnabled: data.integrationEnabled ?? false,
      integrationMode: data.integrationMode ?? 'disabled',
      integrationApiUrl: data.integrationApiUrl || null,
      integrationApiKey: data.integrationApiKey || null,
      autoUpdatePrices: data.autoUpdatePrices ?? true,
      autoUpdateStock: data.autoUpdateStock ?? true,
      syncIntervalMinutes: Number(data.syncIntervalMinutes ?? 5),
      providerName: data.providerName || null,
      providerType: data.providerType || 'manual_json',
      authType: data.authType || 'none',
      requestMethod: data.requestMethod || 'GET',
      productsEndpoint: data.productsEndpoint || null,
      ordersEndpoint: data.ordersEndpoint || null,
      priceFieldMapping: data.priceFieldMapping || null,
      stockFieldMapping: data.stockFieldMapping || null,
      fieldMapping: data.fieldMapping || null,
      isConnected: data.isConnected ?? false,
      syncStatus: data.syncStatus || null,
      syncErrorMessage: data.syncErrorMessage || null,
    };

    if (!settings) {
      settings = await prisma.integrationSettings.create({
        data: payload,
      });
    } else {
      settings = await prisma.integrationSettings.update({
        where: { id: settings.id },
        data: payload,
      });
    }

    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
