/**
 * Human-readable bilingual label for each DTO field.
 * Add an entry per field as your DTOs grow; anything missing falls back
 * to the raw property name in both languages.
 */
export const FIELD_LABELS: Record<string, { en: string; ar: string }> = {
  nameEn: { en: 'English name', ar: 'الاسم بالإنجليزية' },
  nameAr: { en: 'Arabic name', ar: 'الاسم بالعربية' },
  email: { en: 'Email', ar: 'البريد الإلكتروني' },
  password: { en: 'Password', ar: 'كلمة المرور' },
  avatar: { en: 'Avatar', ar: 'الصورة الشخصية' },
  phone: { en: 'Phone number', ar: 'رقم الهاتف' },
};
 
export function getFieldLabel(property: string): { en: string; ar: string } {
  return FIELD_LABELS[property] ?? { en: property, ar: property };
}
 