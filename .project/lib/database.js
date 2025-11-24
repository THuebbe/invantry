/**
 * Tier 2 Database Manager for Invantry Project Orchestration
 * Handles SQLite connection, schema initialization, and basic operations
 *
 * Usage:
 *   const db = require('./.project/lib/database');
 *   const features = db.query('SELECT * FROM features WHERE status = ?', ['in-sprint']);
 *   const result = db.run('INSERT INTO features (id, name, status) VALUES (?, ?, ?)',
 *                         ['FEATURE-001', 'Waste Tracking', 'exploration']);
 */

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// Database file location
const PROJECT_ROOT = path.join(__dirname, '..');
const DB_PATH = path.join(PROJECT_ROOT, 'invantry.db');
const SCHEMA_PATH = path.join(PROJECT_ROOT, 'database', 'schema.sql');

// Global database instance
let db = null;

/**
 * Initialize database connection and schema
 * Called automatically on first use
 */
function initialize() {
  if (db) return db; // Already initialized

  console.log(`[Database] Initializing SQLite database at ${DB_PATH}`);

  db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
      console.error('[Database] Error opening database:', err.message);
      throw err;
    }
    console.log('[Database] Connected to SQLite database');
  });

  // Enable foreign keys
  db.run('PRAGMA foreign_keys = ON', (err) => {
    if (err) console.error('[Database] Error enabling foreign keys:', err);
  });

  // Load and execute schema
  const schema = fs.readFileSync(SCHEMA_PATH, 'utf-8');
  db.exec(schema, (err) => {
    if (err) {
      console.error('[Database] Error initializing schema:', err.message);
      throw err;
    }
    console.log('[Database] Schema initialized successfully');
  });

  return db;
}

/**
 * Execute a SELECT query and return all rows
 * @param {string} sql - SQL query with ? placeholders
 * @param {array} params - Parameters to bind to query
 * @returns {Promise<array>} Array of result rows
 */
async function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    if (!db) initialize();

    db.all(sql, params, (err, rows) => {
      if (err) {
        console.error('[Database] Query error:', err.message, { sql, params });
        reject(err);
      } else {
        resolve(rows || []);
      }
    });
  });
}

/**
 * Execute a single row SELECT query
 * @param {string} sql - SQL query with ? placeholders
 * @param {array} params - Parameters to bind to query
 * @returns {Promise<object>} Single result row or null
 */
async function queryOne(sql, params = []) {
  return new Promise((resolve, reject) => {
    if (!db) initialize();

    db.get(sql, params, (err, row) => {
      if (err) {
        console.error('[Database] Query error:', err.message, { sql, params });
        reject(err);
      } else {
        resolve(row || null);
      }
    });
  });
}

/**
 * Execute INSERT, UPDATE, or DELETE statement
 * @param {string} sql - SQL statement with ? placeholders
 * @param {array} params - Parameters to bind to statement
 * @returns {Promise<object>} { lastID, changes }
 */
async function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    if (!db) initialize();

    db.run(sql, params, function(err) {
      if (err) {
        console.error('[Database] Run error:', err.message, { sql, params });
        reject(err);
      } else {
        resolve({
          lastID: this.lastID,
          changes: this.changes
        });
      }
    });
  });
}

/**
 * Execute multiple statements in a transaction
 * @param {array} statements - Array of {sql, params} objects
 * @returns {Promise<array>} Results from each statement
 */
async function transaction(statements) {
  return new Promise((resolve, reject) => {
    if (!db) initialize();

    db.serialize(async () => {
      try {
        db.run('BEGIN TRANSACTION');
        const results = [];

        for (const stmt of statements) {
          const result = await run(stmt.sql, stmt.params);
          results.push(result);
        }

        db.run('COMMIT', (err) => {
          if (err) {
            db.run('ROLLBACK');
            reject(err);
          } else {
            resolve(results);
          }
        });
      } catch (err) {
        db.run('ROLLBACK');
        reject(err);
      }
    });
  });
}

/**
 * Close database connection
 */
function close() {
  if (db) {
    db.close((err) => {
      if (err) {
        console.error('[Database] Error closing database:', err.message);
      } else {
        console.log('[Database] Database closed');
        db = null;
      }
    });
  }
}

/**
 * Get database statistics
 * @returns {Promise<object>} Database info and stats
 */
async function getStats() {
  const stats = {
    path: DB_PATH,
    exists: fs.existsSync(DB_PATH),
    size: fs.existsSync(DB_PATH) ? fs.statSync(DB_PATH).size : 0
  };

  try {
    const features = await queryOne('SELECT COUNT(*) as count FROM features');
    const sprints = await queryOne('SELECT COUNT(*) as count FROM sprints');
    const tasks = await queryOne('SELECT COUNT(*) as count FROM tasks');
    const completions = await queryOne('SELECT COUNT(*) as count FROM completions');
    const blockers = await queryOne('SELECT COUNT(*) as count FROM blockers');

    stats.tables = {
      features: features.count,
      sprints: sprints.count,
      tasks: tasks.count,
      completions: completions.count,
      blockers: blockers.count
    };
  } catch (err) {
    stats.error = err.message;
  }

  return stats;
}

/**
 * Reset database (DANGER: Deletes all data)
 * Only use for testing
 */
async function reset() {
  if (!db) initialize();

  // Drop all tables
  const tables = ['metrics', 'agent_reports', 'blockers', 'completions', 'tasks', 'sprints', 'features'];

  for (const table of tables) {
    await run(`DROP TABLE IF EXISTS ${table}`);
  }

  // Reinitialize schema
  const schema = fs.readFileSync(SCHEMA_PATH, 'utf-8');
  return new Promise((resolve, reject) => {
    db.exec(schema, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

// Export database interface
module.exports = {
  initialize,
  query,
  queryOne,
  run,
  transaction,
  close,
  getStats,
  reset,
  DB_PATH
};
