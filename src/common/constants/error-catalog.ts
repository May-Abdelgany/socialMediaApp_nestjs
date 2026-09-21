import { HttpStatus } from '@nestjs/common';

export interface BilingualMessage {
  en: string;
  ar: string;
}

export interface ErrorDefinition {
  statusCode: HttpStatus;
  error: string; // machine-readable code, e.g. "WEAK_PASSWORD"
  message: BilingualMessage;
}

/**
 * Central catalog of every known application error.
 * Add new entries here instead of hardcoding messages in services/controllers.
 * Keeping this in one file makes translation review and consistency trivial.
 */
export const ERROR_CATALOG = {
  // ---------- Generic / infra ----------
  INTERNAL_SERVER_ERROR: {
    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
    error: 'INTERNAL_SERVER_ERROR',
    message: {
      en: 'Something went wrong. Please try again later.',
      ar: 'حدث خطأ ما. يرجى المحاولة مرة أخرى لاحقًا.',
    },
  },
  NOT_FOUND: {
    statusCode: HttpStatus.NOT_FOUND,
    error: 'NOT_FOUND',
    message: {
      en: 'The requested resource was not found.',
      ar: 'لم يتم العثور على المورد المطلوب.',
    },
  },
  VALIDATION_ERROR: {
    statusCode: HttpStatus.BAD_REQUEST,
    error: 'VALIDATION_ERROR',
    message: {
      en: 'Validation failed for one or more fields.',
      ar: 'فشل التحقق من صحة حقل واحد أو أكثر.',
    },
  },
  FORBIDDEN: {
    statusCode: HttpStatus.FORBIDDEN,
    error: 'FORBIDDEN',
    message: {
      en: 'You do not have permission to perform this action.',
      ar: 'ليس لديك صلاحية للقيام بهذا الإجراء.',
    },
  },

  // ---------- Auth ----------
  INVALID_CREDENTIALS: {
    statusCode: HttpStatus.UNAUTHORIZED,
    error: 'INVALID_CREDENTIALS',
    message: {
      en: 'Email or password is incorrect.',
      ar: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
    },
  },
  UNAUTHORIZED: {
    statusCode: HttpStatus.UNAUTHORIZED,
    error: 'UNAUTHORIZED',
    message: {
      en: 'Authentication is required to access this resource.',
      ar: 'يجب تسجيل الدخول للوصول إلى هذا المورد.',
    },
  },
  INVALID_REFRESH_TOKEN: {
    statusCode: HttpStatus.UNAUTHORIZED,
    error: 'INVALID_REFRESH_TOKEN',
    message: {
      en: 'Refresh token is invalid or expired.',
      ar: 'رمز التحديث غير صالح أو منتهي الصلاحية.',
    },
  },
  WEAK_PASSWORD: {
    statusCode: HttpStatus.BAD_REQUEST,
    error: 'WEAK_PASSWORD',
    message: {
      en: 'Password must be a strong password.',
      ar: 'كلمة المرور يجب أن تكون قوية.',
    },
  },

  // ---------- Users ----------
  EMAIL_ALREADY_EXISTS: {
    statusCode: HttpStatus.CONFLICT,
    error: 'EMAIL_ALREADY_EXISTS',
    message: {
      en: 'An account with this email already exists.',
      ar: 'يوجد حساب مسجل بهذا البريد الإلكتروني بالفعل.',
    },
  },
  USER_NOT_FOUND: {
    statusCode: HttpStatus.NOT_FOUND,
    error: 'USER_NOT_FOUND',
    message: {
      en: 'User not found.',
      ar: 'المستخدم غير موجود.',
    },
  },
} as const satisfies Record<string, ErrorDefinition>;

export type ErrorCatalogKey = keyof typeof ERROR_CATALOG;