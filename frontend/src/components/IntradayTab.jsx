import React from 'react';

const IntradayTab = ({ stocks }) => {
  return (
    <div className="glass-panel" style={{  }}>
      <h2 style={{ fontWeight: 600 }}>Intraday Alert (3-Min EMA)</h2>
      
      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Symbol</th>
              <th>Signal</th>
              <th>LTP</th>
              <th>9 EMA High</th>
              <th>9 EMA Low</th>
            </tr>
          </thead>
          <tbody>
            {stocks.map(stock => {
              if (!stock.emas || !stock.emas.intraEma9High) {
                return (
                  <tr key={stock.symbol}>
                    <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>{stock.symbol}</td>
                    <td colSpan="4" style={{ color: 'var(--text-muted)', textAlign: 'center' }}>Calculating EMAs...</td>
                  </tr>
                );
              }
              
              const { price } = stock;
              const { intraEma9High, intraEma9Low } = stock.emas;
              
              let signal = 'Wait';
              if (price > intraEma9High) {
                signal = 'BUY';
              } else if (price < intraEma9Low) {
                signal = 'SELL';
              }

              return (
                <tr key={stock.symbol}>
                  <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>{stock.symbol}</td>
                  <td>
                    {signal === 'BUY' && <span className="signal-buy">BUY</span>}
                    {signal === 'SELL' && <span className="signal-sell">SELL</span>}
                    {signal === 'Wait' && <span style={{ color: 'var(--text-muted)' }}>-</span>}
                  </td>
                  <td style={{ fontWeight: 'bold' }}>{price.toFixed(2)}</td>
                  <td style={{ color: signal === 'BUY' ? 'var(--accent-green)' : 'inherit' }}>{intraEma9High.toFixed(2)}</td>
                  <td style={{ color: signal === 'SELL' ? 'var(--accent-red)' : 'inherit' }}>{intraEma9Low.toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default IntradayTab;
