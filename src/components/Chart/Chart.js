import React from 'react';
import Highcharts from 'highcharts/highstock';
import HighchartsReact from 'highcharts-react-official';
import { applyCurrentPriceIndicator } from './current-price-indicator.js';
import { mergeDeepRight } from 'ramda';

import './Chart.css';
import {
  crosshairLabelNumberFormatter,
  tooltipNumberFormatter,
  yAxisLabelNumberFormatter,
} from './formatters.js';


// https://www.php.net/manual/en/function.strftime.php
// https://www.highcharts.com/docs/chart-concepts/labels-and-string-formatting

// chartTheme(Highcharts);
applyCurrentPriceIndicator(Highcharts);

const defaultOptions = {
  title: {
    text: 'Crypto chart',
    style: {
      color: '#ffffff',
    }
  },
  chart: {
    height: null,
    spacingLeft: 0,
    spacingRight: 0,
    backgroundColor: '#242c3d',
  },
  credits: {
    enabled: false,
    text: '',
    href: '',
  },
  navigator: {
    enabled: false,
  },
  rangeSelector: {
    enabled: false,
  },
  scrollbar: {
    enabled: false,
  },
  time: {
    timezoneOffset: new Date().getTimezoneOffset(),
  },
  tooltip: {
    enabled: false,
    formatter: function(tooltip) {
      // return [
      //   Highcharts.dateFormat('%e.%m.%Y %H:%M:%S', new Date(this.x)),
      //   `<b>${tooltipNumberFormatter.format(this.y)}</b>`
      // ];
      return `<b>${tooltipNumberFormatter.format(this.y)}</b>`;
    },
    useHTML: true,
  },
  xAxis: [{
    crosshair: false,
    ordinal: false,
    endOnTick: true,
    maxPadding: 0.25,
    tickInterval: 15 * 1000, // 15 seconds
    // max: 1564138726194,
    gridLineColor: '',
    gridLineWidth: 1,
    lineColor: '#2e3748',
    tickColor: '#2e3748',
    labels: {
      style: {
        color: '#6f737e',
      },
    },
  }],
  yAxis: [{
    opposite: true,
    crosshair: false,
    // startOnTick: true,
    // endOnTick: true,
    showFirstLabel: false,
    showLastLabel: false,
    gridLineColor: '#2e3748',
    tickAmount: 8,
    minPadding: 0.3,
    maxPadding: 0.3,
    // offset: 20,
    labels: {
      formatter: function() {
        return yAxisLabelNumberFormatter.format(this.value);
      },
      style: {
        color: '#6f737e',
      },
      // y: 6,
      x: -60,
      zIndex: 5,
    },
  }],
};

export function getStartFinishLinesConfig(bidStart, bidFinish, softMax) {
  return {
    xAxis: [{
      softMax,
      plotBands: [{
        from: bidStart,
        to: bidFinish,
        color: {
          linearGradient: {
            x1: 0,
            y1: 0,
            x2: 0,
            y2: 1
          },
          stops: [
            [0, '#353c40'],
            [1, Highcharts.Color('#353c40').setOpacity(0).get('rgba')]
          ]
        },
        zIndex: 1,
      }],
      plotLines: [
        {
          value: bidStart,
          width: 1,
          color: '#75756f',
          label: {
            // align: 'right',
            rotation: -90,
            text: 'Start',
            style: {
              color: '#75756f',
              fontSize: '10px',
            },
            x: -5,
            y: 30,
          },
          zIndex: 1,
        },
        {
          value: bidFinish,
          width: 1,
          color: '#a7a551',
          label: {
            // align: 'right',
            rotation: -90,
            text: 'Finish',
            style: {
              color: '#a7a551',
              fontSize: '10px',
            },
            x: -5,
            y: 35,
          },
          zIndex: 2,
        },
      ],
    }],
  };
}

export function getCrosshairConfig(){
  return {
    xAxis: [{
      crosshair: {
        color: '#2f4e6d',
        snap: false,
        label: {
          enabled: true,
          shape: 'rect',
          backgroundColor: '#2f4e6d',
          formatter: function(value) {
            if (value) {
              return Highcharts.dateFormat('%e.%m.%Y %H:%M:%S', new Date(value));
            }
          },
        },
      },
    }],
    yAxis: [{
      crosshair: {
        color: '#2f4e6d',
        snap: false,
        label: {
          enabled: true,
          backgroundColor: '#2f4e6d',
          padding: 4,
          formatter: function(value) {
            if (value) {
              return crosshairLabelNumberFormatter.format(value);
            }
          },
        },
        zIndex: 4,
      },
    }],
  };
}

const dataSeriesDefaultOptions = {
  type: 'area',
  id: 'dataseries',
  lastPrice: {
    enabled: true,
    color: 'red',
  },
  // enableMouseTracking: false,
  dataGrouping: {
    enabled: true,
    forced: true,
    units: [
      ['second', [1]]
    ]
  },
  threshold: null,
  color: '#67b8f8',
  fillColor: {
    // https://api.highcharts.com/class-reference/Highcharts.GradientColorObject
    linearGradient: {
      x1: 0,
      y1: 0,
      x2: 0,
      y2: 1
    },
    stops: [
      [0, '#264769'],
      [1, Highcharts.Color('#264769').setOpacity(0).get('rgba')]
    ]
  },
  states: {
    hover: {
      lineWidthPlus: 0,
    },
  },
};

export function enrichDataSeriesWithDefaultOptions(series) {
  return mergeDeepRight(dataSeriesDefaultOptions, series);
}

const flagDefaultSeries = {
  type: 'flags',
  onSeries: 'dataseries',
  shape: 'circlepin',
  allowOverlapX: true,
  enableMouseTracking: false,
  states: {
    hover: {
      enabled: false,
    },
    inactive: {
      opacity: 1,
    },
  },
  width: 14,
};

export const flagBuySeries = mergeDeepRight(flagDefaultSeries, {
  color: '#d5155b',
  fillColor: '#d5155b',
  // data: [{ x: Date.now() }],
  lineWidth: 2,
  title: 'B',
  y: -25,
});

export const flagSaleSeries = mergeDeepRight(flagDefaultSeries, {
  color: '#62bd22',
  fillColor: '#62bd22',
  // data: [{ x: Date.now() - 1000 }],
  lineWidth: 2,
  title: 'S',
  y: 5,
});

class CryptoChart extends React.PureComponent {
  internalChart;

  afterChartCreated = (chart) => {
    this.internalChart = chart;
  };

  render() {
    let options = mergeDeepRight(defaultOptions, {
      title: {
        text: this.props.title,
      },
    });

    const { forwardedRef } = this.props;
    return (
      <HighchartsReact
        highcharts={Highcharts}
        constructorType={'stockChart'}
        options={options}
        containerProps={{ className: 'chartContainer' }}
        callback={this.afterChartCreated}
        ref={forwardedRef}
      />
    );
  }
}

const cryptoChart = React.forwardRef((props, ref) => <CryptoChart {...props} forwardedRef={ref} />);
export {
  cryptoChart as CryptoChart,
}
