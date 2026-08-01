const db = require('./db');
const { EMA } = require('technicalindicators');

// Delay helper for rate limiting
const delay = ms => new Promise(res => setTimeout(res, ms));

const formatDate = (date) => {
    return date.getFullYear() + '-' + 
           String(date.getMonth()+1).padStart(2,'0') + '-' + 
           String(date.getDate()).padStart(2,'0') + ' ' + 
           String(date.getHours()).padStart(2,'0') + ':' + 
           String(date.getMinutes()).padStart(2,'0');
};

/**
 * Fetch historical data from Angel One API safely with rate limiting.
 * @param {object} smart_api - Authenticated SmartAPI instance
 * @param {string} symbol - Stock symbol
 * @param {string} token - Token ID
 * @param {string} exchange - 'NSE' or 'NFO'
 * @param {string} interval - 'ONE_DAY' or 'THREE_MINUTE'
 */
async function fetchHistoricalSafely(smart_api, symbol, token, exchange, interval) {
    // Determine from and to dates
    const toDate = new Date();
    const fromDate = new Date();
    
    if (interval === 'ONE_DAY') {
        fromDate.setDate(toDate.getDate() - 100); // last 100 days for 21 EMA to be accurate
    } else if (interval === 'THREE_MINUTE') {
        fromDate.setDate(toDate.getDate() - 5); // last 5 days for intraday
    } else if (interval === 'FIVE_MINUTE') {
        fromDate.setDate(toDate.getDate() - 2); // last 2 days for 1st 5-min candle (in case today just started)
    }

    // Check DB for latest data
    const lastFetched = await db.getLastFetchedTimestamp(symbol, interval);
    if (lastFetched) {
        const lastDate = new Date(lastFetched);
        // If data is very recent (e.g. within the last day), we might skip fetching ONE_DAY
        // For simplicity, we just fetch from the lastDate.
        // To avoid overlapping issues, we just set fromDate to lastDate
        if (lastDate > fromDate) {
            fromDate.setTime(lastDate.getTime());
        }
    }

    // If fromDate is almost equal to toDate, skip to save API calls
    if (toDate.getTime() - fromDate.getTime() < 1000 * 60 * 60) {
        return; // Data is fresh enough
    }

    try {
        const payload = {
            exchange: exchange,
            symboltoken: token,
            interval: interval,
            fromdate: formatDate(fromDate),
            todate: formatDate(toDate)
        };
        
        const response = await smart_api.getCandleData(payload);
        if (response && response.status && response.data) {
            await db.insertCandles(symbol, interval, response.data);
        }
    } catch (err) {
        console.error(`Error fetching historical for ${symbol} (${interval}):`, err.message);
    }
}

/**
 * Queue processor to fetch data for all stocks sequentially to avoid rate limits (3 req/sec).
 */
async function syncAllHistoricalData(smart_api, tokens, fnoTokens, indexTokens, bseTokens, progressCallback) {
    console.log("Starting historical data sync queue...");
    
    const allStocks = [];
    if (tokens) for (const [token, symbol] of Object.entries(tokens)) allStocks.push({token, symbol, exchange: 'NSE'});
    if (fnoTokens) for (const [token, symbol] of Object.entries(fnoTokens)) allStocks.push({token, symbol, exchange: 'NFO'});
    if (indexTokens) for (const [token, symbol] of Object.entries(indexTokens)) allStocks.push({token, symbol, exchange: 'NSE'});
    if (bseTokens) for (const [token, symbol] of Object.entries(bseTokens)) allStocks.push({token, symbol, exchange: 'BSE'});

    for (let i = 0; i < allStocks.length; i++) {
        const stock = allStocks[i];
        
        // Fetch Daily
        await fetchHistoricalSafely(smart_api, stock.symbol, stock.token, stock.exchange, 'ONE_DAY');
        await delay(350); // Rate limit buffer (~3 req/sec)

        // Fetch 3-Min for Intraday tab
        await fetchHistoricalSafely(smart_api, stock.symbol, stock.token, stock.exchange, 'THREE_MINUTE');
        await delay(350);
        
        // Fetch 5-Min for Momentum Phase 3 rule
        await fetchHistoricalSafely(smart_api, stock.symbol, stock.token, stock.exchange, 'FIVE_MINUTE');
        await delay(350);
        
        if (progressCallback && i % 5 === 0) {
            progressCallback(i + 1, allStocks.length);
        }
        
        if (i % 20 === 0 && i > 0) console.log(`Synced ${i} / ${allStocks.length} stocks...`);
    }
    
    if (progressCallback) progressCallback(allStocks.length, allStocks.length);
    console.log("Historical data sync complete!");
}

/**
 * Calculates previous daily, weekly, and monthly closing prices for Indices (VIX engine).
 */
async function calculateIndexCloses(symbol) {
    const result = { prevDaily: 0, prevWeekly: 0, prevMonthly: 0 };
    const candles = await db.getCandles(symbol, 'ONE_DAY', 100);
    
    if (!candles || candles.length === 0) return result;

    const getWeekNumber = (d) => {
        const date = new Date(d.getTime());
        date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
        const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
        return Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
    };

    const now = new Date();
    const currentWeek = getWeekNumber(now);
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Oldest to newest
    let prevDailyCandle = null;
    let prevWeeklyCandle = null;
    let prevMonthlyCandle = null;

    for (const c of candles) {
        const cDate = new Date(c.timestamp);
        const cWeek = getWeekNumber(cDate);
        const cMonth = cDate.getMonth();
        const cYear = cDate.getFullYear();

        // Daily: Just take the last available candle that isn't today
        if (cDate.toDateString() !== now.toDateString()) {
            prevDailyCandle = c;
        }

        // Weekly: The last candle belonging to a week strictly before currentWeek
        // (handling year wrap-around simplistically by just checking if year is less or week is less)
        if (cYear < currentYear || (cYear === currentYear && cWeek < currentWeek)) {
            prevWeeklyCandle = c;
        }

        // Monthly: The last candle belonging to a month strictly before currentMonth
        if (cYear < currentYear || (cYear === currentYear && cMonth < currentMonth)) {
            prevMonthlyCandle = c;
        }
    }

    if (prevDailyCandle) result.prevDaily = prevDailyCandle.close;
    if (prevWeeklyCandle) result.prevWeekly = prevWeeklyCandle.close;
    if (prevMonthlyCandle) result.prevMonthly = prevMonthlyCandle.close;

    return result;
}

/**
 * Calculate the static EMAs for a stock using data from SQLite
 * @param {string} symbol 
 * @returns {object} The calculated EMAs { ema5: number, ema9: number, ema21: number, intraEma9High: number, intraEma9Low: number }
 */
async function calculateEMAs(symbol) {
    const result = { ema5: 0, ema9: 0, ema21: 0, intraEma9High: 0, intraEma9Low: 0 };
    
    // 1. Calculate Daily EMAs
    const dailyCandles = await db.getCandles(symbol, 'ONE_DAY', 100);
    if (dailyCandles && dailyCandles.length >= 21) {
        const closes = dailyCandles.map(c => c.close);
        const ema5Arr = EMA.calculate({ period: 5, values: closes });
        const ema9Arr = EMA.calculate({ period: 9, values: closes });
        const ema21Arr = EMA.calculate({ period: 21, values: closes });
        
        result.ema5 = ema5Arr.length > 0 ? ema5Arr[ema5Arr.length - 1] : 0;
        result.ema9 = ema9Arr.length > 0 ? ema9Arr[ema9Arr.length - 1] : 0;
        result.ema21 = ema21Arr.length > 0 ? ema21Arr[ema21Arr.length - 1] : 0;
    }

    // 2. Calculate Intraday EMAs (using High and Low arrays for 9 EMA)
    const intraCandles = await db.getCandles(symbol, 'THREE_MINUTE', 100);
    if (intraCandles && intraCandles.length >= 9) {
        const highs = intraCandles.map(c => c.high);
        const lows = intraCandles.map(c => c.low);
        
        const ema9HighArr = EMA.calculate({ period: 9, values: highs });
        const ema9LowArr = EMA.calculate({ period: 9, values: lows });
        
        result.intraEma9High = ema9HighArr.length > 0 ? ema9HighArr[ema9HighArr.length - 1] : 0;
        result.intraEma9Low = ema9LowArr.length > 0 ? ema9LowArr[ema9LowArr.length - 1] : 0;
    }

    return result;
}

/**
 * Calculates Phase 3 Momentum Engine statistics.
 */
async function calculateMomentumStats(symbol) {
    const stats = {
        momentumScore: 0,
        momentumTotal: 0,
        isMomentum: false,
        first5MinMove: 0,
        is5MinValid: true // defaults to true if no candle found
    };

    try {
        // 1. Calculate 60-Day Momentum Rule
        const dailyCandles = await db.getCandles(symbol, 'ONE_DAY', 60);
        if (dailyCandles && dailyCandles.length > 0) {
            stats.momentumTotal = dailyCandles.length;
            let daysMet = 0;
            
            for (const c of dailyCandles) {
                // Ignore candles with bad data
                if (!c.open || c.open === 0) continue;
                
                const gapUp = Math.abs(c.high - c.open) / c.open;
                const gapDown = Math.abs(c.open - c.low) / c.open;
                const totalMove = Math.abs(c.close - c.open) / c.open;
                
                // If any of the moves is >= 0.95% (0.0095)
                if (gapUp >= 0.0095 || gapDown >= 0.0095 || totalMove >= 0.0095) {
                    daysMet++;
                }
            }
            stats.momentumScore = daysMet;
            if (daysMet >= 50) {
                stats.isMomentum = true;
            }
        }

        // 2. Calculate 1st 5-Minute Candle restriction for the CURRENT day
        const fiveMinCandles = await db.getCandles(symbol, 'FIVE_MINUTE', 100);
        if (fiveMinCandles && fiveMinCandles.length > 0) {
            // Find the first candle of the most recent trading day
            // Sort by timestamp asc, find the first one for the latest date
            const sorted = fiveMinCandles.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
            const latestDateString = new Date(sorted[sorted.length - 1].timestamp).toDateString();
            
            const firstCandleOfDay = sorted.find(c => new Date(c.timestamp).toDateString() === latestDateString);
            
            if (firstCandleOfDay && firstCandleOfDay.low > 0) {
                const move = Math.abs(firstCandleOfDay.high - firstCandleOfDay.low) / firstCandleOfDay.low;
                stats.first5MinMove = move * 100; // in percentage
                
                // Disqualify if it moves more than 0.60% (0.006)
                if (move > 0.006) {
                    stats.is5MinValid = false;
                }
            }
        }
    } catch (err) {
        console.error(`Error calculating momentum for ${symbol}:`, err);
    }

    return stats;
}

module.exports = {
    fetchHistoricalSafely,
    syncAllHistoricalData,
    calculateEMAs,
    calculateIndexCloses,
    calculateMomentumStats
};
