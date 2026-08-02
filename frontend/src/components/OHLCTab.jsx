import React from 'react';

const OHLCTab = ({ stocks }) => {
  // Filter for Open=High (SELL) or Open=Low (BUY)
  const filteredStocks = stocks.filter(stock => {
    // Need a tiny margin of error for floating point math if needed, but prices should be exact usually.
    return (stock.open > 0 && (stock.open === stock.high || stock.open === stock.low));
  });

  return (
    <div >
      <h2 style={{ fontWeight: 600 }}>Open = High / Low Scanner</h2>
      
      {filteredStocks.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#94a3b8' }}>
          No stocks currently matching Open = High or Open = Low.
        </div>
      ) : (
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Signal</th>
                <th>LTP</th>
                <th>Open</th>
                <th>High</th>
                <th>Low</th>
              </tr>
            </thead>
            <tbody>
              {filteredStocks.map(stock => {
                const isSell = stock.open === stock.high;
                return (
                  <tr key={stock.symbol}>
                    <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>{stock.symbol}</td>
                    <td>
                      {isSell ? (
                        <span className="signal-sell">SELL (O=H)</span>
                      ) : (
                        <span className="signal-buy">BUY (O=L)</span>
                      )}
                    </td>
                    <td>{stock.price.toFixed(2)}</td>
                    <td>{stock.open.toFixed(2)}</td>
                    <td style={{ color: isSell ? 'var(--accent-red)' : 'inherit' }}>
                      {stock.high.toFixed(2)}
                    </td>
                    <td style={{ color: !isSell ? 'var(--accent-green)' : 'inherit' }}>
                      {stock.low.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default OHLCTab;
