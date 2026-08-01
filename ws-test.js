const WebSocket = require('ws');
const ws = new WebSocket('ws://localhost:8080');
ws.on('open', () => console.log('Connected'));
ws.on('message', (data) => {
  const msg = JSON.parse(data);
  if (msg.type === 'market_data' && msg.data['RELIANCE']) {
    console.log(msg.data['RELIANCE'].momentum);
    process.exit(0);
  }
});
