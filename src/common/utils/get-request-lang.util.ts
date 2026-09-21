import { Request } from 'express';

export type SupportedLang = 'en' | 'ar';

const SUPPORTED_LANGS: SupportedLang[] = ['en', 'ar'];

/**
 * Resolves the preferred response language for a request.
 * Priority: ?lang= query param -> x-lang header -> Accept-Language header -> 'en'.
 * The full bilingual message object is always returned in the error body;
 * this value only fills the top-level "lang" field for the client's convenience.
 */
export function getRequestLang(request: Request): SupportedLang {
  const queryLang = (request.query?.lang as string | undefined)?.toLowerCase();
  if (queryLang && SUPPORTED_LANGS.includes(queryLang as SupportedLang)) {
    return queryLang as SupportedLang;
  }

  const headerLang = (request.headers['x-lang'] as string | undefined)?.toLowerCase();
  if (headerLang && SUPPORTED_LANGS.includes(headerLang as SupportedLang)) {
    return headerLang as SupportedLang;
  }

  const acceptLanguage = request.headers['accept-language'];
  if (acceptLanguage?.toLowerCase().startsWith('ar')) {
    return 'ar';
  }

  return 'en';
}