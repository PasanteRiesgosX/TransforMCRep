# Lineamientos Oficiales del Sistema de Evaluación de Multiplicadores — TransforMCRep

> **INSTRUCCIONES DIRECTAS PARA EL CHATBOT / ASISTENTE DE IA:**
> 1. **Fuente Única de Verdad:** Debes responder a las consultas del usuario basándote **exclusivamente** en la información contenida en este documento.
> 2. **Obligación de Citar:** En cada respuesta debes citar explícitamente la sección o subsección correspondiente (por ejemplo: `[Sección 1.1]`, `[Sección 5.2]`).
> 3. **Límite de Conocimiento:** Si la consulta del usuario no se encuentra descrita o respaldada en estos lineamientos, debes admitirlo cordialmente (por ejemplo: *"Cordialmente le informo que dicha consulta no se encuentra contemplada en los lineamientos vigentes del proyecto TransforMCRep."*). No inventes ni supongas reglas externas.

---

## Sección 1: Razón de Ser y Propósito del Proyecto

### 1.1 Objetivo General
El proyecto **TransforMCRep** (enmarcado en el programa de transformación digital de **Multicines S.A.**) tiene como razón de ser y propósito fundamental **identificar a personas clave (Multiplicadores / Champions) dentro de la organización** que cuenten con las aptitudes, mentalidad, disposición e iniciativa para aprender, aplicar y cultivar el uso de la Inteligencia Artificial (IA) y nuevas tecnologías en sus respectivos equipos de trabajo.

### 1.2 Importancia de los Multiplicadores en la Organización
La adopción tecnológica no ocurre de forma centralizada ni por imposición. Los multiplicadores actúan como puentes entre la estrategia digital (Célula Central / Comité de IA) y la operación diaria. Su función es acelerar la evangelización tecnológica, detectar oportunidades de mejora en sus áreas y fomentar una cultura de innovación responsable sin generar resistencia al cambio.

---

## Sección 2: Evolución de la Metodología (De la Propuesta Inicial al Sistema Web Digitalizado)

### 2.1 Propuesta Original (Metodología Manual de Dos Etapas)
En su concepción original, la selección de multiplicadores se planteó como una evaluación manual en dos etapas:
- **Etapa 1 (Nominación):** Aplicada por los jefes de área mediante 6 preguntas dicotómicas (Sí/No) divididas en 3 bloques (*Bloque A: Pensamiento disruptivo*, *Bloque B: Agente de cambio*, *Bloque C: Disponibilidad real*).
- **Etapa 2 (Validación):** Aplicada por la Célula Central mediante una rúbrica cualitativa en 4 categorías (*Conocimiento técnico fundamental*, *Aptitudinal*, *Innovación y criterio*, *Disponibilidad real*).

### 2.2 Transformación al Sistema Web Actual (`TransforMCRep`)
Para escalar de forma transparente, objetiva y automatizada, la metodología evolucionó a una **plataforma web integral autogestionada**. En la versión actual del proyecto:
- El proceso se centraliza en una **plataforma de autoevaluación digital** donde el usuario rinde la encuesta directamente en la aplicación web (`/survey`).
- La calificación combina un **motor determinista de cálculo matemático** con un **análisis cualitativo basado en Inteligencia Artificial (Gemini API)**.
- Se elimina la dependencia de formularios en papel o entrevistas manuales previas para la fase inicial.

---

## Sección 3: Creación y Configuración de Preguntas (Panel de Administración)

### 3.1 Tipos de Preguntas Permitidos
El sistema soporta únicamente dos tipos de preguntas activas para evaluar al usuario (`[Sección 3.1]`):
1. **Opción Múltiple (`MULTIPLE_CHOICE`):** El usuario selecciona una opción entre varias alternativas. Cada opción posee una ponderación o valor numérico interno ($0.0$, $0.5$, $1.0$, etc.).
2. **Escala / Slider (`SLIDER`):** El usuario selecciona un valor dentro de un rango numérico (limitado a escalas entre 1 y 10, con su respectivo paso/`stepValue` y etiquetas de mínimo/máximo).

### 3.2 Eliminación de Preguntas de Texto Abierto (`OPEN`)
Las preguntas de texto libre (`OPEN`) fueron **retiradas del motor de evaluación activa** del producto para garantizar la precisión automatizada del cálculo. Sin embargo, por integridad histórica y auditoría, las respuestas históricas de tipo `OPEN` permanecen resguardadas en la base de datos sin ser eliminadas físicamente.

### 3.3 Metadatos y Ponderación de Preguntas
Cada pregunta administrada posee los siguientes parámetros configurables (`[Sección 3.3]`):
- **Dimensión:** Dimensión organizativa a la que aporta (ej. *Comunicación*, *Pensamiento crítico*, *Liderazgo*, *Trabajo en equipo*, *Resolución de problemas*).
- **Categoría de Rúbrica (`rubricCategory`):** Categoría administrativa de desempeño.
- **Peso / Ponderación (`weight`):** Importancia relativa de la pregunta dentro de la encuesta. Escala decimal de **1 a 10** (permite decimales como `1.5`, `2.0`, `5.5`).
- **Índice de Orden (`orderIndex`):** Define el orden de aparición en la encuesta.
- **Estado Activo (`isActive`):** Permite habilitar o deshabilitar preguntas del cuestionario.

### 3.4 Preguntas Filtro o Gates (`isGate`)
Una pregunta marcada como `isGate = true` actúa como un **filtro binario de elegibilidad** (`[Sección 3.4]`):
- **Propósito:** Evalúa condiciones excluyentes (ej. disponibilidad de tiempo o requisitos mínimos).
- **Regla de Cálculo:** Las preguntas Gate **NO participan en el promedio ponderado del puntaje global ni en las dimensiones**. Se evalúan en un flujo independiente.
- **Gate de Opción Múltiple:** El administrador define qué opciones son aprobatorias (`isPassing = true`).
- **Gate de Slider:** El administrador define un umbral mínimo aprobatorio (`passingValue`).
- **Privacidad y Elegibilidad Interna (`isEligible`):** Si un usuario falla un Gate, el sistema registra internamente `isEligible = false`. **Esta condición nunca se le muestra de forma punitiva al usuario final**, garantizando que siempre reciba un feedback constructivo sobre su desempeño sin exponer filtros internos.

---

## Sección 4: Flujo de la Encuesta y Experiencia de Usuario

### 4.1 Paginación y Avance Unidireccional
- Las preguntas se muestran agrupadas en páginas de **máximo 5 preguntas por página** (`[Sección 4.1]`).
- **Progreso en una sola dirección:** El usuario no puede regresar a páginas anteriores que ya completó y guardó.
- Se exige que el usuario responda todas las preguntas de la página actual para habilitar el botón de navegación a la siguiente página.

### 4.2 Guardado Incremental y Reanudación de Sesión
- En cada cambio de página, las respuestas se persisten de forma autoincremental en la base de datos (`tabla Answer`).
- Si el usuario cierra la sesión o abandona la aplicación, al regresar es redirigido automáticamente a la página exacta en la que se quedó (`currentPage`), con sus respuestas pre-llenadas.

### 4.3 Regla del Intento Único (`SUBMITTED`)
- Cada usuario tiene permitido rendir la evaluación **una sola vez** (`[Sección 4.3]`).
- Al completar la última página, el botón cambia a **"Ver mis resultados"**. Al pulsarlo, el intento cambia a estado `SUBMITTED`, se bloquea cualquier modificación posterior y el usuario es redirigido a `/results`. Si intenta ingresar nuevamente a `/survey`, la aplicación lo enviará automáticamente a sus resultados.

---

## Sección 5: Motor de Evaluación y Cálculo de Resultados

### 5.1 Motor Determinista (Puntaje Global y Normalización)
El backend calcula el puntaje global del usuario mediante una fórmula determinista ponderada (`[Sección 5.1]`):

$$\text{Puntaje Global} = \frac{\sum (\text{Valor Normalizado}_i \times \text{Peso}_i)}{\sum \text{Peso}_i} \times 100$$

- **Normalización de respuestas:**
  - `MULTIPLE_CHOICE`: Se toma el valor asignado a la opción ($0.0$ a $1.0$).
  - `SLIDER`: Se normaliza la respuesta con la fórmula $\frac{\text{Valor Seleccionado} - \text{minValue}}{\text{maxValue} - \text{minValue}}$ (redondeado a 4 decimales en el payload).
- Las preguntas inactivas, no elegibles para puntaje o tipo Gate quedan excluidas de esta suma.

### 5.2 Escala de Rangos del Usuario (Tiers / Niveles)
De acuerdo a su puntaje global ($0\%$ a $100\%$), el usuario es clasificado en uno de los 4 rangos de desarrollo (`[Sección 5.2]`):

1. **EXPLORADOR (0% a 25%):** Nivel básico. Posee conocimientos iniciales. Es un momento propicio para explorar y capacitarse en los conceptos fundamentales.
2. **USUARIO (25.01% a 50%):** Nivel intermedio. Cuenta con bases sólidas y oportunidades claras de mejora para consolidar sus prácticas digitales.
3. **IMPULSOR (50.01% a 75%):** Nivel avanzado. Demuestra un alto dominio y capacidad de aplicación práctica, estando preparado para liderar iniciativas en su área.
4. **EMBAJADOR (75.01% a 100%):** Nivel referente. Es un modelo a seguir en la organización, que impulsa a otros y demuestra excelencia sostenida en el uso de herramientas tecnológicas.

### 5.3 Evaluación Cualitativa mediante Inteligencia Artificial (5 Competencias de IA)
Además del cálculo matemático determinista, al finalizar la encuesta el backend envía el payload canónico (que contiene el texto completo de las preguntas y las respuestas elegidas) a un modelo de Inteligencia Artificial (Gemini API) (`[Sección 5.3]`). La IA evalúa al usuario en **5 competencias clave de perfil (Buyer Persona)** asignando un porcentaje de $0\%$ a $100\%$ en cada una:

1. **Conocimiento general:** Grado de entendimiento de los conceptos de IA y tecnología.
2. **Uso de herramientas:** Capacidad práctica y frecuencia en el manejo de herramientas digitales.
3. **Identificación de oportunidades:** Habilidad para detectar ineficiencias y proponer soluciones con IA.
4. **Uso responsable:** Ética, seguridad y criterio en el manejo de datos y herramientas.
5. **Disposición para impulsar:** Proactividad y entusiasmo para motivar y guiar a sus compañeros.

---

## Sección 6: Interfaz Visual de Resultados y Reportes

### 6.1 Estructura a Dos Columnas (`/results`)
La pantalla de resultados del usuario está diseñada en dos columnas para ofrecer una retroalimentación visual clara e interactiva (`[Sección 6.1]`):

- **Columna Izquierda (Rango y Medidor de Silueta Humana):**
  - **Tarjeta de Rango:** Muestra el nivel alcanzado (*Explorador, Usuario, Impulsor o Embajador*), su ícono distintivo y su descripción motivacional.
  - **Medidor Global (Termómetro de Silueta Humana):** Un recipiente gráfico en forma de silueta de persona (cabeza, torso y extremidades continuas) que al ingresar a la página se llena gradualmente de líquido de colores (degradado naranja a cyan) hasta alcanzar la altura correspondiente al puntaje global del usuario, acompañado de marcas para los 4 rangos.
- **Columna Derecha (Perfil de Competencias de IA):**
  - Muestra 5 barras de progreso horizontales con íconos vectoriales y porcentajes que representan el nivel obtenido en cada una de las 5 competencias cualitativas evaluadas por la IA.

### 6.2 Separación de Reportes Usuario vs. Administración
- **Vista Usuario (`/results`):** Enfocada exclusivamente en el desarrollo personal, su rango de multiplicador y sus 5 competencias de IA.
- **Vista Administración / RRHH:** Los desgloses tradicionales por dimensiones administrativas (*Comunicación, Liderazgo, Competencia Técnica*, etc.) y los filtros de elegibilidad interna (`isEligible`) se reservan para paneles analíticos de RRHH y gerencia, evitando sobrecargar o sesgar al usuario final.

---

## Sección 7: Resumen de Reglas y Preguntas Frecuentes

| Consulta Frecuente | Regla Oficial del Sistema | Sección de Referencia |
| :--- | :--- | :--- |
| **¿Cuál es el fin del sistema?** | Identificar personas en Multicines capaces de adoptar e impulsar la Inteligencia Artificial y la transformación digital en sus áreas. | `[Sección 1.1]` |
| **¿El usuario puede repetir la encuesta?** | No. El sistema limita estrictamente a 1 intento enviado (`SUBMITTED`) por usuario. | `[Sección 4.3]` |
| **¿Puedo navegar hacia atrás en la encuesta?** | No. El avance es unidireccional por páginas de máximo 5 preguntas. | `[Sección 4.1]` |
| **¿Qué pasa si cierro el navegador a mitad de encuesta?** | Tu progreso se guarda automáticamente. Al volver entrarás en la página donde te quedaste. | `[Sección 4.2]` |
| **¿Cuáles son los 4 rangos de usuario?** | Explorador (0-25%), Usuario (25.01-50%), Impulsor (50.01-75%) y Embajador (75.01-100%). | `[Sección 5.2]` |
| **¿Las preguntas Gate afectan mi promedio?** | No. Las preguntas Gate son filtros binarios y no suman ni restan al puntaje numérico ni a las dimensiones. | `[Sección 3.4]` |
| **¿Qué tipos de preguntas existen?** | Opción Múltiple (`MULTIPLE_CHOICE`) y Sliders (`SLIDER`). Las de texto abierto (`OPEN`) están deshabilitadas. | `[Sección 3.1]` |
| **¿Cómo evalúa la IA al usuario?** | Analiza el texto de tus preguntas y respuestas para calificar 5 competencias cualitativas de 0 a 100%. | `[Sección 5.3]` |




---
*Fin de los lineamientos oficiales del sistema TransforMCRep — Multicines S.A.*