import React, { useState } from 'react';

const OptionsRangeTab = ({ indices }) => {
  const [selectedIndex, setSelectedIndex] = useState('NIFTY 50');
  const [callPremium, setCallPremium] = useState(150);
  const [putPremium, setPutPremium] = useState(130);

  // Available target indices (excluding VIX)
  const targets = indices.filter(i => i.symbol !== 'INDIA_VIX');
  const target = targets.find(i => i.symbol.replace(/_/g, ' ') === selectedIndex) || targets[0];

  const sum = (Number(callPremium) || 0) + (Number(putPremium) || 0);

  if (!target || !target.historicalCloses) {
    return (
      <div className="glass-panel" style={{  textAlign: 'center', color: '#94a3b8' }}>
        Loading Index Data...
      </div>
    );
  }

  const liveBase = target.price > 0 ? target.price : target.close;
  const weeklyBase = target.historicalCloses.prevWeekly || target.close;

  const calculateBands = (basePrice) => {
    return {
      r1: basePrice + sum,
      s1: basePrice - sum,
      r2: basePrice + (sum * 2),
      s2: basePrice - (sum * 2),
      r3: basePrice + (sum * 3),
      s3: basePrice - (sum * 3) };
  };

  const liveBands = calculateBands(liveBase);
  const weeklyBands = calculateBands(weeklyBase);

  return (
    <div >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
        <h2 style={{ fontWeight: 600 }}>Options Weekly Range Calculator</h2>
        
        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
          <select 
            value={selectedIndex} 
            onChange={(e) => setSelectedIndex(e.target.value)}
            style={inputStyle}
          >
            {targets.map(t => (
              <option key={t.symbol} value={t.symbol.replace(/_/g, ' ')}>{t.symbol.replace(/_/g, ' ')}</option>
            ))}
          </select>
          
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>1st OTM Call:</span>
            <input 
              type="number" 
              value={callPremium} 
              onChange={e => setCallPremium(e.target.value)}
              style={{ ...inputStyle, width: '100px', borderColor: 'var(--accent-green)' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>1st OTM Put:</span>
            <input 
              type="number" 
              value={putPremium} 
              onChange={e => setPutPremium(e.target.value)}
              style={{ ...inputStyle, width: '100px', borderColor: 'var(--accent-red)' }}
            />
          </div>
        </div>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--card-border)', display: 'flex', justifyContent: 'space-around' }}>
        <div>
           <span style={{ color: 'var(--text-muted)' }}>Combined Premium Sum:</span> 
           <strong style={{ fontSize: '1.2rem', marginLeft: '0.5rem', color: '#3b82f6' }}>{sum.toFixed(2)} pts</strong>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap' }}>
        {/* Live LTP Calculation */}
        <div style={{ flex: '1 1 300px' }}>
          <h3 style={{ borderBottom: '1px solid var(--card-border)', paddingBottom: '0.5rem' }}>
            Dynamic Projection <span style={{ fontSize: '0.9rem', fontWeight: 'normal', color: 'var(--text-muted)' }}>(Live LTP: {liveBase.toFixed(2)})</span>
          </h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>Level</th>
                <th>Probability</th>
                <th style={{ color: 'var(--accent-green)' }}>Resistance</th>
                <th style={{ color: 'var(--accent-red)' }}>Support</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ fontWeight: 600 }}>L1</td>
                <td>66% (1 SD)</td>
                <td style={{ color: 'var(--accent-green)', fontWeight: 'bold' }}>{liveBands.r1.toFixed(2)}</td>
                <td style={{ color: 'var(--accent-red)', fontWeight: 'bold' }}>{liveBands.s1.toFixed(2)}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>L2</td>
                <td>95% (2 SD)</td>
                <td style={{ color: 'var(--accent-green)', fontWeight: 'bold' }}>{liveBands.r2.toFixed(2)}</td>
                <td style={{ color: 'var(--accent-red)', fontWeight: 'bold' }}>{liveBands.s2.toFixed(2)}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>L3</td>
                <td>99% (3 SD)</td>
                <td style={{ color: 'var(--accent-green)', fontWeight: 'bold' }}>{liveBands.r3.toFixed(2)}</td>
                <td style={{ color: 'var(--accent-red)', fontWeight: 'bold' }}>{liveBands.s3.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Weekly Close Calculation */}
        <div style={{ flex: '1 1 300px' }}>
          <h3 style={{ borderBottom: '1px solid var(--card-border)', paddingBottom: '0.5rem' }}>
            Static Projection <span style={{ fontSize: '0.9rem', fontWeight: 'normal', color: 'var(--text-muted)' }}>(Prev Weekly Close: {weeklyBase.toFixed(2)})</span>
          </h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>Level</th>
                <th>Probability</th>
                <th style={{ color: 'var(--accent-green)' }}>Resistance</th>
                <th style={{ color: 'var(--accent-red)' }}>Support</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ fontWeight: 600 }}>L1</td>
                <td>66% (1 SD)</td>
                <td style={{ color: 'var(--accent-green)' }}>{weeklyBands.r1.toFixed(2)}</td>
                <td style={{ color: 'var(--accent-red)' }}>{weeklyBands.s1.toFixed(2)}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>L2</td>
                <td>95% (2 SD)</td>
                <td style={{ color: 'var(--accent-green)' }}>{weeklyBands.r2.toFixed(2)}</td>
                <td style={{ color: 'var(--accent-red)' }}>{weeklyBands.s2.toFixed(2)}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>L3</td>
                <td>99% (3 SD)</td>
                <td style={{ color: 'var(--accent-green)' }}>{weeklyBands.r3.toFixed(2)}</td>
                <td style={{ color: 'var(--accent-red)' }}>{weeklyBands.s3.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const inputStyle = {
  background: 'var(--card-bg)',
  color: 'var(--text-main)',
  border: '1px solid var(--card-border)',
  outline: 'none',
  fontWeight: 500
};

export default OptionsRangeTab;
