# Codex Instructions for Digital Twin

Last updated: 2025-12-20

## Purpose
- Provide repo-specific guidance for Codex CLI work in this project.

## Project snapshot
- Stack: Vite + React + TypeScript.
- 3D: three + @react-three/fiber.
- Animation: framer-motion.
- Entry: src/App.tsx.
- Key UI: src/components and src/components/canvas.

## Key commands
- Install: npm install
- Dev: npm run dev
- Build: npm run build
- Lint: npm run lint
- Unit/integration tests: npm test
- E2E: npm run test:e2e

## Testing guidance
- Prefer user-visible behavior over implementation details.
- Mock WebGL/three.js rendering in unit/integration tests when not the focus.
- Use MSW for network mocking:
  - Handlers: src/tests/msw/handlers.ts
  - Server: src/tests/msw/server.ts
  - Setup: src/setupTests.ts
- Reuse the shared framer-motion mock: src/tests/mocks/framer-motion.tsx
- Test locations:
  - Components: src/components/__tests__
  - Services: src/services/__tests__
  - Integration: src/integration
  - E2E: tests/e2e

## Repo conventions
- Keep edits minimal and scoped to the task.
- Prefer rg for searching.
- Use ASCII unless the file already contains Unicode.
- Ask before adding or removing dependencies.
- Run lint/tests when practical; note if the sandbox prevents running them.

## Optional overrides
- Add a local AGENTS.md or AGENTS.override.md in subdirectories if special rules are needed.
