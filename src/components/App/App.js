import React from 'react';
import { NetStatusEvent, netStatusService } from '../../services/netStatusService.js';
import {
  CryptoChart,
  enrichDataSeriesWithDefaultOptions,
  flagBuySeries,
  flagSaleSeries,
  getCrosshairConfig,
  getStartFinishLinesConfig,
} from '../Chart/Chart.js';
import { NetStatusNotification } from '../NetStatusNotification/NetStatusNotification.js';
import { Deal } from '../Deal/Deal.js';
import { binanceService, BinanceServiceEvent } from '../../services/binance.service.js';

import logo from '../../logo.svg';
import './App.css';
import { Notification } from '../Notification/Notification.js';


const SymbolPair = {
  BTCUSDT: 'BTCUSDT',
};
const PAIR_DEFAULT = SymbolPair.BTCUSDT;
const pairTitleMap = {
  [SymbolPair.BTCUSDT]: 'BTC/USDT',
};

const NOTIFICATION_TEXT_DEFAULT = '';
const TEXT_API_UNAVAILABLE = 'Binance api is unavailable.';
const TEXT_STREAM_ERROR = 'Error in Binance data stream.';
const TEXT_STREAM_RECONNECT = 'Reconnecting to Binance data stream';

class App extends React.Component {
  currentSymbolPair = PAIR_DEFAULT;
  bidStart;
  state = {
    initialized: false,
    dealShow: false,
    notificationShow: false,
    notificationText: NOTIFICATION_TEXT_DEFAULT,
  };
  chartRef = React.createRef();

  constructor(props) {
    super(props);
    netStatusService.on(NetStatusEvent.ONLINE, this.handleOnlineStatus);
    netStatusService.on(NetStatusEvent.OFFLINE, this.handleOfflineStatus);
  }

  componentDidMount() {
    this.init();
  }

  showDeal() {
    this.setState({ dealShow: true });
  }

  hideDeal() {
    this.setState({ dealShow: false });
  }

  showNotification() {
    this.setState({ notificationShow: true });
  }

  hideNotification() {
    this.setState({ notificationText: NOTIFICATION_TEXT_DEFAULT });
    this.setState({ notificationShow: false });
  }

  handleOnlineStatus = () => {
    const { initialized } = this.state;
    if (initialized) {
      this.showDeal();
    } else {
      this.init();
    }
  };

  handleOfflineStatus = () => {
    this.hideDeal();
  };

  setInitialData(data) {
    const chart = this.chartRef.current.chart;
    this.updateStartFinish();
    chart.update({
      series: [
        enrichDataSeriesWithDefaultOptions({ data }),
        flagBuySeries,
        flagSaleSeries,
      ],
      ...getCrosshairConfig(),
    }, true, true, true);
  }

  setIncrementalDataPoint(dataPoint) {
    if (this.bidStart <= Date.now()) {
      this.updateStartFinish();
    }

    const chart = this.chartRef.current.chart;
    const series = chart.series[0];
    series.addPoint(dataPoint, true, false, true);
    // series.removePoint(0, true, true);
    chart.series[1].update();
    chart.series[2].update();
  }

  updateStartFinish() {
    const MINUTE = 60000; // ms
    const BID_START_IN = 0.7 * MINUTE;
    const BID_START = Date.now() + BID_START_IN;
    const BID_FINISH = BID_START + 0.5 * MINUTE; // bid frame
    const SOFT_MAX = BID_FINISH + 0.4 * MINUTE; // padding after finish

    const chart = this.chartRef.current.chart;
    chart.update({
      ...getStartFinishLinesConfig(BID_START, BID_FINISH, SOFT_MAX),
    }, true, false, true);

    // remove old data if needed
    if (this.bidStart) {
      const dataSeries = chart.series[0];
      const flagBuySeries = chart.series[1];
      const flagSaleSeries = chart.series[2];

      const dataFilter = (point) => point.x > this.bidStart - BID_START_IN;
      const newData = dataSeries.options.data.filter(dataFilter);
      dataSeries.setData(newData);

      // Filter against first point (to avoid flying markers).
      const flagFilter = (point) => point.x > newData[0].x;
      flagBuySeries.setData(flagBuySeries.options.data.filter(flagFilter));
      flagSaleSeries.setData(flagSaleSeries.options.data.filter(flagFilter));
    }

    this.bidStart = BID_START;
  }

  init() {
    this.initStreamHandlers();
    binanceService
      .getInitialData(this.currentSymbolPair)
      .then((data) => {
        this.setState({ initialized: true });
        this.setInitialData(data);
        this.hideNotification();
        this.showDeal();
        this.connectToStream();
      })
      .catch((error) => {
        // there are all errors from `then`'s
        // treat them as binance unavailable.
        this.setState({ initialized: false });
        this.setState({ notificationText: TEXT_API_UNAVAILABLE });
        this.showNotification();
        this.hideDeal();
      });
  }

  connectToStream() {
    binanceService.connectToStream(this.currentSymbolPair);
  }

  initStreamHandlers() {
    binanceService.on(BinanceServiceEvent.MESSAGE, this.handleStreamMessage);
    binanceService.on(BinanceServiceEvent.ERROR, this.handleStreamError);
    binanceService.on(BinanceServiceEvent.RECONNECT, this.handleStreamReconnect);
  }

  handleStreamMessage = (dataPoint) => {
    this.hideStreamErrorNotificationIfNeeded();
    this.hideStreamReconnectNotificationIfNeeded();
    const chart = this.chartRef.current.chart;
    const series = chart.series[0];
    if (series) {
      this.setIncrementalDataPoint(dataPoint);
    } else {
      this.setInitialData([dataPoint]);
    }
  };

  handleStreamError = () => {
    this.setState({ notificationText: TEXT_STREAM_ERROR });
    this.showNotification();
    this.hideDeal();
  };

  handleStreamReconnect = () => {
    this.setState({ notificationText: TEXT_STREAM_RECONNECT });
    this.showNotification();
    this.hideDeal();
  };

  hideStreamErrorNotificationIfNeeded() {
    const {
      notificationShow,
      notificationText,
    } = this.state;
    if (notificationShow && notificationText === TEXT_STREAM_ERROR) {
      this.hideNotification();
      this.showDeal();
    }
  }

  hideStreamReconnectNotificationIfNeeded() {
    const {
      notificationShow,
      notificationText,
    } = this.state;
    if (notificationShow && notificationText === TEXT_STREAM_RECONNECT) {
      this.hideNotification();
      this.showDeal();
    }
  }

  handleBuy = () => {
    const chart = this.chartRef.current.chart;
    const series = chart.series[1];
    const SHIFT_HACK = 2000;
    series.addPoint({x: Date.now() - SHIFT_HACK}, true);
  };

  handleSale = () => {
    const chart = this.chartRef.current.chart;
    const series = chart.series[2];
    const SHIFT_HACK = 2000;
    series.addPoint({x: Date.now() - SHIFT_HACK}, true);
  };

  render() {
    const {
      dealShow,
      notificationShow,
      notificationText,
    } = this.state;
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <div className="App-title">Binance live chart</div>
          <a
            className="App-link"
            rel="noreferrer noopener"
            target="_blank"
            href="https://github.com/archangel-irk/binance-live-chart"
          >
            GitHub
          </a>
        </header>
        <div className="App-main-wrapper">
          <div className="App-sidebar-left" />
          <div className="App-main">
            <CryptoChart
              title={pairTitleMap[this.currentSymbolPair]}
              ref={this.chartRef}
            />
            {dealShow &&
              <Deal
                onBuy={this.handleBuy}
                onSale={this.handleSale}
              />
            }
          </div>
          <div className="App-sidebar-right" />
        </div>
        <footer className="App-footer">2019 Konstantin Melnikov</footer>
        <NetStatusNotification />
        {notificationShow &&
          <Notification
            text={notificationText}
            ellipsis={notificationText === TEXT_STREAM_RECONNECT}
          />
        }
      </div>
    );
  }
}

export default App;
