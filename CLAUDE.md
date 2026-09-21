# E-commerce App Project Context for Claude

## Project summary
This repository is a NestJS backend for an e-commerce application. It uses TypeScript, MongoDB via Mongoose, Passport JWT, bcrypt, Helmet, CORS, and Vitest. The codebase is structured as a modular NestJS backend with auth, users, config, and shared common utilities.

## Current stack
- Node.js / NestJS 12
- TypeScript
- MongoDB + Mongoose
- Passport JWT
- bcrypt
- Helmet + CORS
- Vitest

## Main architecture
- src/app.module.ts — root app wiring and MongoDB bootstrap
- src/main.ts — Nest application startup, CORS, Helmet, and global filters/pipes
- src/auth/ — authentication flow, DTOs, JWT strategy, and token generation
- src/users/ — user service and schema logic
- src/common/ — shared errors, filters, utilities, and i18n helpers
- src/config/configuration.ts — environment configuration loader

## Implemented behavior
### Auth
- POST /auth/signup
  - validates duplicate email
  - hashes password with bcrypt
  - creates a Mongo user record
  - generates access + refresh JWT tokens
  - stores refresh token hash in DB
  - returns user payload + tokens

### Users
- GET /users
- GET /users/:id
- GET /users/me

### Security and global behavior
- Helmet enabled globally
- CORS enabled for localhost:4200 and localhost:3000
- Validation pipe is registered globally
- Global exception filter is registered globally
- Global app exception catalog is used for bilingual messaging
- Custom AppException supports error code + bilingual message values

## Important current implementation details
### Error handling system
The project now uses a centralized error architecture:
- src/common/constants/error-catalog.ts — catalog of all application error codes and bilingual text
- src/common/exceptions/app.exception.ts — custom app exception wrapper for domain-level errors
- src/common/filters/all-exceptions.filter.ts — global catch-all handler for all exceptions
- src/common/pipes/bilingual-validation.exception-factory.ts — builds bilingual validation messages from class-validator errors

This is the preferred pattern for all business and validation errors.

### Bilingual validation and messaging
The project supports bilingual error payloads using objects like:
- message: { en, ar }

The validation pipeline and global filter should preserve the explicit English/Arabic pairs instead of auto-creating translated text during runtime.

### Auth config status
Current app setup expects:
- PORT
- MONGODB_URI
- JWT_ACCESS_SECRET
- JWT_REFRESH_SECRET

The JWT strategy reads JWT_ACCESS_SECRET, and the application should continue to use access-secret and refresh-secret consistently across auth and validation.

## Data model direction
The user schema supports multilingual fields such as:
- nameEn
- nameAr
- email
- password
- avatar
- isEmailVerified
- isActive
- refreshTokenHash
- refreshTokenExpiresAt

## Project conventions
- NestJS module architecture
- Config is loaded globally with ConfigModule.forRoot
- DTO-based validation is expected for request payloads
- Validation and app errors are designed to be bilingual
- No ad hoc English-only messages should be added in service or controller code when a reusable catalog or localized message format exists

## Environment example
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/ecommerce
JWT_ACCESS_SECRET=your-access-secret
JWT_REFRESH_SECRET=your-refresh-secret
```

## Scripts
```bash
npm install
npm run start
npm run start:dev
npm run build
npm run test
npm run test:e2e
npm run lint
```

## Known work still needed
1. JWT auth flow is not yet complete beyond signup.
2. Login / refresh-token / logout endpoints are still missing.
3. Protected route enforcement should be fully wired and validated.
4. User profile and authorization patterns should be completed.
5. Validation patterns should continue to use explicit bilingual error payloads.

## Recommended next tasks for Claude
- Complete login, refresh token, and logout flows
- Finalize protected route guard usage and JWT validation flow
- Add robust DTO validation for auth and users endpoints
- Extend error catalog with missing domain errors
- Keep all new API error responses bilingual and consistent
- Validate Mongo + Atlas connection behavior in production-like env

## Relevant files to inspect first
- src/auth/auth.service.ts
- src/auth/strategies/jwt.strategy.ts
- src/app.module.ts
- src/main.ts
- src/common/constants/error-catalog.ts
- src/common/filters/all-exceptions.filter.ts
- src/common/pipes/bilingual-validation.exception-factory.ts

## Quick status
Status: backend foundation is working, auth signup is implemented, and centralized bilingual error handling has been added. The app is moving toward a complete JWT-based authentication lifecycle with multilingual validation/error consistency.
