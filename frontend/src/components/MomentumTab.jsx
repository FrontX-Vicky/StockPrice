import React from 'react';

const MomentumTab = ({ stocks }) => {
  if (stocks.length === 0) {
    return (
      <div className="glass-panel" style={{  textAlign: 'center', color: 'var(--text-muted)' }}>
        No stocks available to process.
      </div>
    );
  }

  // Filter stocks that have momentum data calculated
  const processedStocks = stocks.filter(s => s.momentum && s.momentum.momentumTotal > 0);

  // Sort: Eligible first, then by Score (desc), then by 5-Min Move (asc)
  const sortedStocks = [...processedStocks].sort((a, b) => {
    const aEligible = a.momentum.isMomentum && a.momentum.is5MinValid;
    const bEligible = b.momentum.isMomentum && b.momentum.is5MinValid;
    
    if (aEligible && !bEligible) return -1;
    if (!aEligible && bEligible) return 1;
    
    if (b.momentum.momentumScore !== a.momentum.momentumScore) {
        return b.momentum.momentumScore - a.momentum.momentumScore;
    }
    return a.momentum.first5MinMove - b.momentum.first5MinMove;
  });

  return (
    <div className="glass-panel">
      <div style={{  borderBottom: '1px solid var(--card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontWeight: 600 }}>Phase 3: Momentum Engine</h2>
        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Showing <strong>{sortedStocks.length}</strong> F&O Stocks
        </div>
      </div>
      
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Symbol</th>
              <th>60-Day Score (&gt;= 50)</th>
              <th>1st 5-Min Move (&lt;= 0.60%)</th>
              <th>Eligibility</th>
            </tr>
          </thead>
          <tbody>
            {sortedStocks.map(stock => {
              const mom = stock.momentum;
              const isScoreValid = mom.isMomentum;
              const is5MinValid = mom.is5MinValid;
              const isEligible = isScoreValid && is5MinValid;

              return (
                <tr key={stock.symbol}>
                  <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>{stock.symbol}</td>
                  
                  {/* Score Column */}
                  <td>
                    <span style={{ 
                        color: isScoreValid ? 'var(--accent-green)' : 'var(--accent-red)',
                        fontWeight: 'bold'
                    }}>
                        {mom.momentumScore}
                    </span> 
                    <span style={{ color: 'var(--text-muted)' }}> / {mom.momentumTotal} Days</span>
                  </td>
                  
                  {/* 5-Min Column */}
                  <td>
                    <span style={{ 
                        color: is5MinValid ? 'var(--accent-green)' : 'var(--accent-red)',
                        fontWeight: 'bold'
                    }}>
                        {mom.first5MinMove.toFixed(2)}%
                    </span>
                  </td>

                  {/* Eligibility Column */}
                  <td>
                    {isEligible ? (
                        <span style={{ 
                            background: 'rgba(34, 197, 94, 0.2)', 
                            color: 'var(--accent-green)', 
                            padding: '4px 8px', 
                            fontSize: '0.85rem',
                            fontWeight: 'bold'
                        }}>
                            ✅ ELIGIBLE
                        </span>
                    ) : (
                        <span style={{ 
                            background: 'rgba(239, 68, 68, 0.2)', 
                            color: 'var(--accent-red)', 
                            padding: '4px 8px', 
                            fontSize: '0.85rem',
                            fontWeight: 'bold'
                        }}>
                            ❌ REJECTED
                        </span>
                    )}
                  </td>
                </tr>
              );
            })}
            
            {sortedStocks.length === 0 && (
                <tr>
                    <td colSpan="4" style={{ textAlign: 'center', , color: 'var(--text-muted)' }}>
                        Waiting for backend to finish calculating momentum stats...
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MomentumTab;
