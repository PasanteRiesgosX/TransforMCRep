# Estandares para construir frontend

## Proposito

Este documento define las reglas esperadas para construir y mantener interfaces frontend de forma predecible, reutilizable y facil de mantener.

Su objetivo es evitar que varias tecnologias de estilos compitan entre si, reducir los efectos visuales inesperados y permitir que cualquier desarrollador o agente de IA entienda rapidamente donde debe realizar cada cambio.

Estas reglas son generales. Pueden aplicarse a proyectos que utilicen Tailwind CSS, CSS tradicional, React u otros frameworks con una arquitectura de componentes.

---+

## 1. Principio fundamental: una fuente de verdad

Cada decision visual debe tener una fuente de verdad claramente identificable.

No se debe definir el mismo comportamiento en varios lugares al mismo tiempo.

Ejemplos de fuentes de verdad duplicadas que deben evitarse:

```tsx
<button className="py-8 px-6" style={{ padding: '1rem 1.5rem' }}>
  Continuar
</button>
```

```css
/* CSS global */
button {
  width: 100%;
}
```

```tsx
<button className="w-auto">Continuar</button>
```

En estos ejemplos no queda claro cual debe ser el ancho o el padding final. La clase, el estilo inline y el CSS global compiten por controlar el mismo componente.

### Regla

Para cada propiedad visual, elegir una sola fuente principal:

- Tailwind para layout, spacing, responsive y estados de componentes.
- CSS propio para efectos complejos y componentes visuales definidos explicitamente.
- `@theme` para tokens del sistema de diseno.
- Estilos inline solamente para valores dinamicos.

---

## 2. Elegir una estrategia de estilos

Un proyecto debe definir antes de comenzar si utilizara:

- Tailwind como sistema principal.
- CSS Modules como sistema principal.
- CSS tradicional con una metodologia clara.
- Una combinacion cuidadosamente delimitada.

No se debe mezclar Tailwind y CSS tradicional de forma accidental o improvisada.

### Recomendacion para proyectos con Tailwind

Cuando Tailwind es el sistema principal:

- Las pantallas deben construirse principalmente con clases Tailwind.
- El layout debe permanecer en el JSX o HTML mediante clases Tailwind.
- El CSS global debe ser pequeno y tener responsabilidades claras.
- Las clases personalizadas deben reservarse para comportamientos complejos.
- No se deben crear copias CSS de utilidades que Tailwind ya proporciona.

### No confundir combinacion con mezcla descontrolada

Usar Tailwind y CSS propio en el mismo proyecto es valido. Lo incorrecto es que ambos intenten controlar las mismas propiedades del mismo elemento sin una razon documentada.

Una combinacion sana puede ser:

```tsx
<div className="flex min-h-screen items-center justify-center glass-panel">
  ...
</div>
```

En este ejemplo:

- Tailwind controla el layout y el tamano.
- `glass-panel` controla un efecto visual complejo.

---

## 3. Reglas para Tailwind CSS

### Usar Tailwind para layout y componentes

Utilizar clases Tailwind para:

- `display`: `flex`, `grid`, `block`, `hidden`.
- Alineacion: `items-*`, `justify-*`, `content-*`.
- Dimensiones: `w-*`, `h-*`, `min-w-*`, `max-w-*`, `min-h-*`, `max-h-*`.
- Espaciado: `p-*`, `px-*`, `py-*`, `m-*`, `mx-*`, `my-*`, `gap-*`.
- Responsive design: `sm:`, `md:`, `lg:`, `xl:`.
- Colores, fondos, bordes y sombras.
- Estados: `hover:`, `focus:`, `focus-visible:`, `active:`, `disabled:`.
- Tipografia y truncamiento.
- Posicionamiento y capas cuando forman parte del layout del componente.

Ejemplo:

```tsx
<button className="flex w-full max-w-sm items-center justify-center gap-2 rounded-lg px-6 py-4 font-semibold transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50">
  Continuar
</button>
```

### No redefinir utilidades de Tailwind

No declarar en CSS clases con nombres que ya son utilidades oficiales de Tailwind:

```css
/* Incorrecto */
.flex { ... }
.container { ... }
.text-white { ... }
.p-4 { ... }
.animate-spin { ... }
```

Esto genera colisiones, comportamiento dependiente del orden de carga y multiples fuentes de verdad.

Si se necesita un comportamiento diferente, utilizar un nombre propio:

```css
/* Correcto */
.login-panel { ... }
.app-glass-panel { ... }
.brand-logo-bounce { ... }
```

### No sobrescribir utilidades desde CSS global

Evitar reglas globales que modifiquen dimensiones, espaciado o layout de elementos que se controlan con Tailwind:

```css
/* Peligroso */
button {
  padding: 0.5rem;
  width: 100%;
}
```

Si un boton debe ser ancho o tener un padding concreto, expresarlo en su componente:

```tsx
<button className="w-full px-6 py-4">Guardar</button>
```

### No depender de valores cada vez mayores

Si `px-6` o `py-8` no producen ningun cambio, no asumir automaticamente que se necesita `px-20` o `py-20`.

Primero buscar:

- Estilos inline.
- Reglas globales.
- CSS fuera de capa.
- Clases duplicadas.
- Restricciones del elemento padre.
- `max-w-*`, `max-h-*`, `overflow-hidden` o `flex-shrink`.
- Reglas con `!important`.

---

## 4. Reglas para `@theme` y tokens

Un token es un valor de diseno reutilizable y con nombre, como un color de marca, una fuente, una escala o una animacion.

Ejemplo:

```css
@theme {
  --color-brand-primary: #ffabf3;
  --font-body: "Inter", sans-serif;
  --animate-fade-in: fadeIn 0.4s ease-out;
}
```

### Usar tokens para decisiones compartidas

Definir tokens para:

- Colores de marca.
- Colores semanticos.
- Tipografias.
- Espaciado especial reutilizado.
- Sombras de marca.
- Radios de borde consistentes.
- Animaciones propias reutilizables.

### No duplicar tokens existentes

No redefinir con CSS tradicional un token o utilidad que ya existe en Tailwind:

```css
/* Incorrecto si animate-spin ya pertenece a Tailwind */
--animate-spin: spin 1s linear infinite;

.animate-spin {
  animation: spin 1s linear infinite;
}
```

Si se necesita una animacion diferente, crear un nombre propio:

```css
@theme {
  --animate-brand-pulse: brandPulse 1.2s ease-in-out infinite;
}
```

### Una definicion por token

Cada token debe definirse una sola vez. Si se modifica un color o una fuente, el cambio debe realizarse en el lugar donde se define el token, no mediante overrides dispersos.

---

## 5. Uso correcto de `index.css` o CSS global

El archivo CSS global debe existir cuando el proyecto lo necesita. Su responsabilidad no es reemplazar Tailwind, sino servir como punto de entrada y configuracion global.

Puede contener:

1. Importacion del framework de estilos.
2. Tokens en `@theme`.
3. Estilos globales del documento.
4. Fuentes y configuracion de renderizado.
5. Animaciones propias.
6. Clases para efectos visuales complejos.

Ejemplo recomendado:

```css
@import "tailwindcss";

@theme {
  --color-brand-primary: #ffabf3;
  --font-body: "Inter", sans-serif;
}

@layer base {
  body {
    font-family: var(--font-body);
    background-color: #101010;
  }
}

.brand-glass-panel {
  background: rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.12);
}
```

### Usar capas CSS

Cuando el CSS personalizado convive con Tailwind, organizarlo mediante capas:

- `@layer base`: estilos base del documento.
- `@layer components`: componentes CSS reutilizables.
- `@layer utilities`: utilidades propias muy especificas.

Evitar reglas globales fuera de capa que puedan competir con las utilidades generadas por Tailwind.

### Evitar resets innecesarios

Si Tailwind ya incluye un reset base, no agregar otro reset general sin una necesidad demostrable:

```css
/* Evitar como regla general */
*,
*::before,
*::after {
  margin: 0;
  padding: 0;
}
```

Un reset global puede eliminar el espacio que las clases Tailwind intentan aplicar o cambiar el comportamiento de elementos que no fueron revisados.

---

## 6. Animaciones y `@keyframes`

### Animaciones oficiales

Si el framework ya ofrece una utilidad, utilizarla directamente:

```tsx
<div className="animate-spin" />
```

No crear una segunda `.animate-spin` en CSS.

### Animaciones propias

Las animaciones propias deben tener nombres especificos del producto o del componente:

```css
@keyframes brandLogoBounce {
  0% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
  100% { transform: translateY(0); }
}

.brand-logo-bounce {
  animation: brandLogoBounce 0.75s ease-in-out;
}
```

### Animaciones como tokens

Cuando una animacion propia se utiliza mediante clases Tailwind, registrarla como token:

```css
@theme {
  --animate-brand-fade: brandFade 0.4s ease-out;
}
```

Usarla asi:

```tsx
<div className="animate-brand-fade" />
```

El objetivo es que la animacion propia tenga un nombre propio y una unica definicion.

---

## 7. Estilos inline

Los estilos inline deben ser la excepcion, no el sistema principal.

### Usarlos solamente para valores dinamicos

Son apropiados cuando el valor se calcula durante la ejecucion:

```tsx
<div style={{ transform: `translate(${x}px, ${y}px)` }} />
```

Otros casos validos:

- Coordenadas calculadas por interaccion.
- Valores provenientes de datos o configuracion.
- Colores seleccionados por el usuario.
- Dimensiones calculadas en tiempo de ejecucion.
- Propiedades CSS customizadas que reciben valores dinamicos.

### No duplicar valores estaticos

Evitar:

```tsx
<button className="py-8 px-6" style={{ padding: '1rem 1.5rem' }}>
  Continuar
</button>
```

Elegir una sola opcion:

```tsx
<button className="px-6 py-4">Continuar</button>
```

O, si el valor es realmente dinamico:

```tsx
<button style={{ padding: `${verticalPadding}px ${horizontalPadding}px` }}>
  Continuar
</button>
```

### Los estilos inline tienen alta prioridad

Un estilo inline puede imponerse sobre utilidades normales de Tailwind. Por eso puede provocar que modificar `py-*`, `px-*`, `w-*` o `h-*` no produzca ningun cambio visible.

Antes de modificar una clase, buscar si el mismo elemento tiene un `style={{ ... }}` que controle la propiedad.

---

## 8. Layout, dimensiones y botones

### Revisar el contexto del elemento

El tamaño de un boton depende de su propio estilo y de su contenedor.

Revisar siempre:

- `w-*`, `min-w-*`, `max-w-*`.
- `h-*`, `min-h-*`, `max-h-*`.
- `p-*`, `px-*`, `py-*`.
- `line-height` y tamano de fuente.
- `display`, `flex`, `grid` y alineacion.
- `flex-shrink` y `flex-grow`.
- Restricciones del padre.
- `overflow-hidden`.
- `box-sizing`.

### Diferenciar ancho, alto y padding

- `w-*`: ancho.
- `h-*`: alto.
- `px-*`: espacio interno horizontal.
- `py-*`: espacio interno vertical.
- `mx-*` y `my-*`: espacio externo.
- `gap-*`: espacio entre hijos flex o grid.

Un boton puede ser ancho y bajo, o estrecho y alto. Modificar el ancho no modifica automaticamente la altura.

### Botones reutilizables

Los botones compartidos deben tener una API clara y no depender de reglas globales:

```tsx
<Button variant="primary" size="lg">
  Continuar
</Button>
```

El componente debe controlar sus valores base. La pantalla debe controlar solamente las variaciones justificadas.

---

## 9. Iconos y elementos posicionados

Los iconos posicionados de forma absoluta deben tener un contenedor de referencia y espacio reservado.

Patron recomendado:

```tsx
<div className="relative w-full">
  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">
    icon
  </span>
  <input className="w-full py-3 pl-12 pr-4" />
</div>
```

Reglas:

1. El padre debe ser `relative`.
2. El icono debe ser `absolute`.
3. El campo debe reservar espacio con `pl-*`.
4. El icono no debe bloquear la interaccion con `pointer-events-none` cuando corresponda.
5. La posicion del icono y el padding del campo deben revisarse juntos.
6. No usar offsets arbitrarios para compensar un padding sobrescrito.

---

## 10. Estructura de carpetas

La estructura debe reflejar la responsabilidad del codigo.

Una estructura general recomendada:

```text
src/
├── assets/
├── components/
│   ├── layout/
│   ├── ui/
│   ├── forms/
│   ├── feedback/
│   └── navigation/
├── pages/
├── features/
├── hooks/
├── services/
├── lib/
├── types/
├── utils/
├── App.tsx
├── main.tsx
└── index.css
```

### `components/layout/`

Componentes que organizan la estructura de una pagina:

- Headers.
- Sidebars.
- Footers.
- Layouts autenticados.
- Wrappers de contenido.

No deben contener logica visual especifica de una sola pantalla si puede vivir en un componente de UI.

### `components/ui/`

Componentes atomicos y reutilizables:

- Button.
- Input.
- Select.
- Modal.
- Badge.
- Avatar.
- Spinner.
- Logo.

Deben tener APIs pequenas, tipadas y predecibles.

### `components/forms/`

Componentes relacionados con formularios:

- Campos compuestos.
- Selectores con iconos.
- Mensajes de validacion.
- Grupos de formulario.

### `components/feedback/`

Componentes para estados de comunicacion:

- Alertas.
- Toasts.
- Loaders.
- Estados vacios.
- Mensajes de error.

### `pages/`

Componentes que representan rutas o pantallas completas.

Las paginas deben coordinar componentes, datos y navegacion. No deben convertirse en enormes archivos con componentes genericos repetidos.

### `features/`

Cuando la aplicacion crece, organizar por dominio funcional:

```text
features/
├── auth/
│   ├── components/
│   ├── hooks/
│   ├── services/
│   └── types.ts
└── profile/
    ├── components/
    ├── hooks/
    ├── services/
    └── types.ts
```

---

## 11. Componentes reutilizables

Un componente debe extraerse cuando:

- Se repite en varias pantallas.
- Tiene comportamiento independiente.
- Tiene estados propios.
- Su API puede definirse claramente.
- Extraerlo reduce la complejidad de la pagina.

No extraer componentes solamente para dividir un archivo sin mejorar la responsabilidad del codigo.

### Reglas de una buena API

- Props tipadas.
- Nombres semanticos.
- Valores por defecto razonables.
- Variantes explicitas.
- No depender de selectores globales ocultos.
- No exigir que el consumidor conozca detalles internos de CSS.

Ejemplo:

```tsx
<Button variant="primary" size="md" loading={isSaving}>
  Guardar
</Button>
```

Es preferible una API como esta a exigir que cada pantalla conozca una cadena extensa de clases internas.

### Evitar componentes gigantes

Una pagina no deberia contener varias copias de:

- Botones con el mismo comportamiento.
- Campos con el mismo patron de icono.
- Mensajes de error con el mismo estilo.
- Tarjetas con la misma estructura.

Extraer esos patrones a componentes reutilizables reduce inconsistencias y facilita las correcciones globales.

---

## 12. CSS personalizado para componentes

Crear una clase CSS propia cuando:

- El efecto usa varias reglas complejas.
- El comportamiento se repite.
- Expresarlo con Tailwind seria ilegible.
- Se trata de una animacion especifica.
- Es un efecto visual que no representa layout general.

Ejemplo:

```css
@layer components {
  .brand-glass-panel {
    background: rgba(255, 255, 255, 0.04);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.12);
  }
}
```

La clase debe tener un nombre propio. No debe modificar de forma invisible todos los botones, inputs o imagenes de la aplicacion.

---

## 13. Responsive design

El responsive debe definirse en el componente mediante clases y variantes claras:

```tsx
<div className="flex flex-col gap-4 md:flex-row md:items-center">
  ...
</div>
```

Buenas practicas:

- Diseñar primero para pantallas pequenas.
- Agregar cambios con breakpoints cuando sean necesarios.
- No depender solamente de estilos inline.
- Evitar anchos fijos sin restricciones responsivas.
- Usar `max-w-*`, `w-full` y `min-*` de forma intencional.
- Verificar overflow horizontal.
- Probar contenido largo y diferentes tamaños de fuente.

---

## 14. Accesibilidad

Toda implementacion frontend debe considerar:

- `label` asociado a cada campo.
- Texto alternativo en imagenes.
- Estados de foco visibles.
- Contraste suficiente.
- Elementos interactivos semanticamente correctos.
- `button` para acciones y `a` para navegacion.
- Mensajes de error asociados al campo correspondiente.
- Soporte de teclado.
- `aria-*` solamente cuando el HTML semantico no sea suficiente.
- No depender solo del color para comunicar estados.

---

## 15. Validacion antes de finalizar

Antes de considerar terminada una pantalla o componente:

1. Ejecutar el formateador o lint configurado.
2. Ejecutar el typecheck o build.
3. Revisar la consola del navegador.
4. Probar las rutas afectadas.
5. Probar viewport movil y desktop.
6. Revisar estados de carga, error, vacio y deshabilitado.
7. Verificar que no exista overflow horizontal.
8. Comprobar que los botones cambien en ancho y alto cuando corresponde.
9. Revisar iconos y elementos posicionados.
10. Inspeccionar reglas CSS cuando una utilidad no tenga efecto.

Si una clase Tailwind parece ignorada, no continuar acumulando clases hasta que el motivo sea conocido.

---

## 16. Procedimiento para investigar estilos que no cambian

Seguir este orden:

1. Confirmar que se esta editando el componente que realmente renderiza la ruta.
2. Confirmar que el servidor se ejecuto desde el proyecto correcto.
3. Recargar sin cache cuando corresponda.
4. Inspeccionar el elemento en el navegador.
5. Revisar la regla CSS ganadora.
6. Buscar `style={{ ... }}` en el elemento.
7. Buscar la misma propiedad en CSS global y CSS de componentes.
8. Buscar selectores globales fuera de `@layer`.
9. Revisar clases con nombres que coincidan con Tailwind.
10. Revisar limitaciones del padre y del layout.
11. Corregir la fuente de conflicto.
12. Volver a ejecutar build y probar la pantalla.

Nunca asumir que el problema se resuelve aumentando indefinidamente un valor de Tailwind.

---

## 17. Reglas para agentes de IA y colaboracion

Antes de modificar estilos, el agente o desarrollador debe:

- Identificar el componente que renderiza la interfaz.
- Revisar las clases actuales.
- Buscar estilos inline.
- Buscar CSS global relacionado.
- Revisar los componentes padre.
- Identificar la fuente de verdad de la propiedad que se quiere cambiar.

Al implementar:

- Preferir el patron ya establecido en el proyecto.
- Hacer cambios pequenos y verificables.
- No crear CSS paralelo sin necesidad.
- No agregar clases con nombres de utilidades Tailwind.
- No duplicar estilos estaticos en `className` y `style`.
- No modificar archivos no relacionados.
- Explicar que regla controla el comportamiento cuando existe una colision.

Al finalizar:

- Ejecutar una validacion automatica.
- Informar cualquier error preexistente separado del cambio realizado.
- Documentar decisiones no obvias.

---

## 18. Regla final de decision

Antes de escribir codigo visual, responder estas preguntas:

1. Es layout o spacing? Usar Tailwind.
2. Es un valor compartido? Crear o usar un token.
3. Es un efecto complejo? Crear una clase propia con nombre especifico.
4. Es global? Usar `@layer base`.
5. Es dinamico? Usar estilo inline, sin duplicarlo en Tailwind.
6. Se repite? Extraer un componente reutilizable.
7. Ya existe en Tailwind? No redefinirlo en CSS.
8. Ya existe un componente para esto? Reutilizarlo.
9. Otra regla controla la misma propiedad? Resolver la colision antes de agregar otra regla.

La implementacion correcta no es la que acumula mas estilos. Es la que deja claro quien controla cada propiedad y permite cambiar la interfaz sin efectos ocultos.
