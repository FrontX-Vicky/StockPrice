import React, { useState } from 'react';

const WatchlistSidebar = ({ stocksMap, selectedStock, onSelectStock }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const stocks = Object.values(stocksMap).sort((a, b) => a.symbol.localeCompare(b.symbol));

  const filteredStocks = stocks.filter(stock => 
    stock.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: 'var(--bg-dark)' }}>
      {/* Sidebar Header & Search */}
      <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--card-border)', background: 'var(--card-bg)' }}>
        <h2 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '8px' }}>Watchlist</h2>
        <div style={{ position: 'relative' }}>
          <input 
            type="text" 
            placeholder="Search..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '6px 8px 6px 28px', 
              background: 'var(--bg-dark)', 
              border: '1px solid var(--card-border)', 
              color: 'var(--text-main)',
              borderRadius: '4px',
              outline: 'none',
              fontFamily: 'var(--font-sans)',
              fontSize: '12px'
            }}
          />
          <span style={{ position: 'absolute', left: '8px', top: '7px', color: 'var(--text-muted)', fontSize: '12px' }}>🔍</span>
        </div>
      </div>

      {/* Stocks List */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {filteredStocks.map(stock => {
          const change = stock.change || 0;
          const price = stock.price || 0;
          const percentChange = price > 0 ? (change / price) * 100 : 0;
          
          const isUp = change > 0;
          const isDown = change < 0;
          const changeColor = isUp ? 'var(--accent-green)' : isDown ? 'var(--accent-red)' : 'var(--text-muted)';
          const changeIcon = isUp ? '▲' : isDown ? '▼' : '';
          
          const formattedPrice = new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(price);
          const formattedChange = new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.abs(change));
          const formattedPercent = new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.abs(percentChange));

          return (
            <div 
              key={stock.symbol} 
              onClick={() => onSelectStock && onSelectStock(stock.symbol)}
              style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                padding: '8px 12px',
                borderBottom: '1px solid var(--card-border)',
                cursor: 'pointer',
                background: selectedStock === stock.symbol ? '#1e2434' : 'transparent'
              }}
              onMouseEnter={(e) => { if (selectedStock !== stock.symbol) e.currentTarget.style.background = 'var(--card-bg)' }}
              onMouseLeave={(e) => { if (selectedStock !== stock.symbol) e.currentTarget.style.background = 'transparent' }}
            >
              {/* Left Side: Symbol & Exchange */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontWeight: 600, fontSize: '12px', color: 'var(--text-main)' }}>{stock.symbol}</span>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{stock.exchange || 'NSE'}</span>
              </div>

              {/* Right Side: Price & Change */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                <span className={stock.priceClass || ''} style={{ fontWeight: 600, fontSize: '12px', color: changeColor }}>
                  {formattedPrice} <span style={{ fontSize: '9px' }}>{changeIcon}</span>
                </span>
                <span style={{ fontSize: '11px', color: changeColor, fontFamily: 'var(--font-mono)' }}>
                  {isUp ? '+' : (isDown ? '-' : '')}{formattedChange} ({isUp ? '+' : (isDown ? '-' : '')}{formattedPercent}%)
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WatchlistSidebar;
