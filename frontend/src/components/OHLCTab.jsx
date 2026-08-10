import React, { useState, useEffect } from 'react';

const OHLCTab = () => {
  const [logs, setLogs] = useState([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]); // YYYY-MM-DD
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const port = window.location.port === '3000' || window.location.port === '5173' ? '8080' : window.location.port;
        const res = await fetch(`http://${window.location.hostname}:${port}/api/scanners/${date}`);
        const json = await res.json();
        if (json.success && isMounted) {
          setLogs(json.data);
        }
      } catch (err) {
        console.error("Failed to fetch scanner logs", err);
      }
      if (isMounted) setLoading(false);
    };

    fetchLogs();

    // If viewing today, poll every 5 seconds
    const today = new Date().toISOString().split('T')[0];
    let interval = null;
    if (date === today) {
      interval = setInterval(fetchLogs, 5000);
    }

    return () => {
      isMounted = false;
      if (interval) clearInterval(interval);
    };
  }, [date]);

  const formatTime = (isoString) => {
    if (!isoString) return '-';
    return new Date(isoString).toLocaleTimeString([], { hour12: false });
  };

  return (
    <div style={{ paddingBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ fontWeight: 600 }}>Historical Stateful Scanners</h2>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            * Note: O=H/L includes a 0.05% safety buffer.
          </span>
          <input 
            type="date" 
            value={date} 
            onChange={(e) => setDate(e.target.value)}
            style={{
              background: 'var(--bg-dark)',
              border: '1px solid var(--card-border)',
              color: 'var(--text-main)',
              padding: '6px 12px',
              borderRadius: '4px',
              fontFamily: 'var(--font-mono)'
            }}
          />
        </div>
      </div>
      
      {loading && logs.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#94a3b8' }}>Loading...</div>
      ) : logs.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#94a3b8' }}>
          No scanner events detected for {date}.
        </div>
      ) : (
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Signal Type</th>
                <th>Detected At</th>
                <th>Broken At</th>
                <th>Status</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => {
                const isActive = log.status === 'ACTIVE';
                
                let signalBadge = null;
                if (log.type === 'O=L') signalBadge = <span className="signal-buy">BUY (O=L)</span>;
                else if (log.type === 'O=H') signalBadge = <span className="signal-sell">SELL (O=H)</span>;
                else if (log.type === 'VWAP_CROSS') signalBadge = <span style={{background: 'var(--accent-blue)', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700}}>VWAP CROSS</span>;
                else if (log.type === 'VOLUME_SHOCKER') signalBadge = <span style={{background: '#eab308', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700}}>VOL SHOCK</span>;

                let parsedDetails = {};
                try {
                    parsedDetails = JSON.parse(log.details);
                } catch(e) {}

                return (
                  <tr key={log.id} style={{ opacity: isActive ? 1 : 0.5 }}>
                    <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>{log.symbol}</td>
                    <td>{signalBadge}</td>
                    <td>{formatTime(log.detected_at)}</td>
                    <td>{formatTime(log.broken_at)}</td>
                    <td>
                      <span style={{
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                        fontWeight: 'bold',
                        background: isActive ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                        color: isActive ? 'var(--accent-green)' : 'var(--accent-red)'
                      }}>
                        {log.status}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {Object.entries(parsedDetails).map(([k, v]) => (
                            <span key={k} style={{ marginRight: '8px' }}>
                                {k.toUpperCase()}: <strong style={{ color: 'var(--text-main)'}}>{typeof v === 'number' ? v.toFixed(2) : v}</strong>
                            </span>
                        ))}
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
