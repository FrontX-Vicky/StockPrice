const https = require('https');

https.get('https://margincalculator.angelbroking.com/OpenAPI_File/files/OpenAPIScripMaster.json', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        const scrips = JSON.parse(data);
        const fnoTokens = {};
        
        // Find NIFTY Options (instrumenttype: OPTIDX) near 24000
        const options = scrips.filter(s => 
            s.exch_seg === 'NFO' && 
            s.instrumenttype === 'OPTIDX' && 
            s.name === 'NIFTY' &&
            (s.strike === '2400000.000000' || s.strike === '2410000.000000' || s.strike === '2390000.000000')
        );
        
        // Sort by expiry to get the nearest ones
        options.sort((a, b) => new Date(a.expiry) - new Date(b.expiry));
        
        // Get the top 6 closest expirations (e.g., 3 strikes x 2 (CE/PE))
        options.slice(0, 6).forEach(s => {
            fnoTokens[s.token] = s.symbol;
        });
        
        console.log(JSON.stringify(fnoTokens, null, 2));
    });
});
