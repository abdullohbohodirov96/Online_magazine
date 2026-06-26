import { sendEskizSms } from './eskiz-service';

export async function sendSms(phone: string, message: string): Promise<void> {
  const provider = process.env.SMS_PROVIDER || "mock";
  console.log("SMS_PROVIDER:", provider);

  if (provider === "mock") {
    console.log(`Mock SMS to ${phone}: ${message}`);
    return;
  }

  if (provider === "eskiz") {
    await sendEskizSms(phone, message);
    return;
  }

  throw new Error(`Unsupported SMS provider: ${provider}`);
}

export async function sendOtpSms(phone: string, code: string): Promise<void> {
  const message = `Tasdiqlash kodi: ${code}`;
  await sendSms(phone, message);
}
