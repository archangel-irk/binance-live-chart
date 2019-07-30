import React from 'react';

import './NetStatusNotification.css';
import {
  NetStatusEvent,
  netStatusService,
} from '../../services/netStatusService.js';


const ONLINE_HIDE_TIMEOUT = 3000;
const OFFLINE_TIME_INTERVAL = 300;
const OFFLINE_TIME_START_SHIFT = 1000; // start from one second
const OFFLINE_TIME_DEFAULT_TEXT = '';

const offlineTimeFormatter = new Intl.DateTimeFormat(undefined,{
  timeZone: 'UTC',
  hour12: false,
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

class NetStatusNotification extends React.Component {
  offlineFrom = undefined;
  offlineTimeIntervalId;
  onlineHideTimeoutId;

  constructor(props) {
    super(props);
    this.state = {
      online: netStatusService.isOnline(),
      offlineTime: OFFLINE_TIME_DEFAULT_TEXT,
      show: netStatusService.isOffline(),
    };
    netStatusService.on(NetStatusEvent.ONLINE, this.handleOnlineStatus);
    netStatusService.on(NetStatusEvent.OFFLINE, this.handleOfflineStatus);

    if (!this.state.online) {
      this.startOfflineTime();
    }
  }

  handleOnlineStatus = () => {
    this.setState({
      online: true,
      show: true,
    });
    clearTimeout(this.onlineHideTimeoutId);
    this.onlineHideTimeoutId = setTimeout(this.hideOnline, ONLINE_HIDE_TIMEOUT);
    this.stopOfflineTime();
  };

  handleOfflineStatus = () => {
    this.setState({
      online: false,
      show: true,
    });
    this.startOfflineTime();
  };

  hideOnline = () => {
    // if status still online after ONLINE_HIDE_TIMEOUT
    if (this.state.online) {
      this.setState({ show: false });
    }
  };

  startOfflineTime = () => {
    this.offlineFrom = Date.now();
    this.offlineTimeIntervalId = setInterval(this.updateOfflineTime, OFFLINE_TIME_INTERVAL);
  };

  stopOfflineTime = () => {
    this.offlineFrom = undefined;
    clearInterval(this.offlineTimeIntervalId);
    this.setState({ offlineTime: OFFLINE_TIME_DEFAULT_TEXT });
  };

  updateOfflineTime = () => {
    const offlineTimestamp = Date.now() - this.offlineFrom + OFFLINE_TIME_START_SHIFT;
    this.setState({
      show: true,
      offlineTime: offlineTimeFormatter.format(offlineTimestamp),
    });
  };

  getStatusText() {
    const { online } = this.state;
    const { onlineText, offlineText } = this.props;
    return online ? onlineText : `${offlineText} ${this.state.offlineTime}`;
  }

  getBaseClass() {
    return 'NetStatusNotification';
  }

  getStatusClass() {
    const { online } = this.state;
    return online
      ? 'NetStatusNotification--online'
      : 'NetStatusNotification--offline';
  }

  getShowClass() {
    const { show } = this.state;
    return show ? 'NetStatusNotification--show' : '';
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

NetStatusNotification.defaultProps = {
  onlineText: 'Online',
  offlineText: 'Offline',
};

export {
  NetStatusNotification,
};
