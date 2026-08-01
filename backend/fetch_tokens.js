const https = require('https');

const nifty50 = [
  'ADANIENT', 'ADANIPORTS', 'APOLLOHOSP', 'ASIANPAINT', 'AXISBANK', 'BAJAJ-AUTO', 'BAJFINANCE', 
  'BAJAJFINSV', 'BPCL', 'BHARTIARTL', 'BRITANNIA', 'CIPLA', 'COALINDIA', 'DIVISLAB', 'DRREDDY', 
  'EICHERMOT', 'GRASIM', 'HCLTECH', 'HDFCBANK', 'HDFCLIFE', 'HEROMOTOCO', 'HINDALCO', 'HINDUNILVR', 
  'ICICIBANK', 'ITC', 'INDUSINDBK', 'INFY', 'JSWSTEEL', 'KOTAKBANK', 'LT', 'LTIM', 'M&M', 'MARUTI', 
  'NESTLEIND', 'NTPC', 'ONGC', 'POWERGRID', 'RELIANCE', 'SBILIFE', 'SBIN', 'SUNPHARMA', 'TCS', 
  'TATACONSUM', 'TATAMOTORS', 'TATASTEEL', 'TECHM', 'TITAN', 'ULTRACEMCO', 'WIPRO', 'TATAPOWER', 'NIPPOBATRY', 'ADANIPOWER'
];

https.get('https://margincalculator.angelbroking.com/OpenAPI_File/files/OpenAPIScripMaster.json', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        const scrips = JSON.parse(data);
        const tokens = {};
        scrips.forEach(s => {
            if (s.exch_seg === 'NSE' && s.symbol.endsWith('-EQ') && nifty50.includes(s.name)) {
                tokens[s.token] = s.name;
            }
        });
        console.log(JSON.stringify(tokens, null, 2));
    });
});
