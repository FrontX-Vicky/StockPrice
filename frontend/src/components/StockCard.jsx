import React, { useEffect, useState } from 'react';

const StockCard = ({ symbol, name, initialPrice, initialChange }) => {
  const [isUpdating, setIsUpdating] = useState(false);

  // Flash the card when a new price comes in via WebSocket
  useEffect(() => {
    if (initialPrice > 0) {
      setIsUpdating(true);
      const timeout = setTimeout(() => setIsUpdating(false), 500);
      return () => clearTimeout(timeout);
    }
  }, [initialPrice]);

  const isPositive = initialChange >= 0;
  
  // Format the price
  const formattedPrice = initialPrice > 0 ? new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR' }).format(initialPrice) : '₹0.00';

  return (
    <div className={`glass-panel stock-card ${isUpdating ? 'update-flash' : ''}`}>
      <div className="stock-card-header">
        <span className="stock-symbol">{symbol}</span>
        <span className="stock-name">{name}</span>
      </div>
      <div className="stock-price">{formattedPrice}</div>
      <div className={`stock-change ${isPositive ? 'positive' : 'negative'}`}>
        {isPositive ? '▲' : '▼'} {Math.abs(initialChange).toFixed(2)}%
      </div>
    </div>
  );
};

export default StockCard;
