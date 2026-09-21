import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getModelToken } from '@nestjs/mongoose';

import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';
import { bilingualValidationExceptionFactory } from '../src/common/pipes/bilingual-validation.exception-factory';
import { User } from '../src/users/schemas/user.schema';

describe('Auth System (e2e)', () => {
  let app: INestApplication<App>;
  let mockUserModel: any;

  beforeEach(async () => {
    mockUserModel = {
      find: vi.fn(),
      findById: vi.fn(),
      findOne: vi.fn(),
      create: vi.fn(),
      updateOne: vi.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(getModelToken(User.name))
      .useValue(mockUserModel)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new AllExceptionsFilter());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        exceptionFactory: bilingualValidationExceptionFactory,
      }),
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /auth/signup', () => {
    it('should validate DTO and return bilingual error payload for invalid input', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/signup')
        .send({
          nameEn: 'A', // min length is 2
          nameAr: '',
          email: 'invalid-email',
          password: '123',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('VALIDATION_ERROR');
      expect(response.body.message).toHaveProperty('en');
      expect(response.body.message).toHaveProperty('ar');
    });
  });

  describe('GET /users/me', () => {
    it('should reject unauthorized request without Bearer token', async () => {
      const response = await request(app.getHttpServer())
        .get('/users/me')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('UNAUTHORIZED');
    });
  });
});
