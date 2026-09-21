import { BadRequestException, ValidationError } from '@nestjs/common';
import { getFieldLabel } from '../constants/field-labels';

/**
 * Maps class-validator constraint keys to bilingual sentence builders.
 * Each builder receives the field's bilingual label, not the raw property
 * name, so output reads naturally: "Arabic name should not be empty"
 * instead of "nameAr: nameAr should not be empty".
 * Extend this map as you adopt more class-validator decorators.
 */
const CONSTRAINT_TEMPLATES: Record<
  string,
  (label: { en: string; ar: string }) => { en: string; ar: string }
> = {
  isNotEmpty: (label) => ({
    en: `${label.en} should not be empty`,
    ar: `يجب ألا يكون حقل ${label.ar} فارغًا`,
  }),
  isEmail: (label) => ({
    en: `${label.en} must be a valid email address`,
    ar: `يجب أن يكون ${label.ar} بريدًا إلكترونيًا صالحًا`,
  }),
  minLength: (label) => ({
    en: `${label.en} is too short`,
    ar: `${label.ar} أقصر من الحد المسموح`,
  }),
  maxLength: (label) => ({
    en: `${label.en} is too long`,
    ar: `${label.ar} أطول من الحد المسموح`,
  }),
  isStrongPassword: () => ({
    en: 'Password must be a strong password',
    ar: 'كلمة المرور يجب أن تكون قوية',
  }),
};

export interface FieldError {
  field: string;
  message: { en: string; ar: string };
}

/**
 * Flattens class-validator errors into one FieldError per field,
 * keeping only the FIRST failing constraint per field (not all of them) —
 * that's what removes the duplicate "nameAr: ...; nameAr: ..." noise.
 */
function flattenErrors(errors: ValidationError[], parentPath = ''): FieldError[] {
  const result: FieldError[] = [];

  for (const err of errors) {
    const path = parentPath ? `${parentPath}.${err.property}` : err.property;

    if (err.constraints) {
      const firstConstraintKey = Object.keys(err.constraints)[0];
      const label = getFieldLabel(err.property);
      const template = CONSTRAINT_TEMPLATES[firstConstraintKey];

      result.push({
        field: path,
        message: template
          ? template(label)
          : {
              en: err.constraints[firstConstraintKey],
              ar: `قيمة الحقل ${label.ar} غير صالحة`,
            },
      });
    }

    if (err.children?.length) {
      result.push(...flattenErrors(err.children, path));
    }
  }

  return result;
}

/**
 * Pass to ValidationPipe's `exceptionFactory` option. Produces one clean
 * bilingual sentence per field, no raw property names, no duplicated
 * constraints. AllExceptionsFilter recognizes this `fieldErrors` shape.
 */
export function bilingualValidationExceptionFactory(errors: ValidationError[]) {
  const fieldErrors = flattenErrors(errors);

  return new BadRequestException({
    error: 'VALIDATION_ERROR',
    fieldErrors,
    // kept for tools/logs that still expect a flat string[]
    message: fieldErrors.map((f) => f.message.en),
  });
}