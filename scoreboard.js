// En Electron se guarda un JSON; al abrir index.html se usa el navegador.
(() => {
  const storageKey = 'neon-breaker-scoreboard-v1';
  const normalize = (rows) => {
    if (!Array.isArray(rows)) throw new Error('Ranking inválido');
    return rows.filter(row => row && /^[A-Z]{3}$/.test(row.nickname) && Number.isSafeInteger(row.score) && row.score >= 0)
      .sort((a, b) => b.score - a.score).slice(0, 10);
  };
  const storage = window.scoreStorage || {
    async read() { return normalize(JSON.parse(localStorage.getItem(storageKey) || '[]')); },
    async add(entry) {
      const rows = normalize([...JSON.parse(localStorage.getItem(storageKey) || '[]'), entry]);
      localStorage.setItem(storageKey, JSON.stringify(rows));
      return rows;
    },
    async clear() { localStorage.removeItem(storageKey); return []; },
  };
  const $ = selector => document.querySelector(selector);
  const resultDialog = $('#result-dialog');
  const clearDialog = $('#clear-dialog');
  const form = $('#nickname-form');
  const nickname = $('#nickname');
  const saveButton = $('#save-score');
  let pendingEntry;
  let busy = false;
  let onNext;
  let onClearClose;
  let homeRequest = 0;

  function renderHome(rows) {
    $('#home-scoreboard-rows').replaceChildren();
    rows.forEach((entry, index) => {
      const row = document.createElement('tr');
      [index + 1, entry.nickname, String(entry.score).padStart(5, '0')].forEach(value => {
        const cell = document.createElement('td');
        cell.textContent = value;
        row.append(cell);
      });
      $('#home-scoreboard-rows').append(row);
    });
    $('#home-scoreboard-status').textContent = rows.length ? '' : 'Todavía no hay puntajes. ¡Sé el primero en jugar!';
  }

  async function refreshHome() {
    const request = ++homeRequest;
    try {
      const rows = await storage.read();
      if (request === homeRequest) renderHome(rows);
    } catch {
      if (request !== homeRequest) return;
      $('#home-scoreboard-rows').replaceChildren();
      $('#home-scoreboard-status').textContent = 'No se pudo cargar el ranking.';
    }
  }

  function render(rows, entryId) {
    $('#scoreboard-rows').replaceChildren();
    rows.forEach((entry, index) => {
      const row = document.createElement('tr');
      if (entry.id === entryId) row.classList.add('is-current');
      [index + 1, entry.nickname, String(entry.score).padStart(5, '0')].forEach(value => {
        const cell = document.createElement('td');
        cell.textContent = value;
        row.append(cell);
      });
      $('#scoreboard-rows').append(row);
    });
    $('#scoreboard-empty').hidden = rows.length !== 0;
    $('#scoreboard-note').textContent = entryId && !rows.some(row => row.id === entryId)
      ? 'Tu puntaje no alcanzó el Top 10. ¡Probá otra vez!' : '';
  }

  nickname.addEventListener('input', () => {
    nickname.value = nickname.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3);
    nickname.setCustomValidity('');
  });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (busy || !pendingEntry || clearDialog.open) return;
    const name = nickname.value.toUpperCase();
    if (!/^[A-Z]{3}$/.test(name)) {
      nickname.setCustomValidity('Ingresá exactamente 3 letras de la A a la Z.');
      nickname.reportValidity();
      return;
    }
    busy = true;
    saveButton.disabled = true;
    $('#score-error').textContent = '';
    try {
      const entry = { ...pendingEntry, nickname: name };
      const rows = await storage.add(entry);
      render(rows, entry.id);
      homeRequest++;
      renderHome(rows);
      pendingEntry = null;
      form.hidden = true;
      $('#scoreboard').hidden = false;
      $('#next-player').focus();
    } catch {
      $('#score-error').textContent = 'No se pudo guardar el ranking. Intentá nuevamente. Si el archivo está dañado, podés borrar el ranking con Ctrl + Shift + R.';
    } finally {
      busy = false;
      saveButton.disabled = false;
    }
  });
  resultDialog.addEventListener('cancel', event => event.preventDefault());
  $('#next-player').addEventListener('click', () => { resultDialog.close(); onNext(); });

  function closeClear() {
    clearDialog.close();
    onClearClose?.();
    onClearClose = null;
  }
  clearDialog.addEventListener('cancel', event => {
    event.preventDefault();
    if (!busy) closeClear();
  });
  $('#cancel-clear').addEventListener('click', () => { if (!busy) closeClear(); });
  $('#confirm-clear').addEventListener('click', async () => {
    if (busy) return;
    busy = true;
    $('#confirm-clear').disabled = true;
    $('#cancel-clear').disabled = true;
    try {
      await storage.clear();
      render([]);
      homeRequest++;
      renderHome([]);
      closeClear();
    } catch {
      $('#clear-error').textContent = 'No se pudo borrar el ranking. Intentá nuevamente.';
    } finally {
      busy = false;
      $('#confirm-clear').disabled = false;
      $('#cancel-clear').disabled = false;
    }
  });

  window.arcadeScores = {
    refreshHome,
    get confirming() { return clearDialog.open; },
    finish(won, score, next) {
      pendingEntry = { id: crypto.randomUUID(), score };
      onNext = next;
      $('#result-title').textContent = won ? '¡GANASTE!' : 'GAME OVER';
      $('#final-score').textContent = `Puntaje final: ${score}`;
      form.hidden = false;
      $('#scoreboard').hidden = true;
      $('#score-error').textContent = '';
      nickname.value = '';
      nickname.setCustomValidity('');
      resultDialog.showModal();
      nickname.focus();
    },
    confirmClear(onOpen, onClose) {
      if (busy || clearDialog.open) return;
      onClearClose = onClose;
      $('#clear-error').textContent = '';
      onOpen();
      clearDialog.showModal();
      $('#cancel-clear').focus();
    },
  };
})();
