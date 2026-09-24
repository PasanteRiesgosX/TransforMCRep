# Prompt para agente de codificación — TransforMCRep · Fase 2

## Contexto

Trabajas en el repositorio **TransforMCRep**, cuya Fase 1 implementó autenticación, roles, administración global de preguntas, encuesta, persistencia de intentos, snapshots de respuestas y `payloadJson` canónico.

Antes de escribir código, lee:

- `CLAUDE.md`.
- `FRONTEND_CODING_STANDARDS.md`.
- `backend/prisma/schema.prisma`.
- `backend/src/survey/` completo.
- `backend/src/admin/questions/` completo.
- `frontend/src/App.tsx`.
- `frontend/src/pages/survey/SurveyPage.tsx`.
- `frontend/src/pages/admin/AdminQuestionsPage.tsx`.
- `frontend/src/components/admin/QuestionFormModal.tsx`.
- `frontend/src/services/`.

Verifica primero el estado real del repositorio. No asumas que el prompt de Fase 1 coincide exactamente con la implementación actual. Conserva los datos históricos y no reviertas cambios existentes.

## Objetivo de la Fase 2

Construir el motor determinista tradicional, sin Inteligencia Artificial, que procese el intento enviado por el usuario y produzca:

1. Puntaje global normalizado entre `0` y `100`.
2. Puntaje porcentual independiente por dimensión.
3. Rango determinista basado en el puntaje global.
4. Estado interno de elegibilidad derivado de preguntas gate.
5. Flags internos explicando por qué un usuario no es elegible.
6. Resultados visuales en `/results`, incluyendo rango, descripción estática y gráfico radar.

La misma entrada debe producir siempre exactamente el mismo resultado. No uses IA, aleatoriedad ni interpretaciones de lenguaje natural.

## Alcance y exclusiones

Incluido:

- Motor matemático determinista en backend.
- Evaluación de gates.
- Cálculo global y por dimensión.
- Rangos configurados en código o en una estructura claramente versionada.
- Flags de elegibilidad internos.
- Persistencia o exposición segura del resultado necesario para `/results`.
- Pantalla visual de resultados.
- Tests unitarios y de integración.

Fuera de alcance:

- Integración con IA.
- Recomendaciones generadas automáticamente.
- Panel analítico administrativo.
- Edición de rangos desde la interfaz.
- Mostrar al usuario si fue considerado apto o no apto.

## Reglas de ponderación

Cada pregunta puntuable tiene:

- `value`: valor normalizado entre `0` y `1`.
- `weight`: importancia relativa de la pregunta.

La escala administrativa de peso será decimal y estará limitada a `1` hasta `10`, incluyendo decimales como `1.1`, `1.2`, `5.5`, etc.

Reglas:

- Peso mínimo: `1`.
- Peso máximo: `10`.
- Se permiten decimales.
- El backend es la autoridad y debe rechazar pesos fuera del rango.
- El frontend debe usar un input numérico con `min="1"`, `max="10"` y un `step` adecuado.
- No es necesario que la suma de pesos sea `10`.
- La suma depende de cuántas preguntas existan; la fórmula normaliza usando la suma real de pesos.
- No redondees prematuramente los pesos. Usa precisión decimal suficiente y redondea solo en la salida definida por el contrato.

### Puntaje global

Para preguntas puntuables normales, excluyendo gates, preguntas inactivas y cualquier pregunta no puntuable:

$$
PuntajeGlobal =
\frac{\sum(valor_i \times peso_i)}{\sum peso_i}
\times 100
$$

El resultado debe estar entre `0` y `100`.

Si no existen preguntas puntuables válidas, no inventes un `0%`: devuelve un estado explícito de ausencia de datos según el contrato de resultados y evita dividir entre cero.

## Preguntas abiertas

Las preguntas de tipo `OPEN` quedan eliminadas del producto.

Debes:

- Retirarlas del frontend de administración.
- Retirarlas de los DTOs de creación y actualización.
- Rechazar `OPEN` en el backend.
- Retirarlas de los controles de encuesta.
- Retirarlas de los tipos/interfaces frontend.
- Crear las migraciones necesarias sin borrar físicamente respuestas históricas.
- Mantener la compatibilidad de lectura con snapshots históricos si el esquema lo requiere.

Antes de eliminar columnas o datos, inspecciona la base y las migraciones existentes. Si una eliminación física pudiera romper datos históricos, conserva la columna histórica y bloquea su uso nuevo, documentando la decisión.

Los únicos tipos nuevos de pregunta permitidos serán:

- `MULTIPLE_CHOICE`.
- `SLIDER`.

## Preguntas gate

Una pregunta `isGate` es un filtro binario de elegibilidad, no una pregunta normal de puntuación.

Flujo:

1. Se evalúan todas las preguntas gate activas.
2. Se determina si cada respuesta cumple la condición aprobatoria configurada.
3. Si falla al menos un gate, el estado interno de elegibilidad es `false`.
4. El puntaje global y los puntajes por dimensión se calculan igualmente.
5. Los gates nunca participan en el promedio ponderado ni en el radar.
6. El resultado interno debe conservar flags identificando los gates fallidos.
7. El usuario normal no debe ver `isEligible`, `NO_APTO`, `gateFailed`, los criterios correctos ni las respuestas aprobatorias en `/results` ni en la respuesta pública de la encuesta.
8. El flujo visual del usuario continúa normalmente y muestra sus resultados de desempeño aunque internamente no sea elegible.

Ejemplo:

```text
¿El candidato tiene disponibilidad?
Sí -> gate aprobado
No -> gate fallido, elegibilidad interna false
```

Un puntaje global de `95` no puede cambiar el resultado interno de un gate fallido.

### Gate de opción múltiple

Cuando el administrador marca `isGate` en una pregunta `MULTIPLE_CHOICE`:

- La interfaz debe mostrar el texto: `Selecciona la respuesta correcta`.
- Cada opción debe tener un control para marcarla como aprobatoria.
- Debe permitirse una o varias respuestas aprobatorias.
- La selección debe ser compatible con control + click si se usa una interacción tipo lista; también debe ser accesible con teclado.
- Debe existir al menos una opción aprobatoria.
- Una respuesta del usuario aprueba si la opción seleccionada pertenece al conjunto de opciones aprobatorias.
- No debe enviarse al usuario encuestado qué opciones son aprobatorias.
- El valor de puntuación de las opciones sigue siendo metadata interna y no debe exponerse en `GET /survey/questions`.

Añade al esquema el campo necesario para persistir las opciones aprobatorias, preferiblemente mediante una relación o estructura explícita que conserve integridad referencial. No uses texto libre separado por comas ni dependas del orden de las opciones.

### Gate de slider

Cuando el administrador marca `isGate` en una pregunta `SLIDER`:

- Debe aparecer un campo `valor aprobatorio`.
- El valor aprobatorio debe pertenecer a la escala del slider.
- Debe respetar `minValue`, `maxValue` y `stepValue`.
- Define y documenta la semántica: el valor seleccionado debe ser mayor o igual al umbral aprobatorio para aprobar el gate.
- Guarda el umbral en la pregunta; no lo envíes al encuestado.

Ejemplo:

```text
minValue: 1
maxValue: 10
stepValue: 1
valor aprobatorio: 7

7, 8, 9 y 10 -> aprobado
1 a 6 -> fallido
```

Si el negocio necesita una comparación distinta en el futuro, encapsúlala en una función explícita y no la mezcles con el cálculo global.

### Dimensión y categoría de los gates

Los gates no miden una competencia y no pertenecen a una dimensión de desempeño.

Cuando `isGate = true`:

- Forzar `dimension` a `No aplica` o `null`, usando la convención real del repositorio.
- Forzar `rubricCategory` a `No aplica` o `null`.
- Bloquear ambos selectores en el frontend.
- Limpiar valores previos al cambiar una pregunta normal a gate.
- Al desmarcar `isGate`, no recuperar valores anteriores automáticamente; el administrador debe seleccionarlos de nuevo.
- El backend debe imponer esta regla aunque se envíe una petición manipulada desde fuera del frontend.

Cuando `isGate = false`:

- `dimension` debe ser obligatoria para preguntas puntuables.
- `rubricCategory` debe cumplir la regla definida por el esquema de Fase 1.

## Validación de sliders

Las preguntas `SLIDER` deben conservar su normalización actual y quedar limitadas a escalas entre `1` y `10`.

Reglas de creación y edición:

- `minValue >= 1`.
- `maxValue <= 10`.
- `minValue <= 10`.
- `maxValue >= 1`.
- `minValue < maxValue`.
- `stepValue > 0`.
- El rango debe ser compatible con el paso: `(maxValue - minValue) % stepValue === 0` cuando se usen valores enteros.
- El valor aprobatorio de un gate slider debe estar dentro del rango y alineado al paso.
- El valor respondido debe estar entre mínimo y máximo.
- El valor respondido debe respetar el paso configurado.
- Rechazar valores fuera de rango, pasos incompatibles y respuestas manipuladas.

Se permiten escalas menores como `1` a `5`; no se permiten valores fuera de `1` a `10`.

La normalización será:

$$
valorNormalizado =
\frac{valorSeleccionado - minValue}{maxValue - minValue}
$$

Redondea el valor normalizado a cuatro decimales en el payload canónico. El `stepValue` determina los saltos disponibles del control, pero no cambia la fórmula.

Si el repositorio mantiene `minValue`, `maxValue` y `stepValue` como enteros, conserva esa decisión y valida enteros. Si se decide permitir pasos decimales, realiza una migración y actualiza DTOs, formulario, validación y tests de forma coherente.

## Dimensiones

Las dimensiones se calculan de forma independiente usando solo preguntas:

- Activas.
- No gate.
- Puntuables.
- Con peso válido mayor que cero.
- Con una respuesta válida.

Para cada dimensión existente:

$$
PuntajeDimension =
\frac{\sum(valor_i \times peso_i)}{\sum peso_i}
\times 100
$$

Reglas críticas:

- Una dimensión sin preguntas válidas no debe producir `0%`.
- Una dimensión sin preguntas debe omitirse completamente del resultado y del radar.
- Una dimensión con preguntas válidas cuyo resultado sea mínimo sí debe aparecer con `0%`.
- No uses una lista fija de dimensiones para rellenar ceros.
- La lista de dimensiones debe derivarse de las preguntas configuradas y válidas.
- Las preguntas gate nunca aparecen en el radar.
- Si una dimensión tiene preguntas, pero ninguna respuesta válida, aplica una política explícita de respuestas incompletas y documentada; no conviertas silenciosamente la ausencia en cero.

## Rangos

Implementa rangos deterministas y versionados. Como configuración inicial:

- `0` a `40`: `PRINCIPIANTE`.
- Más de `40` hasta `75`: `INTERMEDIO`.
- Más de `75` hasta `100`: `AVANZADO`.

Define los límites sin ambigüedad y prueba los bordes `40`, `40.01`, `75`, `75.01` y `100`.

La descripción de cada rango debe estar quemada en el frontend o en una configuración estática versionada, no generada por IA. Por ejemplo:

- `PRINCIPIANTE`: descripción fija de fortalezas iniciales y áreas de desarrollo.
- `INTERMEDIO`: descripción fija de bases consolidadas y oportunidades de mejora.
- `AVANZADO`: descripción fija de dominio y capacidad de aplicación.

No muestres al usuario información interna de elegibilidad dentro de estas descripciones.

## Contratos backend

Extiende `ScoringService` con tipos explícitos, no uses `any` para los nuevos contratos.

Como mínimo, define estructuras equivalentes a:

```ts
type ScoreInput = {
  questionId: string;
  type: 'MULTIPLE_CHOICE' | 'SLIDER';
  dimension: string | null;
  weight: number;
  value: number | null;
  isGate: boolean;
  gatePassed?: boolean;
};

type DimensionScore = {
  dimension: string;
  score: number;
  questionCount: number;
};

type DeterministicResult = {
  overallScore: number | null;
  range: 'PRINCIPIANTE' | 'INTERMEDIO' | 'AVANZADO' | null;
  dimensions: DimensionScore[];
  internalEligibility: {
    isEligible: boolean;
    failedGateIds: string[];
  };
};
```

Adapta estos tipos a los contratos reales del repositorio.

El servicio debe:

- Leer únicamente snapshots confiables del intento y los datos internos necesarios.
- Rechazar o ignorar respuestas inválidas según una política documentada.
- Evitar divisiones entre cero.
- Redondear resultados de forma consistente.
- No exponer al frontend los pesos, valores de opción, respuestas correctas ni reglas internas.
- Ser idempotente: recalcular el mismo intento produce el mismo resultado.

No confíes en que el frontend haya calculado el valor. El backend debe reconstruir o validar los valores contra la configuración almacenada y el snapshot del intento.

## API y resultados

Implementa un endpoint autenticado para obtener los resultados del usuario actual, por ejemplo `GET /survey/results` o el nombre que mejor encaje con la arquitectura existente.

Reglas:

- Solo devuelve resultados del usuario autenticado.
- No permite consultar resultados de otro usuario por cambiar un ID.
- Devuelve el puntaje global, rango, descripción o clave de descripción y dimensiones para el radar.
- No devuelve `isEligible`, `failedGateIds`, `isGate`, pesos, valores internos, opciones correctas ni umbrales.
- Si no existe un intento enviado, devuelve un estado manejable, no una excepción genérica.
- Define qué intento se consulta si existe más de uno; usa una regla explícita y documentada.

La respuesta pública debe tener únicamente los datos necesarios para la pantalla, por ejemplo:

```json
{
  "overallScore": 82.4,
  "range": "AVANZADO",
  "description": "...",
  "dimensions": [
    { "dimension": "Comunicación", "score": 90, "questionCount": 3 },
    { "dimension": "Liderazgo", "score": 40, "questionCount": 2 }
  ]
}
```

## Pantalla `/results`

Construye la página de resultados usando el layout existente y respetando `FRONTEND_CODING_STANDARDS.md`.

Debe mostrar:

1. Puntaje global normalizado.
2. Rango alcanzado.
3. Descripción estática correspondiente al rango.
4. Radar con solo las dimensiones que tienen preguntas válidas.
5. Estado de carga.
6. Estado sin intento enviado.
7. Estado de error.
8. Diseño responsive.

No debe mostrar:

- La etiqueta interna `NO_APTO`.
- `isEligible`.
- Gates fallidos.
- Pesos.
- Valores internos de opciones.
- Umbrales de aprobación.

Usa una librería de gráficos existente o instala una librería apropiada, preferiblemente `recharts` si encaja con el stack. No dibujes un radar manualmente si una librería estable resuelve el problema.

El radar no debe crear ejes para dimensiones inexistentes. Si no hay dimensiones puntuables, muestra un estado informativo en lugar de un gráfico vacío o engañoso.

## Eliminación de `OPEN`

Actualiza de forma coherente:

- Prisma y migraciones necesarias.
- DTOs backend.
- Validaciones del service.
- Serialización del payload.
- Servicio y tipos frontend.
- Formulario de administración.
- Renderizado de encuesta.
- Tests.

No borres físicamente `Answer` ni `SurveyAttempt` históricos. Si existen snapshots de preguntas abiertas, deben seguir siendo legibles para preservar la integridad histórica, aunque no se puedan crear nuevas preguntas `OPEN`.

## Migraciones y compatibilidad

Genera migraciones Prisma; no edites la base manualmente.

Antes de migrar:

- Revisa migraciones existentes.
- Determina si ya existen preguntas o respuestas de tipo `OPEN`.
- Evita una migración destructiva si hay datos históricos.
- Añade los campos necesarios para gates de opción múltiple y slider.
- Usa nombres coherentes con Prisma y el código existente.
- Actualiza el cliente Prisma después de la migración.

Si una ambigüedad requiere elegir entre dos diseños, documenta la decisión en la entrega y en un comentario breve junto al contrato afectado.

## Tests obligatorios

Backend:

- Normalización de slider con escalas `1-10` y `1-5`.
- Rechazo de slider fuera de `1-10`.
- Rechazo de `minValue >= maxValue`.
- Rechazo de paso no positivo.
- Rechazo de rango incompatible con el paso.
- Rechazo de respuesta slider fuera de rango.
- Rechazo de respuesta slider que no respeta el paso.
- Puntaje global con pesos iguales.
- Puntaje global con pesos diferentes.
- Confirmación de que multiplicar todos los pesos por la misma constante no altera el resultado.
- Puntajes por dimensión.
- Dimensión sin preguntas omitida.
- Dimensión con resultado real `0` conservada.
- Gates de opción múltiple con una respuesta aprobatoria.
- Gates de opción múltiple con varias respuestas aprobatorias.
- Gate slider con umbral aprobatorio.
- Gate fallido cambia la elegibilidad interna.
- Gate excluido del promedio y del radar.
- Resultado público no expone datos internos.
- Intento inexistente o no enviado.
- Límites de rangos.
- Idempotencia del cálculo.

Frontend:

- El formulario elimina la opción `OPEN`.
- Al activar `isGate`, dimensión y categoría quedan en `No aplica` y deshabilitadas.
- Un gate múltiple permite seleccionar una o varias opciones aprobatorias.
- Un gate slider muestra y valida el valor aprobatorio.
- El formulario limita peso a `1-10` y permite decimales.
- El radar no renderiza dimensiones ausentes.
- La página muestra estados de carga, error y ausencia de datos.

## Validación final

Ejecuta y reporta cada comando y su resultado:

```text
cd backend
npm run lint
npm run build
npm test

cd frontend
npm run lint
npm run build
```

Si existe un error preexistente, sepáralo de los errores introducidos por la Fase 2 y no lo ocultes desactivando reglas globales.

## Criterios de aceptación

1. El motor produce siempre el mismo resultado para los mismos datos.
2. El puntaje global está normalizado entre `0` y `100`.
3. Los pesos válidos están entre `1` y `10` y aceptan decimales.
4. Cambiar la cantidad de preguntas no rompe la normalización.
5. Las dimensiones sin preguntas no aparecen como `0%`.
6. Las dimensiones con preguntas y resultado `0%` sí aparecen.
7. Los gates se evalúan aparte y no alteran el promedio numérico.
8. Un gate fallido marca la elegibilidad interna como falsa.
9. La información de no elegibilidad no se expone al usuario normal.
10. Los gates no aparecen en dimensiones ni radar.
11. Los gates de opción múltiple permiten una o varias respuestas aprobatorias.
12. Los gates slider tienen un umbral guardado, válido y no visible para el encuestado.
13. Los sliders respetan límites `1-10`, escalas menores como `1-5`, rango y paso.
14. Las preguntas `OPEN` ya no pueden crearse ni responderse.
15. `/results` muestra puntaje, rango, descripción fija y radar.
16. El radar solo representa dimensiones configuradas y puntuables.
17. Los resultados pertenecen únicamente al usuario autenticado.
18. El backend no confía en cálculos enviados por el frontend.
19. Existen migraciones y tests para los cambios.
20. La validación final queda documentada con los comandos ejecutados y cualquier deuda preexistente.

## Entrega

Al terminar, reporta:

- Migraciones creadas.
- Archivos nuevos.
- Archivos modificados.
- Contratos y fórmulas implementados.
- Política de rangos elegida.
- Política de respuestas incompletas elegida.
- Diseño usado para almacenar respuestas aprobatorias de gates.
- Tratamiento de datos históricos `OPEN`.
- Decisiones ante ambigüedades del repositorio.
- Tests ejecutados y resultados.
- Cualquier limitación o deuda que deba pasar a Fase 3.
