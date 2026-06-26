let cachedEskizToken: string | null = null;
let cachedEskizTokenExpiresAt: number = 0;

async function getEskizToken(): Promise<string> {
  const email = process.env.ESKIZ_EMAIL;
  const password = process.env.ESKIZ_PASSWORD;

  if (!email || !password) {
    throw new Error("Eskiz SMS sozlamalari to‘liq emas");
  }

  if (cachedEskizToken && cachedEskizTokenExpiresAt > Date.now()) {
    return cachedEskizToken;
  }

  console.log("ESKIZ SMS: Requesting new token...");
  const response = await fetch("https://notify.eskiz.uz/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Eskiz Auth Error: ${response.status} ${response.statusText} (${errText})`);
  }

  const data = await response.json();
  const token = data?.data?.token || data?.token;

  if (!token) {
    throw new Error("Eskiz Auth Error: Token not found in response");
  }

  cachedEskizToken = token;
  // Cache for 23 hours
  cachedEskizTokenExpiresAt = Date.now() + 23 * 60 * 60 * 1000;
  return token;
}

export async function sendEskizSms(phone: string, message: string): Promise<void> {
  const from = process.env.ESKIZ_FROM || "4546";
  if (!process.env.ESKIZ_FROM) {
    console.warn("WARNING: ESKIZ_FROM is not defined. Defaulting to '4546'.");
  }

  // Format phone to remove leading '+'
  const formattedPhone = phone.replace(/^\+/, '').trim();
  console.log("Eskiz SMS sending to:", formattedPhone);

  const token = await getEskizToken();

  const response = await fetch("https://notify.eskiz.uz/api/message/sms/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({
      mobile_phone: formattedPhone,
      message,
      from,
    }),
  });

  if (response.status === 401) {
    console.log("ESKIZ SMS: Token expired (401). Retrying with new token...");
    cachedEskizToken = null;
    cachedEskizTokenExpiresAt = 0;

    const newToken = await getEskizToken();
    const retryResponse = await fetch("https://notify.eskiz.uz/api/message/sms/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${newToken}`,
      },
      body: JSON.stringify({
        mobile_phone: formattedPhone,
        message,
        from,
      }),
    });

    if (!retryResponse.ok) {
      const errText = await retryResponse.text();
      throw new Error(`Eskiz Send Error (retry): ${retryResponse.status} ${retryResponse.statusText} (${errText})`);
    }
    return;
  }

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Eskiz Send Error: ${response.status} ${response.statusText} (${errText})`);
  }
}
