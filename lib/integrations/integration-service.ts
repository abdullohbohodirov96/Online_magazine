import { prisma } from '../db';

export interface IntegrationSettings {
  integrationEnabled: boolean;
  integrationMode: string;
  integrationApiUrl: string | null;
  integrationApiKey: string | null;
  autoUpdatePrices: boolean;
  autoUpdateStock: boolean;
  syncIntervalMinutes: number;
  providerName: string | null;
  providerType: string;
  authType: string;
  requestMethod: string;
  productsEndpoint: string | null;
  ordersEndpoint: string | null;
  priceFieldMapping: any;
  stockFieldMapping: any;
  fieldMapping: any;
}

function getValueByPath(obj: any, path: string | null | undefined, defaultKey: string) {
  if (!path) {
    return obj[defaultKey];
  }
  const parts = path.split('.');
  let current = obj;
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    current = current[part];
  }
  return current;
}

export function getAuthHeaders(authType: string, apiKey: string | null): Record<string, string> {
  const headers: Record<string, string> = {};
  if (!apiKey) return headers;

  if (authType === 'api_key') {
    headers['x-api-key'] = apiKey;
  } else if (authType === 'bearer_token') {
    headers['Authorization'] = `Bearer ${apiKey}`;
  } else if (authType === 'basic_auth') {
    // If it contains colon, base64 encode it. Else assume already encoded.
    if (apiKey.includes(':')) {
      const base64 = Buffer.from(apiKey).toString('base64');
      headers['Authorization'] = `Basic ${base64}`;
    } else {
      headers['Authorization'] = `Basic ${apiKey}`;
    }
  }
  return headers;
}

export async function testConnection(settings: IntegrationSettings): Promise<{ success: boolean; message: string }> {
  if (!settings.integrationApiUrl) {
    return { success: false, message: 'URL API не настроен' };
  }

  const url = settings.integrationApiUrl;
  const headers = getAuthHeaders(settings.authType, settings.integrationApiKey);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(url, {
      method: 'GET',
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      return { success: true, message: `Соединение успешно установлено. Статус: ${response.status}` };
    } else {
      return { success: false, message: `Ошибка ответа сервера: ${response.status} ${response.statusText}` };
    }
  } catch (error: any) {
    return { success: false, message: `Ошибка соединения: ${error.message || error}` };
  }
}

export async function fetchExternalProducts(settings: IntegrationSettings): Promise<any[]> {
  if (!settings.integrationApiUrl) {
    throw new Error('URL API не настроен');
  }

  let fullUrl = settings.integrationApiUrl;
  if (settings.productsEndpoint) {
    if (fullUrl.endsWith('/') && settings.productsEndpoint.startsWith('/')) {
      fullUrl = fullUrl + settings.productsEndpoint.slice(1);
    } else if (!fullUrl.endsWith('/') && !settings.productsEndpoint.startsWith('/')) {
      fullUrl = fullUrl + '/' + settings.productsEndpoint;
    } else {
      fullUrl = fullUrl + settings.productsEndpoint;
    }
  }

  const headers = getAuthHeaders(settings.authType, settings.integrationApiKey);
  headers['Accept'] = 'application/json, text/csv';

  const response = await fetch(fullUrl, {
    method: settings.requestMethod || 'GET',
    headers,
  });

  if (!response.ok) {
    throw new Error(`Не удалось загрузить товары: ${response.status} ${response.statusText}`);
  }

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('csv') || fullUrl.endsWith('.csv')) {
    const text = await response.text();
    return parseCsv(text);
  }

  return await response.json();
}

function parseCsv(csvText: string): any[] {
  const lines = csvText.split(/\r?\n/);
  if (lines.length === 0) return [];
  
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const result = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    const obj: any = {};
    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = values[j];
    }
    result.push(obj);
  }
  return result;
}

export function normalizeExternalProduct(rawProduct: any, mapping: any): any {
  const defaultMapping = {
    barcode: 'barcode',
    nomenclatureCode: 'nomenclatureCode',
    name: 'name',
    price: 'price',
    stock: 'stock',
    unit: 'unit',
    categoryName: 'categoryName',
  };

  const map = { ...defaultMapping, ...(mapping || {}) };

  const barcode = getValueByPath(rawProduct, map.barcode, 'barcode');
  const nomenclatureCode = getValueByPath(rawProduct, map.nomenclatureCode, 'nomenclatureCode');
  const name = getValueByPath(rawProduct, map.name, 'name');
  const price = getValueByPath(rawProduct, map.price, 'price');
  const stock = getValueByPath(rawProduct, map.stock, 'stock');
  const unit = getValueByPath(rawProduct, map.unit, 'unit');
  const categoryName = getValueByPath(rawProduct, map.categoryName, 'categoryName');

  return {
    barcode: barcode ? String(barcode) : null,
    nomenclatureCode: nomenclatureCode ? String(nomenclatureCode) : null,
    name: name ? String(name) : 'Без названия',
    price: price !== undefined && price !== null ? Number(price) : 0,
    stock: stock !== undefined && stock !== null ? Number(stock) : 0,
    unit: unit ? String(unit) : 'шт',
    categoryName: categoryName ? String(categoryName) : null,
  };
}

export async function syncProducts(settings: IntegrationSettings, rawProducts?: any[]): Promise<{
  success: boolean;
  message: string;
  added: number;
  updated: number;
  shopUpdated: number;
}> {
  try {
    const productsArray = rawProducts || await fetchExternalProducts(settings);

    if (!Array.isArray(productsArray)) {
      throw new Error('Неверный формат данных, ожидается массив товаров');
    }

    let extCreated = 0;
    let extUpdated = 0;
    let shopUpdated = 0;

    const autoPrice = settings.autoUpdatePrices;
    const autoStock = settings.autoUpdateStock;
    const mapping = settings.fieldMapping;

    for (const item of productsArray) {
      const norm = normalizeExternalProduct(item, mapping);

      if (!norm.name || norm.price === undefined || norm.stock === undefined) {
        continue; // Skip invalid products
      }

      let externalProduct = null;

      if (norm.barcode) {
        externalProduct = await prisma.externalProduct.findUnique({
          where: { barcode: norm.barcode },
        });
      }

      if (!externalProduct && norm.nomenclatureCode) {
        externalProduct = await prisma.externalProduct.findUnique({
          where: { nomenclatureCode: norm.nomenclatureCode },
        });
      }

      if (externalProduct) {
        externalProduct = await prisma.externalProduct.update({
          where: { id: externalProduct.id },
          data: {
            name: norm.name,
            price: norm.price,
            stock: norm.stock,
            unit: norm.unit,
            categoryName: norm.categoryName,
            lastSyncedAt: new Date(),
            rawData: item,
          },
        });
        extUpdated++;
      } else {
        externalProduct = await prisma.externalProduct.create({
          data: {
            barcode: norm.barcode,
            nomenclatureCode: norm.nomenclatureCode,
            name: norm.name,
            price: norm.price,
            stock: norm.stock,
            unit: norm.unit,
            categoryName: norm.categoryName,
            lastSyncedAt: new Date(),
            rawData: item,
          },
        });
        extCreated++;
      }

      // Link products
      const linkedProducts = await prisma.product.findMany({
        where: {
          OR: [
            { externalProductId: externalProduct.id },
            {
              source: 'integration',
              OR: [
                norm.barcode ? { barcode: norm.barcode } : {},
                norm.nomenclatureCode ? { nomenclatureCode: norm.nomenclatureCode } : {},
              ].filter(o => Object.keys(o).length > 0),
            },
          ],
        },
      });

      for (const prod of linkedProducts) {
        const updateData: any = {};

        if (!prod.externalProductId) {
          updateData.externalProductId = externalProduct.id;
        }

        if (prod.syncPrice && autoPrice) {
          updateData.price = norm.price;
        }
        if (prod.syncStock && autoStock) {
          updateData.stock = norm.stock;
        }

        if (Object.keys(updateData).length > 0) {
          await prisma.product.update({
            where: { id: prod.id },
            data: updateData,
          });
          shopUpdated++;
        }
      }
    }

    const message = `Синхронизация успешна. Получено: ${productsArray.length}. Добавлено внешних: ${extCreated}, обновлено внешних: ${extUpdated}. На сайте обновлено: ${shopUpdated}.`;

    await prisma.integrationLog.create({
      data: {
        type: 'EXTERNAL_PRODUCTS_SYNC',
        status: 'SUCCESS',
        message,
      },
    });

    return {
      success: true,
      message,
      added: extCreated,
      updated: extUpdated,
      shopUpdated,
    };
  } catch (error: any) {
    const errMessage = error.message || 'Неизвестная ошибка при синхронизации';
    await prisma.integrationLog.create({
      data: {
        type: 'EXTERNAL_PRODUCTS_SYNC',
        status: 'ERROR',
        message: `Ошибка: ${errMessage}`,
      },
    });
    throw error;
  }
}

export async function sendOrderToExternalProgram(order: any, settings: IntegrationSettings): Promise<{ success: boolean; response?: any }> {
  if (!settings.ordersEndpoint || !settings.integrationApiUrl) {
    return { success: false };
  }

  let fullUrl = settings.integrationApiUrl;
  if (settings.ordersEndpoint) {
    if (fullUrl.endsWith('/') && settings.ordersEndpoint.startsWith('/')) {
      fullUrl = fullUrl + settings.ordersEndpoint.slice(1);
    } else if (!fullUrl.endsWith('/') && !settings.ordersEndpoint.startsWith('/')) {
      fullUrl = fullUrl + '/' + settings.ordersEndpoint;
    } else {
      fullUrl = fullUrl + settings.ordersEndpoint;
    }
  }

  const headers = getAuthHeaders(settings.authType, settings.integrationApiKey);
  headers['Content-Type'] = 'application/json';

  try {
    const response = await fetch(fullUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(order),
    });

    if (response.ok) {
      const data = await response.json().catch(() => ({}));
      return { success: true, response: data };
    } else {
      console.error(`Failed to send order to external system: ${response.status} ${response.statusText}`);
      return { success: false };
    }
  } catch (err) {
    console.error('Error sending order to external system:', err);
    return { success: false };
  }
}
