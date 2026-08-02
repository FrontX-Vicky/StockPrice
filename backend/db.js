const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Connect to SQLite DB (creates file if it doesn't exist)
const dataDir = path.join(__dirname, 'data');
if (!require('fs').existsSync(dataDir)) {
    require('fs').mkdirSync(dataDir);
}
const dbPath = path.join(dataDir, 'data.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to the SQLite database.');
    }
});

const dbInitPromise = new Promise((resolve, reject) => {
    db.serialize(() => {
        // Create table for storing historical candles
        db.run(`CREATE TABLE IF NOT EXISTS historical_candles (
            symbol TEXT,
            interval TEXT,
            timestamp TEXT,
            open REAL,
            high REAL,
            low REAL,
            close REAL,
            volume REAL,
            PRIMARY KEY (symbol, interval, timestamp)
        )`, (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
});

/**
 * Insert an array of candles for a symbol and interval.
 * @param {string} symbol - The stock symbol (e.g. INFY)
 * @param {string} interval - e.g. 'ONE_DAY' or 'THREE_MINUTE'
 * @param {Array} candles - Array of [timestamp, open, high, low, close, volume]
 */
function insertCandles(symbol, interval, candles) {
    return new Promise((resolve, reject) => {
        if (!candles || candles.length === 0) return resolve();

        db.serialize(() => {
            db.run('BEGIN TRANSACTION');
            
            const stmt = db.prepare(`INSERT OR REPLACE INTO historical_candles 
                (symbol, interval, timestamp, open, high, low, close, volume) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);

            for (const c of candles) {
                // c: [timestamp, open, high, low, close, volume]
                stmt.run(symbol, interval, c[0], c[1], c[2], c[3], c[4], c[5]);
            }
            
            stmt.finalize();
            
            db.run('COMMIT', (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    });
}

/**
 * Get the latest timestamp fetched for a symbol and interval.
 * @param {string} symbol 
 * @param {string} interval 
 * @returns {Promise<string|null>} The timestamp string or null if empty
 */
function getLastFetchedTimestamp(symbol, interval) {
    return new Promise((resolve, reject) => {
        db.get(`SELECT MAX(timestamp) as maxTs FROM historical_candles WHERE symbol = ? AND interval = ?`, 
            [symbol, interval], 
            (err, row) => {
                if (err) reject(err);
                else resolve(row ? row.maxTs : null);
            });
    });
}

/**
 * Get all candles for a symbol and interval, ordered by time.
 * @param {string} symbol 
 * @param {string} interval 
 * @param {number} limit - max rows to return (e.g. 100)
 */
function getCandles(symbol, interval, limit = 100) {
    return new Promise((resolve, reject) => {
        // We order by timestamp DESC to get the latest, then reverse in JS to feed into technical indicators
        db.all(`SELECT * FROM historical_candles WHERE symbol = ? AND interval = ? ORDER BY timestamp DESC LIMIT ?`,
            [symbol, interval, limit],
            (err, rows) => {
                if (err) reject(err);
                else resolve(rows.reverse()); // Oldest to newest
            });
    });
}

/**
 * Retrieve candles for a symbol and interval.
 */
function getCandles(symbol, interval) {
    return new Promise((resolve, reject) => {
        db.all(
            `SELECT timestamp, open, high, low, close, volume 
             FROM historical_candles 
             WHERE symbol = ? AND interval = ?
             ORDER BY timestamp ASC`,
            [symbol, interval],
            (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            }
        );
    });
}

module.exports = {
    db,
    dbInitPromise,
    insertCandles,
    getLastFetchedTimestamp,
    getCandles
};
