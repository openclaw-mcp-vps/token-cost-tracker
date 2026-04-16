# Build Task: token-cost-tracker

Build a complete, production-ready Next.js 15 App Router application.

PROJECT: token-cost-tracker
HEADLINE: See exactly what each AI agent cost you yesterday, broken down per provider, model, and workflow
WHAT: A dashboard that pulls usage data from OpenAI, Anthropic, Google, and Moltbook APIs. Shows per-day and per-agent token burn, flags runaway costs, and sends Discord alerts when any single agent exceeds a monthly budget.
WHY: AI agents can silently burn $500-$5000/month with no per-agent visibility. Existing dashboards (OpenAI Usage, Anthropic Console) only show provider-level totals, not per-workflow attribution.
WHO PAYS: Solo devs and small teams running multiple AI agents in production — Claude Code users, agent builders, MCP developers.
NICHE: ai-agent-tools
PRICE: $$19/mo

ARCHITECTURE SPEC:
A Next.js dashboard that connects to multiple AI provider APIs to track token usage per agent/workflow. Features a React frontend with real-time cost monitoring, budget alerts via Discord webhooks, and Lemon Squeezy subscription management.

PLANNED FILES:
- app/page.tsx
- app/dashboard/page.tsx
- app/api/providers/openai/route.ts
- app/api/providers/anthropic/route.ts
- app/api/providers/google/route.ts
- app/api/providers/moltbook/route.ts
- app/api/webhooks/lemonsqueezy/route.ts
- app/api/alerts/discord/route.ts
- components/CostChart.tsx
- components/AgentTable.tsx
- components/BudgetAlerts.tsx
- lib/database.ts
- lib/providers.ts
- lib/discord.ts
- prisma/schema.prisma

DEPENDENCIES: next, react, typescript, tailwindcss, prisma, @prisma/client, recharts, axios, @lemonsqueezy/lemonsqueezy.js, discord.js, zod, date-fns, lucide-react

REQUIREMENTS:
- Next.js 15 with App Router (app/ directory)
- TypeScript
- Tailwind CSS v4
- shadcn/ui components (npx shadcn@latest init, then add needed components)
- Dark theme ONLY — background #0d1117, no light mode
- Lemon Squeezy checkout overlay for payments
- Landing page that converts: hero, problem, solution, pricing, FAQ
- The actual tool/feature behind a paywall (cookie-based access after purchase)
- Mobile responsive
- SEO meta tags, Open Graph tags
- /api/health endpoint that returns {"status":"ok"}
- DEPENDENCY DISCIPLINE: Every package imported in any .ts, .tsx, .js, or .jsx file MUST be
  listed in package.json dependencies (or devDependencies for build-only). Before finishing,
  scan all source files for `import` statements and verify every external package (anything
  not starting with `.` or `@/`) appears in package.json. Common shadcn/ui peers that MUST
  be added if used:
  - lucide-react, clsx, tailwind-merge, class-variance-authority
  - react-hook-form, zod, @hookform/resolvers
  - @radix-ui/* (for any shadcn component)
- After running `npm run build`, if you see "Module not found: Can't resolve 'X'", add 'X'
  to package.json dependencies and re-run npm install + npm run build until it passes.

ENVIRONMENT VARIABLES (create .env.example):
- NEXT_PUBLIC_LEMON_SQUEEZY_STORE_ID
- NEXT_PUBLIC_LEMON_SQUEEZY_PRODUCT_ID
- LEMON_SQUEEZY_WEBHOOK_SECRET

After creating all files:
1. Run: npm install
2. Run: npm run build
3. Fix any build errors
4. Verify the build succeeds with exit code 0

Do NOT use placeholder text. Write real, helpful content for the landing page
and the tool itself. The tool should actually work and provide value.


PREVIOUS ATTEMPT FAILED WITH:
Codex timed out after 600s
Please fix the above errors and regenerate.