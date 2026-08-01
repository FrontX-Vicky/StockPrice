import React, { useState } from 'react';

const FACTORS = {
  Monthly: 3.46,
  Weekly: 7.21,
  Daily: 19.1,
  Intraday: 19.1
};

const VixTab = ({ indices }) => {
  const [selectedIndex, setSelectedIndex] = useState('NIFTY 50');

  // We need the VIX data
  const vix = indices.find(i => i.symbol === 'INDIA_VIX');
  
  // Available target indices
  const targets = indices.filter(i => i.symbol !== 'INDIA_VIX');
  const target = targets.find(i => i.symbol.replace(/_/g, ' ') === selectedIndex) || targets[0];

  return (
    <div className="glass-panel" style={{  }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontWeight: 600 }}>VIX Range Calculator</h2>
        <select 
          value={selectedIndex} 
          onChange={(e) => setSelectedIndex(e.target.value)}
          style={{
            background: 'var(--card-bg)',
            color: 'var(--text-main)',
            border: '1px solid var(--card-border)',
            outline: 'none',
            fontWeight: 500
          }}
        >
          {targets.map(t => (
            <option key={t.symbol} value={t.symbol.replace(/_/g, ' ')}>{t.symbol.replace(/_/g, ' ')}</option>
          ))}
        </select>
      </div>
      
      {(!vix || !vix.historicalCloses || !target || !target.historicalCloses) ? (
        <div style={{ textAlign: 'center', color: '#94a3b8' }}>
          Loading VIX and Index historical data... (Takes approx 2-3 mins on fresh boot)
        </div>
      ) : (
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Horizon</th>
                <th>Closing Basis</th>
                <th>VIX Basis</th>
                <th>Factor</th>
                <th>Points Range</th>
                <th style={{ color: 'var(--accent-green)' }}>High Range</th>
                <th style={{ color: 'var(--accent-red)' }}>Low Range</th>
              </tr>
            </thead>
            <tbody>
              {/* Monthly Range */}
              {(() => {
                const closePrice = target.historicalCloses.prevMonthly || target.close; // Fallback to current close if missing
                const vixClose = vix.historicalCloses.prevMonthly || vix.close;
                const percent = vixClose / FACTORS.Monthly;
                const pts = (closePrice * percent) / 100;
                return (
                  <tr>
                    <td style={{ fontWeight: 600 }}>Monthly</td>
                    <td>{closePrice.toFixed(2)}</td>
                    <td>{vixClose.toFixed(2)}</td>
                    <td>{FACTORS.Monthly}</td>
                    <td style={{ color: 'var(--text-muted)' }}>± {pts.toFixed(2)}</td>
                    <td style={{ color: 'var(--accent-green)', fontWeight: 'bold' }}>{(closePrice + pts).toFixed(2)}</td>
                    <td style={{ color: 'var(--accent-red)', fontWeight: 'bold' }}>{(closePrice - pts).toFixed(2)}</td>
                  </tr>
                );
              })()}

              {/* Weekly Range */}
              {(() => {
                const closePrice = target.historicalCloses.prevWeekly || target.close;
                const vixClose = vix.historicalCloses.prevWeekly || vix.close;
                const percent = vixClose / FACTORS.Weekly;
                const pts = (closePrice * percent) / 100;
                return (
                  <tr>
                    <td style={{ fontWeight: 600 }}>Weekly</td>
                    <td>{closePrice.toFixed(2)}</td>
                    <td>{vixClose.toFixed(2)}</td>
                    <td>{FACTORS.Weekly}</td>
                    <td style={{ color: 'var(--text-muted)' }}>± {pts.toFixed(2)}</td>
                    <td style={{ color: 'var(--accent-green)', fontWeight: 'bold' }}>{(closePrice + pts).toFixed(2)}</td>
                    <td style={{ color: 'var(--accent-red)', fontWeight: 'bold' }}>{(closePrice - pts).toFixed(2)}</td>
                  </tr>
                );
              })()}

              {/* Daily Range */}
              {(() => {
                const closePrice = target.historicalCloses.prevDaily || target.close;
                const vixClose = vix.historicalCloses.prevDaily || vix.close;
                const percent = vixClose / FACTORS.Daily;
                const pts = (closePrice * percent) / 100;
                return (
                  <tr>
                    <td style={{ fontWeight: 600 }}>Daily</td>
                    <td>{closePrice.toFixed(2)}</td>
                    <td>{vixClose.toFixed(2)}</td>
                    <td>{FACTORS.Daily}</td>
                    <td style={{ color: 'var(--text-muted)' }}>± {pts.toFixed(2)}</td>
                    <td style={{ color: 'var(--accent-green)', fontWeight: 'bold' }}>{(closePrice + pts).toFixed(2)}</td>
                    <td style={{ color: 'var(--accent-red)', fontWeight: 'bold' }}>{(closePrice - pts).toFixed(2)}</td>
                  </tr>
                );
              })()}

              {/* Intraday Range (Live) */}
              {(() => {
                const closePrice = target.price > 0 ? target.price : target.close; // Live LTP
                const vixClose = vix.price > 0 ? vix.price : vix.close; // Live VIX
                const percent = vixClose / FACTORS.Intraday;
                const pts = (closePrice * percent) / 100;
                return (
                  <tr style={{ background: 'rgba(59, 130, 246, 0.05)' }}>
                    <td style={{ fontWeight: 600, color: '#3b82f6' }}>Intraday (Live)</td>
                    <td style={{ fontWeight: 'bold' }}>{closePrice.toFixed(2)}</td>
                    <td style={{ fontWeight: 'bold' }}>{vixClose.toFixed(2)}</td>
                    <td>{FACTORS.Intraday}</td>
                    <td style={{ color: 'var(--text-muted)' }}>± {pts.toFixed(2)}</td>
                    <td style={{ color: 'var(--accent-green)', fontWeight: 'bold' }}>{(closePrice + pts).toFixed(2)}</td>
                    <td style={{ color: 'var(--accent-red)', fontWeight: 'bold' }}>{(closePrice - pts).toFixed(2)}</td>
                  </tr>
                );
              })()}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default VixTab;
