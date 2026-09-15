# Neon Breaker

Juego estilo **Brick Breaker** para una expo de carreras, realizado con HTML, CSS y JavaScript y empaquetado con Electron. Combina tres niveles de ladrillos con preguntas sencillas sobre Desarrollo de Software.

## Jugar y entregar

El entregable actual es `dist/Neon-Breaker-1.0.0-portable.exe`, para Windows de 64 bits. Copiá ese archivo a la computadora de la expo o a un pendrive. Para jugar no hace falta instalar Node.js, Electron ni dependencias, ni disponer de Internet.

También se puede abrir `index.html` en un navegador moderno. Esa versión usa el almacenamiento del navegador y tiene un ranking independiente del de Electron.

## Reglas y pantallas

1. El inicio muestra el título arriba, el **scoreboard Top 10** en el medio y el botón **Jugar** con los controles debajo. Si no hay resultados, invita a registrar el primero.
2. La partida comienza con **dos vidas** y tiene **tres niveles**. Cada ladrillo se destruye con un impacto y suma 10, 20 o 30 puntos según su tipo.
3. Cuando la pelota sale por abajo, el juego se detiene y aparece una pregunta de cuatro opciones. El contador de **20 segundos** está centrado debajo de las respuestas.
4. Acertar conserva la vida. Equivocarse o agotar el tiempo descuenta una vida. Se muestra la respuesta correcta durante 3 segundos, seguida de una transición de 450 milisegundos; se continúa si quedan vidas.
5. Al limpiar un nivel, se ofrece continuar. Completar los tres muestra **¡GANASTE!** y perder ambas vidas muestra **GAME OVER**.
6. En ambos finales, una ventana pide un **apodo de exactamente tres letras de la A a la Z**, convertido a mayúsculas. No se solicitan correos electrónicos.
7. Al guardar se muestra el ranking actualizado. **Jugar otra vez** vuelve al inicio y prepara una nueva partida.

El banco contiene 20 preguntas. Se toman de una cola mezclada que se repone al agotarse. El límite de 20 segundos corresponde a cada pregunta: no existe un límite total de duración de la partida.

## Controles

| Control | Acción |
|---|---|
| Flecha izquierda / A | Mover la plataforma a la izquierda. |
| Flecha derecha / D | Mover la plataforma a la derecha. |
| Espacio | Iniciar desde una pantalla preparada o pausar/reanudar el juego. No pausa las preguntas. |
| Reiniciar | Volver al inicio con dos vidas y cero puntos. No borra el ranking. Se deshabilita durante el registro y el ranking del final. |
| Ctrl + Shift + R | Abrir la confirmación para borrar el ranking, con la aplicación enfocada. |

## Scoreboard y almacenamiento

Se conservan **hasta 10 resultados**, ordenados de mayor a menor. En un empate queda primero el registrado antes. Cada partida es una entrada independiente: los apodos repetidos no representan una cuenta ni reemplazan automáticamente resultados anteriores.

El resultado nuevo se resalta si entra al Top 10. Si no alcanza, se informa al jugador y se muestran los mejores resultados. El ranking del inicio también se actualiza al guardar o borrar.

| Ejecución | Almacenamiento |
|---|---|
| Electron | `scoreboard.json` dentro de `app.getPath('userData')`, normalmente `%APPDATA%/Neon Breaker/` en Windows. |
| Navegador | `localStorage`, clave `neon-breaker-scoreboard-v1`. |

El JSON está fuera del ejecutable. Cerrar la aplicación o reemplazar el `.exe` no reinicia el ranking si se mantiene la misma carpeta de datos. Copiar solamente el ejecutable a otra computadora no copia resultados. No hay sincronización entre equipos.

### Borrar el ranking

Presioná **Ctrl + Shift + R** y elegí **Borrar ranking**. **Cancelar** o **Escape** conserva los resultados. Mientras se decide, se detienen el juego y el contador de una pregunta pendiente. Borrar elimina los puntajes guardados, pero no reinicia la partida en curso.

Los errores de lectura o escritura se muestran en la interfaz. En Electron, un archivo inválido no se sobrescribe al intentar guardar un puntaje; el borrado confirmado permite comenzar de nuevo y elimina los resultados anteriores.

## Desarrollo y empaquetado

Para desarrollar se necesitan Node.js y npm. Desde la carpeta del proyecto:

```powershell
npm ci
```

Ese comando instala las dependencias de `package-lock.json`. Los comandos disponibles son:

| Comando | Resultado |
|---|---|
| `npm start` | Abre la aplicación Electron en desarrollo. |
| `npm test` | Ejecuta las pruebas automáticas. |
| `npm run dist` | Genera el ejecutable portable para Windows. |

Cerrá el juego antes de regenerar el ejecutable. El resultado actual queda en `dist/Neon-Breaker-1.0.0-portable.exe`; su nombre incluye la versión de `package.json`. La instalación de dependencias y el empaquetado pueden necesitar Internet. No hace falta entregar `node_modules` ni `dist/win-unpacked` junto al portable.

Antes de la expo, probá el `.exe` en el equipo de destino: jugá, guardá un apodo y comprobá que el ranking permanezca al cerrar y abrir. Después borrá los resultados de prueba con el atajo.

## Personalización

En `game.js`:

- `LEVELS` contiene una matriz por nivel. Cada arreglo interno es una fila y cada número ocupa una columna.
- `0` deja un espacio vacío; `1`, `2` y `3` seleccionan tipos de ladrillo. Mantené la misma cantidad de columnas en todas las filas de un nivel y verificá que el ancho total entre en el canvas.
- `BRICK_TYPES` define colores y puntos.
- `SETTINGS` define vidas, segundos por pregunta, velocidades y medidas de ladrillos.
- `QUESTIONS` contiene el enunciado, la respuesta correcta y tres incorrectas, en ese orden. Las opciones se mezclan al mostrarse.
- `playSound` define los sonidos generados con Web Audio. No se utilizan imágenes ni archivos de sonido externos.

Ejemplo de una matriz para agregar dentro de `LEVELS`:

```js
[
  [1, 1, 1, 1, 1, 1],
  [0, 2, 2, 2, 2, 0],
  [0, 0, 3, 3, 0, 0],
]
```

## Archivos del proyecto

| Archivo | Responsabilidad |
|---|---|
| `index.html` | Canvas, información de partida, inicio, preguntas y diálogos de registro/ranking y confirmación. |
| `style.css` | Estética arcade, distribución, tablas, formularios y transiciones. |
| `game.js` | Niveles, física, preguntas, temporizadores, controles y estados. |
| `scoreboard.js` | Apodos, tablas del ranking y acceso al almacenamiento. |
| `main.cjs` | Ventana Electron, carpeta de datos y solicitudes de almacenamiento. |
| `preload.cjs` | Puente para leer, guardar y borrar desde la interfaz. |
| `score-store.cjs` | Validación, ordenamiento y persistencia del Top 10 en JSON. |
| `package.json` / `package-lock.json` | Comandos, dependencias y configuración del portable. |
| `tests/game-flow.test.cjs` | Pruebas de los flujos con interfaz y temporizadores simulados. |
| `tests/score-store.test.cjs` | Pruebas de almacenamiento con archivos temporales. |
| `PRESENTACION_JUEGO.md` | Resumen para explicar el proyecto. |
| `EXPLICACION_CODIGO.md` | Guía técnica por archivos y funciones. |
