# Explicación del código — Neon Breaker

Esta guía describe la versión actual por archivos y funciones. Las referencias usan nombres del código en lugar de números de línea, que cambian al editarlo.

## Estructura y arranque

`index.html` define el canvas de 900 × 600, puntaje, vidas y nivel, el panel de inicio/pausa y la tarjeta de preguntas. Contiene dos elementos `dialog`: uno para resultado, apodo y ranking, y otro para confirmar el borrado.

Carga primero `scoreboard.js`, que publica `window.arcadeScores`, y después `game.js`, que utiliza esa interfaz. Al final de `game.js` se conectan los eventos, se ejecuta `resetGame()` y se solicita el primer fotograma con `requestAnimationFrame(loop)`.

`style.css` define la apariencia arcade. `is-home` coloca el título arriba, el ranking en el medio y el botón y los controles debajo. La tarjeta de preguntas centra el texto y coloca el contador debajo de las opciones. `is-closing` controla su desvanecimiento.

## Datos y estados de `game.js`

| Dato | Significado |
|---|---|
| `LEVELS` | Tres matrices: cada matriz es un nivel, cada arreglo interno una fila y cada número una columna. `0` significa vacío. |
| `SETTINGS` | Dos vidas, 20 segundos por pregunta, velocidades y medidas de ladrillos. |
| `BRICK_TYPES` | Colores y puntos de los tipos 1, 2 y 3: 10, 20 y 30 puntos. |
| `QUESTIONS` | Veinte arreglos con enunciado, respuesta correcta y tres incorrectas. `map` los convierte en objetos con `text`, `correct` e `incorrect`. |
| `keys` | Teclas presionadas. |
| `bricks` | Ladrillos que todavía quedan en el nivel. |
| `score`, `lives`, `currentLevel` | Puntaje, vidas e índice del nivel, que comienza en cero. |
| `paddle`, `ball` | Posiciones, dimensiones y velocidades de los objetos. |
| `lastTime` | Instante del fotograma anterior. |
| `audioContext` | Contexto de audio creado al reproducir el primer efecto. |

Los estados posibles son:

| `state` | Comportamiento |
|---|---|
| `ready` | Espera para empezar o continuar al siguiente nivel. |
| `playing` | Actualiza movimiento y colisiones. |
| `paused` | Muestra el mensaje de pausa y conserva la escena. |
| `question` | Detiene la física mientras se responde o se muestra la corrección. |
| `won` | Final por completar los niveles; abre el registro. |
| `lost` | Final por agotar vidas; abre el registro. |

La confirmación de borrado se controla además con `window.arcadeScores.confirming`: no cambia directamente el estado, pero detiene el juego y el contador de una pregunta pendiente.

## Preparación e interfaz

### `setMessage(title, text, buttonText)`

Actualiza título, instrucciones y botón. Si el título es `NEON BREAKER`, aplica `is-home`, muestra el ranking inicial y solicita su actualización con `refreshHome()`. En la pausa y entre niveles oculta ese ranking.

### `updateHud()`

Escribe el puntaje con un mínimo de cinco dígitos mediante `padStart`, las vidas con corazones y el número de nivel con dos dígitos. Cuando no quedan vidas muestra un guion largo.

### `buildLevel()`

Lee la matriz de `currentLevel`, calcula su ancho y la centra. Recorre filas y columnas y convierte cada valor no nulo en un objeto con tipo, posición, ancho y alto. Las posiciones dependen de las medidas y separación de `SETTINGS`.

### `resetBall()`

Centra la plataforma y coloca la pelota encima. La velocidad vertical apunta hacia arriba y la horizontal se elige hacia izquierda o derecha. `ballSpeed` sirve para calcular componentes de velocidad; la rapidez total no es constante para todos los ángulos.

### `resetGame()`

Habilita Reiniciar, limpia teclas y cancela temporizadores. Restablece cero puntos, dos vidas y primer nivel; oculta la pregunta, reconstruye la escena y muestra el inicio en estado `ready`. No borra el ranking. La cola de preguntas tampoco se reinicia aquí.

### `startGame()` y `finishGame(won)`

`startGame` permite pasar de `ready` o `paused` a `playing`, oculta el panel y actualiza el tiempo de referencia.

`finishGame` cancela temporizadores, selecciona `won` o `lost`, limpia teclas y deshabilita Reiniciar. Llama a `window.arcadeScores.finish(won, score, resetGame)`: entrega `resetGame` como acción para Jugar otra vez.

## Preguntas y tiempo

### `shuffled(items)` y `getQuestion()`

`shuffled` copia un arreglo y altera su orden usando `sort` con un comparador aleatorio. Es una mezcla sencilla, no una distribución uniforme garantizada.

`getQuestion` extrae con `pop` una pregunta de `questionQueue`. Cuando se agota, repone la cola con una copia mezclada del banco. La cola continúa entre partidas durante la misma ejecución. Las cuatro opciones también se mezclan al mostrarse.

### `showLifeQuestion()`

Cancela temporizadores anteriores, obtiene una pregunta, cambia a `question` y crea sus botones. Define `questionDeadline` como el instante actual más veinte segundos.

Un intervalo de 100 milisegundos calcula el tiempo restante con `performance.now()`. `Math.ceil` muestra segundos enteros y `Math.max` evita valores negativos. Al llegar a cero se llama a `answerQuestion(false, question.correct)`. El intervalo no actualiza la cuenta durante la confirmación de borrado.

### `answerQuestion(...)`

Comprueba que la pregunta esté activa y no se haya respondido. También verifica el plazo en el momento del clic: una respuesta fuera de tiempo cuenta como fallo, aunque el intervalo todavía no haya actualizado la pantalla.

Marca `questionAnswered`, detiene el intervalo y deshabilita opciones para impedir respuestas duplicadas. La correcta se muestra verde y una elección incorrecta, roja. Un fallo o tiempo agotado resta una vida, actualiza la información y reproduce el sonido correspondiente. Acertar conserva la vida, pero no suma puntos.

Tras 3 segundos se inicia una transición de 450 milisegundos. Si no quedan vidas se ejecuta `finishGame(false)`; de lo contrario se centra la pelota y continúa. Los callbacks `closeQuestion` y `resumeGame` posponen su ejecución si está abierta la confirmación de borrado.

### `clearQuestionTimers()`

Cancela el intervalo de cuenta y el timeout de transición. Evita que una pregunta anterior modifique una nueva partida al reiniciar o terminar.

## Física, dibujo y eventos

### `overlapCircleRect(circle, rect)`

Calcula el punto del rectángulo más cercano al centro de la pelota. Compara la distancia al cuadrado con el radio al cuadrado para detectar superposición.

### `update(delta)`

1. Calcula la dirección de la plataforma a partir de las teclas, la mueve según los segundos transcurridos y limita su posición al canvas.
2. Mueve la pelota con `vx` y `vy`. Invierte `vx` al tocar los lados y `vy` al tocar el techo.
3. Si la pelota baja y toca la plataforma, el lugar del impacto determina su nueva componente horizontal; la vertical apunta hacia arriba.
4. Recorre ladrillos desde el final y procesa el primer impacto. Usa la posición horizontal previa para decidir el eje del rebote, suma puntos y elimina el ladrillo con `splice`. Procesa como máximo un ladrillo por actualización.
5. Si no quedan ladrillos, avanza o termina con victoria. Si la pelota sale por abajo, abre una pregunta.

### `draw()` y `loop(time)`

`draw` pinta fondo, líneas, ladrillos, plataforma y pelota con Canvas 2D. No carga sprites ni imágenes externas.

`loop` calcula `delta` en segundos y lo limita a 0,03 para evitar saltos grandes por actualización. Ejecuta `update` solo en `playing` y sin confirmación de borrado. Dibuja en todos los estados y solicita el próximo fotograma.

### `playSound(type)`

Crea un oscilador y un control de volumen con Web Audio. Selecciona frecuencia y duración según `wall`, `paddle`, `brick` o `life`, baja progresivamente el volumen y detiene el oscilador. La pérdida de vida usa onda de diente de sierra; los otros efectos usan onda cuadrada.

### `keyDown(event)` y `keyUp(event)`

`keyDown` atiende primero Ctrl + Shift + R. Guarda el instante de apertura de la confirmación y limpia teclas. Al cerrarla, extiende el plazo de una pregunta pendiente por el tiempo transcurrido y actualiza `lastTime`.

Durante el registro final deja escribir el apodo sin interceptar A/D. En juego evita el desplazamiento de la página con los controles y usa espacio para pausar o continuar. Ignora la repetición de espacio al mantenerlo presionado. `keyUp` marca la tecla como liberada.

## Registro y ranking: `scoreboard.js`

El archivo está encapsulado en una función que se ejecuta inmediatamente y publica `window.arcadeScores`.

### Acceso al almacenamiento

Si existe `window.scoreStorage`, utiliza Electron. En el navegador implementa `read`, `add` y `clear` sobre `localStorage`, clave `neon-breaker-scoreboard-v1`. `normalize` filtra entradas válidas, ordena de mayor a menor y conserva diez.

### `renderHome(rows)` y `refreshHome()`

`renderHome` crea filas con puesto, apodo y puntaje, o muestra una invitación a jugar si no hay resultados. `refreshHome` lee de forma asíncrona y muestra un error si falla. El contador `homeRequest` descarta lecturas antiguas que podrían reemplazar un ranking más reciente.

### `finish`, formulario y `render`

`finish` crea una entrada pendiente con un identificador de `crypto.randomUUID()` y el puntaje final. Abre el diálogo de victoria o derrota y enfoca el apodo.

El evento `input` convierte a mayúsculas y elimina todo lo que no sea A–Z. Al enviar se exigen tres letras. `busy`, el botón deshabilitado y `pendingEntry` impiden envíos simultáneos o guardar otra vez desde el mismo formulario.

Tras guardar, `render` muestra el Top 10 y resalta la partida por su identificador si entró. Si no alcanza, muestra una nota. También actualiza el ranking inicial. Ante un fallo conserva el formulario para reintentar.

Las tablas usan `createElement` y `textContent`. Cada partida es independiente: los apodos repetidos no se agrupan. Los empates mantienen el orden previo; una nueva entrada empatada queda detrás de las existentes.

El diálogo final no se cierra con Escape. Después de guardar, Jugar otra vez lo cierra y ejecuta la función recibida del juego.

### `confirmClear` y `closeClear`

`confirmClear` abre el segundo diálogo y enfoca Cancelar. Borrar ranking llama a `storage.clear()` y vacía ambas tablas. Si falla, muestra un error. Cancelar o Escape cierra sin borrar. Los botones se deshabilitan durante la operación para evitar repeticiones. `closeClear` avisa al juego para retomar sus tiempos.

## Electron y archivo JSON

### `main.cjs`

Es el punto de entrada de `package.json`. Define el nombre Neon Breaker y solicita una única instancia; otro intento de apertura enfoca la existente.

Cuando Electron está listo, crea el almacén en `app.getPath('userData')`. Registra `scores:read`, `scores:add` y `scores:clear`. `fromGame` comprueba que cada solicitud provenga de la ventana del juego y su frame principal.

La ventana carga `index.html` con `preload.cjs`, aislamiento de contexto, sandbox y sin integración directa de Node.js en la página. Bloquea nuevas ventanas y navegación desde la página. Quita el menú predeterminado para que Ctrl + Shift + R llegue al juego sin forzar una recarga. Cierra la aplicación al cerrar todas las ventanas.

### `preload.cjs`

`contextBridge.exposeInMainWorld` publica `window.scoreStorage` con `read`, `add` y `clear`. Cada método solicita una operación específica con `ipcRenderer.invoke`. La página no recibe acceso general a archivos ni a todos los canales de Electron.

### `score-store.cjs`

`createScoreStore(directory)` define `scoreboard.json` en la carpeta recibida y devuelve las operaciones del almacén:

| Función | Responsabilidad |
|---|---|
| `validEntry` | Valida identificador de texto de hasta 80 caracteres, apodo A–Z de tres letras y puntaje entero seguro no negativo. |
| `read` | Lee el JSON; si falta el archivo devuelve un arreglo vacío, y si es inválido produce un error. Ordena y limita a diez. |
| `write` | Crea la carpeta si hace falta, escribe `scoreboard.json.tmp` y lo renombra a `scoreboard.json`. |
| `add` | Valida, evita repetir un identificador presente en el ranking, agrega, ordena, limita a diez y guarda. |
| `clear` | Guarda un arreglo vacío, incluso si el archivo anterior estaba dañado. |

Ejemplo ilustrativo del archivo:

```json
[
  { "id": "identificador-de-la-partida", "nickname": "ABC", "score": 900 }
]
```

El archivo temporal evita reemplazar el ranking con un JSON escrito parcialmente. Un error de lectura no se trata como un ranking vacío: no se descartan silenciosamente los resultados anteriores.

El JSON queda fuera del ejecutable, normalmente en `%APPDATA%/Neon Breaker/`. La versión de navegador usa otro almacenamiento y los equipos no sincronizan resultados.

## Empaquetado y pruebas

`package.json` define `npm start`, `npm test` y `npm run dist`. `package-lock.json` registra dependencias. electron-builder genera el portable actual `dist/Neon-Breaker-1.0.0-portable.exe`.

`build.files` incluye HTML, CSS, JavaScript y módulos Electron. Los Markdown y las pruebas se entregan con el código fuente si se necesitan, pero no están incluidos en el paquete del juego. Cambiar solamente estos documentos no requiere regenerar el ejecutable.

`tests/game-flow.test.cjs` simula interfaz y temporizadores para comprobar victoria, derrota, registro, ranking inicial, confirmación y pausa del contador. `tests/score-store.test.cjs` usa directorios temporales para comprobar persistencia, Top 10, empates, validación, borrado y JSON dañado. No sustituyen la revisión visual ni la prueba del ejecutable en el equipo de destino.
