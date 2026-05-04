# Project

A Next.js web app for experimentation and learning.

## Stack

- **Framework**: Next.js (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Package manager**: npm

## Running

```bash
npm install       # install dependencies
npm run dev       # start dev server at localhost:3000
npm run build     # production build
npm run lint      # run eslint
```

## Conventions

- Components go in `src/components/`, one per file, PascalCase
- Pages go in `src/app/` following Next.js App Router conventions
- Keep components small — split anything over ~100 lines
- Use TypeScript types, avoid `any`
- Prefer server components by default, add `"use client"` only when needed

## Do not touch

- `package-lock.json` — never edit by hand
- `.next/` — generated, ignore it
- `node_modules/` — never edit

## Notes

- This is an experimental project — prioritise working code over perfection
- Suggest improvements but don't refactor unless asked
- Keep changes small and focused, one thing at a time