import React from 'react';

const SRTab = ({ stocks }) => {
  // Filter for stocks that have S&R data from the CSV
  const srStocks = stocks.filter(stock => stock.sr != null);

  return (
    <div >
      <h2 style={{ fontWeight: 600 }}>Support & Resistance Levels</h2>
      
      {srStocks.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#94a3b8' }}>
          No Support/Resistance data loaded. Check the backend CSV file.
        </div>
      ) : (
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Symbol</th>
                <th>LTP</th>
                <th>S3</th>
                <th>S2</th>
                <th>S1</th>
                <th>Gap</th>
                <th>R1</th>
                <th>R2</th>
                <th>R3</th>
              </tr>
            </thead>
            <tbody>
              {srStocks.map(stock => {
                const { sr, price } = stock;
                return (
                  <tr key={stock.symbol}>
                    <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>{stock.symbol}</td>
                    <td style={{ fontWeight: 'bold', color: '#3b82f6' }}>{price.toFixed(2)}</td>
                    <td>{sr.s3.toFixed(2)}</td>
                    <td>{sr.s2.toFixed(2)}</td>
                    <td style={{ color: 'var(--accent-red)' }}>{sr.s1.toFixed(2)}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{sr.strikeGap.toFixed(2)}</td>
                    <td style={{ color: 'var(--accent-green)' }}>{sr.r1.toFixed(2)}</td>
                    <td>{sr.r2.toFixed(2)}</td>
                    <td>{sr.r3.toFixed(2)}</td>
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

export default SRTab;
