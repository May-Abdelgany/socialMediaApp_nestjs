import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

const englishNameRegex = /^[a-zA-Z\s'-]+$/;
const arabicNameRegex = /^[\u0600-\u06FF\s'-]+$/u;

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
  @MinLength(8)
  @MaxLength(72)
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).+$/,
    {
      message:
        'Password must contain uppercase, lowercase, number and special character',
    },
  )
  password: string;
}