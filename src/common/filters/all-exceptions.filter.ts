import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { MongoServerError } from 'mongodb';
import { Error as MongooseError } from 'mongoose';
import { AppException } from '../exceptions/app.exception';
import { BilingualMessage, ERROR_CATALOG } from '../constants/error-catalog';
import {
  ApiErrorResponse,
  ApiFieldError,
} from '../interfaces/api-error-response.interface';
import { getRequestLang } from '../utils/get-request-lang.util';

interface ResolvedError {
  statusCode: number;
  error: string;
  message: BilingualMessage;
  errors?: ApiFieldError[];
  logAsError: boolean;
}

/**
 * Single global error handler for the whole app.
 * Register it once in main.ts with app.useGlobalFilters(new AllExceptionsFilter()).
 *
 * Handles, in order:
 *  1. AppException              -> our own catalog-backed bilingual errors
 *  2. class-validator errors    -> thrown by ValidationPipe as BadRequestException
 *  3. Any other HttpException   -> built-in Nest exceptions (NotFoundException, etc.)
 *  4. Mongoose/MongoDB errors   -> duplicate key, cast errors, validation errors
 *  5. Anything else             -> logged as a real bug, returned as 500
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionsFilter');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const lang = getRequestLang(request);

    const { statusCode, error, message, errors, logAsError } = this.resolve(exception);

    if (logAsError) {
      this.logger.error(
        `${request.method} ${request.url} -> ${statusCode} ${error}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    const body: ApiErrorResponse = {
      success: false,
      statusCode,
      error,
      lang,
      message,
      ...(errors ? { errors } : {}),
      path: request.url,
      timestamp: new Date().toISOString(),
    };

    response.status(statusCode).json(body);
  }

  private resolve(exception: unknown): ResolvedError {
    // 1. Our own bilingual exceptions
    if (exception instanceof AppException) {
      return {
        statusCode: exception.getStatus(),
        error: exception.errorCode,
        message: exception.bilingualMessage,
        logAsError: false,
      };
    }

    // 2 & 3. Any Nest HttpException (includes ValidationPipe's BadRequestException)
    if (exception instanceof HttpException) {
      return this.resolveHttpException(exception);
    }

    // 4. Mongoose/MongoDB errors
    const mongoResolved = this.resolveMongoError(exception);
    if (mongoResolved) {
      return mongoResolved;
    }

    // 5. Unknown/unexpected error -> always a bug, never leak details to client
    return {
      statusCode: ERROR_CATALOG.INTERNAL_SERVER_ERROR.statusCode,
      error: ERROR_CATALOG.INTERNAL_SERVER_ERROR.error,
      message: ERROR_CATALOG.INTERNAL_SERVER_ERROR.message,
      logAsError: true,
    };
  }

  private resolveHttpException(exception: HttpException): ResolvedError {
    const statusCode = exception.getStatus();
    const payload = exception.getResponse();

    // Produced by bilingual-validation.exception-factory.ts (preferred path):
    // { error: 'VALIDATION_ERROR', fieldErrors: [{ field, message: { en, ar } }] }
    // Each field keeps its own entry in `errors` — nothing is joined into one string.
    if (
      statusCode === HttpStatus.BAD_REQUEST &&
      typeof payload === 'object' &&
      payload !== null &&
      Array.isArray((payload as Record<string, unknown>).fieldErrors)
    ) {
      const fieldErrors = (
        payload as { fieldErrors: ApiFieldError[] }
      ).fieldErrors;
      return {
        statusCode,
        error: ERROR_CATALOG.VALIDATION_ERROR.error,
        message: ERROR_CATALOG.VALIDATION_ERROR.message,
        errors: fieldErrors,
        logAsError: false,
      };
    }

    // Fallback: default Nest ValidationPipe shape { message: string[], error, statusCode }
    // (used if bilingualValidationExceptionFactory isn't wired in yet)
    if (
      statusCode === HttpStatus.BAD_REQUEST &&
      typeof payload === 'object' &&
      payload !== null &&
      Array.isArray((payload as Record<string, unknown>).message)
    ) {
      const validationMessages = (payload as { message: string[] }).message;
      return {
        statusCode,
        error: ERROR_CATALOG.VALIDATION_ERROR.error,
        message: ERROR_CATALOG.VALIDATION_ERROR.message,
        errors: validationMessages.map((text) => ({
          field: text.split(' ')[0] ?? 'unknown',
          message: { en: text, ar: ERROR_CATALOG.VALIDATION_ERROR.message.ar },
        })),
        logAsError: false,
      };
    }

    // Any other built-in Nest exception (NotFoundException, ForbiddenException, etc.)
    const fallbackText =
      typeof payload === 'string'
        ? payload
        : (payload as Record<string, unknown>)?.message?.toString() ??
          exception.message;

    return {
      statusCode,
      error: HttpStatus[statusCode] ?? 'HTTP_ERROR',
      message: {
        en: fallbackText,
        ar: ERROR_CATALOG.INTERNAL_SERVER_ERROR.message.ar,
      },
      logAsError: statusCode >= 500,
    };
  }

  private resolveMongoError(exception: unknown): ResolvedError | null {
    // Duplicate key (e.g. unique email)
    if (exception instanceof MongoServerError && exception.code === 11000) {
      const field = Object.keys(exception.keyPattern ?? {})[0] ?? 'field';
      return {
        statusCode: HttpStatus.CONFLICT,
        error: 'DUPLICATE_FIELD',
        message: {
          en: `A record with this ${field} already exists.`,
          ar: `يوجد سجل بنفس ${field} بالفعل.`,
        },
        logAsError: false,
      };
    }

    if (exception instanceof MongooseError.CastError) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        error: 'INVALID_ID',
        message: {
          en: `Invalid value for ${exception.path}.`,
          ar: `قيمة غير صالحة لـ ${exception.path}.`,
        },
        logAsError: false,
      };
    }

    if (exception instanceof MongooseError.ValidationError) {
      const details = Object.values(exception.errors)
        .map((e) => e.message)
        .join('; ');
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        error: ERROR_CATALOG.VALIDATION_ERROR.error,
        message: {
          en: details || ERROR_CATALOG.VALIDATION_ERROR.message.en,
          ar: ERROR_CATALOG.VALIDATION_ERROR.message.ar,
        },
        logAsError: false,
      };
    }

    return null;
  }
}