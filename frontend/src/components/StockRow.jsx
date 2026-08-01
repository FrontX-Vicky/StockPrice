import React, { useEffect, useState } from 'react';

const StockRow = ({ stock }) => {
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (stock.price > 0) {
      setIsUpdating(true);
      const timeout = setTimeout(() => setIsUpdating(false), 500);
      return () => clearTimeout(timeout);
    }
  }, [stock.price]);

  // For real usage, `stock.change` might be an absolute value and you'd have a `stock.changePercent` too.
  // We'll mock the percent logic based on the generic change value if it's not provided by API.
  const isPositive = stock.change >= 0;
  
  const formattedPrice = stock.price > 0 
    ? new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(stock.price) 
    : '0.00';
    
  const absChange = Math.abs(stock.change).toFixed(2);
  const changePercent = ((stock.change / (stock.price || 1)) * 100).toFixed(2);

  return (
    <div className={`watchlist-row ${isUpdating ? 'update-flash' : ''}`}>
      <div className="watchlist-left">
        <span className="wl-symbol">{stock.symbol}</span>
        <span className="wl-exchange">{stock.exchange || 'NSE'}</span>
      </div>
      
      <div className="watchlist-right">
        <div className={`wl-price-line ${isPositive ? 'text-green' : 'text-red'}`}>
          <span className="wl-price">{formattedPrice}</span>
          <span className="wl-arrow">{isPositive ? '▲' : '▼'}</span>
        </div>
        <div className="wl-change-line">
          {stock.change > 0 ? '+' : (stock.change < 0 ? '-' : '')}{absChange} ({stock.change > 0 ? '+' : ''}{Math.abs(changePercent)}%)
        </div>
      </div>
    </div>
  );
};

export default StockRow;
