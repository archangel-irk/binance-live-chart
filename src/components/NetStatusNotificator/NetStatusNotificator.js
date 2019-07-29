import React from 'react';

import './NetStatusNotificator.css';
import {
  NetStatusEvent,
  netStatusService,
} from '../../services/NetStatusService.js';

class NetStatusNotificator extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      online: netStatusService.isOnline(),
      show: netStatusService.isOffline(),
    };
    netStatusService.on(NetStatusEvent.ONLINE, this.setOnlineStatus);
    netStatusService.on(NetStatusEvent.OFFLINE, this.setOfflineStatus);
  }

  setOnlineStatus = () => {
    console.log('Online');
  };

  setOfflineStatus = () => {
    console.log('Offline');
  };

  getStatusText() {
    const { online } = this.props;
    const { onlineText, offlineText } = this.state;
    return online ? onlineText : offlineText;
  }

  getBaseClass() {
    return 'NetStatusNotificator';
  }

  getStatusClass() {
    const { online } = this.props;
    return online
      ? 'NetStatusNotificator__online'
      : 'NetStatusNotificator__offline';
  }

  getShowClass() {
    const { show } = this.state;
    return show ? 'NetStatusNotificator__show' : '';
  }

  getClass() {
    return `${this.getBaseClass()} ${this.getStatusClass()} ${this.getShowClass()}`;
  }

  render() {
    return (
      <div className={this.getClass()}>
        {this.getStatusText()}
      </div>
    );
  }
}

NetStatusNotificator.defaultProps = {
  onlineText: 'Online',
  offlineText: 'Offline',
};

export {
  NetStatusNotificator,
};
