# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Estructura del repo

Monorepo simple (sin workspaces/lerna/turborepo). `backend/` y `frontend/` son dos proyectos **totalmente independientes**: cada uno tiene su propio `package.json`, `node_modules` y lockfile. Se instalan y corren por separado (`cd backend && npm install`, `cd frontend && npm install`). No hay tipos ni código compartido entre ambos.

- `backend/` — API NestJS
- `frontend/` — SPA React (Vite)
- `docker-compose.yml` (raíz) — solo levanta SQL Server (`sqlserver_dev`, imagen `mssql/server:2022-latest`)
- `GUIA_PRUEBAS.md` (raíz) — guía manual (payloads curl/Postman) de los 4 endpoints de auth

## Stack

**Backend:** NestJS 12 + TypeScript. Prisma 7 (`prisma-client-js`) como ORM contra SQL Server, usando el driver adapter `@prisma/adapter-mssql` (no el connector nativo de Prisma) — ver `backend/src/prisma/prisma.service.ts`. Auth con `@nestjs/jwt` + `passport-jwt`, hashing con `bcrypt`. Validación con `class-validator`/`class-transformer` vía `ValidationPipe` global (`whitelist`, `forbidNonWhitelisted`, `transform`). Mail con `@nestjs-modules/mailer`/`nodemailer`. Lint: `oxlint`. Test: `jest`. Formato: `prettier` (`singleQuote`, `trailingComma: all`).

**Frontend:** React 19 + Vite 8 + TypeScript. Tailwind CSS 4 vía `@tailwindcss/vite` (config CSS-first con `@theme` en `frontend/src/index.css`, paleta tipo Material Design 3: `--color-primary`, `--color-surface*`, etc.). Routing con `react-router-dom` 7 (`BrowserRouter`). HTTP con `axios` (`frontend/src/services/api.ts`, funciones tipadas por endpoint). Sin gestor de estado global: cada página usa `useState`/`useEffect` y persiste sesión directamente en `localStorage` (`accessToken`, `user`). Iconos: clase `material-symbols-outlined` (Google Material Symbols vía CDN/font), **no** `lucide-react` aunque está en dependencias.

## Backend — arquitectura (`backend/src/`)

- `app.module.ts` — importa `ConfigModule` (global, lee `.env`), `PrismaModule`, `AuthModule`.
- `main.ts` — `enableCors()` abierto, `ValidationPipe` global, puerto desde `PORT` (default 3000).
- `prisma/` — `PrismaService` (extiende `PrismaClient`, crea `PrismaMssql` adapter desde `DATABASE_URL`, conecta/desconecta en el ciclo de vida del módulo), `PrismaModule`.
- `auth/` — único módulo de negocio implementado:
  - `auth.controller.ts` — incluye `POST /auth/azure-callback` (los antiguos endpoints de 2FA/register/login todavía están en el código pero el flujo principal ahora es Microsoft Entra ID).
  - `auth.service.ts` — toda la lógica (ver flujo abajo). Sin capa de repositorio: llama a Prisma directo.
  - `dto/` — `AzureCallbackDto` (junto con los DTO heredados).
  - `guards/jwt-auth.guard.ts` y `strategies/jwt.strategy.ts` — **definidos pero no aplicados a ninguna ruta todavía** (no existe ningún endpoint protegido/`@UseGuards(JwtAuthGuard)` en el código).
- `mail/` — (heredado del flujo anterior de 2FA).

**Flujo de auth (Microsoft Entra ID con JIT Provisioning):**
El frontend redirige al usuario al endpoint de autorización de Microsoft Entra ID (`/oauth2/v2.0/authorize`). Microsoft autentica al usuario y redirige al frontend (`/auth/callback`) con un código de autorización. El frontend envía este código al backend (`POST /auth/azure-callback`). El backend canjea el código por tokens contra Microsoft (`/oauth2/v2.0/token`), decodifica el `id_token` para extraer el email y nombre, y busca al usuario. Si no existe, lo crea automáticamente (Aprovisionamiento Just-in-Time). Finalmente, genera y devuelve un JWT interno de sesión.

**Prisma schema** (`backend/prisma/schema.prisma`): `User` (id uuid, email único, password hasheado, fullName, area, role — `area` y `role` son `String` libres, sin enum) y `EmailVerification` (id, code, email, expiresAt, índice por email).

## Frontend — arquitectura (`frontend/src/`)

Rutas (`App.tsx`): `/login`, `/auth/callback`, `/verify-code` (heredado, redirige a `/login`), `/welcome`, `/dashboard` (alias de `/welcome`), `/profile` (realmente renderiza `DashboardPage`), `*` → `/login`. No hay rutas protegidas por lógica de router; cada página chequea `localStorage` por su cuenta.

Páginas (`pages/`):
- `LoginPage` — pantalla de inicio de sesión con el botón de Microsoft. Usa CSS Tailwind inline.
- `AzureCallback` — maneja la redirección desde Microsoft Entra ID y se comunica con el backend. Guarda `accessToken` y `user` en `localStorage` y navega a `/dashboard`.
- `VerifyCodePage` — (heredada del flujo anterior).
- `WelcomePage` — landing post-login con animación "scramble" de texto hecha a mano (clase `ScrambleEffect`), botón "Toma la encuesta" que **es un placeholder** (`alert(...)`, no navega a ninguna encuesta real). Usa clases Tailwind + tokens del `@theme`.
- `DashboardPage` — lee `user`/`accessToken` de `localStorage`, redirige a `/login` si faltan; muestra datos del usuario y logout. Usa clases Tailwind + tokens del `@theme`.
- `CookieMonsterEyes` — componente decorativo (ojos animados), usado solo dentro de `WelcomePage`.
- `AuthLayout` — componente de layout con panel de quotes, **no está siendo usado por ninguna página actualmente** (código muerto o a integrar).

`services/api.ts` — `API_BASE_URL` está **hardcodeado** a `http://localhost:3000` (no usa variable de entorno de Vite). Expone `registerUser`, `loginUser`, `verifyCode`, `resendCode` y `getErrorMessage()` (helper para extraer mensajes de error de Nest desde `AxiosError`).

## Comandos

```bash
# Backend (desde backend/)
npm run start:dev       # dev con watch, puerto 3000
npm run lint             # oxlint src/ test/
npm run format            # prettier --write
npm run test              # jest (unit)
npm run test:e2e          # jest -c test/jest-e2e.json
npm run test:cov          # coverage
npx jest ruta/al.spec.ts  # correr un solo test
npm run prisma:generate   # regenerar Prisma Client tras cambiar schema.prisma
npx prisma migrate dev --name <nombre>  # nueva migración

# Frontend (desde frontend/)
npm run dev       # vite dev server
npm run build      # tsc -b && vite build
npm run lint        # eslint .

# DB (desde la raíz)
docker compose up -d   # levanta SQL Server (sqlserver_dev)
```

Backend requiere `backend/.env` (ver `backend/.env.example`): `DATABASE_URL` es la **única** variable de conexión que se usa realmente (consumida por `PrismaMssql` en `prisma.service.ts`); las variables sueltas `DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASSWORD` del `.env.example` no se leen en ningún lado del código — son informativas/redundantes. Otras variables leídas: `PORT`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASS`, `MAIL_FROM`.

## Estado actual

**Completo:** flujo de autenticación con Microsoft Entra ID (JIT Provisioning), persistencia de sesión en frontend vía `localStorage`, páginas de login/dashboard funcionales y conectadas al backend. Los antiguos endpoints de 2FA continúan en el código como legado.

**A medias / placeholder:** `WelcomePage` ("Toma la encuesta" no hace nada real todavía — la encuesta como tal no existe); `AuthLayout` construido pero no integrado en ninguna ruta; `JwtAuthGuard`/`JwtStrategy` listos pero sin ningún endpoint protegido que los use.

**No existe todavía:** cualquier funcionalidad de "encuesta" (survey) en sí — ni modelo en el schema de Prisma, ni endpoints, ni pantalla real más allá del botón placeholder; roles/permisos (el campo `role` es texto libre, sin enum ni control de acceso por rol); endpoints protegidos por JWT; tests para el módulo `auth` (solo existe el spec boilerplate de `AppController`).

## Convenciones

- Backend: un módulo Nest por dominio (`auth/`, `mail/`, `prisma/`), cada uno con `*.module.ts`, `*.controller.ts`, `*.service.ts`, `dto/` propio. DTOs con mensajes de validación en español.
- Los `service` de Nest llaman a Prisma directamente (sin repositorios/capa de abstracción intermedia).
- Emails se normalizan siempre con `.toLowerCase().trim()` antes de cualquier query.
- Respuestas de los endpoints de auth siguen el mismo shape: `{ statusCode, message, ...datos }`.
- Frontend: una carpeta plana `pages/` (no por feature), cada página con su propio `.css` cuando no usa Tailwind. Mezcla de dos estilos de UI: CSS módulo/inline (`LoginPage`, `RegisterPage`, `VerifyCodePage`) vs. utilidades Tailwind con los tokens de `@theme` (`WelcomePage`, `DashboardPage`) — al tocar una página, seguir el estilo que ya usa esa página, no mezclar ambos.
- `services/api.ts` centraliza todas las llamadas HTTP y sus tipos (request/response) en un solo archivo — seguir ese patrón para nuevos endpoints en vez de crear un cliente por feature.

## No hacer / cuidado

- No commitear `backend/.env` (ya está en `.gitignore`) ni credenciales reales del `.env.example`.
- `JWT_SECRET` y el password de SQL Server (`docker-compose.yml`, `MSSQL_SA_PASSWORD`) están hardcodeados como fallback/ejemplo en el repo — son solo para desarrollo local, no reusar en ningún ambiente real.

- Actualmente el proyecto funciona con una base de datos sql server microsoft, instalada localmente en mi computadora, me conecto a ella mediante `DATABASE_URL`.  `docker-compose.yml` es solo un archivo de pruebas, por si en un futuro se necesita levantar una base de datos en un contenedor, pero de momento no se esta usando, pero 

- No hay control de acceso por rol ni endpoints protegidos aún: no asumir que `role`/`area` filtran nada en el backend.

