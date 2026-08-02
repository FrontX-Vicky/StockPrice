import React, { useState } from 'react';

const LeverageTab = () => {
  const [capital, setCapital] = useState(100000);
  const [leverage, setLeverage] = useState(5);
  const [buyPrice, setBuyPrice] = useState(300);
  const [targetPrice, setTargetPrice] = useState(315);
  const [slPrice, setSlPrice] = useState(295);

  // Calculations
  const buyingPower = capital * leverage;
  const quantity = buyPrice > 0 ? Math.floor(buyingPower / buyPrice) : 0;
  
  const targetPoint = targetPrice - buyPrice;
  const targetPercent = buyPrice > 0 ? (targetPoint / buyPrice) * 100 : 0;
  const targetProfit = targetPoint * quantity;

  const slPoint = buyPrice - slPrice;
  const slPercent = buyPrice > 0 ? (slPoint / buyPrice) * 100 : 0;
  const slLoss = slPoint * quantity;

  let rrRatio = 0;
  if (slPoint > 0 && targetPoint > 0) {
    rrRatio = targetPoint / slPoint;
  }

  const isFavorable = rrRatio >= 1;
  const isInvalid = targetPoint <= 0 || slPoint <= 0;

  return (
    <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexWrap: 'wrap', gap: '24px' }}>
      
      {/* Input Form */}
      <div style={{ flex: '1 1 300px' }}>
        <h2 style={{ fontWeight: 600, marginBottom: '12px' }}>Trade Setup</h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div className="input-group">
            <label style={{ color: 'var(--text-muted)', fontSize: '0.9rem', display: 'block' }}>Capital (₹)</label>
            <input 
              type="number" 
              value={capital} 
              onChange={e => setCapital(Number(e.target.value))}
              style={inputStyle}
            />
          </div>
          <div className="input-group">
            <label style={{ color: 'var(--text-muted)', fontSize: '0.9rem', display: 'block' }}>Leverage (x)</label>
            <input 
              type="number" 
              value={leverage} 
              onChange={e => setLeverage(Number(e.target.value))}
              style={inputStyle}
            />
          </div>
          <div className="input-group">
            <label style={{ color: 'var(--text-muted)', fontSize: '0.9rem', display: 'block' }}>Entry Price</label>
            <input 
              type="number" 
              value={buyPrice} 
              onChange={e => setBuyPrice(Number(e.target.value))}
              style={inputStyle}
            />
          </div>
          <div className="input-group">
            <label style={{ color: 'var(--text-muted)', fontSize: '0.9rem', display: 'block' }}>Target Price</label>
            <input 
              type="number" 
              value={targetPrice} 
              onChange={e => setTargetPrice(Number(e.target.value))}
              style={{ ...inputStyle, borderColor: 'var(--accent-green)' }}
            />
          </div>
          <div className="input-group">
            <label style={{ color: 'var(--text-muted)', fontSize: '0.9rem', display: 'block' }}>Stoploss Price</label>
            <input 
              type="number" 
              value={slPrice} 
              onChange={e => setSlPrice(Number(e.target.value))}
              style={{ ...inputStyle, borderColor: 'var(--accent-red)' }}
            />
          </div>
        </div>
      </div>

      {/* Dashboard Metrics */}
      <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <h2 style={{ fontWeight: 600 }}>Risk Dashboard</h2>
        
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Buying Power</span>
            <span style={{ fontWeight: 'bold' }}>₹ {buyingPower.toLocaleString('en-IN')}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Max Quantity</span>
            <span style={{ fontWeight: 'bold', color: '#3b82f6', fontSize: '1.2rem' }}>{quantity.toLocaleString('en-IN')} Shares</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ flex: 1, background: 'rgba(46, 189, 133, 0.1)', border: '1px solid rgba(46, 189, 133, 0.2)', padding: '12px' }}>
            <div style={{ color: 'var(--accent-green)', fontWeight: 600 }}>Target Projection</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent-green)' }}>+ ₹{targetProfit > 0 ? targetProfit.toLocaleString('en-IN') : '0'}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {targetPoint > 0 ? targetPoint.toFixed(2) : '0'} pts ({targetPercent > 0 ? targetPercent.toFixed(2) : '0'}%)
            </div>
          </div>

          <div style={{ flex: 1, background: 'rgba(246, 70, 93, 0.1)', border: '1px solid rgba(246, 70, 93, 0.2)', padding: '12px' }}>
            <div style={{ color: 'var(--accent-red)', fontWeight: 600 }}>Max Risk (SL)</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent-red)' }}>- ₹{slLoss > 0 ? slLoss.toLocaleString('en-IN') : '0'}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {slPoint > 0 ? slPoint.toFixed(2) : '0'} pts ({slPercent > 0 ? slPercent.toFixed(2) : '0'}%)
            </div>
          </div>
        </div>

        <div style={{ 
          background: isInvalid ? 'var(--card-bg)' : isFavorable ? 'rgba(46, 189, 133, 0.15)' : 'rgba(246, 70, 93, 0.15)', 
          border: `1px solid ${isInvalid ? 'var(--card-border)' : isFavorable ? 'var(--accent-green)' : 'var(--accent-red)'}`,
          textAlign: 'center',
          padding: '16px'
        }}>
          <div style={{ color: isInvalid ? 'var(--text-muted)' : isFavorable ? 'var(--accent-green)' : 'var(--accent-red)', fontWeight: 600 }}>
            Risk : Reward Ratio
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: isInvalid ? 'var(--text-muted)' : isFavorable ? 'var(--accent-green)' : 'var(--accent-red)' }}>
            {isInvalid ? 'Invalid Setup' : `1 : ${rrRatio.toFixed(2)}`}
          </div>
          {!isInvalid && !isFavorable && (
             <div style={{ fontSize: '0.85rem', color: 'var(--accent-red)' }}>
               Warning: You are risking more than your potential reward!
             </div>
          )}
        </div>

      </div>
    </div>
  );
};

const inputStyle = {
  width: '100%',
  background: 'rgba(0,0,0,0.2)',
  border: '1px solid var(--card-border)',
  color: 'var(--text-main)',
  outline: 'none',
  padding: '6px 8px',
  marginTop: '4px',
  fontSize: '14px',
  fontWeight: 500
};

export default LeverageTab;
