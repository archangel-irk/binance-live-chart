import React from 'react';

import './Deal.css';

const VALUE_MIN = 1;
const VALUE_DEFAULT = 1;

class Deal extends React.Component {
  state = {
    value: VALUE_DEFAULT,
  };

  clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  handleChange = (event) => {
    this.setState({value: Math.abs(parseFloat(event.target.value)) || VALUE_MIN});
  };

  handleIncrease = () => {
    this.setState({value: this.state.value + 1});
  };

  handleDecrease = () => {
    this.setState({value: this.clamp(this.state.value - 1, VALUE_MIN, Infinity)});
  };

  handleBuy = () => {
    this.setState({value: VALUE_DEFAULT});
    this.props.onBuy();
  };

  handleSale = () => {
    this.setState({value: VALUE_DEFAULT});
    this.props.onSale();
  };

  render() {
    return (
      <div className="deal-controller"  style={{marginBottom: 0}}>
        <div className="holder">
          <div className="slider upper">
            <div className="current-deal">
              <div className="block amount no-swipe">
                <div className="title">Amount</div>
                <div className="amount-input">
                  <span className="input-btn minus" onClick={this.handleDecrease}>−</span>
                  <span className="input currency-once">
                    <i>$</i>
                    <input
                      pattern="^((?!(0))[0-9]+)$"
                      value={this.state.value}
                      onChange={this.handleChange}
                    />
                  </span>
                  <span className="input-btn plus" onClick={this.handleIncrease}>+</span></div>
              </div>
              <div className="block deal no-swipe">
                <div className="put-side">
                  <div className="amount-data">
                    <span className="money undefined money-big">
                      &nbsp;
                      {/*<i className="currency ">$</i>*/}
                      {/*1.85*/}
                    </span>
                  </div>
                  <div className="deal-button put" onClick={this.handleBuy}>Buy</div>
                </div>
                <div className="call-side">
                  <div className="amount-data">
                    <span className="money undefined money-big">
                      &nbsp;
                      {/*<i className="currency ">$</i>*/}
                      {/*1.85*/}
                    </span>
                  </div>
                  <div className="deal-button call" onClick={this.handleSale}>Sale</div>
                </div>
              </div>
            </div>
            <div className="new-deal">
              <div className="block profit">
                <div className="title">Profit</div>
                <span className="money value money-big"><i className="currency ">$</i>0</span></div>
              <div className="block timer">
                <div className="title">Expiration time</div>
                <div className="value big">00:00</div>
              </div>
              <div className="block new"><i>+</i> New option</div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

Deal.defaultProps = {
  onSale: () => {},
  onBuy: () => {},
};

export {
  Deal,
};
