# AGENTS.md

This file contains guidelines for AI agents working on this forum project (Vue 3 + Node.js + MySQL).

## Project Overview

Full-stack forum system with:
- **Frontend**: Vue 3 + TypeScript + Vite + Element Plus
- **Backend**: Node.js + Express + TypeScript + Sequelize ORM
- **Database**: MySQL + Redis (cache)

## Build/Development Commands

### Backend (backend/)
```bash
# Install dependencies
cd backend && npm install

# Development server (port 3000)
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run single test file
npm run test -- --testPathPattern=user.service

# Database operations
npm run db:init      # Initialize database
npm run db:migrate   # Run migrations
npm run db:seed      # Seed database
```

### Frontend (frontend/)
```bash
# Install dependencies
cd frontend && npm install

# Development server (port 5173)
npm run dev

# Build for production
npm run build

# Type check
npm run type-check
```

## Code Style Guidelines

### TypeScript
- **Target**: ES2020, CommonJS modules
- **Strict mode**: Enabled
- Use explicit return types for functions
- Define interfaces for data structures (e.g., `RegisterData`, `TokenPayload`)
- Use `async/await` for asynchronous operations

### Imports
- Use ES6 import syntax
- Group imports: external libraries first, then internal modules
- Use path alias `@/*` for internal imports (configured in tsconfig.json)
- Example:
```typescript
import express from 'express';
import { Request, Response } from 'express';
import { userService } from '../services/user.service';
import { ApiResponse } from '../utils/response';
```

### Naming Conventions
- **Files**: kebab-case (e.g., `user.controller.ts`, `auth.middleware.ts`)
- **Classes**: PascalCase (e.g., `User`, `Category`)
- **Interfaces**: PascalCase (e.g., `RegisterData`, `TokenPayload`)
- **Variables/Functions**: camelCase (e.g., `userService`, `findById`)
- **Constants**: UPPER_SNAKE_CASE for true constants

### Error Handling
- Use custom `asyncHandler` wrapper for async route handlers
- Use `ApiResponse` utility for consistent response format:
  - `ApiResponse.success(res, data, message?, statusCode?)`
  - `ApiResponse.badRequest(res, message)`
  - `ApiResponse.unauthorized(res)`
  - `ApiResponse.notFound(res, message)`
- Throw errors in services, handle in controllers
- Log errors using Winston logger

### Project Structure
```
backend/src/
├── config/         # Configuration files
├── controllers/    # Route controllers
├── database/       # Database initialization, migrations, seeders
├── middlewares/    # Express middlewares
├── models/         # Sequelize models
├── routes/         # Express routes
├── services/       # Business logic
└── utils/          # Utility functions
```

### Response Format
All API responses follow this structure:
```typescript
{
  success: boolean,
  message: string,
  data?: any,
  errors?: any
}
```

### Database
- Use Sequelize ORM for database operations
- Define models in `models/` directory
- Use migrations for schema changes
- Model attributes use snake_case in DB, camelCase in code

### Security
- Use Helmet for security headers
- Use CORS with configured origins
- Implement rate limiting on API routes
- JWT for authentication
- Password hashing with bcrypt

## Environment Variables

Key backend environment variables (see backend/.env.example):
```
NODE_ENV=development
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_NAME=luntan
DB_USER=root
DB_PASSWORD=root
JWT_SECRET=your_secret_key
REDIS_HOST=localhost
REDIS_PORT=6379
```

## Testing
- Use Jest for testing
- Use supertest for API testing
- Tests located alongside source files or in `__tests__` directories
- Run single test: `npm run test -- --testPathPattern=<name>`

## API Convention
- Base URL: `/api/v1`
- RESTful endpoints
- Use appropriate HTTP methods (GET, POST, PUT, DELETE)
- Return appropriate HTTP status codes
- Chinese language for user-facing messages
