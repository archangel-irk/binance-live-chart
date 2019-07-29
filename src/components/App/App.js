import React from 'react';
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
    data: undefined,
  };
  chartRef = React.createRef();

  componentDidMount() {
    binanceService
      .getInitialData(this.currentSymbolPair)
      .then((data) => {
        // this.chartRef.current.chart.addSeries({ data: [1, 2, 1, 4, 3, 6, 7, 3, 8, 6, 9] });
        this.setState({ data });
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
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <div className="App-title">Reactive Crypto Bets</div>
        </header>
        <div className="App-main-wrapper">
          <div className="App-sidebar-left" />
          <div className="App-main">
            <CryptoChart
              title={pairTitleMap[this.currentSymbolPair]}
              data={this.state.data}
              ref={this.chartRef}
            />
            <Deal
              onBuy={this.handleBuy}
              onSale={this.handleSale}
            />
          </div>
          <div className="App-sidebar-right" />
        </div>
        <footer className="App-footer">© 2019 Reactive Crypto Bets. All rights reserved</footer>
        <NetStatusNotificator />
      </div>
    );
  }
}

export default App;
