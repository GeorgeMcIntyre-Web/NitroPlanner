# Backend Structure

This directory contains all backend code for NitroPlanner.

## Subdirectories
- `src/`: Node.js/Prisma backend (TypeScript)
- `prisma/`: Database schema and migrations (for Prisma)
- `instance/`: (Legacy/optional) instance-specific configuration
- `node_modules/`: Node.js dependencies (not committed)

## Setup
1. Copy `.env.example` to `.env` and set your PostgreSQL connection string.
2. Install dependencies:
   ```bash
   cd backend
   npm install
   ```
3. Run migrations and generate Prisma client:
   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   ```
4. (Optional) Seed the database:
   ```bash
   npx ts-node src/seed.ts
   ```

## API Development
- Add your API endpoints in `src/routes/`.
- Use the Prisma client for all database operations.

## Testing
- Set up tests using Jest or your preferred Node.js test runner.

---
**Note:** The backend is now Prisma/PostgreSQL only. 