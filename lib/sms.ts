export interface SmsResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

let cachedToken: string | null = null;
let tokenExpiresAt: number | null = null;

async function getEskizToken(): Promise<string> {
  if (cachedToken && tokenExpiresAt && Date.now() < tokenExpiresAt) {
    return cachedToken;
  }

  const email = process.env.ESKIZ_EMAIL;
  const password = process.env.ESKIZ_PASSWORD;

  if (!email || !password) {
    throw new Error('Пропущены настройки Eskiz (ESKIZ_EMAIL, ESKIZ_PASSWORD) в переменных окружения.');
  }

  const response = await fetch('https://notify.eskiz.uz/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Ошибка авторизации Eskiz: ${response.statusText} (${errText})`);
  }

  const data = await response.json();
  const token = data?.data?.token || data?.token;

  if (!token) {
    throw new Error(`Токен Eskiz не найден в ответе авторизации: ${JSON.stringify(data)}`);
  }

  cachedToken = token;
  tokenExpiresAt = Date.now() + 25 * 24 * 60 * 60 * 1000;

  return token;
}

export async function sendSms(phone: string, message: string): Promise<SmsResult> {
  const provider = process.env.SMS_PROVIDER || 'mock';

  console.log(`\n--- [SMS SERVICE] Отправка сообщения на ${phone} ---`);
  console.log(`Сообщение: ${message}`);
  console.log(`Провайдер: ${provider}`);
  console.log(`-----------------------------------------------\n`);

  if (provider === 'mock') {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return { success: true, messageId: 'mock-id-' + Math.random().toString(36).slice(2) };
  }

  if (provider === 'eskiz') {
    try {
      const from = process.env.ESKIZ_FROM || '4546';
      const normalizedPhone = phone.replace(/^\+/, '').trim();

      const token = await getEskizToken();

      const response = await fetch('https://notify.eskiz.uz/api/message/sms/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          mobile_phone: normalizedPhone,
          message: message,
          from: from,
        }),
      });

      if (response.status === 401) {
        cachedToken = null;
        tokenExpiresAt = null;
        
        const newToken = await getEskizToken();
        const retryResponse = await fetch('https://notify.eskiz.uz/api/message/sms/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${newToken}`,
          },
          body: JSON.stringify({
            mobile_phone: normalizedPhone,
            message: message,
            from: from,
          }),
        });

        if (!retryResponse.ok) {
          const errText = await retryResponse.text();
          return { success: false, error: `Eskiz API Error after retry: ${retryResponse.statusText} (${errText})` };
        }

        const retryData = await retryResponse.json();
        return { success: true, messageId: retryData?.id || retryData?.message_id };
      }

      if (!response.ok) {
        const errText = await response.text();
        return { success: false, error: `Eskiz API Error: ${response.statusText} (${errText})` };
      }

      const data = await response.json();
      return { success: true, messageId: data?.id || data?.message_id };
    } catch (e: any) {
      console.error('Eskiz send SMS failed:', e);
      return { success: false, error: e.message || 'Ошибка подключения к Eskiz API' };
    }
  }

  return { success: false, error: `Неподдерживаемый провайдер SMS: ${provider}` };
}
