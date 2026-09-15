/* 0 es vacío; 1, 2 y 3 son los tipos de ladrillo.
cada fila es un nivel, cada columna es una fila del nivel */
const LEVELS = [
  [[3,3,3,1,1,1,2,2,0,3,3,3],[0,3,0,1,0,0,2,0,2,3,0,0],[0,3,0,1,1,1,2,0,2,3,3,3],[0,3,0,0,0,1,2,0,2,0,0,3],[0,3,0,1,1,1,2,2,0,3,3,3]],
  [[0,1,1,2,2,3,3,2,2,1,1,0],[1,1,2,2,3,3,1,1,3,3,2,2],[1,2,3,1,2,3,1,2,3,1,2,3],[0,1,1,2,2,3,3,2,2,1,1,0]],
  [[3,0,3,0,3,0,3,0,3,0,3,0],[0,2,0,2,0,2,0,2,0,2,0,2],[1,1,1,1,1,1,1,1,1,1,1,1],[0,2,0,2,0,2,0,2,0,2,0,2],[3,0,3,0,3,0,3,0,3,0,3,0]],
];

//valores de los objetos
const SETTINGS = { lives: 2, questionSeconds: 20, paddleSpeed: 620, ballSpeed: 390, brickWidth: 66, brickHeight: 27, brickGap: 6 };

//tipos de ladrillo
const BRICK_TYPES = { 1: { color: '#58e1ff', points: 10 }, 2: { color: '#b57aff', points: 20 }, 3: { color: '#ff6eaa', points: 30 } };

//simplificamos los nombres para hace rmas corto el codigo
const canvas = document.querySelector('#game');
const ctx = canvas.getContext('2d');
const scoreEl = document.querySelector('#score');
const livesEl = document.querySelector('#lives');
const levelEl = document.querySelector('#level');
const messageEl = document.querySelector('#message');
const startButton = document.querySelector('#start-button');
const restartButton = document.querySelector('#restart-button');
const questionModal = document.querySelector('#question-modal');
const questionTitle = document.querySelector('#question-title');
const questionText = document.querySelector('#question-text');
const questionOptions = document.querySelector('#question-options');
const questionTimer = document.querySelector('#question-timer');

const QUESTIONS = [
  ['¿Qué hace principalmente un desarrollador de software?', 'Diseña y mantiene sistemas, aplicaciones y programas', 'Se encarga principalmente del mantenimiento físico de computadoras', 'Administra redes y conexiones entre dispositivos', 'Fabrica los componentes utilizados por las computadoras'],
  ['¿Qué es un programa?', 'Un conjunto de instrucciones que le indica a un dispositivo qué hacer', 'Un sistema utilizado para conectar diferentes dispositivos', 'Un conjunto de componentes que forman una computadora', 'Un espacio donde se almacenan archivos digitales'],
  ['¿Cuál de estos es un lenguaje de programación?', 'JavaScript', 'Google Chrome', 'Windows', 'Google Drive'],
  ['¿Qué se utiliza principalmente para crear la estructura de una página web?', 'HTML', 'CSS', 'JavaScript', 'SQL'],
  ['¿Para qué sirve principalmente CSS en una página web?', 'Para definir la apariencia y el diseño de los elementos', 'Para agregar funcionalidades e interacción', 'Para almacenar información de los usuarios', 'Para definir la estructura principal del contenido'],
  ['¿Qué permite hacer JavaScript en una página web?', 'Agregar interacción y comportamiento a los elementos de la página', 'Definir principalmente los colores y tamaños de los elementos', 'Organizar físicamente los archivos de una computadora', 'Almacenar permanentemente la información de los usuarios'],
  ['¿Qué es una aplicación?', 'Un programa creado para realizar determinadas tareas o funciones', 'Un componente utilizado para ejecutar programas', 'Un sistema que conecta una computadora con Internet', 'Un conjunto de archivos almacenados en una computadora'],
  ['¿Qué es una base de datos?', 'Un sistema que permite almacenar y organizar información', 'Un programa utilizado para crear páginas web', 'Un sistema encargado de proteger una computadora', 'Un conjunto de dispositivos conectados entre sí'],
  ['¿Cuál de estos es un ejemplo de software?', 'WhatsApp', 'Teclado', 'Memoria RAM', 'Monitor'],
  ['¿Cuál de estos es un ejemplo de hardware?', 'Teclado', 'Sistema operativo', 'Navegador web', 'Aplicación de mensajería'],
  ['¿Qué significa "bug" en programación?', 'Un error que puede provocar un comportamiento incorrecto en un programa', 'Una función utilizada para mejorar el rendimiento de un programa', 'Una herramienta utilizada para diseñar páginas web', 'Un archivo utilizado para almacenar información'],
  ['¿Qué hace un programador cuando encuentra un bug?', 'Analiza el problema e intenta corregirlo', 'Reinstala siempre el sistema operativo', 'Reemplaza el programa por otro diferente', 'Elimina los datos almacenados por el programa'],
  ['¿Cuál de estos dispositivos puede ejecutar aplicaciones?', 'Smartphone', 'Monitor', 'Teclado', 'Router'],
  ['¿Qué es un algoritmo?', 'Una serie de pasos ordenados para resolver un problema o realizar una tarea', 'Un programa utilizado para almacenar información', 'Un lenguaje utilizado para crear aplicaciones', 'Un sistema utilizado para conectar computadoras'],
  ['¿Para qué sirve principalmente una contraseña?', 'Para controlar y proteger el acceso a una cuenta o sistema', 'Para aumentar la velocidad de un dispositivo', 'Para almacenar archivos de manera segura', 'Para mejorar la conexión a Internet'],
  ['¿Qué es una página web?', 'Un recurso digital al que se puede acceder mediante un navegador', 'Un programa que permite conectar dispositivos entre sí', 'Un sistema utilizado para almacenar físicamente información', 'Una aplicación que necesariamente debe instalarse en una computadora'],
  ['¿Cuál de estos es un navegador web?', 'Google Chrome', 'Windows', 'WhatsApp', 'Android'],
  ['¿Qué es un videojuego?', 'Un tipo de software interactivo creado principalmente para entretener', 'Un dispositivo electrónico diseñado para ejecutar programas', 'Un lenguaje de programación especializado en gráficos', 'Una plataforma utilizada exclusivamente para crear páginas web'],
  ['¿Cuál de estas características puede ser útil para estudiar Desarrollo de Software?', 'Tener interés por resolver problemas y aprender cosas nuevas', 'Tener conocimientos avanzados de programación antes de comenzar', 'Saber reparar cualquier componente de una computadora', 'Tener experiencia profesional desarrollando aplicaciones'],
  ['¿Qué puede crear un desarrollador de software?', 'Aplicaciones, páginas web, sistemas y videojuegos, entre otras cosas', 'Solamente programas para computadoras de escritorio', 'Principalmente componentes físicos para computadoras', 'Exclusivamente páginas web y aplicaciones móviles'],
].map(([text, correct, ...incorrect]) => ({ text, correct, incorrect }));

//variables
let keys = {};
let bricks = [];
let score = 0;
let lives = SETTINGS.lives;
let currentLevel = 0;
let state = 'ready';
let lastTime = 0;
let audioContext;
let questionQueue = [];
let questionAnswered = false;
let questionDeadline = 0;
let questionInterval;
let questionTransition;
const paddle = { width: 140, height: 17, x: 0, y: canvas.height - 45 };
const ball = { radius: 9, x: 0, y: 0, vx: 0, vy: 0 };

//muestra un mensaje. Recibe título, texto y botón.
function setMessage(title, text, buttonText = 'Jugar') {
  messageEl.querySelector('h2').textContent = title;
  document.querySelector('#message-text').textContent = text;
  const isHome = title === 'NEON BREAKER';
  messageEl.classList.remove('is-home');
  if (isHome) messageEl.classList.add('is-home');
  document.querySelector('#home-scoreboard').hidden = !isHome;
  if (isHome) window.arcadeScores.refreshHome();
  startButton.textContent = buttonText;
  messageEl.hidden = false;
}

//actualiza puntaje, vidas y nivel en pantalla.
function updateHud() {
  scoreEl.textContent = String(score).padStart(5, '0');
  livesEl.textContent = '♥ '.repeat(lives).trim() || '—';
  levelEl.textContent = String(currentLevel + 1).padStart(2, '0');
}

//unibca los ladrillos del nivel actual.
function buildLevel() {
  const layout = LEVELS[currentLevel];
  const totalWidth = layout[0].length * (SETTINGS.brickWidth + SETTINGS.brickGap) - SETTINGS.brickGap;
  const startX = (canvas.width - totalWidth) / 2;
  bricks = [];
  for (let row = 0; row < layout.length; row++) {
    for (let column = 0; column < layout[row].length; column++) {
      const type = layout[row][column];
      if (type !== 0) bricks.push({ type, x: startX + column * (SETTINGS.brickWidth + SETTINGS.brickGap), y: 72 + row * (SETTINGS.brickHeight + SETTINGS.brickGap), width: SETTINGS.brickWidth, height: SETTINGS.brickHeight });
    }
  }
}

//centra la plataforma y coloca la pelota.
function resetBall() {
  paddle.x = (canvas.width - paddle.width) / 2;
  ball.x = canvas.width / 2;
  ball.y = paddle.y - ball.radius - 2;
  ball.vx = SETTINGS.ballSpeed * (Math.random() > 0.5 ? 0.72 : -0.72);
  ball.vy = -SETTINGS.ballSpeed;
}

//prepara una partida nueva.
function resetGame() {
  restartButton.disabled = false;
  keys = {};
  clearQuestionTimers();
  questionAnswered = true;
  score = 0; lives = SETTINGS.lives; currentLevel = 0;
  questionModal.hidden = true;
  questionModal.classList.remove('is-closing');
  buildLevel(); resetBall(); updateHud();
  state = 'ready';
  setMessage('NEON BREAKER', 'Movete con ← → o A / D');
}

function shuffled(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

function getQuestion() {
  if (questionQueue.length === 0) questionQueue = shuffled(QUESTIONS);
  return questionQueue.pop();
}

// Detiene la partida mientras el jugador responde si conserva la vida.
function clearQuestionTimers() {
  clearInterval(questionInterval);
  clearTimeout(questionTransition);
}

function showLifeQuestion() {
  clearQuestionTimers();
  const question = getQuestion();
  questionAnswered = false;
  state = 'question';
  questionModal.hidden = false;
  questionModal.classList.remove('is-closing');
  questionTitle.textContent = 'Respondé para conservar tu vida';
  questionText.textContent = question.text;
  questionOptions.replaceChildren();
  questionDeadline = performance.now() + SETTINGS.questionSeconds * 1000;
  questionTimer.textContent = `${SETTINGS.questionSeconds} s`;
  questionInterval = setInterval(() => {
    if (window.arcadeScores.confirming) return;
    const remaining = Math.max(0, Math.ceil((questionDeadline - performance.now()) / 1000));
    questionTimer.textContent = `${remaining} s`;
    if (remaining === 0) answerQuestion(false, question.correct);
  }, 100);

  for (const answer of shuffled([question.correct, ...question.incorrect])) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'question-option';
    button.textContent = answer;
    button.addEventListener('click', () => answerQuestion(answer === question.correct, question.correct, answer));
    questionOptions.append(button);
  }
}

function answerQuestion(isCorrect, correctAnswer, selectedAnswer) {
  if (questionAnswered || state !== 'question') return;
  const timedOut = performance.now() >= questionDeadline;
  if (timedOut) {
    isCorrect = false;
    selectedAnswer = undefined;
    questionTimer.textContent = '0 s';
  }
  questionAnswered = true;
  clearInterval(questionInterval);
  const options = [...questionOptions.querySelectorAll('button')];
  options.forEach((option) => {
    option.disabled = true;
    if (option.textContent === correctAnswer) option.classList.add('is-correct');
    else if (option.textContent === selectedAnswer && !isCorrect) option.classList.add('is-incorrect');
  });
  questionTitle.textContent = isCorrect ? '¡Correcto! Conservás tu vida' : 'Incorrecto: perdés una vida';
  if (timedOut) questionTitle.textContent = 'Tiempo agotado: perdés una vida';

  if (!isCorrect) {
    lives--;
    updateHud();
    playSound('life');
  }

  questionTransition = setTimeout(function closeQuestion() {
    if (window.arcadeScores.confirming) {
      questionTransition = setTimeout(closeQuestion, 100);
      return;
    }
    questionModal.classList.add('is-closing');
    questionTransition = setTimeout(function resumeGame() {
      if (window.arcadeScores.confirming) {
        questionTransition = setTimeout(resumeGame, 100);
        return;
      }
      questionModal.hidden = true;
      questionModal.classList.remove('is-closing');
      if (lives === 0) {
        finishGame(false);
      } else {
        resetBall();
        state = 'playing';
        lastTime = performance.now();
      }
    }, 450);
  }, 3000);
}

//inicia o continúa una partida.
function finishGame(won) {
  clearQuestionTimers();
  state = won ? 'won' : 'lost';
  keys = {};
  messageEl.hidden = true;
  restartButton.disabled = true;
  window.arcadeScores.finish(won, score, resetGame);
}

function startGame() {
  if (state !== 'ready' && state !== 'paused') return;
  state = 'playing';
  messageEl.hidden = true;
  lastTime = performance.now();
}

//reproduce un sonido.
function playSound(type) {
  if (!audioContext) audioContext = new AudioContext();
  const sounds = { wall: [300, 0.05], paddle: [460, 0.08], brick: [650, 0.07], life: [150, 0.35] };
  const sound = sounds[type];
  const oscillator = audioContext.createOscillator();
  const volume = audioContext.createGain();
  oscillator.frequency.value = sound[0];
  oscillator.type = type === 'life' ? 'sawtooth' : 'square';
  volume.gain.setValueAtTime(0.08, audioContext.currentTime);
  volume.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + sound[1]);
  oscillator.connect(volume);
  volume.connect(audioContext.destination);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + sound[1]);
}

//indica si una pelota toca un rectángulo. Recibe ambos objetos y devuelve true o false.
function overlapCircleRect(circle, rect) {
  const x = Math.max(rect.x, Math.min(circle.x, rect.x + rect.width));
  const y = Math.max(rect.y, Math.min(circle.y, rect.y + rect.height));
  return (circle.x - x) ** 2 + (circle.y - y) ** 2 < circle.radius ** 2;
}

//actualiza movimiento y colisiones. Recibe segundos entre cuadros.
function update(delta) {
  let direction = 0;
  if (keys.ArrowLeft || keys.a || keys.A) direction--;
  if (keys.ArrowRight || keys.d || keys.D) direction++;
  paddle.x += direction * SETTINGS.paddleSpeed * delta;
  paddle.x = Math.max(0, Math.min(canvas.width - paddle.width, paddle.x));
  ball.x += ball.vx * delta;
  ball.y += ball.vy * delta;

  if (ball.x - ball.radius < 0 || ball.x + ball.radius > canvas.width) {
    ball.vx *= -1;
    ball.x = Math.max(ball.radius, Math.min(canvas.width - ball.radius, ball.x));
    playSound('wall');
  }
  if (ball.y - ball.radius < 0) {
    ball.vy *= -1;
    ball.y = ball.radius;
    playSound('wall');
  }
  if (ball.vy > 0 && overlapCircleRect(ball, paddle)) {
    const hit = (ball.x - (paddle.x + paddle.width / 2)) / (paddle.width / 2);
    ball.vx = hit * SETTINGS.ballSpeed;
    ball.vy = -Math.abs(ball.vy);
    ball.y = paddle.y - ball.radius - 1;
    playSound('paddle');
  }

  for (let index = bricks.length - 1; index >= 0; index--) {
    const brick = bricks[index];
    if (!overlapCircleRect(ball, brick)) continue;
    const previousX = ball.x - ball.vx * delta;
    if (previousX + ball.radius < brick.x || previousX - ball.radius > brick.x + brick.width) ball.vx *= -1;
    else ball.vy *= -1;
    score += BRICK_TYPES[brick.type].points;
    bricks.splice(index, 1);
    updateHud();
    playSound('brick');
    break;
  }

  if (bricks.length === 0) {
    currentLevel++;
    if (currentLevel >= LEVELS.length) {
      finishGame(true);
      return;
    } else {
      buildLevel(); resetBall(); updateHud(); state = 'ready';
      setMessage(`NIVEL ${currentLevel + 1}`, 'Presioná jugar cuando estés listo', 'Continuar');
    }
  }
  if (ball.y - ball.radius > canvas.height) {
    showLifeQuestion();
  }
}

//dibuja el juego con colores sólidos.
function draw() {
  ctx.fillStyle = '#070b17';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = 'rgba(88, 225, 255, .07)';
  for (let x = 0; x < canvas.width; x += 45) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
  }
  for (const brick of bricks) {
    ctx.fillStyle = BRICK_TYPES[brick.type].color;
    ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
    ctx.fillStyle = 'rgba(255, 255, 255, .24)';
    ctx.fillRect(brick.x, brick.y, brick.width, 4);
  }
  ctx.fillStyle = '#eaf7ff';
  ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  ctx.fillStyle = '#60e7ff';
  ctx.fill();
}

//repite el juego en cada cuadro. Recibe la hora actual.
function loop(time) {
  const delta = Math.min((time - lastTime) / 1000, 0.03);
  lastTime = time;
  if (state === 'playing' && !window.arcadeScores.confirming) update(delta);
  draw();
  requestAnimationFrame(loop);
}

//guarda la tecla y controla el espacio.
function keyDown(event) {
  if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'r') {
    event.preventDefault();
    if (!event.repeat) {
      let openedAt;
      window.arcadeScores.confirmClear(() => {
        openedAt = performance.now();
        keys = {};
      }, () => {
        if (state === 'question' && !questionAnswered) questionDeadline += performance.now() - openedAt;
        lastTime = performance.now();
      });
    }
    return;
  }
  if (window.arcadeScores.confirming || state === 'won' || state === 'lost') return;
  const gameKeys = ['ArrowLeft', 'ArrowRight', ' ', 'a', 'A', 'd', 'D'];
  if (gameKeys.includes(event.key)) event.preventDefault();
  if (state === 'question') return;
  if (event.key === ' ') {
    if (event.repeat) return;
    if (state === 'playing') {
      state = 'paused';
      setMessage('PAUSA', 'Presioná jugar para continuar', 'Continuar');
    } else startGame();
  }
  keys[event.key] = true;
}

//quita una tecla guardada.
function keyUp(event) {
  keys[event.key] = false;
}

document.addEventListener('keydown', keyDown);
document.addEventListener('keyup', keyUp);
startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', resetGame);
resetGame();
requestAnimationFrame(loop);
