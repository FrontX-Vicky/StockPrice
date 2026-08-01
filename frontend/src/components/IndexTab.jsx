import React from 'react';

const IndexTab = ({ indices }) => {
  // Filter for indices that have S&R data from the CSV
  const srIndices = indices.filter(index => index.sr != null);

  return (
    <div className="glass-panel" style={{  }}>
      <h2 style={{ fontWeight: 600 }}>Indices Support & Resistance</h2>
      
      {srIndices.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#94a3b8' }}>
          No Index Support/Resistance data loaded.
        </div>
      ) : (
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Index</th>
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
              {srIndices.map(index => {
                const { sr, price, symbol } = index;
                return (
                  <tr key={symbol}>
                    <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>{symbol.replace(/_/g, ' ')}</td>
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

export default IndexTab;
