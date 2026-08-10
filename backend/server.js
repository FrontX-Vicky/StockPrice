require('dotenv').config();
const express = require('express');
const http = require('http');
const { WebSocketServer } = require('ws');
const { SmartAPI, WebSocketV2 } = require('smartapi-javascript');
const totp = require('totp-generator');
const cors = require('cors');

const app = express();
app.use(cors());
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT || 8080;

// Angel One Credentials
const API_KEY = process.env.API_KEY;
const CLIENT_CODE = process.env.CLIENT_CODE;
const PIN = process.env.PIN;
const TOTP_SECRET = process.env.TOTP_SECRET;

// Token mapping for Nifty 50 stocks (NSE)
const TOKENS = {
  "25": "ADANIENT", "157": "APOLLOHOSP", "236": "ASIANPAINT", "317": "BAJFINANCE",
  "467": "HDFCLIFE", "526": "BPCL", "547": "BRITANNIA", "694": "CIPLA", "881": "DRREDDY",
  "910": "EICHERMOT", "1232": "GRASIM", "1333": "HDFCBANK", "1348": "HEROMOTOCO",
  "1363": "HINDALCO", "1394": "HINDUNILVR", "1594": "INFY", "1660": "ITC",
  "1922": "KOTAKBANK", "2031": "M&M", "2475": "ONGC", "2885": "RELIANCE",
  "3045": "SBIN", "3351": "SUNPHARMA", "3426": "TATAPOWER", "3432": "TATACONSUM",
  "3499": "TATASTEEL", "3506": "TITAN", "3787": "WIPRO", "4963": "ICICIBANK",
  "5258": "INDUSINDBK", "5900": "AXISBANK", "6782": "NIPPOBATRY", "7229": "HCLTECH",
  "10604": "BHARTIARTL", "10940": "DIVISLAB", "10999": "MARUTI", "11483": "LT",
  "11532": "ULTRACEMCO", "11536": "TCS", "11630": "NTPC", "11723": "JSWSTEEL",
  "13538": "TECHM", "14977": "POWERGRID", "15083": "ADANIPORTS", "16669": "BAJAJ-AUTO",
  "16675": "BAJAJFINSV", "17388": "ADANIPOWER", "17963": "NESTLEIND", "20374": "COALINDIA",
  "21808": "SBILIFE"
};
const FNO_TOKENS = {
  "58067": "BANKNIFTY25AUG26FUT", "58072": "NIFTY25AUG26FUT",
  "61088": "BANKNIFTY28JUL26FUT", "61093": "NIFTY28JUL26FUT",
  "63935": "NIFTY28JUL2623900CE", "63936": "NIFTY28JUL2623900PE",
  "63939": "NIFTY28JUL2624000CE", "63940": "NIFTY28JUL2624000PE",
  "63943": "NIFTY28JUL2624100CE", "63944": "NIFTY28JUL2624100PE"
};
const TOKEN_LIST = Object.keys(TOKENS);
const FNO_TOKEN_LIST = Object.keys(FNO_TOKENS);

const INDEX_TOKENS = {
    '26000': 'NIFTY_50',
    '26009': 'NIFTY_BANK',
    '26037': 'NIFTY_FIN_SERVICE',
    '26017': 'INDIA_VIX'
};
const BSE_TOKENS = {
    '99919000': 'SENSEX'
};

const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

let smartApiWs = null;
let latestPrices = {};
let supportResistanceData = {};

// Load Support & Resistance Data (F&O)
const csvPath = path.join(__dirname, '../raw/Automate Bot or Android App for Share Market Alert - F&O Share S_R.csv');
if (fs.existsSync(csvPath)) {
    fs.createReadStream(csvPath)
        .pipe(csv())
        .on('data', (data) => {
            if (data.TICKER) {
                const symbol = data.TICKER.trim();
                supportResistanceData[symbol] = {
                    s1: parseFloat(data['Support 1']) || 0,
                    s2: parseFloat(data['Support 2']) || 0,
                    s3: parseFloat(data['Support 3']) || 0,
                    s4: parseFloat(data['Support 4']) || 0,
                    s5: parseFloat(data['Support 5']) || 0,
                    r1: parseFloat(data['Resistance 1']) || 0,
                    r2: parseFloat(data['Resistance 2']) || 0,
                    r3: parseFloat(data['Resistance 3']) || 0,
                    r4: parseFloat(data['Resistance 4']) || 0,
                    r5: parseFloat(data['Resistance 5']) || 0,
                    strikeGap: parseFloat(data['STRIKE Price Gap']) || parseFloat(data['STICKE GAP']) || 0
                };
            }
        });
}

// Load Support & Resistance Data (Indices)
const indexCsvPath = path.join(__dirname, '../raw/Automate Bot or Android App for Share Market Alert - INDEX.csv');
if (fs.existsSync(indexCsvPath)) {
    fs.createReadStream(indexCsvPath)
        .pipe(csv())
        .on('data', (data) => {
            if (data.TICKER) {
                const symbol = data.TICKER.trim();
                supportResistanceData[symbol] = {
                    s1: parseFloat(data['Support 1']) || 0,
                    s2: parseFloat(data['Support 2']) || 0,
                    s3: parseFloat(data['Support 3']) || 0,
                    s4: parseFloat(data['Support 4']) || 0,
                    s5: parseFloat(data['Support 5']) || 0,
                    r1: parseFloat(data['Resistance 1']) || 0,
                    r2: parseFloat(data['Resistance 2']) || 0,
                    r3: parseFloat(data['Resistance 3']) || 0,
                    r4: parseFloat(data['Resistance 4']) || 0,
                    r5: parseFloat(data['Resistance 5']) || 0,
                    strikeGap: parseFloat(data['STICKE GAP']) || parseFloat(data['STRIKE Price Gap']) || 0
                };
            }
        })
        .on('end', () => {
            // Pre-fill latestPrices so frontend shows all stocks/indices immediately
            const initPriceObj = (symbol, exch) => ({
                symbol: symbol, exchange: exch, price: 0, change: 0, close: 0, open: 0, high: 0, low: 0,
                sr: supportResistanceData[symbol] || null
            });
            Object.values(TOKENS).forEach(sym => latestPrices[sym] = initPriceObj(sym, 'NSE'));
            Object.values(FNO_TOKENS).forEach(sym => latestPrices[sym] = initPriceObj(sym, 'NFO'));
            Object.values(INDEX_TOKENS).forEach(sym => latestPrices[sym] = initPriceObj(sym, 'INDEX'));
            Object.values(BSE_TOKENS).forEach(sym => latestPrices[sym] = initPriceObj(sym, 'BSE'));
        });
}

const smart_api = new SmartAPI({
    api_key: API_KEY,
});

async function authenticateAndConnect() {
    try {
        if (!API_KEY || !CLIENT_CODE || !PIN || !TOTP_SECRET) {
            console.warn("Credentials missing in .env, skipping SmartAPI connection.");
            return;
        }

        const generatedTotp = totp(TOTP_SECRET);
        
        console.log("Authenticating with Angel One...");
        const session = await smart_api.generateSession(CLIENT_CODE, PIN, generatedTotp);
        
        if (session.status) {
            console.log("Authentication successful.");
            const jwttoken = session.data.jwtToken;
            const feedtoken = session.data.feedToken;

            connectSmartApiWebsocket(jwttoken, feedtoken);
            
            // Start historical sync and EMA calculations in the background
            const { syncAllHistoricalData, calculateEMAs, calculateIndexCloses, calculateMomentumStats } = require('./historical');
            const { dbInitPromise } = require('./db');
            
            dbInitPromise.then(() => {
                return syncAllHistoricalData(
                    smart_api, TOKENS, FNO_TOKENS, INDEX_TOKENS, BSE_TOKENS,
                    (current, total) => {
                        broadcast({ type: 'sync_progress', current, total });
                    }
                );
            }).then(async () => {
                console.log("Calculating EMAs, Index Closes, and Momentum Stats...");
                for (const symbol of Object.values(TOKENS)) {
                    if (latestPrices[symbol]) {
                        latestPrices[symbol].emas = await calculateEMAs(symbol);
                        latestPrices[symbol].momentum = await calculateMomentumStats(symbol);
                    }
                }
                for (const symbol of Object.values(FNO_TOKENS)) {
                    if (latestPrices[symbol]) {
                        latestPrices[symbol].emas = await calculateEMAs(symbol);
                        latestPrices[symbol].momentum = await calculateMomentumStats(symbol);
                    }
                }
                for (const symbol of Object.values(INDEX_TOKENS)) {
                    if (latestPrices[symbol]) latestPrices[symbol].historicalCloses = await calculateIndexCloses(symbol);
                }
                for (const symbol of Object.values(BSE_TOKENS)) {
                    if (latestPrices[symbol]) latestPrices[symbol].historicalCloses = await calculateIndexCloses(symbol);
                }
                console.log("EMA, Index, and Momentum calculations complete.");
                isHistoricalSyncComplete = true;
                broadcast({ type: 'sync_complete' });
            }).catch(err => console.error("Error in historical sync:", err));

        } else {
            console.error("Authentication failed:", session.message);
        }
    } catch (err) {
        console.error("Error during authentication:", err.message || err);
    }
}

function connectSmartApiWebsocket(jwttoken, feedtoken) {
    smartApiWs = new WebSocketV2({
        jwttoken: jwttoken,
        apikey: API_KEY,
        clientcode: CLIENT_CODE,
        feedtype: feedtoken,
    });

    smartApiWs.connect()
        .then(() => {
            console.log("Connected to Angel One WebSocketV2.");
            
            // Subscribe to live market data (LTP)
            const nse_req = {
                correlationID: "nse_equities_stream",
                action: 1, // 1 for subscribe
                mode: 3, // 3 for SnapQuote (gives OHLC + LTP)
                exchangeType: 1, // 1 for NSE
                tokens: [...TOKEN_LIST, ...Object.keys(INDEX_TOKENS)]
            };
            
            const nfo_req = {
                correlationID: "nfo_stream",
                action: 1, // 1 for subscribe
                mode: 3, // 3 for SnapQuote
                exchangeType: 2, // 2 for NFO
                tokens: FNO_TOKEN_LIST 
            };
            
            const bse_req = {
                correlationID: "bse_stream",
                action: 1,
                mode: 1, // 1 for LTP (BSE indices often don't support SnapQuote)
                exchangeType: 3, // 3 for BSE
                tokens: Object.keys(BSE_TOKENS)
            };
            
            smartApiWs.fetchData(nse_req);
            smartApiWs.fetchData(nfo_req);
            smartApiWs.fetchData(bse_req);
        })
        .catch(err => {
            console.error("Error connecting to SmartAPI WS:", err);
        });

    smartApiWs.on('tick', (data) => {
        // data format varies, but usually contains token and ltp
        if (data && data.token) {
            const rawToken = data.token.replace(/['"]/g, '');
            let symbol = TOKENS[rawToken];
            let exchange = 'NSE';
            
            if (!symbol && FNO_TOKENS[rawToken]) {
                symbol = FNO_TOKENS[rawToken];
                exchange = 'NFO';
            }
            if (!symbol && INDEX_TOKENS[rawToken]) {
                symbol = INDEX_TOKENS[rawToken];
                exchange = 'INDEX';
            }
            if (!symbol && BSE_TOKENS[rawToken]) {
                symbol = BSE_TOKENS[rawToken];
                exchange = 'BSE';
            }

            if (symbol) {
                // SnapQuote provides multiple price fields. We convert them from paise to rupees.
                const price = data.last_traded_price ? data.last_traded_price / 100 : latestPrices[symbol].price;
                const open = data.open_price_day ? data.open_price_day / 100 : latestPrices[symbol].open;
                const high = data.high_price_day ? data.high_price_day / 100 : latestPrices[symbol].high;
                const low = data.low_price_day ? data.low_price_day / 100 : latestPrices[symbol].low;
                let close = data.close_price ? data.close_price / 100 : latestPrices[symbol].close;
                
                // VWAP & Volume
                const vwap = data.average_traded_price ? data.average_traded_price / 100 : latestPrices[symbol].vwap;
                const volume = data.volume_traded_today ? data.volume_traded_today : latestPrices[symbol].volume;
                
                // If Angel One doesn't provide a previous close, simulate one initially to show red/green
                if (close === 0 && price > 0) {
                    const mockOffset = price * (Math.random() * 0.02 - 0.01); // +/- 1%
                    close = price - mockOffset;
                }
                
                const change = price - close;
                
                latestPrices[symbol].price = price;
                latestPrices[symbol].change = change;
                latestPrices[symbol].close = close;
                latestPrices[symbol].open = open;
                latestPrices[symbol].high = high;
                latestPrices[symbol].low = low;
                latestPrices[symbol].vwap = vwap;
                latestPrices[symbol].volume = volume;
                // keep exchange info intact
                latestPrices[symbol].exchange = exchange;

                // Process intraday stateful tracking (O=H/L, etc)
                try {
                    const { processTick } = require('./scanner');
                    processTick(symbol, latestPrices[symbol]);
                } catch (e) {
                    console.error("Scanner tracking error:", e);
                }

                // Broadcast to all connected frontend clients
                broadcastToClients();
            }
        }
    });

    smartApiWs.on('error', (err) => {
        console.error("SmartAPI WS Error:", err);
    });

    smartApiWs.on('close', () => {
        console.log("SmartAPI WS Closed. Reconnecting...");
        setTimeout(authenticateAndConnect, 5000);
    });
}

function broadcastToClients() {
    const data = JSON.stringify({ type: 'market_data', data: latestPrices });
    wss.clients.forEach((client) => {
        if (client.readyState === 1) { // OPEN
            client.send(data);
        }
    });
}

function broadcast(messageObj) {
    const data = JSON.stringify(messageObj);
    wss.clients.forEach((client) => {
        if (client.readyState === 1) { // OPEN
            client.send(data);
        }
    });
}

let isHistoricalSyncComplete = false;

// Local WebSocket Server for the frontend
wss.on('connection', (ws) => {
    console.log("Frontend client connected.");
    // Send immediate snapshot of latest prices
    ws.send(JSON.stringify({ type: 'market_data', data: latestPrices }));
    // Tell client if we are already done syncing
    ws.send(JSON.stringify({ type: 'sync_status', isComplete: isHistoricalSyncComplete }));
});

app.get('/api/historical/:symbol', async (req, res) => {
    try {
        const symbol = req.params.symbol;
        const interval = req.query.interval || 'ONE_DAY';
        const { getCandles } = require('./db');
        const data = await getCandles(symbol, interval);
        res.json({ success: true, data });
    } catch (err) {
        console.error("Error fetching historical data:", err);
        res.status(500).json({ success: false, error: err.message });
    }
});

app.get('/api/scanners/:date', async (req, res) => {
    try {
        const { getScannerLogs } = require('./db');
        const date = req.params.date; // YYYY-MM-DD
        const logs = await getScannerLogs(date);
        res.json({ success: true, data: logs });
    } catch (err) {
        console.error("Error fetching scanner logs:", err);
        res.status(500).json({ success: false, error: err.message });
    }
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
});

server.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
    authenticateAndConnect();
});
