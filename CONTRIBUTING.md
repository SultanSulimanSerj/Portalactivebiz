# Contributing to Project Portal

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/Portalactivebiz.git`
3. Install dependencies: `npm install`
4. Create a branch: `git checkout -b feature/your-feature-name`
5. Make your changes
6. Test your changes: `npm test`
7. Commit your changes: `git commit -m "Add your feature"`
8. Push to your fork: `git push origin feature/your-feature-name`
9. Create a Pull Request

## Development Setup

```bash
# Install dependencies
npm install

# Setup database with Docker
docker-compose up -d

# Initialize database
npx prisma db push
npm run db:seed

# Start development server
npm run dev
```

## Code Style

- Use TypeScript
- Follow ESLint rules
- Write meaningful commit messages
- Add tests for new features
- Update documentation

## Project Structure

- `src/app/` - Next.js App Router pages
- `src/components/` - React components
- `src/lib/` - Utility functions and configurations
- `prisma/` - Database schema and migrations
- `docs/` - Documentation files
- `public/` - Static assets

## Features

- Project Management
- Task Management with Gantt Charts
- Document Management
- Financial Tracking
- User Management
- Real-time Chat
- Reports and Analytics
- API Documentation
