# E-commerce App Project Context for Claude

## Project summary
This repository is a NestJS backend for an e-commerce application. It uses TypeScript, MongoDB via Mongoose, Passport JWT, bcrypt for password hashing, and Vitest for testing. The app is structured as a modular NestJS service with user and auth domains.

## Stack
- Node.js / NestJS 12
- TypeScript
- MongoDB + Mongoose
- Passport JWT
- bcrypt
- Helmet + CORS
- Vitest

## Main folders
- `src/app.module.ts` — root module wiring the app
- `src/main.ts` — bootstraps the app, enables CORS, Helmet, and global response interceptor
- `src/auth/` — authentication logic and JWT strategy
- `src/users/` — user CRUD and schema logic
- `src/common/` — shared decorators, guards, and interceptors
- `src/config/configuration.ts` — app config loader

## Current implemented behavior
### Authentication
- `POST /auth/signup`
  - Validates duplicate email
  - Hashes password with bcrypt
  - Creates a Mongo user record
  - Generates access + refresh JWT tokens
  - Stores a hashed refresh token in the user record
  - Returns user data plus access and refresh tokens

### Users
- `GET /users` — returns all users
- `GET /users/:id` — returns one user by id
- `GET /users/me` — reads the authenticated user from request.user

### Security
- Helmet is enabled globally
- CORS allows localhost:4200 and localhost:3000
- Global response interceptor is registered in `main.ts`
- JWT guard and current-user decorator exist, but they are not fully wired into the app yet

## Data model
The user schema is defined in `src/users/schemas/user.schema.ts` and includes:
- `nameEn`
- `nameAr`
- `email` (unique, lowercase)
- `password` (hashed, not selected by default)
- `avatar`
- `isEmailVerified`
- `isActive`
- `refreshTokenHash`
- `refreshTokenExpiresAt`

## Important project conventions
- NestJS module-based architecture
- Config values are loaded globally using `ConfigModule.forRoot({ load: [configuration] })`
- Validation DTOs are expected for request bodies, although the current signup flow is minimal and direct.
- Response structure is standardized through `src/common/interceptors/response.interceptor.ts`.

## Environment variables expected
At minimum, the project expects:
- `PORT` (default `3000`)
- `MONGODB_URI`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- optional: `JWT_ACCESS_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN`

Example:
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/ecommerce
JWT_ACCESS_SECRET=your-access-secret
JWT_REFRESH_SECRET=your-refresh-secret
```

## Scripts
From `package.json`:
```bash
npm install
npm run start
npm run start:dev
npm run build
npm run test
npm run test:e2e
npm run lint
```

## Notable issues / technical debt
These are important if Claude is asked to continue development:
1. `JwtStrategy` uses `configService.get<string>('JWT_SECRET')` but the app signs tokens with `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`. This mismatch will break JWT verification.
2. `JwtAuthGuard` exists but is not registered globally in the app bootstrap, so protected routes are not enforced automatically.
3. There is no login/signin endpoint or refresh-token endpoint implemented yet.
4. `public.decorator.ts` exists, but it is not used anywhere in the current app structure.
5. The project is clearly in an early implementation stage and likely needs a full auth flow beyond signup.

## Recommended next tasks for Claude
- Fix JWT secret configuration consistency across auth service and strategy.
- Register the JWT guard globally or on relevant controllers.
- Implement login, logout, and refresh token endpoints.
- Add validation and DTOs for all auth/user endpoints.
- Add protected route usage with `@Public()` for public auth routes.
- Add database connection validation and more robust error handling.

## Suggested implementation direction
The project already establishes the foundation for a secure JWT-based user auth system. The most likely next milestone is to complete the full authentication lifecycle:
- `signup`
- `login`
- `refresh token`
- `logout`
- `protected user profile` access

## Relevant files to inspect first
- `src/auth/auth.service.ts`
- `src/auth/strategies/jwt.strategy.ts`
- `src/users/users.service.ts`
- `src/users/schemas/user.schema.ts`
- `src/app.module.ts`
- `src/main.ts`

## Quick project status
Status: partial backend implementation, strongly aligned with a JWT-based e-commerce auth system, but not yet complete. The project definitely has a working sign-up foundation, but auth security and route protection need follow-through.
