/* eslint-disable */
/**
 * Highstock plugin for displaying current price indicator.
 *
 * Author: Roland Banguiran
 * Email: banguiran@gmail.com
 */

// https://www.highcharts.com/products/plugin-registry/single/28/Current%20Price%20Indicator
// https://github.com/highcharts/highcharts/issues/9915
// https://www.highcharts.com/forum/viewtopic.php?t=37651

// Fixes by Konstantin Melnikov

// JSLint options:
/*global Highcharts, document */

import { crosshairLabelNumberFormatter } from './formatters.js';


export function applyCurrentPriceIndicator(H) {
  'use strict';
  var merge = H.merge;

  H.wrap(H.Chart.prototype, 'init', function(proceed) {

    // Run the original proceed method
    proceed.apply(this, Array.prototype.slice.call(arguments, 1));

    renderCurrentPriceIndicator(this);
  });

  H.wrap(H.Chart.prototype, 'redraw', function(proceed) {

    // Run the original proceed method
    proceed.apply(this, Array.prototype.slice.call(arguments, 1));

    renderCurrentPriceIndicator(this);
  });

  function renderCurrentPriceIndicator(chart) {
    var priceYAxis = chart.yAxis[0],
      priceSeries = chart.series[0];

    if (!priceSeries) {
      return;
    }

    const grouped = priceSeries.groupedData && priceSeries.groupedData.length > 1;

    var priceData = grouped ? priceSeries.groupedData : priceSeries.yData;
    var currentPrice = priceData[priceData.length - 1];
    if (grouped) {
      currentPrice = currentPrice.y;
    }

    var extremes = priceYAxis.getExtremes();
    var min = extremes.min;
    var max = extremes.max;

    var options = chart.options.yAxis[0].currentPriceIndicator,
      defaultOptions = {
        backgroundColor: '#254e6b',
        borderColor: '#278abd',
        lineColor: '#278abd',
        lineDashStyle: 'Solid',
        lineOpacity: 1,
        enabled: true,
        style: {
          color: '#ffffff',
          fontSize: '11px',
        },
        x: 0,
        y: 0,
        zIndex: 5,
      },

      chartWidth = chart.chartWidth,
      chartHeight = chart.chartHeight,
      marginRight = chart.marginRight || 0,
      marginLeft = chart.marginLeft || 0,

      renderer = chart.renderer,

      currentPriceIndicator = priceYAxis.currentPriceIndicator || {},
      isRendered = Object.keys(currentPriceIndicator).length,

      group = currentPriceIndicator.group,
      label = currentPriceIndicator.label,
      box = currentPriceIndicator.box,
      line = currentPriceIndicator.line,

      width,
      height,
      x,
      y,

      lineFrom;

    options = merge(true, defaultOptions, options);

    // width = priceYAxis.opposite ? (marginRight ? marginRight : 40) : (marginLeft ? marginLeft : 40);
    // x = priceYAxis.opposite ? chartWidth - width : marginLeft;
    x = chartWidth;
    y = priceYAxis.toPixels(currentPrice);

    lineFrom = priceYAxis.opposite ? marginLeft : chartWidth - marginRight;

    // offset
    x += options.x;
    y += options.y;
    const boxWidth = 100;
    const labelPaddingLeft = 20;
    const labelPaddingRight = 20;
    const labelX = x - boxWidth - labelPaddingRight;
    const boxX = x - boxWidth - labelPaddingLeft - labelPaddingRight;

    if (options.enabled) {

      // render or animate
      if (!isRendered) {
        // group
        group = renderer.g()
          .attr({
            zIndex: options.zIndex,
          })
          .add();

        // label
        // label = renderer.text(crosshairLabelNumberFormatter.format(currentPrice), x, y)
        label = renderer.label(crosshairLabelNumberFormatter.format(currentPrice), labelX, y)
          .attr({
            zIndex: 2,
          })
          .css({
            color: options.style.color,
            fontSize: options.style.fontSize,
          })
          .add(group);

        height = label.getBBox().height;

        // box
        box = renderer.rect(boxX, y - (height / 2 + 5), boxWidth, height + 10, 15)
          .attr({
            fill: options.backgroundColor,
            stroke: options.borderColor,
            zIndex: 1,
            'stroke-width': 1,
            opacity: 0.6,
          })
          .add(group);

        // box
        line = renderer.path([
            'M', lineFrom, y, 'L', x - 140, y,
            'M', x - 40, y, 'L', x, y,
          ])
          .attr({
            stroke: options.lineColor,
            'stroke-dasharray': dashStyleToArray(options.lineDashStyle, 1),
            'stroke-width': 1,
            opacity: options.lineOpacity,
            zIndex: 1,
          })
          .add(group);

        // adjust
        label.animate({
          // y: y + (height / 4),
          y: y - (height / 2),
        }, 0);
      } else {
        height = currentPriceIndicator.label.getBBox().height;

        currentPriceIndicator.label.animate({
          // text: crosshairLabelNumberFormatter.format(currentPrice), // нужно ли это тут?
          x: labelX,
          // y: y,
          y: y - (height / 2),
        },
          // https://stackoverflow.com/questions/48121684/is-it-possible-to-make-custom-shaped-label-w-o-use-of-html-in-highcharts
          // http://jsfiddle.net/1ypn6927/1/
          // http://jsfiddle.net/kkulig/hqyfpsw4/
          // https://api.highcharts.com/class-reference/Highcharts.SVGElement.html#animate
          // https://api.highcharts.com/class-reference/Highcharts.AnimationOptionsObject#complete
          {
            duration: 500,
            step: function() {
              this.attr({
                text: crosshairLabelNumberFormatter.format(priceYAxis.toValue(this.y)),
                // text: crosshairLabelNumberFormatter.format(currentPrice),
              });
            },
            complete: function() {
              this.attr({
                text: crosshairLabelNumberFormatter.format(currentPrice),
              });
            },
          },
        );

        // height = currentPriceIndicator.label.getBBox().height;

        currentPriceIndicator.box.animate({
          x: boxX,
          y: y - (height / 2 + 5),
        }, 500);

        currentPriceIndicator.line.animate({
          // d: ['M', lineFrom, y, 'L', x, y],
          d: [
            'M', lineFrom, y, 'L', x - 140, y,
            'M', x - 40, y, 'L', x + 5, y,
          ],
        }, 500);

        // adjust
        // currentPriceIndicator.label.animate({
        //   y: y + (height / 4),
        // }, 500);
      }

      if (currentPrice > min && currentPrice < max) {
        group.show();
      } else {
        group.hide();
      }

      // register to price y-axis object
      priceYAxis.currentPriceIndicator = {
        group: group,
        label: label,
        box: box,
        line: line,
      };
    }
  }

  /**
   * Convert dash style name to array to be used a the value
   * for SVG element's "stroke-dasharray" attribute
   * @param {String} dashStyle  Possible values: 'Solid', 'Shortdot', 'Shortdash', etc
   * @param {Integer} width  SVG element's "stroke-width"
   * @param {Array} value
   */
  function dashStyleToArray(dashStyle, width) {
    var value;

    dashStyle = dashStyle.toLowerCase();
    width = (typeof width !== 'undefined' && width !== 0) ? width : 1;

    if (dashStyle === 'solid') {
      value = 'none';
    } else if (dashStyle) {
      value = dashStyle
        .replace('shortdashdotdot', '3,1,1,1,1,1,')
        .replace('shortdashdot', '3,1,1,1')
        .replace('shortdot', '1,1,')
        .replace('shortdash', '3,1,')
        .replace('longdash', '8,3,')
        .replace(/dot/g, '1,3,')
        .replace('dash', '4,3,')
        .replace(/,$/, '')
        .split(','); // ending comma

      i = value.length;
      while (i--) {
        value[i] = parseInt(value[i]) * width;
      }
      value = value.join(',');
    }

    return value;
  }
}
