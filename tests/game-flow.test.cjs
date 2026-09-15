const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');

function setup() {
  const elements = new Map(), saved = new Map(), timers = new Map();
  let now = 0, timerId = 0, entryId = 0;
  function element() {
    return {
      value: '', textContent: '', hidden: false, open: false, disabled: false, children: [], handlers: {},
      classList: { add() {}, remove() {} },
      addEventListener(name, fn) { this.handlers[name] = fn; },
      append(child) { this.children.push(child); }, replaceChildren() { this.children = []; },
      querySelectorAll() { return this.children; }, querySelector() { return element(); },
      focus() {}, setCustomValidity() {}, reportValidity() {},
      showModal() { this.open = true; }, close() { this.open = false; },
    };
  }
  const $ = key => { if (!elements.has(key)) elements.set(key, element()); return elements.get(key); };
  $('#game').width = 900; $('#game').height = 600; $('#game').getContext = () => ({});
  const context = vm.createContext({
    document: { querySelector: $, createElement: element, addEventListener() {} },
    performance: { now: () => now }, crypto: { randomUUID: () => String(++entryId) },
    localStorage: { getItem: key => saved.get(key), setItem: (key, value) => saved.set(key, value), removeItem: key => saved.delete(key) },
    requestAnimationFrame() {},
    setTimeout(fn, ms) { timers.set(++timerId, { fn, ms }); return timerId; },
    clearTimeout: id => timers.delete(id),
    setInterval(fn, ms) { timers.set(++timerId, { fn, ms, interval: true }); return timerId; },
    clearInterval: id => timers.delete(id),
  });
  context.window = context;
  const run = code => vm.runInContext(code, context);
  for (const file of ['scoreboard.js', 'game.js']) run(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'));
  run('playSound = () => {}');
  function fire(ms) {
    const entry = [...timers].find(([, timer]) => timer.ms === ms);
    assert.ok(entry, `Temporizador de ${ms} ms`);
    if (!entry[1].interval) timers.delete(entry[0]);
    entry[1].fn();
  }
  const event = { preventDefault() {} };
  return { $, run, saved, fire, setTime: value => { now = value; }, event };
}

test('victoria pide apodo, guardar muestra ranking y siguiente jugador reinicia', async () => {
  const { $, run, event } = setup();
  run('currentLevel = 2; bricks = []; state = "playing"; score = 900; update(0)');
  assert.equal(run('state'), 'won');
  assert.equal($('#result-dialog').open, true);
  assert.equal($('#result-title').textContent, '¡GANASTE!');
  assert.equal($('#restart-button').disabled, true);
  $('#nickname').value = 'a1bc'; $('#nickname').handlers.input();
  assert.equal($('#nickname').value, 'ABC');
  await $('#nickname-form').handlers.submit(event);
  assert.equal($('#nickname-form').hidden, true);
  assert.equal($('#scoreboard').hidden, false);
  assert.equal($('#scoreboard-rows').children[0].children[2].textContent, '00900');
  assert.equal($('#home-scoreboard-rows').children[0].children[2].textContent, '00900');
  await $('#nickname-form').handlers.submit(event);
  assert.equal($('#scoreboard-rows').children.length, 1);
  $('#next-player').handlers.click();
  assert.equal(run('state'), 'ready'); assert.equal(run('lives'), 2);
});

test('dos tiempos agotados abren el registro de derrota', () => {
  const { $, run, fire, setTime } = setup();
  for (let i = 1; i <= 2; i++) {
    run('showLifeQuestion()'); setTime(i * 20000); fire(100); fire(3000); fire(450);
  }
  assert.equal(run('lives'), 0); assert.equal(run('state'), 'lost');
  assert.equal($('#result-dialog').open, true);
  assert.equal($('#result-title').textContent, 'GAME OVER');
});

test('atajo pide confirmación: cancelar conserva y confirmar borra el ranking', async () => {
  const { $, run, saved, event } = setup();
  run('finishGame(false)'); $('#nickname').value = 'AAA';
  await $('#nickname-form').handlers.submit(event);
  const shortcut = 'keyDown({ key: "R", ctrlKey: true, shiftKey: true, preventDefault() {} })';
  run(shortcut); assert.equal($('#clear-dialog').open, true);
  $('#clear-dialog').handlers.cancel(event);
  assert.equal(saved.size, 1);
  run(shortcut); await $('#confirm-clear').handlers.click();
  assert.equal(saved.size, 0); assert.equal($('#clear-dialog').open, false);
  assert.equal($('#scoreboard-rows').children.length, 0);
  assert.equal($('#home-scoreboard-rows').children.length, 0);
});

test('inicio carga puntajes persistidos y oculta el ranking durante la pausa', async () => {
  const { $, run, saved } = setup();
  saved.set('neon-breaker-scoreboard-v1', JSON.stringify([
    { id: '1', nickname: 'AAA', score: 30 },
    { id: '2', nickname: 'BBB', score: 80 },
  ]));
  await run('window.arcadeScores.refreshHome()');
  assert.equal($('#home-scoreboard').hidden, false);
  assert.equal($('#home-scoreboard-rows').children[0].children[1].textContent, 'BBB');
  run('setMessage("PAUSA", "Continuar", "Continuar")');
  assert.equal($('#home-scoreboard').hidden, true);
  assert.equal($('#message-text').textContent, 'Continuar');
});

test('confirmación pausa el contador y no bloquea escribir A/D en el apodo', () => {
  const { run, $, fire, setTime } = setup();
  run('showLifeQuestion()'); setTime(5000);
  run('keyDown({ key: "R", ctrlKey: true, shiftKey: true, preventDefault() {} })');
  setTime(35000); fire(100); assert.equal(run('lives'), 2);
  $('#cancel-clear').handlers.click(); fire(100);
  assert.equal($('#question-timer').textContent, '15 s');
  run('finishGame(false); keyDown({ key: "a", preventDefault() { throw new Error("Tecla bloqueada"); } })');
});
