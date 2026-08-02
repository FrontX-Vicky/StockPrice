import React from 'react';

const TrendTab = ({ stocks }) => {
  return (
    <div >
      <h2 style={{ fontWeight: 600 }}>Stock Trend (Daily EMAs)</h2>
      
      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Symbol</th>
              <th>Day Trend</th>
              <th>EMA Trend</th>
              <th>Signal</th>
              <th>LTP</th>
              <th>5 EMA</th>
              <th>9 EMA</th>
              <th>21 EMA</th>
            </tr>
          </thead>
          <tbody>
            {stocks.map(stock => {
              if (!stock.emas || !stock.emas.ema5) {
                return (
                  <tr key={stock.symbol}>
                    <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>{stock.symbol}</td>
                    <td colSpan="6" style={{ color: 'var(--text-muted)', textAlign: 'center' }}>Calculating EMAs...</td>
                  </tr>
                );
              }
              
              const { price, close } = stock;
              const { ema5, ema9, ema21 } = stock.emas;
              
              let emaTrend = 'Neutral';
              let trendIcon = '-';
              if (price > ema5 && price > ema9 && price > ema21) {
                emaTrend = 'UpTrend';
                trendIcon = '▲';
              } else if (price < ema5 && price < ema9 && price < ema21) {
                emaTrend = 'DownTrend';
                trendIcon = '▼';
              }
              
              let dayTrend = price > close ? 'UP' : (price < close ? 'DOWN' : 'Neutral');
              let dayTrendIcon = price > close ? '▲' : (price < close ? '▼' : '-');
              
              let signal = 'Wait';
              if (emaTrend === 'UpTrend' && price > close) {
                signal = 'BUY';
              } else if (emaTrend === 'DownTrend' && price < close) {
                signal = 'SELL';
              }

              return (
                <tr key={stock.symbol}>
                  <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>{stock.symbol}</td>
                  <td style={{ color: dayTrend === 'UP' ? 'var(--accent-green)' : dayTrend === 'DOWN' ? 'var(--accent-red)' : 'inherit' }}>
                    {dayTrend} {dayTrendIcon}
                  </td>
                  <td style={{ color: emaTrend === 'UpTrend' ? 'var(--accent-green)' : emaTrend === 'DownTrend' ? 'var(--accent-red)' : 'inherit' }}>
                    {emaTrend} {trendIcon}
                  </td>
                  <td>
                    {signal === 'BUY' && <span className="signal-buy">BUY</span>}
                    {signal === 'SELL' && <span className="signal-sell">SELL</span>}
                    {signal === 'Wait' && <span style={{ color: 'var(--text-muted)' }}>-</span>}
                  </td>
                  <td style={{ fontWeight: 'bold' }}>{price.toFixed(2)}</td>
                  <td>{ema5.toFixed(2)}</td>
                  <td>{ema9.toFixed(2)}</td>
                  <td>{ema21.toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TrendTab;
