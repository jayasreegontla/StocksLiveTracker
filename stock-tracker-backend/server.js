const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');
const axios = require('axios');

const app = express();
const server = http.createServer(app);

const wss = new WebSocket.Server({ server });
wss.setMaxListeners(0); 

app.use(express.static('public')); // Serve static files from 'public' directory

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

const apiKey = 'okHvyM3UTrLceFViRbZFWwmKmtLQF8vI';

const fetchStocks = async () => {
  const response = await axios.get('https://api.polygon.io/v3/reference/tickers', {
    params: {
      apiKey: apiKey,
      sort: 'ticker',
      order: 'asc',
      type: 'cs',
      active: true,
      market: 'stocks',
      perpage: 20,
    },
  });

  return response.data.results;
};

const saveStockData = (data) => {
  fs.writeFileSync('stocks.json', JSON.stringify(data, null, 2));
};

let stocks = [];

// Add the missing getStockCount method to wss
wss.getStockCount = async (client) => {
  return new Promise((resolve) => {
    client.on('message', (message) => {
      resolve(message);
    });
    client.send('getStockCount');
  });
};

wss.on('connection', (ws) => {
  ws.on('message', async (message) => {
    console.log(`Received message: ${message}`);

    // Fetch 'n' stocks from the backend
    const stockCount = parseInt(message, 10);
    stocks = await fetchStocks();

    // Send stock IDs to the WebSocket connection to subscribe to updates
    const selectedStocks = stocks.slice(0, stockCount);
    const stockIds = selectedStocks.map((stock) => stock.ticker);
    ws.send(JSON.stringify(stockIds));

    // Display the initial data received from WebSocket on the frontend
    ws.send(JSON.stringify(selectedStocks));
  });
});

setInterval(async () => {
  stocks.forEach((stock) => {
    stock.price = Math.random() * 100;
  });

  console.log('Broadcasting stock data to clients:', JSON.stringify(stocks));

  wss.clients.forEach(async (client) => {
    if (client.readyState === WebSocket.OPEN) {
      const stockCount = parseInt(await wss.getStockCount(client), 10);
      const selectedStocks = stocks.slice(0, stockCount);
      client.send(JSON.stringify(selectedStocks));
    }
  });
}, 5000); // Update every 5 seconds

server.listen(3000, () => {
  console.log('Server running at http://localhost:3000/');
});
