const socket = new WebSocket('ws://localhost:3000');

socket.onopen = () => {
  console.log('WebSocket connection opened');
};

socket.onmessage = (event) => {
  try {
    console.log('Received WebSocket message:', event);

    if (event.data === 'getStockCount') {
      console.log('Received stock count request from server');
      return;
    }

    const data = JSON.parse(event.data);
    updateStockList(data);
  } catch (error) {
    console.error('Error processing WebSocket message:', error);
  }
};

socket.onclose = (event) => {
  if (event.wasClean) {
    console.log(`Connection closed cleanly, code=${event.code}, reason=${event.reason}`);
  } else {
    console.error('Connection abruptly closed');
  }
};

socket.onerror = (error) => {
  console.error('WebSocket error:', error);
};

function fetchStocks() {
  console.log(`WebSocket readyState: ${socket.readyState}`);
  const stockCount = document.getElementById('stockCount').value;
  console.log(`Sending request for ${stockCount} stocks`);
  socket.send(stockCount);
}

function updateStockList(data) {
  console.log('Updating stock list with data:', data);

  // Add this log to check the length of the data received
  console.log('Data length:', data.length);

  const stockList = document.getElementById('stockList');
  stockList.innerHTML = '';

  data.forEach((stock) => {
    const listItem = document.createElement('li');
    listItem.textContent = `${stock.ticker} - $${stock.price.toFixed(2)}`;
    stockList.appendChild(listItem);
  });
}
