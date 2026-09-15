const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createScoreStore } = require('../score-store.cjs');

function fixture(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'neon-score-test-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  return { directory, store: createScoreStore(directory) };
}
test('persiste el Top 10 ordenado al abrir otra instancia del almacén', t => {
  const { directory, store } = fixture(t);
  assert.deepEqual(store.read(), []);
  for (let i = 0; i < 12; i++) store.add({ id: String(i), nickname: 'ABC', score: i * 10 });
  const rows = createScoreStore(directory).read();
  assert.equal(rows.length, 10);
  assert.deepEqual(rows.map(row => row.score), [110, 100, 90, 80, 70, 60, 50, 40, 30, 20]);
  store.add({ id: '11', nickname: 'ABC', score: 110 });
  assert.equal(store.read().length, 10);
});
test('empates estables, validación y borrado persistente', t => {
  const { directory, store } = fixture(t);
  store.add({ id: 'first', nickname: 'UNO', score: 50 });
  store.add({ id: 'second', nickname: 'DOS', score: 50 });
  assert.deepEqual(store.read().map(row => row.id), ['first', 'second']);
  for (const entry of [{ nickname: 'AB', score: 1 }, { nickname: 'ABC', score: -1 }, { nickname: '<x>', score: 5 }]) {
    assert.throws(() => store.add({ id: 'invalid', ...entry }));
  }
  store.clear();
  assert.deepEqual(createScoreStore(directory).read(), []);
});
test('un archivo dañado no se sobrescribe al guardar; borrar permite recuperarlo', t => {
  const { directory, store } = fixture(t);
  fs.writeFileSync(path.join(directory, 'scoreboard.json'), 'invalid-json');
  assert.throws(() => store.add({ id: '1', nickname: 'ABC', score: 10 }));
  assert.equal(fs.readFileSync(path.join(directory, 'scoreboard.json'), 'utf8'), 'invalid-json');
  store.clear();
  assert.deepEqual(store.read(), []);
});
