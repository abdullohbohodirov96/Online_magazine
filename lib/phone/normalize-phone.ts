export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');

  if (digits.startsWith('998') && digits.length === 12) {
    return '+' + digits;
  }

  if (digits.length === 9) {
    return '+998' + digits;
  }

  return '+' + digits;
}
