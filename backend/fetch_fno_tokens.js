const https = require('https');

https.get('https://margincalculator.angelbroking.com/OpenAPI_File/files/OpenAPIScripMaster.json', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        const scrips = JSON.parse(data);
        const fnoTokens = {};
        
        // Find NIFTY and BANKNIFTY Futures (instrumenttype: FUTIDX)
        const futures = scrips.filter(s => 
            s.exch_seg === 'NFO' && 
            s.instrumenttype === 'FUTIDX' && 
            (s.name === 'NIFTY' || s.name === 'BANKNIFTY')
        );
        
        // Sort by expiry to get the nearest ones
        futures.sort((a, b) => new Date(a.expiry) - new Date(b.expiry));
        
        // Get the top 4 closest expirations
        futures.slice(0, 4).forEach(s => {
            fnoTokens[s.token] = s.symbol;
        });
        
        console.log(JSON.stringify(fnoTokens, null, 2));
    });
});
