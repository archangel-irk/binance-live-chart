const proxy = require("http-proxy-middleware");

// http://saule1508.github.io/create-react-app-proxy-websocket/
// https://github.com/facebook/create-react-app/issues/5280
// https://github.com/chimurai/http-proxy-middleware/search?q=websocket+wss&type=Issues
// https://github.com/chimurai/http-proxy-middleware/issues/51
// https://github.com/chimurai/http-proxy-middleware#external-websocket-upgrade
// https://github.com/chimurai/http-proxy-middleware/issues/253

module.exports = app => {
  app.use(proxy("/websocket", {target: "wss://stream.binance.com:9443", ws: true}))
};
