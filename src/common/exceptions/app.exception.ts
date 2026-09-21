import { HttpException } from '@nestjs/common';
import {
  BilingualMessage,
  ERROR_CATALOG,
  ErrorCatalogKey,
} from '../constants/error-catalog';

/**
 * Throw this instead of raw HttpException / Error whenever you want a
 * consistent, bilingual, catalog-backed error.
 *
 * Usage:
 *   throw new AppException('EMAIL_ALREADY_EXISTS');
 *
 * Override the message on the fly (still bilingual, still typed):
 *   throw new AppException('VALIDATION_ERROR', {
 *     en: 'Phone number is invalid',
 *     ar: 'رقم الهاتف غير صالح',
 *   });
 */
export class AppException extends HttpException {
  public readonly errorCode: string;
  public readonly bilingualMessage: BilingualMessage;

  constructor(catalogKey: ErrorCatalogKey, overrideMessage?: BilingualMessage) {
    const definition = ERROR_CATALOG[catalogKey];
    const message = overrideMessage ?? definition.message;

    super(
      {
        error: definition.error,
        message,
      },
      definition.statusCode,
    );

    this.errorCode = definition.error;
    this.bilingualMessage = message;
  }
}