import React from 'react';

const MarketPulse = ({ indices }) => {
  return (
    <div className="market-pulse glass-panel" style={{ 
        display: 'flex', 
        justifyContent: 'space-around', flexWrap: 'wrap' }}>
      {indices.map(index => {
        const { symbol, price, close } = index;
        const changeValue = price - close;
        const changePercent = close > 0 ? (changeValue / close) * 100 : 0;
        const isUp = changeValue >= 0;
        
        return (
          <div key={symbol} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '4px' }}>
                {symbol.replace(/_/g, ' ')}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--text-main)' }}>
                  {price > 0 ? price.toFixed(2) : '-'}
              </span>
              {price > 0 && (
                  <span style={{ 
                      fontSize: '0.85rem', 
                      fontWeight: 600,
                      color: isUp ? 'var(--accent-green)' : 'var(--accent-red)' 
                  }}>
                      {isUp ? '▲' : '▼'} {Math.abs(changeValue).toFixed(2)} ({Math.abs(changePercent).toFixed(2)}%)
                  </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MarketPulse;
