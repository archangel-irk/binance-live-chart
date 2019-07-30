import React from 'react';

import './Notification.css';

class Notification extends React.PureComponent {
  getBaseClass() {
    return 'Notification';
  }

  getClass() {
    return `${this.getBaseClass()}`;
  }

  render() {
    const {
      text,
      ellipsis,
    } = this.props;
    return (
      <div className={this.getClass()}>
        {text}
        {ellipsis &&
          <span className="Notification__ellipsis" />
        }
      </div>
    );
  }
}

Notification.defaultProps = {
  show: false,
  text: '',
};

export {
  Notification,
};
