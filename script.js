const apiUrl = "wss://stream.binance.com:9443/ws";
let socket;
let chart;
let crypto = "ethusdt";  // Default crypto
let interval = "1m";     // Default interval
let chartData = {};      // In-memory storage for chart data

// Retrieve stored data from localStorage (if exists)
function loadChartData() {
  const storedData = localStorage.getItem("chartData");
  if (storedData) {
    chartData = JSON.parse(storedData);
  }
}

// Save data to localStorage
function saveChartData() {
  localStorage.setItem("chartData", JSON.stringify(chartData));
}

// Create or update the chart
function updateChart(candleData) {
  const ctx = document.getElementById("cryptoChart").getContext("2d");
  const labels = candleData.map(data => new Date(data[0]).toLocaleTimeString());
  const openPrices = candleData.map(data => parseFloat(data[1]));
  const closePrices = candleData.map(data => parseFloat(data[4]));
  
  if (chart) {
    chart.destroy();
  }
  
  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: `${crypto.toUpperCase()} Price`,
        data: closePrices,
        borderColor: 'rgba(75, 192, 192, 1)',
        fill: false,
      }]
    },
    options: {
      responsive: true,
    }
  });
}

// Handle WebSocket messages
function handleSocketMessage(event) {
  const message = JSON.parse(event.data);
  const candle = message.k;
  const symbol = message.s.toLowerCase();
  
  if (!chartData[symbol]) {
    chartData[symbol] = [];
  }
  
  // Store candlestick data (open, high, low, close)
  chartData[symbol].push([
    candle.t,  // Open time
    candle.o,  // Open
    candle.h,  // High
    candle.l,  // Low
    candle.c   // Close
  ]);
  
  saveChartData();
  
  if (symbol === crypto) {
    updateChart(chartData[crypto]);
  }
}

// Initialize WebSocket
function initWebSocket() {
  if (socket) {
    socket.close();
  }
  
  const wsUrl = `${apiUrl}/${crypto}@kline_${interval}`;
  socket = new WebSocket(wsUrl);
  
  socket.onmessage = handleSocketMessage;
  socket.onclose = () => console.log("WebSocket closed, reconnecting...");
  socket.onerror = (error) => console.log("WebSocket error: ", error);
}

// Handle crypto or interval change
function handleSelectionChange() {
  const newCrypto = document.getElementById("crypto").value;
  const newInterval = document.getElementById("interval").value;
  
  if (newCrypto !== crypto || newInterval !== interval) {
    crypto = newCrypto;
    interval = newInterval;
    
    // Update chart with stored data or start with empty chart
    if (chartData[crypto]) {
      updateChart(chartData[crypto]);
    } else {
      updateChart([]);
    }
    
    initWebSocket();
  }
}

// Event listeners for dropdown change
document.getElementById("crypto").addEventListener("change", handleSelectionChange);
document.getElementById("interval").addEventListener("change", handleSelectionChange);

// Initialize chart and WebSocket connection
loadChartData();
initWebSocket();
