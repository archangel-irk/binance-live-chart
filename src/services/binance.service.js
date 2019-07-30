import axios from 'axios';
import { EventEmitter } from '../utils/EventEmitter.js';

// Binance api doc
// https://github.com/binance-exchange/binance-official-api-docs

// import io from 'socket.io-client';
// https://socket.io/docs/client-api/#new-Manager-url-options
// https://github.com/socketio/engine.io-client/blob/master/engine.io.js
// https://github.com/socketio/socket.io/issues/3206
// https://socket.io/docs/
// https://github.com/socketio/engine.io-client

// https://docs.binance.org/api-reference/dex-api/ws-streams.html#10-individual-symbol-mini-ticker-streams

// https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API/Writing_WebSocket_client_applications#Receiving_and_interpreting_JSON_objects

// https://binance.zendesk.com/hc/en-us/sections/360002204471-Beginner-s-Guide
// https://binance.zendesk.com/hc/en-us/articles/115003765031-How-to-Trade

// const SockJS = require('sockjs-client');

const INTERVAL = '1m';
const WS_BASE = 'wss://stream.binance.com:9443';
const SYMBOL_DEFAULT = 'BTCUSDT';
const SYMBOL_PLACEHOLDER = '<symbol>';
// const STREAM_TIMEOUT = 3000; // milliseconds
// const STREAM_PATH = `/stream?streams=!miniTicker@arr@3000ms`;
// const STREAM_PATH = `/stream?streams=${SYMBOL_PLACEHOLDER}@miniTicker`;
const STREAM_CANDLESTICK_PATH = `/stream?streams=${SYMBOL_PLACEHOLDER}@kline_${INTERVAL}`;
const STREAM_MINI_TICKER_PATH = `/stream?streams=${SYMBOL_PLACEHOLDER}@miniTicker`;


// https://bablofil.ru/binance-webscokets/
// from https://bablofil.ru/binance-api/
const apiMethod = {
// public methods
  'ping': { 'url': '/api/v1/ping', 'method': 'GET', 'private': false },
  'time': { 'url': '/api/v1/time', 'method': 'GET', 'private': false },
  'exchangeInfo': { 'url': '/api/v1/exchangeInfo', 'method': 'GET', 'private': false },
  'depth': { 'url': '/api/v1/depth', 'method': 'GET', 'private': false },
  'trades': { 'url': '/api/v1/trades', 'method': 'GET', 'private': false },
  'historicalTrades': { 'url': '/api/v1/historicalTrades', 'method': 'GET', 'private': false },
  'aggTrades': { 'url': '/api/v1/aggTrades', 'method': 'GET', 'private': false },
  'klines': { 'url': '/api/v1/klines', 'method': 'GET', 'private': false },
  'ticker24hr': { 'url': '/api/v1/ticker/24hr', 'method': 'GET', 'private': false },
  'tickerPrice': { 'url': '/api/v3/ticker/price', 'method': 'GET', 'private': false },
  'tickerBookTicker': { 'url': '/api/v3/ticker/bookTicker', 'method': 'GET', 'private': false },
  // private methods
  'createOrder': { 'url': '/api/v3/order', 'method': 'POST', 'private': true },
  'testOrder': { 'url': '/api/v3/order/test', 'method': 'POST', 'private': true },
  'orderInfo': { 'url': '/api/v3/order', 'method': 'GET', 'private': true },
  'cancelOrder': { 'url': '/api/v3/order', 'method': 'DELETE', 'private': true },
  'openOrders': { 'url': '/api/v3/openOrders', 'method': 'GET', 'private': true },
  'allOrders': { 'url': '/api/v3/allOrders', 'method': 'GET', 'private': true },
  'account': { 'url': '/api/v3/account', 'method': 'GET', 'private': true },
  'myTrades': { 'url': '/api/v3/myTrades', 'method': 'GET', 'private': true },
  // wapi
  'depositAddress': { 'url': 'wapi/v3/depositAddress.html', 'method': 'GET', 'private': true },
  'withdraw': { 'url': 'wapi/v3/withdraw.html', 'method': 'POST', 'private': true },
  'depositHistory': { 'url': 'wapi/v3/depositHistory.html', 'method': 'GET', 'private': true },
  'withdrawHistory': { 'url': 'wapi/v3/withdrawHistory.html', 'method': 'GET', 'private': true },
  'assetDetail': { 'url': 'wapi/v3/assetDetail.html', 'method': 'GET', 'private': true },
  'tradeFee': { 'url': 'wapi/v3/tradeFee.html', 'method': 'GET', 'private': true },
  'accountStatus': { 'url': 'wapi/v3/accountStatus.html', 'method': 'GET', 'private': true },
  'systemStatus': { 'url': 'wapi/v3/systemStatus.html', 'method': 'GET', 'private': true },
};

const WebSocketEvent = {
  OPEN: 'open',
  MESSAGE: 'message',
  ERROR: 'error',
  CLOSE: 'close',
};

const BinanceServiceEvent = {
  MESSAGE: 'message',
  ERROR: 'error',
  CLOSE: 'close',
  RECONNECT: 'reconnect',
  RECONNECTING: 'reconnecting',
};

const AUTO_RECONNECT_INTERVAL = 5 * 1000; // ms

class BinanceService extends EventEmitter {
  connection;
  url;

  getWsBase() {
    return `${WS_BASE}`;
  }

  // getWsStreamTimeoutPart() {
  //   return `@${STREAM_TIMEOUT}ms`;
  // }

  getStreamCandlestickUrl(symbol) {
    return `${this.getWsBase()}${STREAM_CANDLESTICK_PATH.replace(SYMBOL_PLACEHOLDER, symbol.toLowerCase())}`;
  }

  getStreamMiniTickerUrl(symbol) {
    return `${this.getWsBase()}${STREAM_MINI_TICKER_PATH.replace(SYMBOL_PLACEHOLDER, symbol.toLowerCase())}`;
  }

  getApiCandlestickUrl(symbol) {
    return `${apiMethod.klines.url}?symbol=${symbol}&interval=${INTERVAL}&limit=2`;
  }

  getApiAggTradesUrl(symbol) {
    return `${apiMethod.aggTrades.url}?symbol=${symbol}&limit=50`;
  }

  connectToStream(symbol = SYMBOL_DEFAULT) {
    // this.connection = io(this.getURLBase(), {
    //   path: '/stream',
    //   transports: ['websocket'],
    //   // transportOptions: {
    //   //   websocket: {
    //   //     query: {}
    //   //   }
    //   // },
    //   upgrade: false,
    //   rememberUpgrade: true,
    //   reconnection: false,
    //   // query: {
    //   //   // streams: encodeURIComponent(`!miniTicker@arr@3000ms`),
    //   //   streams: `!miniTicker\u0040arr\u00403000ms`,
    //   // }
    //   query: 'streams=!miniTicker@arr@3000ms'
    // });

    this.url = this.getStreamMiniTickerUrl(symbol);
    console.log(this.url);
    this.open(this.url);
  }

  open() {
    this.connection = new WebSocket(this.url);
    this.connection.addEventListener(WebSocketEvent.OPEN, this.handleStreamOpen);
    this.connection.addEventListener(WebSocketEvent.MESSAGE, this.handleStreamMessage);
    this.connection.addEventListener(WebSocketEvent.ERROR, this.handleStreamError);
    this.connection.addEventListener(WebSocketEvent.CLOSE, this.handleStreamClose);

    // test reconnection
    // setTimeout(() => {this.connection.close()}, 5000);
  }

  removeAllWebSocketListeners() {
    if (this.connection) {
      this.connection.removeEventListener(WebSocketEvent.OPEN, this.handleStreamOpen);
      this.connection.removeEventListener(WebSocketEvent.MESSAGE, this.handleStreamMessage);
      this.connection.removeEventListener(WebSocketEvent.ERROR, this.handleStreamError);
      this.connection.removeEventListener(WebSocketEvent.CLOSE, this.handleStreamClose);
    }
  }

  handleStreamOpen = (event) => {
    console.log('BinanceService: connected');
  };

  handleStreamMessage = (event) => {
    const msg = JSON.parse(event.data);
    this.trigger(BinanceServiceEvent.MESSAGE, this.streamMiniTickerMapper(msg.data));
  };

  handleStreamError = (event) => {
    console.error('BinanceService: error', event);
    this.trigger(BinanceServiceEvent.ERROR);
    // todo: 'ECONNREFUSED' -> reconnect
    // switch (e.code){
    //   case 'ECONNREFUSED':
    //     this.reconnect(e);
    //     break;
    //   default:
    //     this.onerror(e);
    //     break;
    // }
  };

  handleStreamClose = (event) => {
    console.log('BinanceService: closed', event);
    this.trigger(BinanceServiceEvent.CLOSE);
    this.reconnect();
  };

  // https://github.com/websockets/ws/wiki/Websocket-client-implementation-for-auto-reconnect
  reconnect() {
    console.log(`BinanceService: retry in ${AUTO_RECONNECT_INTERVAL}ms`);
    this.trigger(BinanceServiceEvent.RECONNECT);
    this.removeAllWebSocketListeners();
    setTimeout(() => {
      console.log('BinanceService: reconnecting...');
      this.trigger(BinanceServiceEvent.RECONNECTING);
      this.open();
    }, AUTO_RECONNECT_INTERVAL);
  }

  streamMiniTickerMapper(ticker) {
    const eventTime = ticker.E;
    // todo: check that parseFloat gets accurate number as for currency.
    const closePrice = parseFloat(ticker.c);
    return {
      x: eventTime,
      y: closePrice,
    };
  }

  streamCandlestickMapper(data) {
    const candlestick = data.k;
    const eventTime = data.E;
    // todo: check that parseFloat gets accurate number as for currency.
    const closePrice = parseFloat(candlestick.c);
    return {
      x: eventTime,
      y: closePrice,
    };
  }

  apiAggTradeMapper(trade) {
    const timestamp = trade.T;
    // todo: check that parseFloat gets accurate number as for currency.
    const price = parseFloat(trade.p);
    return {
      x: timestamp,
      y: price,
    };
  }

  apiCandlestickMapper(candlestick) {
    // [
    //   1499040000000,      // Open time
    //   "0.01634790",       // Open
    //   "0.80000000",       // High
    //   "0.01575800",       // Low
    //   "0.01577100",       // Close
    //   "148976.11427815",  // Volume
    //   1499644799999,      // Close time
    //   "2434.19055334",    // Quote asset volume
    //   308,                // Number of trades
    //   "1756.87402397",    // Taker buy base asset volume
    //   "28.46694368",      // Taker buy quote asset volume
    //   "17928899.62484339" // Ignore.
    // ]
    const closeTime = candlestick[6];
    // todo: check that parseFloat gets accurate number as for currency.
    const closePrice = parseFloat(candlestick[4]);
    return {
      x: closeTime,
      y: closePrice,
    };
  }

  handleApiAggTradesData(data) {
    // const ONE_SECOND = 1000;
    // console.log(data);
    // console.log(data.reduce((group) => {
    //
    // }, []));
    return data.map(this.apiAggTradeMapper);
  }

  getInitialData(symbol = SYMBOL_DEFAULT) {
    // return fetch('/api/v1/ping');
    // limit=80

    // var theBigDay = new Date("2019-07-26T09:00:01.633Z");
    // console.log(theBigDay.getMinutes())
    // theBigDay.setMinutes(theBigDay.getMinutes() - 1);
    // theBigDay.toISOString()

    return axios
      .get(this.getApiAggTradesUrl(symbol))
      .then((response) => {
        // remove last candlestick cause it's close in the and of current minute.
        // response.data.pop();
        // fix last candlestick timestamp cause it's close in the and of current minute.
        // response.data[response.data.length - 1][6] = Date.now();

        return this.handleApiAggTradesData(response.data);
      });
  }
}

const binanceService = new BinanceService();

export {
  BinanceServiceEvent,
  binanceService,
}
