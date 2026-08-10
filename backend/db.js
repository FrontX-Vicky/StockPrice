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
            if (err) return reject(err);
        });

        // Create table for tracking intraday scanners (O=H/L, Volume, etc)
        db.run(`CREATE TABLE IF NOT EXISTS scanner_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT,
            symbol TEXT,
            type TEXT,
            detected_at TEXT,
            broken_at TEXT,
            status TEXT,
            details TEXT
        )`, (err) => {
            if (err) return reject(err);
            resolve();
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

/**
 * Fetch scanner logs for a specific date
 */
function getScannerLogs(date) {
    return new Promise((resolve, reject) => {
        db.all(
            `SELECT * FROM scanner_logs WHERE date = ? ORDER BY detected_at DESC`,
            [date],
            (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            }
        );
    });
}

/**
 * Upsert a scanner log. If it exists for the same date, symbol, and type, just update if needed.
 */
function upsertScannerLog(date, symbol, type, detected_at, status, details) {
    return new Promise((resolve, reject) => {
        db.get(
            `SELECT id, status FROM scanner_logs WHERE date = ? AND symbol = ? AND type = ?`,
            [date, symbol, type],
            (err, row) => {
                if (err) return reject(err);
                
                if (row) {
                    // Update only if status changed (e.g. from ACTIVE to BROKEN)
                    if (row.status !== status) {
                        const broken_at = status === 'BROKEN' ? new Date().toISOString() : null;
                        db.run(
                            `UPDATE scanner_logs SET status = ?, broken_at = ?, details = ? WHERE id = ?`,
                            [status, broken_at, details, row.id],
                            (err) => err ? reject(err) : resolve(row.id)
                        );
                    } else {
                        resolve(row.id);
                    }
                } else {
                    // Insert new log
                    db.run(
                        `INSERT INTO scanner_logs (date, symbol, type, detected_at, broken_at, status, details) 
                         VALUES (?, ?, ?, ?, NULL, ?, ?)`,
                        [date, symbol, type, detected_at, status, details],
                        function(err) {
                            if (err) reject(err);
                            else resolve(this.lastID);
                        }
                    );
                }
            }
        );
    });
}

module.exports = {
    db,
    dbInitPromise,
    insertCandles,
    getLastFetchedTimestamp,
    getCandles,
    getScannerLogs,
    upsertScannerLog
};
