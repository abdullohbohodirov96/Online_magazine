import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAdminAccess } from '@/lib/store/security';

export async function GET(request: Request) {
  const { authorized, store } = await verifyAdminAccess(request);
  if (!authorized || !store) {
    return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
  }

  try {
    let settings = await prisma.integrationSettings.findUnique({
      where: { storeId: store.id },
    });
    if (!settings) {
      settings = await prisma.integrationSettings.create({
        data: {
          storeId: store.id,
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
  const { authorized, store } = await verifyAdminAccess(request);
  if (!authorized || !store) {
    return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
  }

  try {
    const data = await request.json();
    let settings = await prisma.integrationSettings.findUnique({
      where: { storeId: store.id },
    });

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
        data: {
          ...payload,
          storeId: store.id,
        },
      });
    } else {
      settings = await prisma.integrationSettings.update({
        where: { storeId: store.id },
        data: payload,
      });
    }

    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
