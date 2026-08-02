import React, { useEffect, useRef, useState } from 'react';
import { createChart, CrosshairMode, CandlestickSeries } from 'lightweight-charts';

const ChartTab = ({ selectedStock, stockData }) => {
  const chartContainerRef = useRef();
  const chartRef = useRef();
  const seriesRef = useRef();
  const [interval, setInterval] = useState('ONE_DAY'); // 'ONE_DAY', 'FIVE_MINUTE', 'THREE_MINUTE'
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!selectedStock || !chartContainerRef.current) return;

    // Create Chart
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: 'solid', color: '#131722' },
        textColor: '#d1d4dc',
      },
      grid: {
        vertLines: { color: '#2a2e39' },
        horzLines: { color: '#2a2e39' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
      },
      rightPriceScale: {
        borderColor: '#2a2e39',
      },
      timeScale: {
        borderColor: '#2a2e39',
        timeVisible: interval !== 'ONE_DAY',
      },
      autoSize: true,
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    });

    chartRef.current = chart;
    seriesRef.current = candleSeries;

    // Fetch historical data
    const fetchHistory = async () => {
      setIsLoading(true);
      try {
        const port = window.location.port === '3000' ? '8080' : window.location.port;
        const res = await fetch(`http://${window.location.hostname}:${port}/api/historical/${selectedStock}?interval=${interval}`);
        const data = await res.json();
        
        if (data.success && data.data) {
          // lightweight-charts needs data sorted by time, ascending
          const formattedData = data.data.map(d => {
            const dateObj = new Date(d.timestamp);
            let timeValue;
            
            if (interval === 'ONE_DAY') {
              // Extract YYYY-MM-DD in local time
              timeValue = dateObj.toLocaleDateString('en-CA'); // 'YYYY-MM-DD' format
            } else {
              // Intraday needs UNIX timestamp (seconds)
              timeValue = Math.floor(dateObj.getTime() / 1000) + 19800; // +5:30 IST offset
            }

            return {
              time: timeValue,
              open: d.open,
              high: d.high,
              low: d.low,
              close: d.close,
            };
          });

          // Deduplicate by time (lightweight charts throws error on duplicate times)
          const uniqueData = [];
          const seenTimes = new Set();
          formattedData.forEach(item => {
              if (!seenTimes.has(item.time)) {
                  seenTimes.add(item.time);
                  uniqueData.push(item);
              }
          });

          candleSeries.setData(uniqueData);
          chart.timeScale().fitContent();
        }
      } catch (err) {
        console.error("Failed to fetch historical data for chart", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth, height: chartContainerRef.current.clientHeight });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [selectedStock, interval]);

  // Update last candle with live price
  useEffect(() => {
    if (!seriesRef.current || !stockData || !stockData.price) return;
    
    // We only update if we have historical data loaded
    const currentData = seriesRef.current.data();
    if (currentData && currentData.length > 0) {
       const lastCandle = currentData[currentData.length - 1];
       const currentPrice = stockData.price;
       
       // Formulate the updated live candle
       const updatedCandle = {
           time: lastCandle.time,
           open: lastCandle.open,
           high: Math.max(lastCandle.high, currentPrice),
           low: Math.min(lastCandle.low, currentPrice),
           close: currentPrice
       };
       
       seriesRef.current.update(updatedCandle);
    }
  }, [stockData]);

  if (!selectedStock) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>No Symbol Selected</h3>
        <p>Click on any stock in the Watchlist to view its live chart.</p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      
      {/* Chart Header Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--card-border)', background: 'var(--card-bg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600 }}>{selectedStock}</h2>
          <span style={{ fontSize: '14px', color: stockData?.change > 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
            ₹{stockData?.price || 0}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {['ONE_DAY', 'FIVE_MINUTE', 'THREE_MINUTE'].map(intv => (
            <button 
              key={intv}
              onClick={() => setInterval(intv)}
              style={{
                background: interval === intv ? '#2962ff' : 'transparent',
                color: interval === intv ? '#fff' : 'var(--text-muted)',
                border: '1px solid',
                borderColor: interval === intv ? '#2962ff' : 'var(--card-border)',
                padding: '4px 8px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: 500
              }}
            >
              {intv.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Container */}
      <div style={{ flex: 1, position: 'relative' }}>
        {isLoading && (
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 10, color: 'var(--accent-blue)' }}>
            Loading historical data...
          </div>
        )}
        <div ref={chartContainerRef} style={{ width: '100%', height: '100%' }} />
      </div>
    </div>
  );
};

export default ChartTab;
