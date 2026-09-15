const fs = require('node:fs');
const path = require('node:path');

function validEntry(entry) {
  return entry && typeof entry.id === 'string' && entry.id.length <= 80
    && typeof entry.nickname === 'string' && /^[A-Z]{3}$/.test(entry.nickname)
    && Number.isSafeInteger(entry.score) && entry.score >= 0;
}

function createScoreStore(directory) {
  const file = path.join(directory, 'scoreboard.json');
  function read() {
    try {
      const rows = JSON.parse(fs.readFileSync(file, 'utf8'));
      if (!Array.isArray(rows) || !rows.every(validEntry)) throw new Error('Ranking inválido');
      return rows.sort((a, b) => b.score - a.score).slice(0, 10);
    } catch (error) {
      if (error.code === 'ENOENT') return [];
      throw error;
    }
  }
  function write(rows) {
    fs.mkdirSync(directory, { recursive: true });
    const temporary = file + '.tmp';
    fs.writeFileSync(temporary, JSON.stringify(rows, null, 2), 'utf8');
    fs.renameSync(temporary, file);
    return rows;
  }
  return {
    read,
    add(entry) {
      if (!validEntry(entry)) throw new Error('Puntaje inválido');
      const rows = read();
      if (rows.some(row => row.id === entry.id)) return rows;
      rows.push({ id: entry.id, nickname: entry.nickname, score: entry.score });
      return write(rows.sort((a, b) => b.score - a.score).slice(0, 10));
    },
    clear() { return write([]); },
  };
}

module.exports = { createScoreStore };
