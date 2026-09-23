// src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { bilingualValidationExceptionFactory } from './common/pipes/bilingual-validation.exception-factory';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet());
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:4200',
      'http://localhost:5173',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:4200',
      'http://127.0.0.1:5173',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Catch-all for every thrown error in the app, formatted bilingually
  app.useGlobalFilters(new AllExceptionsFilter());

  // Wrap every successful response in a single success/error contract
  app.useGlobalInterceptors(new ResponseInterceptor());

  // Makes DTO validation failures (class-validator) come out bilingual too
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: bilingualValidationExceptionFactory,
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
