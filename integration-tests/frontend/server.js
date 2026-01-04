const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 4200;
const API_URL = process.env.API_URL || 'http://localhost:5999';

// Proxy API requests to backend
app.use('/config', createProxyMiddleware({
  target: API_URL,
  changeOrigin: true,
  logLevel: 'debug'
}));

// Serve static files
app.use(express.static(path.join(__dirname)));

// SPA catch-all - return index.html for other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Frontend server listening on port ${PORT}`);
  console.log(`Proxying /config to ${API_URL}`);
});
