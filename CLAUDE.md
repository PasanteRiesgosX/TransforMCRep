# CLAUDE.md

This file provides repository context for coding agents working on TransforMCRep.

## Repository structure

- `backend/`: NestJS API, authentication, email, Prisma and SQL Server integration.
- `frontend/`: React single-page application built with Vite and TypeScript.
- `docker-compose.yml`: local SQL Server service.
- `GUIA_PRUEBAS.md`: project testing guidance.

## visual changes
- Important: For visual changes (implementing frontend, new pages, new buttons, change the position of visual componentes). You must check the @FRONTEND_CODING_STANDARDS.md


## Stack

### Frontend

- React 19.
- Vite 8.
- TypeScript.
- React Router 7.
- Axios for API requests.
- Tailwind CSS 4 through `@tailwindcss/vite`.
- ESLint for static analysis.

Frontend commands, run from `frontend/`:

```text
npm run dev
npm run build
npm run lint
npm run preview
```

### Backend

- NestJS 12.
- TypeScript.
- Prisma 7 with SQL Server adapter.
- JWT and Passport authentication.
- Nodemailer and Nest mailer integration.
- Jest for unit and end-to-end tests.
- Oxlint for linting.

Backend commands, run from `backend/`:

```text
npm run start:dev
npm run build
npm run lint
npm test
npm run test:e2e
```

## Frontend structure

```text
frontend/src/
├── assets/       # static images and imported media
├── components/   # reusable React components
│   ├── layout/   # page-level wrappers and route layouts
│   └── ui/       # reusable UI components
├── pages/        # route-level screens
├── services/     # API and external-service clients
├── App.tsx       # router and route composition
├── main.tsx      # application entry point
└── index.css     # global stylesheet and Tailwind entry point
```

Current reusable components:

- `components/layout/UserLayout.tsx`: layout wrapper for normal users.
- `components/layout/AdminLayout.tsx`: layout wrapper with sidebar for administrators.
- `components/ui/LogoPlaceholder.tsx`: renders the application logo and accepts `topbar` or `large` variants.
- `components/ui/ProfileButton.tsx`: user profile control with its dropdown actions.
- `components/auth/RequireAuth.tsx`: route guard requiring user session.
- `components/auth/RequireAdmin.tsx`: route guard requiring ADMIN role.
- `components/admin/QuestionFormModal.tsx`: modal for creating/editing survey questions.

Current pages:

- `pages/LoginPage.tsx`.
- `pages/AzureCallback.tsx`.
- `pages/CompleteProfilePage.tsx`.
- `pages/survey/SurveyPage.tsx`.
- `pages/survey/SurveyFormPage.tsx`.
- `pages/survey/ResultsPage.tsx`.
- `pages/admin/AdminQuestionsPage.tsx`.
- `pages/CookieMonsterEyes.tsx`: auxiliary interactive component.

## Routing

The route tree is defined in `frontend/src/App.tsx`:

- `/login`: login screen.
- `/auth/callback`: Azure authentication callback.
- `/complete-profile`: profile completion screen rendered inside `UserLayout`.
- `/survey`: survey welcome screen inside `UserLayout`.
- `/survey/form`: survey form placeholder inside `UserLayout`.
- `/results`: survey results page displaying radar chart and eligibility rank inside `UserLayout`.
- `/admin/questions`: administration page for configuring questions, inside `AdminLayout` (protected by `RequireAdmin`).
- Any unknown route redirects to `/login`.

Do not document routes as implemented until they exist in `App.tsx`.

## Backend structure

```text
backend/src/
├── admin/        # admin sub-modules (e.g. questions CRUD)
├── auth/         # authentication controller, service, DTOs, guards and strategies
├── mail/         # email delivery module and service
├── prisma/       # Prisma module and database service
├── survey/       # survey logic, attempts, canonical payloads, and scoring deterministic engine
├── app.module.ts
├── app.controller.ts
├── app.service.ts
└── main.ts
```

Database schema and migrations are under `backend/prisma/`. Phase 2 added Gate configurations (`isPassing`, `passingValue`) and Attempt relationships.

Important backend areas:

- `auth/`: registration, login, verification and profile completion flows.
- `auth/guards/`: JWT protection.
- `auth/strategies/`: Passport JWT strategy.
- `admin/questions/`: CRUD for questions with dynamic validation based on question type (MULTIPLE_CHOICE, SLIDER) and Gate flags.
- `survey/`: survey submission (`survey.service.ts`), payload canonization, and result scoring (`scoring.service.ts`).
- `mail/`: verification and application email delivery.
- `prisma/`: database access boundary.

## Application boundaries

- Pages compose route-level workflows.
- Components provide reusable UI behavior.
- Services isolate API communication from page rendering.
- Backend controllers expose HTTP endpoints.
- Backend services contain application logic.
- DTOs define and validate incoming request data.
- Prisma services provide database access.

When adding functionality, place code at the narrowest existing boundary that owns the behavior. Avoid putting API calls, database logic or reusable component behavior directly into unrelated route files.

## Working conventions

- Read the owning module and its nearby call sites before changing behavior.
- Preserve existing public APIs unless the task requires a contract change.
- Keep changes focused on the requested behavior.
- Use typed interfaces and DTOs for cross-module data.
- Reuse existing services, guards and components before creating parallel implementations.
- Keep route registration in `App.tsx` and backend module registration in the relevant Nest module.
- Do not add routes or components to this document unless they exist in the repository.
- Run the narrowest relevant validation after a change, followed by the appropriate build or test command.

## Current status

- **Phase 1 & 2 Completed:** Backend includes full Question Admin CRUD, Survey endpoints, canonical JSON payloads, and a Deterministic Scoring Motor for Ranks/Gates. Frontend includes Admin UI, Survey flows, and Radar Chart Results using `recharts`.
- The frontend is a React/Vite SPA with route composition in `App.tsx`.
- The backend is a NestJS API with authentication, mail and Prisma modules.
- The frontend build currently succeeds with `npm run build` from `frontend/`.
- Frontend lint has an existing `no-explicit-any` issue in `pages/AzureCallback.tsx` and `AdminQuestionsPage.tsx`; treat them separately from unrelated changes unless the task concerns those files.
- Backend Jest tests have a pre-existing TSConfig issue (`error TS5011: The common source directory...`). Do not hide or suppress it; it requires framework-level architectural changes.
