import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

const englishNameRegex = /^[a-zA-Z\s'-]+$/;
const arabicNameRegex = /^[\u0600-\u06FF\s'-]+$/u;

function IsPasswordOrHash(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isPasswordOrHash',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          if (typeof value !== 'string') return false;

          const isSha256Hash = /^[a-fA-F0-9]{64}$/.test(value);
          const isStrongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,72}$/.test(
            value,
          );

          return isSha256Hash || isStrongPassword;
        },
        defaultMessage() {
          return 'Password must be a strong password or a valid SHA-256 hash';
        },
      },
    });
  };
}

function IsSameAsPassword(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isSameAsPassword',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown, args: ValidationArguments) {
          const obj = args.object as Record<string, unknown>;
          return (
            typeof value === 'string' &&
            typeof obj.password === 'string' &&
            value === obj.password
          );
        },
        defaultMessage() {
          return 'Confirm password must match password';
        },
      },
    });
  };
}

export class SignupDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  @Matches(englishNameRegex, {
    message: 'English name must contain English letters only',
  })
  nameEn: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  @Matches(arabicNameRegex, {
    message: 'Arabic name must contain Arabic letters only',
  })
  nameAr: string;

  @IsEmail()
  @IsNotEmpty()
  @MaxLength(254)
  email: string;

  @IsString()
  @IsNotEmpty()
  @IsPasswordOrHash({
    message:
      'Password must be a strong password or a valid SHA-256 hash of exactly 64 characters',
  })
  password: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(72)
  @IsSameAsPassword({
    message: 'Confirm password must match password',
  })
  confirmPassword: string;
}