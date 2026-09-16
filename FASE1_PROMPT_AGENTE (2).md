# Prompt para agente de codificación — TransforMCRep · Fase 1


## Contexto

Trabajas en el repositorio **TransforMCRep**. Antes de escribir cualquier código, lee:

- `CLAUDE.md` — estructura, stack y convenciones del repositorio.
- `FRONTEND_CODING_STANDARDS.md` — **obligatorio** antes de cualquier cambio visual.
- `backend/prisma/schema.prisma` — esquema actual.
- `frontend/src/App.tsx` — árbol de rutas actual.
- `frontend/src/components/layout/UserLayout.tsx`, `frontend/src/components/ui/LogoPlaceholder.tsx`, `frontend/src/components/ui/ProfileButton.tsx`.
- `backend/src/auth/` completo, incluyendo guards, strategies y DTOs.

Estado actual: solo están implementados el login con Microsoft Entra ID, `/welcome` y `/complete-profile`. No existe panel de administración, ni encuesta, ni resultados.

## Objetivo de la Fase 1

Implementar tres bloques, en este orden:

1. **Roles y acceso administrador** (backend + guardas + navegación).
2. **Módulo de creación de preguntas** para administradores.
3. **Toma de la encuesta por parte del usuario**, con persistencia de respuestas y generación de un JSON canónico.

**Fuera de alcance:** cálculo de puntajes, rangos, integración con IA, panel analítico. La página de resultados es un placeholder con el mensaje "En construcción". No implementes lógica de puntuación; sí debes crear las estructuras de datos y los stubs que la Fase 2 consumirá.

---

## Bloque 1 — Roles y acceso administrador

### Esquema

Se crea una tabla `Role` con los roles de aplicación, y cada usuario queda asociado a un rol mediante una clave foránea en `User`. Un usuario tiene exactamente un rol de aplicación, por lo que **no** debe crearse tabla puente `UserRole`.

Es importante que hagas el siguiente cambio en la tabla User que existe actualmente. Actualmente ya tiene un campo existente llamado role que en verdad no guarda un role en si, guarda el cargo o posicion de el usuario en la empresa.
Cambia el nombre de este role por position.
role->position.

Ahora el cargo de la empresa se va a guarde en position y el rol de el usuario se va a guardar en role.

Agrega al `schema.prisma`:

```prisma
model Role {
  id    Int    @id @default(autoincrement())
  code  String @unique   // "USER" | "ADMIN"
  name  String
  users User[]
}
```

En `User`, agrega la FK hacia `Role`:

```prisma
  roleId Int  @default(1)
  role   Role @relation(fields: [appRoleId], references: [id])
```

Reglas estrictas:

Crea un seed idempotente que inserte los roles `USER` (id 1) y `ADMIN` (id 2). La asignación de administradores se hará manualmente por SQL; no construyas UI para ello.

Simplemente inserta los roles. Yo insertare los administradores mediante SSMS, es decir, aqui no realizas nada mas.

### Backend

- El payload del JWT debe incluir `appRole` (el `code`, no el id). Revisa la estrategia Passport existente y extiéndela sin romper el contrato actual.
- Crea `auth/guards/admin.guard.ts` que verifique `appRole === 'ADMIN'`. Debe componerse con el guard JWT existente, no reemplazarlo.
- Expón `GET /auth/me` devolviendo `{ id, email, fullName, area, appRole }`. Si ya existe un endpoint equivalente, extiéndelo en lugar de duplicarlo.

### Frontend

- Crea `components/auth/RequireAuth.tsx` y `components/auth/RequireAdmin.tsx` como componentes de ruta (React Router 7). `RequireAdmin` redirige a `/welcome` si el usuario no es admin.
- Al completarse el login, si `appRole === 'ADMIN'` redirige a `/admin/questions`; en caso contrario a `/welcome`.
- Mantén el rol en un contexto de sesión (`contexts/AuthContext.tsx`) alimentado desde `GET /auth/me`. No leas ni decodifiques el JWT en componentes de página.

---

## Bloque 2 — Header con pestañas

Crea `components/layout/AppHeader.tsx`, extrayendo el header que hoy vive en `UserLayout.tsx`. Debe conservar exactamente los colores, tipografía y espaciado actuales, y seguir `FRONTEND_CODING_STANDARDS.md`.

Pestañas visibles según rol:

| Rol   | Pestañas                        |
|-------|---------------------------------|
| USER  | ENCUESTA, RESULTADOS            |
| ADMIN | ADMIN, ENCUESTA, RESULTADOS     |

- ENCUESTA → `/welcome`
- RESULTADOS → `/results`
- ADMIN → `/admin/questions`

La pestaña activa debe tener un estado visual distinguible mediante `NavLink`. Instala `lucide-react` en `frontend/` y usa sus iconos en las pestañas y en el sidebar.

`UserLayout` debe seguir renderizando `<Outlet />`; solo cambia de dónde proviene el header.

---

## Bloque 3 — Módulo de preguntas (admin)

### Esquema

```prisma
model Question {
  id             String   @id @default(uuid())
  text           String
  type           String   // "MULTIPLE_CHOICE" | "OPEN" | "SLIDER"
  dimension      String?  // CONOCIMIENTO_GENERAL | USO_HERRAMIENTAS |
                          // IDENTIFICACION_OPORTUNIDADES | USO_RESPONSABLE |
                          // DISPOSICION_IMPULSAR
  rubricCategory String?  // TECNICO | APTITUDINAL | INNOVACION | DISPONIBILIDAD
  weight         Decimal  @default(1)
  isGate         Boolean  @default(false)
  scoreEligible  Boolean  @default(true)
  orderIndex     Int
  isActive       Boolean  @default(true)

  // solo para SLIDER
  minValue  Int?
  maxValue  Int?
  stepValue Int?
  minLabel  String?
  maxLabel  String?

  createdById String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  deletedAt   DateTime?

  options QuestionOption[]
}

model QuestionOption {
  id         String  @id @default(uuid())
  questionId String
  text       String
  value      Decimal // 0 = básico, 0.5 = intermedio, 1 = avanzado
  orderIndex Int
  isActive   Boolean @default(true)
  question   Question @relation(fields: [questionId], references: [id])
}
```

Las preguntas son **globales y compartidas**: no llevan `ownerId` ni filtro por área. Cualquier admin ve y modifica el mismo conjunto.

### Reglas de negocio (backend, en el service — no en el controller)

- `MULTIPLE_CHOICE`: mínimo 2 opciones, cada una con `value` entre 0 y 1.
- `SLIDER`: requiere `minValue < maxValue` y `stepValue > 0`. No admite opciones.
- `OPEN`: no admite opciones; fuerza `scoreEligible = false` y `weight = 0`.
- **El borrado es lógico.** `DELETE /admin/questions/:id` marca `isActive = false` y setea `deletedAt`. Nunca ejecutes un borrado físico: rompería los intentos históricos.
- La edición de una pregunta con respuestas existentes está permitida, porque las respuestas guardan snapshot (ver Bloque 4). Documenta esto en un comentario del service.

### Endpoints (todos bajo `AdminGuard`)

```
GET    /admin/questions              lista completa, incluye inactivas, ordenada por orderIndex
POST   /admin/questions              crea pregunta + opciones en una transacción
GET    /admin/questions/:id
PATCH  /admin/questions/:id          actualiza pregunta + reconcilia opciones
DELETE /admin/questions/:id          borrado lógico
PATCH  /admin/questions/reorder      body: { items: [{ id, orderIndex }] }
```

Usa DTOs con `class-validator` para toda entrada. Valida el tipo de pregunta con validación condicional según `type`.

### Frontend admin

Crea:

- `components/layout/AdminLayout.tsx` — reutiliza `AppHeader` y agrega un sidebar izquierdo. Única entrada por ahora: **Preguntas** (icono de `lucide-react`). Deja el array de items del sidebar preparado para crecer.
- `pages/admin/AdminQuestionsPage.tsx` — tabla/lista de preguntas con: orden, texto, tipo, dimensión, peso, estado, y acciones editar / desactivar.
- `components/admin/QuestionFormModal.tsx` — formulario que cambia sus campos según el tipo seleccionado:
  - `MULTIPLE_CHOICE`: editor de opciones con texto + valor (selector Básico 0 / Intermedio 0.5 / Avanzado 1), agregar y quitar filas.
  - `SLIDER`: min, max, paso, etiqueta mínima, etiqueta máxima.
  - `OPEN`: solo texto de la pregunta.
  - Siempre: dimensión (select), categoría de rúbrica (select), peso (numérico), "es gate" (checkbox).
- `services/questions.service.ts` — cliente Axios. Ninguna llamada HTTP directa desde las páginas.

Rutas nuevas: `/admin` (redirige a `/admin/questions`) y `/admin/questions`, ambas bajo `RequireAdmin`.

---

## Bloque 4 — Toma de la encuesta y JSON canónico

### Esquema

```prisma
model SurveyAttempt {
  id             String    @id @default(uuid())
  subjectUserId  String    // persona evaluada
  evaluatorUserId String   // quien responde; en Fase 1 siempre == subjectUserId
  evaluationType String    @default("AUTOEVALUACION")
  status         String    @default("IN_PROGRESS") // IN_PROGRESS | SUBMITTED
  startedAt      DateTime  @default(now())
  submittedAt    DateTime?
  payloadJson    String?   @db.NVarChar(Max) // JSON canónico congelado al enviar
  answers        Answer[]
}

model Answer {
  id        String @id @default(uuid())
  attemptId String

  questionId           String
  questionTextSnapshot String
  questionTypeSnapshot String
  dimensionSnapshot    String?
  weightSnapshot       Decimal

  selectedOptionId    String?
  optionTextSnapshot  String?
  optionValueSnapshot Decimal?
  numericValue        Int?     // SLIDER
  textValue           String?  @db.NVarChar(Max) // OPEN

  attempt SurveyAttempt @relation(fields: [attemptId], references: [id])
}
```

Los campos `evaluationType`, `subjectUserId` y `evaluatorUserId` no se usan todavía con valores distintos, pero existen desde ahora para evitar una migración sobre datos reales en fases posteriores.

### Endpoints (bajo guard JWT, disponibles para USER y ADMIN)

```
GET  /survey/questions              solo isActive = true, ordenadas; ver contrato de
                                    exposición de campos más abajo
POST /survey/attempts               crea o reanuda el intento IN_PROGRESS del usuario
POST /survey/attempts/:id/submit    persiste respuestas con snapshot, marca SUBMITTED,
                                    construye y guarda payloadJson, lo devuelve
```

### Contrato de exposición de campos en `GET /survey/questions`

La separación se hace **en el backend**, construyendo un DTO de salida explícito. No envíes la entidad completa confiando en que el frontend ignore campos.

**Campos que SÍ se envían** (el control no se puede renderizar sin ellos):

- `id`, `text`, `type`, `orderIndex`
- Para `SLIDER`: `minValue`, `maxValue`, `stepValue`, `minLabel`, `maxLabel`
- Para `MULTIPLE_CHOICE`: `options[].id`, `options[].text`, `options[].orderIndex`

**Campos que NO se envían nunca:**

- `options[].value` — es la calificación de cada opción (0 básico / 0.5 intermedio / 1 avanzado). Si viaja al cliente, el encuestado puede leer en la respuesta HTTP cuál opción vale 1 y marcarla, independientemente de lo que haría realmente.
- `isGate` — señala la pregunta de disponibilidad real, que es filtro no compensable en la metodología.
- `weight`, `rubricCategory`, `scoreEligible` — metadata interna de puntuación.

Nota: los límites y etiquetas del deslizador **no son información sensible** y deben enviarse; la escala es visible en pantalla de todos modos. Lo que se protege es la equivalencia opción → puntaje.

El motivo no es de seguridad sino de validez del instrumento: la metodología establece que quien responde no debe conocer las reglas de corte, porque de lo contrario contesta apuntando al resultado deseado en vez de a lo que observa. Como el frontend no necesita estos campos para renderizar nada, omitirlos no tiene costo funcional.

### JSON canónico

Crea `backend/src/survey/survey-payload.builder.ts` que produzca exactamente esta forma:

```json
{
  "attemptId": "uuid",
  "subjectUserId": "uuid",
  "evaluationType": "AUTOEVALUACION",
  "submittedAt": "ISO-8601",
  "answers": [
    {
      "questionId": "uuid",
      "type": "MULTIPLE_CHOICE",
      "dimension": "USO_HERRAMIENTAS",
      "weight": 1,
      "value": 0.5,
      "text": null
    },
    {
      "questionId": "uuid",
      "type": "OPEN",
      "dimension": null,
      "weight": 0,
      "value": null,
      "text": "respuesta libre del usuario"
    }
  ]
}
```

Para `SLIDER`, `value` es el valor normalizado `(numericValue - minValue) / (maxValue - minValue)`, redondeado a 4 decimales.

Crea además `backend/src/survey/scoring.service.ts` con las firmas declaradas y cuerpo que lance `NotImplementedException`, documentadas con la fórmula prevista:

```ts
computeOverallScore(payload): number        // Σ(value·weight) / Σ(weight) × 100
computeDimensionScores(payload): Record<string, number>
resolveRank(score: number): string          // EXPLORADOR | USUARIO | IMPULSOR | EMBAJADOR
```

No implementes estos métodos en esta fase. Solo deben existir, tipados, con tests marcados como `it.todo`.

### Frontend encuesta

- `pages/SurveyPage.tsx` en la ruta `/survey`:
  - Carga las preguntas activas y las pagina de **5 en 5**.
  - Renderiza el control según tipo: radio group, textarea, o slider con etiquetas.
  - Botones Anterior / Siguiente; en la última página, "Ver mis resultados".
  - Mantiene las respuestas en estado local mientras se navega entre páginas.
  - Indicador de progreso (página X de Y).
  - Al enviar, llama a `submit` y navega a `/results`.
- `pages/ResultsPage.tsx` en `/results`: placeholder con el mensaje "En construcción", usando el layout y estilos existentes.
- En `WelcomePage.tsx`, el botón "Tomar la encuesta" deja de ser placeholder y navega a `/survey`. "Ver mis resultados" navega a `/results`.
- `services/survey.service.ts` para todas las llamadas.

---

## Restricciones

- No modifiques el flujo de autenticación con Entra ID más allá de agregar `appRole` al payload y al contexto.
- No corrijas el issue preexistente de `no-explicit-any` en `pages/AzureCallback.tsx`; es ajeno a esta tarea.
- No crees implementaciones paralelas de servicios, guards o componentes que ya existan. Extiende.
- Ninguna llamada HTTP ni lógica de acceso a datos dentro de archivos de página o de ruta.
- Todo dato que cruce módulos debe pasar por interfaces tipadas o DTOs.
- Genera migraciones de Prisma; no edites la base manualmente.

## Validación

Ejecuta, en este orden, y deja todo en verde:

```
cd backend  && npm run lint && npm run build && npm test
cd frontend && npm run lint && npm run build
```

## Criterios de aceptación

1. Un usuario con `appRole = USER` ve las pestañas ENCUESTA y RESULTADOS, y no puede acceder a `/admin/*` ni por URL directa.
2. Un usuario con `appRole = ADMIN` aterriza en `/admin/questions` tras el login y ve las tres pestañas.
3. Un admin crea preguntas de los tres tipos, con dimensión, peso y valores por opción; quedan persistidas.
4. Desactivar una pregunta la retira de la encuesta sin borrarla de la base ni afectar intentos previos.
5. Las preguntas son idénticas para todos los administradores; no hay aislamiento por admin ni por área.
6. El usuario responde la encuesta en páginas de 5 preguntas y al enviar se persisten respuestas con snapshot completo.
7. `payloadJson` se guarda en el intento y cumple exactamente la forma especificada.
8. `GET /survey/questions` cumple el contrato de exposición: envía `minValue`, `maxValue`, `stepValue` y etiquetas de los deslizadores, y no expone `options[].value`, `weight`, `rubricCategory`, `scoreEligible` ni `isGate` en ninguna circunstancia. Debe existir un test que verifique la ausencia de esos campos en la respuesta.
9. `/results` muestra "En construcción".
10. `scoring.service.ts` existe, compila y sus métodos están declarados sin implementar.
11. El campo `role String` de `User` permanece sin modificar, y ninguna decisión de autorización lo consulta.

## Entrega

Al terminar, reporta: migraciones creadas, archivos nuevos, archivos modificados, decisiones tomadas ante ambigüedades del repositorio, y cualquier punto donde el esquema existente haya obligado a desviarte de estas instrucciones.
