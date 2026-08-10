const { upsertScannerLog } = require('./db');

// In-memory cache to prevent spamming the database for unchanged states
// { 'INFY': { 'O=H': 'ACTIVE', 'O=L': 'BROKEN' } }
const scannerCache = {};

/**
 * Process a live market tick and evaluate intraday tracking strategies.
 * @param {string} symbol - The stock symbol (e.g., 'TATAPOWER')
 * @param {object} tickData - { price, open, high, low, volume, vwap }
 */
async function processTick(symbol, tickData) {
    if (!symbol || !tickData.open) return;

    const { price, open, high, low } = tickData;
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const now = new Date().toISOString();

    if (!scannerCache[symbol]) {
        scannerCache[symbol] = {};
    }

    // --- 1. Open = High Tracker (SELL SIGNAL) ---
    // Buffer of 0.05% as requested by user
    const highBuffer = open * 1.0005;
    
    // Condition to be considered O=H initially
    // We only care if high is currently <= open + buffer.
    // If it is, and price hasn't broken above highBuffer, it's ACTIVE.
    
    let ohStatus = null;
    if (high <= highBuffer) {
        ohStatus = 'ACTIVE';
    } else if (scannerCache[symbol]['O=H'] === 'ACTIVE') {
        // If it was active but the high just broke the buffer, it's broken!
        ohStatus = 'BROKEN';
    }

    if (ohStatus && scannerCache[symbol]['O=H'] !== ohStatus) {
        scannerCache[symbol]['O=H'] = ohStatus;
        try {
            await upsertScannerLog(date, symbol, 'O=H', now, ohStatus, JSON.stringify({ open, high, price }));
        } catch (err) {
            console.error(`Error upserting O=H log for ${symbol}:`, err.message);
        }
    }


    // --- 2. Open = Low Tracker (BUY SIGNAL) ---
    const lowBuffer = open * 0.9995;
    
    let olStatus = null;
    if (low >= lowBuffer) {
        olStatus = 'ACTIVE';
    } else if (scannerCache[symbol]['O=L'] === 'ACTIVE') {
        // If it was active but the low just broke the buffer, it's broken!
        olStatus = 'BROKEN';
    }

    if (olStatus && scannerCache[symbol]['O=L'] !== olStatus) {
        scannerCache[symbol]['O=L'] = olStatus;
        try {
            await upsertScannerLog(date, symbol, 'O=L', now, olStatus, JSON.stringify({ open, low, price }));
        } catch (err) {
            console.error(`Error upserting O=L log for ${symbol}:`, err.message);
        }
    }

    // --- 3. VWAP Crossover Tracker ---
    // Track when price crosses above VWAP
    if (tickData.vwap && price) {
        const vwapStatusKey = 'VWAP_CROSS';
        let vwapStatus = scannerCache[symbol][vwapStatusKey];
        
        if (price > tickData.vwap) {
            // Price is above VWAP. If it wasn't tracked before, we don't know exactly when it crossed,
            // but we can mark it active. For true "crossover" we'd need historical state, but live state is fine.
            if (!vwapStatus) {
                vwapStatus = 'ACTIVE';
            }
        } else if (price < tickData.vwap && vwapStatus === 'ACTIVE') {
            vwapStatus = 'BROKEN';
        }

        if (vwapStatus && scannerCache[symbol][vwapStatusKey] !== vwapStatus) {
            scannerCache[symbol][vwapStatusKey] = vwapStatus;
            try {
                await upsertScannerLog(date, symbol, vwapStatusKey, now, vwapStatus, JSON.stringify({ price, vwap: tickData.vwap }));
            } catch (err) { }
        }
    }

    // --- 4. Volume Shocker Tracker ---
    // If volume is suddenly high on a single tick. Since we don't have historical average here easily,
    // we can use a simpler metric or wait until we implement historical average fetch.
    // For now, if volume > 1,000,000 we log it (simplified).
    if (tickData.volume && tickData.volume > 1000000) {
        const volKey = 'VOLUME_SHOCKER';
        if (scannerCache[symbol][volKey] !== 'ACTIVE') {
            scannerCache[symbol][volKey] = 'ACTIVE';
            try {
                await upsertScannerLog(date, symbol, volKey, now, 'ACTIVE', JSON.stringify({ volume: tickData.volume }));
            } catch (err) {}
        }
    }
}

module.exports = {
    processTick
};
