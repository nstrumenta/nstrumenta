const target = process.env.PROXY_TARGET || 'http://localhost:5999';

module.exports = {
  "/config": {
    "target": target,
    "secure": false
  },
  "/api": {
    "target": target,
    "secure": false
  },
  "/mcp": {
    "target": target,
    "secure": false
  }
};
