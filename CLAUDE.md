# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run dev          # Start dev server
npm run build        # Production build
npm run preview      # Preview production build

# Code quality
npm run lint         # Prettier + ESLint check
npm run format       # Auto-format with Prettier
npm run check        # TypeScript type checking
npm run check:watch  # Watch mode type checking

# Tests
npm run test:unit    # Run unit tests (Vitest)
npm run test         # Single-run test mode
```

## Architecture

**Stack**: Svelte 5 + SvelteKit 2, TypeScript, Tailwind CSS 4, Vitest

**Path aliases** (defined in `svelte.config.js`):
- `$components` → `src/lib/components`
- `$store` → `src/store`
- `$services` → `src/services`

### State Management

Stores live in `src/store/`. Each domain has its own store with a class-based pattern:
- `store.ts` — global UI state (`treeviewSidebarVisible`, `currentThemeStore`, `currentRoute`)
- `movies.ts` — movies list, filtering via derived `filteredMovies` store
- `comments.ts` — user comments + Pinecone/Ollama-powered similarity search
- `users.ts`, `genres.ts`, `language.ts` — domain stores

### API Layer

`src/services/apiService.ts` exports service objects (e.g. `moviesAPIService`, `UsersAPIService`) that call the backend at `VITE_API_URL` (default: `http://localhost:8080`).

All HTTP calls go through `src/lib/utils/fetch.ts` → `handleFetch()`, which:
- Injects auth tokens via `fetchAuthToken()` from `src/lib/utils/token.ts`
- Auto-retries on 401 (max 3 times)
- Uses `FetchMethods` enum for HTTP methods

### Routing

Routes use a `(pages)` layout group. The root layout (`src/routes/+layout.svelte`) sets the active theme based on the pathname (`movies` → "movies" theme, `maintenance` → "content" theme).

Main route tree under `src/routes/(pages)/movies/`:
- `movies/` — listing, comments, recommendations
- `users/` — user management, 3rd-party auth, example (AI similarity demo)

API routes live under `src/routes/api/`.

### AI/ML Features

The `users/example` page demonstrates vector similarity search:
- `commentsStore.handleCreateEmbeddings(userId)` — generates Pinecone embeddings via Ollama
- `commentsStore.findMostSimilarUsers(userId)` — queries similar users by embedding similarity
- Results surface in `similarityTable` store

### Testing

Vitest is configured with two environments:
- **jsdom** — Svelte component tests (`*.svelte.test.ts`)
- **node** — Server-side / utility tests (`*.test.ts`)

## Workflow

Before starting any task:
1. State a brief plan of what you're going to do
2. Use `TodoWrite` to track each step, marking items complete as you go

## Conventions

### New Pages
When creating a new route/page or component, always add a corresponding `<button>` to the header nav in [src/lib/components/Header.svelte](src/lib/components/Header.svelte) using the existing `handleRoute` pattern:

```svelte
<button
  class:active={$page.url.pathname.includes('your-route')}
  class="text-zinc-950 [&.active]:font-semibold [&.active]:underline"
  on:click={() => handleRoute('your-route')}
>
  Your Route
</button>
```

### Code Style

Prettier config (`.prettierrc`): single quotes, no trailing commas, 100-char line width, tabs (not spaces). Run `npm run format` before committing.

# use context7 to check up-to-date docs when needed implementing new libs or frameworks or adding new features using them

**invoke the ui-ux-reviewer subagent** to review your work and implement suggestions where needed. Iterate on the review process when needed