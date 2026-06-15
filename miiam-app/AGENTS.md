<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# MIIAM Project Conventions

## Tech Stack
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript (strict mode)
- **Database**: PostgreSQL via Prisma ORM
- **Auth**: Supabase Auth
- **State**: Zustand
- **Styling**: Tailwind CSS v4
- **Validation**: Zod
- **Payments**: Razorpay
- **Monitoring**: Sentry
- **Logging**: Pino

## Code Quality

### Commands
```bash
npm run typecheck    # TypeScript type checking
npm run lint         # ESLint
npm run lint:fix     # ESLint with auto-fix
npm run format       # Prettier formatting
npm run format:check # Check formatting without changing
npm run validate     # Run all checks (typecheck + lint + format + test)
```

### Pre-commit Hooks
- Husky runs `lint-staged` on pre-commit
- Pre-push runs `typecheck`
- All staged `.ts/.tsx` files are linted and formatted

### TypeScript Rules
- `strict: true` — no `any` types allowed
- Use `unknown` instead of `any` when type is uncertain
- Define explicit return types on exported functions
- Use `interface` for object shapes, `type` for unions/intersections

### ESLint Rules
- `react-hooks/rules-of-hooks`: error
- `jsx-a11y/alt-text`: error
- `@typescript-eslint/no-explicit-any`: warn

## File Structure
```
src/
├── app/          # Next.js App Router pages and API routes
├── components/   # Reusable UI components
├── lib/          # Utility functions, helpers, services
│   ├── hooks/    # Custom React hooks
│   ├── store/    # Zustand stores
│   ├── supabase/ # Supabase client setup
│   └── types/    # TypeScript type definitions
└── test/         # Test setup and utilities
```

## Naming Conventions
- **Files**: `kebab-case` (e.g., `cart-store.ts`, `order-utils.ts`)
- **Components**: `PascalCase` (e.g., `CartItem.tsx`, `OrderStatus.tsx`)
- **Functions**: `camelCase` (e.g., `calculateTotal`, `formatCurrency`)
- **Types/Interfaces**: `PascalCase` with descriptive names (e.g., `CartItem`, `OrderStatus`)
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `MAX_CART_ITEMS`, `API_TIMEOUT`)

## API Routes
- Always validate input with Zod at the boundary
- Return consistent error shapes: `{ error: string, code: string }`
- Use `NextResponse.json()` for all responses
- Apply rate limiting via `checkIpRateLimit()` from `@/lib/security`
- Log errors with Pino logger

## Testing
- **Unit tests**: `*.test.ts` or `*.test.tsx` co-located or in `__tests__/`
- **E2E tests**: `e2e/*.spec.ts` using Playwright
- Run: `npm run test:run` (unit) or `npm run e2e` (E2E)
- Coverage thresholds: 70% statements, 60% branches

## Security
- Never commit `.env.local` — use `.env.local.example` as template
- Validate all env vars via `src/env.js` (Zod + t3-oss)
- Use `checkCsrf()` for mutation endpoints
- Use `requireCronAuth()` for cron/webhook endpoints
- Sanitize user input before rendering or database queries

## Git Workflow
- Branch naming: `feat/`, `fix/`, `chore/`, `docs/`
- Conventional commits: `feat:`, `fix:`, `chore:`, `docs:`
- PR title must match conventional commit format
- Squash merge to main
- No force pushes to shared branches

## Performance
- Use `next/image` for all images (auto-optimization)
- Lazy load components below the fold
- Use `React.memo()` for expensive renders
- Keep bundle size under 250KB initial JS

## Accessibility
- Semantic HTML elements (`<main>`, `<nav>`, `<article>`)
- All images require `alt` text
- Interactive elements must be keyboard accessible
- Test with screen reader (VoiceOver/NVDA)
- WCAG 2.1 AA compliance required
