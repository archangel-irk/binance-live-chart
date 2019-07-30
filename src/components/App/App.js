import React from 'react';
import { NetStatusEvent, netStatusService } from '../../services/netStatusService.js';
import {
  CryptoChart,
  enrichSeriesWithDefaultOptions,
  getChartOptionsToBeAddedWithData,
} from '../Chart/Chart.js';
import { NetStatusNotificator } from '../NetStatusNotificator/NetStatusNotificator.js';
import { Deal } from '../Deal/Deal.js';
import { binanceService } from '../../services/binance.service.js';

import logo from '../../logo.svg';
import './App.css';


const SymbolPair = {
  BTCUSDT: 'BTCUSDT',
};
const PAIR_DEFAULT = SymbolPair.BTCUSDT;
const pairTitleMap = {
  [SymbolPair.BTCUSDT]: 'BTC/USDT',
};

class App extends React.Component {
  currentSymbolPair = PAIR_DEFAULT;
  state = {
    initialData: undefined,
    showDeal: false,
  };
  chartRef = React.createRef();

  constructor(props) {
    super(props);
    netStatusService.on(NetStatusEvent.ONLINE, this.handleOnlineStatus);
    netStatusService.on(NetStatusEvent.OFFLINE, this.handleOfflineStatus);
  }

  handleOnlineStatus = () => {
    this.setState({
      showDeal: true,
    });
  };

  handleOfflineStatus = () => {
    this.setState({
      showDeal: false,
    });
  };

  componentDidMount() {
    binanceService
      .getInitialData(this.currentSymbolPair)
      .then((data) => {
        // this.chartRef.current.chart.addSeries({ data: [1, 2, 1, 4, 3, 6, 7, 3, 8, 6, 9] });
        this.setState({
          showDeal: true,
          initialData: data,
        });
        this.connectToStream();
      })
      .catch(() => {
        // todo: handle errors
      });
  }

  connectToStream() {
    binanceService
      .connectToStream(this.currentSymbolPair, this.handleStreamMessage);
  }

  handleStreamMessage = (dataPoint) => {
    // console.log(data);
    const chart = this.chartRef.current.chart;
    const series = chart.series[0];
    if (series) {
      series.addPoint(dataPoint, true, false, true);
      // series.removePoint(0, true, true);
      chart.series[1].update();
      chart.series[2].update();
    } else {
      chart.update({
        series: [enrichSeriesWithDefaultOptions({data: [dataPoint]})],
        ...getChartOptionsToBeAddedWithData(),
      }, true, true, true);
    }
  };

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
    const { showDeal } = this.state;
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
              initialData={this.state.initialData}
              ref={this.chartRef}
            />
            {showDeal &&
              <Deal
                onBuy={this.handleBuy}
                onSale={this.handleSale}
              />
            }
          </div>
          <div className="App-sidebar-right" />
        </div>
        <footer className="App-footer">2019 Konstantin Melnikov</footer>
        <NetStatusNotificator />
      </div>
    );
  }
}

export default App;
