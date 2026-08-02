import React, { useState, useEffect } from 'react';
import OHLCTab from './OHLCTab';
import SRTab from './SRTab';
import TrendTab from './TrendTab';
import IntradayTab from './IntradayTab';
import MarketPulse from './MarketPulse';
import IndexTab from './IndexTab';
import VixTab from './VixTab';
import LeverageTab from './LeverageTab';
import OptionsRangeTab from './OptionsRangeTab';
import MomentumTab from './MomentumTab';
import WatchlistSidebar from './WatchlistSidebar';
import ChartTab from './ChartTab';

const Dashboard = () => {
  const [stocksMap, setStocksMap] = useState({});
  const [isLive, setIsLive] = useState(false);
  const [mainTab, setMainTab] = useState('Chart');
  const [activeTab, setActiveTab] = useState('NSE'); // 'NSE' or 'NFO'
  const [selectedStock, setSelectedStock] = useState(null);
  
  // System Boot State
  const [syncProgress, setSyncProgress] = useState(null); // { current, total }
  const [isSyncing, setIsSyncing] = useState(true);

  useEffect(() => {
    // Connect to backend WebSocket dynamically based on host
    const wsUrl = `ws://${window.location.hostname}:8080`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
        console.log("Connected to local backend WebSocket");
        setIsLive(true);
    };

    ws.onmessage = (event) => {
        try {
            const message = JSON.parse(event.data);
            if (message.type === 'market_data' || message.type === 'init' || message.type === 'update') {
                setStocksMap(prevMap => ({
                    ...prevMap,
                    ...(message.data || message.prices)
                }));
            } else if (message.type === 'sync_progress') {
                setSyncProgress({ current: message.current, total: message.total });
                setIsSyncing(true);
            } else if (message.type === 'sync_complete') {
                setIsSyncing(false);
                setSyncProgress(null);
            } else if (message.type === 'sync_status') {
                setIsSyncing(!message.isComplete);
            }
        } catch (err) {
            console.error("Error parsing WebSocket message:", err);
        }
    };

    ws.onclose = () => {
        console.log("Disconnected from local backend WebSocket");
        setIsLive(false);
    };

    return () => {
        ws.close();
    };
  }, []);

  // Filter based on the selected tab and sort alphabetically
  const displayStocks = Object.values(stocksMap)
    .filter(stock => stock.exchange === activeTab)
    .sort((a, b) => a.symbol.localeCompare(b.symbol));

  const indexStocks = Object.values(stocksMap)
    .filter(stock => stock.exchange === 'INDEX' || stock.exchange === 'BSE')
    .sort((a, b) => a.symbol.localeCompare(b.symbol));

  return (
    <div className="app-layout">
      
      {/* BOOT OVERLAY */}
      {isSyncing && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(19, 23, 34, 0.95)', zIndex: 9999, 
          display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center'
        }}>
          <div className="glass-panel" style={{ textAlign: 'center', maxWidth: '500px' }}>
            <h2 style={{ color: 'var(--text-main)', marginBottom: '16px' }}>System Booting</h2>
            <p style={{ color: 'var(--text-muted)' }}>
              Fetching Daily, 3-Min, and 5-Min historical candles to calculate 60-Day Momentum metrics. 
              <br/><br/>
              Due to broker API limits (3 req/sec), this takes ~60 seconds.
            </p>
            
            {syncProgress ? (
              <div style={{ marginTop: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '8px' }}>
                  <span>Syncing F&O Stocks</span>
                  <span>{syncProgress.current} / {syncProgress.total}</span>
                </div>
                <div style={{ width: '100%', height: '8px', background: 'var(--card-bg)', overflow: 'hidden', borderRadius: '4px' }}>
                  <div style={{ 
                    height: '100%', 
                    background: 'var(--accent-blue)', 
                    width: `${(syncProgress.current / syncProgress.total) * 100}%`,
                    transition: 'width 0.3s ease'
                  }}></div>
                </div>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>Estimated time remaining: {Math.max(0, Math.ceil((syncProgress.total - syncProgress.current) * 1.05))}s</p>
              </div>
            ) : (
              <div style={{ color: 'var(--accent-blue)', marginTop: '24px' }}>Initializing historical queue...</div>
            )}
          </div>
        </div>
      )}

      {/* Top Bar Pane */}
      <div className="top-bar-pane">
        <header className="header">
          <h1>Advanced Market Alerts</h1>
          <div className="live-indicator">
            <div className={`live-dot ${!isLive ? 'paused' : ''}`}></div>
            {isLive ? 'Live Updates (Angel One)' : 'Connecting...'}
          </div>
        </header>
        <MarketPulse indices={indexStocks} />
      </div>

      {!isSyncing && (
        <>
          {/* Left Sidebar Pane (Watchlist) */}
          <div className="sidebar-pane">
            <WatchlistSidebar 
              stocksMap={stocksMap} 
              selectedStock={selectedStock}
              onSelectStock={(sym) => {
                setSelectedStock(sym);
                setMainTab('Chart');
              }} 
            />
          </div>

          {/* Main Content Pane */}
          <div className="main-pane">
            <div className="main-nav">
              <button 
                className={`main-tab-btn ${mainTab === 'Chart' ? 'active' : ''}`}
                onClick={() => setMainTab('Chart')}
              >
                Chart
              </button>
              <button 
                className={`main-tab-btn ${mainTab === 'OHLC' ? 'active' : ''}`}
                onClick={() => setMainTab('OHLC')}
              >
                Open=High/Low
              </button>
              <button 
                className={`main-tab-btn ${mainTab === 'SR' ? 'active' : ''}`}
                onClick={() => setMainTab('SR')}
              >
                Support & Resistance
              </button>
              <button 
                className={`main-tab-btn ${mainTab === 'Indices' ? 'active' : ''}`}
                onClick={() => setMainTab('Indices')}
              >
                Indices S/R
              </button>
              <button 
                className={`main-tab-btn ${mainTab === 'VIX' ? 'active' : ''}`}
                onClick={() => setMainTab('VIX')}
              >
                VIX Range Calc
              </button>
              <button 
                className={`main-tab-btn ${mainTab === 'Leverage' ? 'active' : ''}`}
                onClick={() => setMainTab('Leverage')}
              >
                Risk Calculator
              </button>
              <button 
                className={`main-tab-btn ${mainTab === 'OptionsRange' ? 'active' : ''}`}
                onClick={() => setMainTab('OptionsRange')}
              >
                Options Range
              </button>
              <button 
                className={`main-tab-btn ${mainTab === 'Momentum' ? 'active' : ''}`}
                onClick={() => setMainTab('Momentum')}
              >
                Momentum Engine
              </button>
              <button 
                className={`main-tab-btn ${mainTab === 'Trend' ? 'active' : ''}`}
                onClick={() => setMainTab('Trend')}
              >
                Stock Trend
              </button>
              <button 
                className={`main-tab-btn ${mainTab === 'Intraday' ? 'active' : ''}`}
                onClick={() => setMainTab('Intraday')}
              >
                Intraday (3-Min)
              </button>
            </div>

            <div className="tab-content" style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
              {mainTab === 'Chart' && (
                <ChartTab selectedStock={selectedStock} stockData={selectedStock ? stocksMap[selectedStock] : null} />
              )}
              {mainTab === 'OHLC' && <OHLCTab stocks={displayStocks} />}
              {mainTab === 'SR' && <SRTab stocks={displayStocks} />}
              {mainTab === 'Trend' && <TrendTab stocks={Object.values(stocksMap).filter(s => s.exchange === 'NSE')} />}
              {mainTab === 'Intraday' && <IntradayTab stocks={Object.values(stocksMap).filter(s => s.exchange === 'NSE')} />}
              {mainTab === 'Indices' && <IndexTab indices={indexStocks} />}
              {mainTab === 'VIX' && <VixTab indices={indexStocks} />}
              {mainTab === 'Leverage' && <LeverageTab />}
              {mainTab === 'OptionsRange' && <OptionsRangeTab indices={indexStocks} />}
              {mainTab === 'Momentum' && <MomentumTab stocks={Object.values(stocksMap).filter(s => s.exchange === 'NSE')} />}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
