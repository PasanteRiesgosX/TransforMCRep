# Guia de estilos del frontend

## Proposito

Este documento explica como se combinan Tailwind CSS, `index.css`, las clases CSS personalizadas y los estilos inline en este proyecto. Tambien documenta por que algunos cambios visuales no tenian efecto y por que aparecian botones estrechos, iconos superpuestos o elementos que no se movian aunque se cambiara su clase Tailwind.

La regla principal para este repositorio es:

> Tailwind controla el layout y la mayoria de los estilos de los componentes. `index.css` contiene tokens, estilos globales y unas pocas clases visuales complejas. Ninguna regla global debe competir con una utilidad de Tailwind.

---

## 1. Que estaba fallando

El problema no era una sola clase incorrecta. Era la combinacion de varios mecanismos de estilos que competian entre si:

1. Tailwind aplicaba utilidades desde `className`.
2. `index.css` incluia reglas CSS normales fuera de una capa.
3. Algunos componentes tenian estilos inline mediante `style={{ ... }}`.
4. Existian clases CSS personalizadas y animaciones con nombres que coincidian con utilidades de Tailwind.
5. El codigo no seguia una convension unica para decidir donde vive cada estilo.

Cuando dos reglas escriben la misma propiedad, el navegador decide usando la cascada CSS. El resultado no depende de que el codigo "se vea" correcto en JSX, sino de que regla termina ganando.

### El caso critico del reset global

El reset original de `index.css` era equivalente a:

```css
*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}
```

El problema no era solamente `padding: 0`. La regla estaba escrita fuera de `@layer` y despues de importar Tailwind:

```css
@import "tailwindcss";
```

Tailwind v4 organiza su preflight y sus utilidades dentro de capas CSS. Una regla normal fuera de una capa puede tener prioridad sobre reglas normales dentro de una capa. Por eso un reset aparentemente general podia ganar frente a utilidades como `pl-16`, `py-4` o `px-6`.

En consecuencia:

- `pl-16` podia no producir el desplazamiento esperado del logo.
- `py-4` podia no conservar la altura esperada de un boton.
- `px-*` y otros espacios podian parecer ignorados.
- Cambiar numeros en `className` no siempre cambiaba el resultado visible.

La solucion correcta no fue buscar un numero de padding cada vez mayor. Fue eliminar la regla global que competia con Tailwind. Tailwind ya incluye un reset base mediante Preflight.

### Importante sobre especificidad

Decir que `*` siempre gana seria incorrecto. Un selector de clase normalmente tiene mayor especificidad que `*`. El detalle decisivo en este caso es la combinacion de capas CSS y reglas fuera de capa:

- Tailwind v4 genera reglas dentro de capas.
- El CSS personalizado escrito fuera de una capa queda fuera de ese orden de capas.
- Una regla normal fuera de capa puede imponerse a una regla normal dentro de una capa.

Por eso es importante usar `@layer base`, `@layer components` y `@layer utilities` cuando una regla personalizada debe convivir con Tailwind.

### Que significa exactamente "redefinir una clase de Tailwind"

En este caso no se trataba solamente de que dos animaciones tuvieran un nombre parecido. Se trataba de que el proyecto usaba exactamente el mismo selector CSS:

```css
.animate-spin {
  animation: spin 1s linear infinite;
}
```

Tailwind ya genera una utilidad llamada `.animate-spin`. Por tanto, el `index.css` del proyecto volvia a declarar la misma clase. El navegador no entiende que una regla viene de Tailwind y la otra de un desarrollador: ve dos reglas que escriben la misma propiedad sobre el mismo elemento y aplica la cascada CSS para decidir cual gana.

Eso es un error de organizacion de estilos en este proyecto. No porque sea ilegal que CSS declare una clase con ese nombre, sino porque crea dos fuentes de verdad para una utilidad que ya pertenece a Tailwind. A partir de ese momento no queda claro si el comportamiento de `animate-spin` debe cambiarse en Tailwind o en `index.css`.

Habia dos colisiones relacionadas:

1. `.animate-spin` era una clase oficial de Tailwind y tambien una clase escrita manualmente en `index.css`.
2. `spin` era el nombre del `@keyframes` utilizado por la animacion oficial y tambien se declaraba manualmente en `index.css`.

La correccion fue eliminar ambas declaraciones propias. Desde entonces, cuando un elemento usa:

```tsx
<svg className="animate-spin" />
```

la fuente de esa utilidad es Tailwind. No se creo una animacion nueva en Tailwind durante la correccion; se dejo de competir con la que Tailwind ya proporciona.

Esto no significa que nunca se puedan personalizar animaciones. Significa que se debe elegir una estrategia:

- Para el spinner estandar: usar `animate-spin` de Tailwind.
- Para una animacion propia: usar un nombre propio, por ejemplo `animate-logo-bounce`.
- Para una animacion propia integrada en Tailwind: registrar un token propio en `@theme`, por ejemplo `--animate-fade-in`.

Lo que se debe evitar es declarar manualmente una clase que ya tiene significado oficial en Tailwind.

---

## 2. Por que habia botones estrechos

Un boton puede tener clases Tailwind correctas y aun asi verse estrecho si otra regla escribe las mismas propiedades.

Un caso representativo es:

```tsx
<button
  className="w-4/5 py-10 px-6 ..."
  style={{ padding: '1rem 1.5rem' }}
>
  Continuar
</button>
```

Las clases indican:

- `w-4/5`: ancho del 80% del contenedor padre.
- `py-10`: padding vertical grande.
- `px-6`: padding horizontal.

Pero el estilo inline indica:

- `padding-top: 1rem`.
- `padding-bottom: 1rem`.
- `padding-left: 1.5rem`.
- `padding-right: 1.5rem`.

El estilo inline tiene prioridad sobre las utilidades normales. Por eso cambiar `py-10` a `py-12` no producia ningun cambio vertical: el atributo `style` seguia imponiendo `padding: 1rem 1.5rem`.

La correccion recomendada es elegir una sola fuente para ese valor:

```tsx
<button className="w-4/5 py-10 px-6 ...">
  Continuar
</button>
```

Si el valor debe calcularse dinamicamente, entonces debe controlarse desde `style` y no duplicarse en Tailwind:

```tsx
<button style={{ padding: `${verticalPadding}px ${horizontalPadding}px` }}>
  Continuar
</button>
```

### Ancho y alto no son lo mismo

Tambien hay que distinguir:

- Ancho: `w-full`, `w-4/5`, `w-80`, `min-w-*`, `max-w-*`.
- Alto: `h-*`, `min-h-*`, `max-h-*`.
- Espacio interno vertical: `py-*`.
- Espacio interno horizontal: `px-*`.
- Espacio externo: `my-*`, `mx-*`, `mt-*`, `mb-*`.

Un boton puede crecer horizontalmente por `w-full` y continuar bajo porque `padding-top`, `padding-bottom`, `h-*` o `min-h-*` estan siendo controlados por otra regla.

---

## 3. Por que los iconos se superponian

Los iconos de los campos de `CompleteProfilePage.tsx` usan posicionamiento absoluto:

```tsx
<div className="relative w-full">
  <span className="absolute left-5 top-1/2 -translate-y-1/2">
    domain
  </span>
  <select className="w-full py-3.5 pl-14 pr-4 ..." />
</div>
```

Ese patron funciona porque:

- El contenedor padre es `relative`.
- El icono es `absolute`.
- El campo reserva espacio a la izquierda con `pl-14`.

Si `pl-14` es sobrescrito o se elimina, el texto del campo empieza demasiado cerca del icono y ambos se superponen. La solucion no es mover el icono arbitrariamente; es mantener coordinados:

1. La posicion del icono: `left-*`.
2. El espacio reservado para el icono: `pl-*`.
3. El ancho y la altura del campo.
4. El contenedor de referencia: `relative`.

---

## 4. Animaciones que competian con Tailwind

El `index.css` original redefinia nombres que Tailwind ya utiliza:

```css
.animate-spin {
  animation: spin 1s linear infinite;
}
```

Tambien declaraba `@keyframes spin` y una clase `.animate-fade-in`. Eso creaba dos riesgos:

- La implementacion local podia reemplazar la implementacion oficial de Tailwind.
- El comportamiento podia cambiar segun el orden de las capas y la carga del CSS.

Se eliminaron las redefiniciones de `animate-spin` y `spin`. Ahora `animate-spin` pertenece a Tailwind.

La animacion de entrada se mantiene como token propio:

```css
@theme {
  --animate-fade-in: fadeIn 0.4s ease-out;
}
```

Esto permite usar la utilidad generada por Tailwind:

```tsx
<div className="animate-fade-in" />
```

La diferencia importante es que el nombre y la definicion se registran en el sistema de Tailwind, en lugar de declarar una clase manual fuera de sus capas.

---

## 5. Que se corrigio en `index.css`

Los cambios fueron:

### Se elimino el reset global personalizado

Se retiro:

```css
*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}
```

Tailwind Preflight ya cubre el reset base. El reset personalizado podia competir con las utilidades.

### Se movieron los estilos de `body` a `@layer base`

Ahora los estilos globales viven en una capa explicita:

```css
@layer base {
  body {
    font-family: var(--font-body);
    background-color: var(--color-surface-dim);
    color: var(--color-on-surface);
  }
}
```

Esto expresa correctamente que son estilos base del documento y mantiene predecible la relacion con las utilidades.

### Se eliminaron duplicados de Tailwind

Se quitaron:

- `.animate-spin` manual.
- `@keyframes spin` manual.
- La declaracion redundante de `.animate-fade-in`.
- El token `--animate-spin` personalizado.

El resultado es que `animate-spin` ahora tiene una sola fuente de verdad: la definicion incorporada de Tailwind. En cambio, `animate-logo-bounce` sigue siendo una animacion propia porque no reutiliza el nombre de una utilidad oficial.

### Se conservaron las clases realmente propias del proyecto

Estas clases no son utilidades estandar de Tailwind y tienen una responsabilidad visual concreta:

- `.cyber-bg`: fondo con patrones y gradientes.
- `.glass-panel`: superficie translucida con blur y borde.
- `.neon-input`: comportamiento visual del foco.
- `.neon-button`: estilo reutilizable de boton neon.
- `.glow-text`: sombra luminosa del texto.
- `.animate-logo-bounce`: animacion especifica del logo.
- `.login-btn-morph`: transicion visual especifica del boton de login.

Conservar una clase personalizada no es un problema. El problema aparece cuando esa clase redefine utilidades de Tailwind o controla propiedades que el JSX tambien intenta controlar.

---

## 6. Para que sirve `index.css`

Si, es recomendable mantener `index.css`. No debe desaparecer por usar Tailwind.

En este proyecto es el punto de entrada global porque `main.tsx` importa:

```tsx
import './index.css';
```

Su funcion adecuada es:

1. Importar Tailwind:

```css
@import "tailwindcss";
```

2. Definir tokens del proyecto en `@theme`:

```css
@theme {
  --color-primary: #ffabf3;
  --font-body: "Inter", sans-serif;
}
```

3. Definir estilos globales del documento dentro de `@layer base`.

4. Definir componentes CSS reutilizables cuando una clase necesita varias propiedades complejas o una animacion especifica.

5. Definir `@keyframes` y efectos que no resultaria practico escribir repetidamente en JSX.

Lo que no debe hacer es convertirse en un segundo sistema de utilidades que compita con Tailwind.

---

## 7. Estandar recomendado para este proyecto

### `@theme`

Usar para valores compartidos:

- Colores de marca.
- Fuentes.
- Tokens de animacion.
- Valores de diseño que se reutilizan en muchas pantallas.

No usar `@theme` para corregir puntualmente el ancho de un boton concreto.

### `@layer base`

Usar para:

- `body`.
- `html`.
- Elementos base cuando sea necesario.
- Ajustes globales de tipografia y renderizado.

Evitar resets globales personalizados si Preflight ya resuelve el caso.

### JSX con clases Tailwind

Usar para la mayoria del layout y los estados:

- `flex`, `grid`, `items-center`, `justify-center`.
- `w-*`, `h-*`, `min-w-*`, `max-w-*`.
- `p-*`, `px-*`, `py-*`, `m-*`, `gap-*`.
- Colores, bordes, sombras y responsive design.
- `hover:`, `focus:`, `disabled:`, `md:`, `lg:`.

Ejemplo:

```tsx
<button className="w-full max-w-sm px-6 py-4 flex items-center justify-center gap-2">
  Continuar
</button>
```

### Clases CSS personalizadas

Usar cuando exista una razon clara:

- Un fondo compuesto por varios gradientes.
- Un efecto de cristal.
- Una animacion con varios pasos.
- Un estado visual reutilizado que seria demasiado largo en cada `className`.

Las clases personalizadas deben tener nombres propios del dominio. No deben llamarse `.flex`, `.container`, `.text-white`, `.animate-spin`, `.p-4` ni reutilizar nombres de Tailwind.

### Estilos inline

Usar solamente para valores realmente dinamicos que vienen de JavaScript:

```tsx
<div style={{ transform: `translate(${x}px, ${y}px)` }} />
```

No usar `style` para valores estaticos que Tailwind ya puede expresar. En especial, no duplicar:

```tsx
className="py-10 px-6"
style={{ padding: '1rem 1.5rem' }}
```

Eso crea una fuente de verdad ambigua y suele ser la causa de botones que no responden a los cambios de Tailwind.

---

## 8. Archivos CSS huérfanos y estado actual

El análisis histórico del proyecto mencionaba archivos como `LoginPage.css`, `WelcomePage.css`, `App.css`, `VerifyCodePage.css` y componentes como `AuthLayout` o `VerifyCodePage`.

En el estado actual de este repositorio, la búsqueda de `frontend/src/**/*.css` devuelve únicamente:

```text
frontend/src/index.css
```

Por tanto, esos archivos no estan presentes en el checkout actual. Si existieron en una version anterior, el riesgo descrito era valido: mantener un `.css` que ya no se importa o cuyas clases ya no se usan dificulta que una persona o una IA determine cual es la fuente real de los estilos.

La regla practica es:

- Si un archivo CSS no se importa y ninguna clase suya se usa, eliminarlo o documentar por que se conserva.
- Si una pantalla usa Tailwind, mantener su layout principal en JSX.
- Si una pantalla necesita CSS especifico, importarlo explicitamente y limitarlo a esa pantalla.
- No conservar dos implementaciones visuales para el mismo componente.

---

## 9. Metodo de diagnostico para futuros problemas

Cuando modificar una clase Tailwind no cambia la pantalla, revisar en este orden:

1. Confirmar que se esta viendo la ruta y el componente correctos.
2. Confirmar que el servidor se ejecuto desde `frontend`.
3. Buscar la misma propiedad en `style={{ ... }}`.
4. Buscar la misma propiedad en `index.css` y en CSS importado.
5. Buscar selectores globales (`*`, `button`, `input`, `img`) fuera de `@layer`.
6. Buscar si una clase personalizada tiene el mismo nombre que una utilidad Tailwind.
7. Revisar el elemento padre: `max-w-*`, `overflow-hidden`, `items-*`, `justify-*` y `flex-shrink` pueden limitar el resultado.
8. Revisar el inspector del navegador para identificar la regla tachada y la regla ganadora.
9. Ejecutar `npm run build` despues de corregir el estilo.

Para botones, revisar especificamente:

- `width`, `min-width`, `max-width`.
- `height`, `min-height`, `max-height`.
- `padding` y `line-height`.
- `display: flex`, `align-items` y `justify-content`.
- `style={{ ... }}`.
- Clases globales o componentes CSS que escriban las mismas propiedades.

---

## 10. Regla de mantenimiento

Antes de agregar una regla a `index.css`, preguntar:

1. Es un token reutilizable? Entonces va en `@theme`.
2. Es un estilo global del documento? Entonces va en `@layer base`.
3. Es un efecto complejo y reutilizable? Entonces puede ser una clase propia.
4. Es layout, spacing o responsive de un componente? Entonces debe ir en las clases Tailwind del JSX.
5. Es un valor dinamico? Entonces puede ir en `style`, sin duplicarlo en Tailwind.

Si una nueva regla de `index.css` puede cambiar el ancho, alto, margen o padding de cualquier elemento sin que ese elemento la solicite explicitamente, debe considerarse peligrosa y revisarse antes de agregarla.

---

## Conclusion

Los errores se produjeron porque habia varias fuentes de verdad para el mismo estilo. El reset global fuera de capa podia interferir con las utilidades de Tailwind; los estilos inline podian imponerse sobre `py-*` y `px-*`; y las redefiniciones de animaciones podian reemplazar utilidades oficiales.

La correccion no consiste en abandonar `index.css`. Consiste en darle una responsabilidad clara:

- Tailwind para el layout y los estilos de componentes.
- `@theme` para tokens.
- `@layer base` para estilos globales.
- Clases CSS propias para efectos complejos.
- `style` solamente para valores dinamicos.

Con esta separacion, los cambios hechos en JSX vuelven a ser predecibles y los agentes de IA tienen una fuente de verdad clara para modificar la interfaz.
