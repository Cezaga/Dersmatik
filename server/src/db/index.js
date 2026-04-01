const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

const dbPath = process.env.DB_PATH || './data/dersmatik.db';
const fullPath = path.resolve(__dirname, '../../', dbPath);
const dbDir = path.dirname(fullPath);
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

let _db = null;
let _ready = null;

// Wrapper that provides a better-sqlite3-like synchronous API over sql.js
class DbWrapper {
  constructor(db, filePath) {
    this._db = db;
    this._filePath = filePath;
    this._saveInterval = setInterval(() => this._save(), 5000);
  }

  _save() {
    try {
      const data = this._db.export();
      fs.writeFileSync(this._filePath, Buffer.from(data));
    } catch {}
  }

  exec(sql) {
    this._db.run(sql);
    this._save();
  }

  prepare(sql) {
    const db = this._db;
    const wrapper = this;
    return {
      run(...params) {
        db.run(sql, params);
        wrapper._save();
        return { changes: db.getRowsModified() };
      },
      get(...params) {
        const stmt = db.prepare(sql);
        stmt.bind(params);
        if (stmt.step()) {
          const row = stmt.getAsObject();
          stmt.free();
          return row;
        }
        stmt.free();
        return undefined;
      },
      all(...params) {
        const results = [];
        const stmt = db.prepare(sql);
        stmt.bind(params);
        while (stmt.step()) {
          results.push(stmt.getAsObject());
        }
        stmt.free();
        return results;
      }
    };
  }

  pragma(pragma) {
    try { this._db.run(`PRAGMA ${pragma}`); } catch {}
  }

  transaction(fn) {
    const self = this;
    return function(...args) {
      self._db.run('BEGIN TRANSACTION');
      try {
        const result = fn(...args);
        self._db.run('COMMIT');
        self._save();
        return result;
      } catch (err) {
        self._db.run('ROLLBACK');
        throw err;
      }
    };
  }

  close() {
    clearInterval(this._saveInterval);
    this._save();
    this._db.close();
  }
}

function initDb() {
  if (_ready) return _ready;
  _ready = initSqlJs().then(SQL => {
    let db;
    if (fs.existsSync(fullPath)) {
      const buffer = fs.readFileSync(fullPath);
      db = new SQL.Database(buffer);
    } else {
      db = new SQL.Database();
    }
    _db = new DbWrapper(db, fullPath);
    _db.pragma('foreign_keys = ON');
    return _db;
  });
  return _ready;
}

// Proxy that auto-initializes and delegates
const proxy = new Proxy({}, {
  get(target, prop) {
    if (prop === 'init') return initDb;
    if (prop === '__isProxy') return true;
    if (!_db) throw new Error('Database not initialized. Call db.init() first.');
    return typeof _db[prop] === 'function' ? _db[prop].bind(_db) : _db[prop];
  }
});

module.exports = proxy;
