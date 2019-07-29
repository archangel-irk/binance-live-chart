import React from 'react';

import './NetStatusNotificator.css';
import {
  NetStatusEvent,
  netStatusService,
} from '../../services/netStatusService.js';


const ONLINE_HIDE_TIMEOUT = 3000;
const OFFLINE_TIME_INTERVAL = 300;
const OFFLINE_TIME_START_SHIFT = 1000; // start from one second
const OFFLINE_TIME_DEFAULT_TEXT = '';

const offlineTimeSecondsFormatter = new Intl.DateTimeFormat(undefined,{
  second: 'numeric',
});

const offlineTimeMinutesFormatter = new Intl.DateTimeFormat(undefined,{
  minute: '2-digit',
  second: '2-digit',
});

const offlineTimeHoursFormatter = new Intl.DateTimeFormat(undefined,{
  timeZone: 'UTC',
  hour12: false,
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

// https://stackoverflow.com/questions/3177836/how-to-format-time-since-xxx-e-g-4-minutes-ago-similar-to-stack-exchange-site
// https://stackoverflow.com/questions/6108819/javascript-timestamp-to-relative-time-eg-2-seconds-ago-one-week-ago-etc-best
function timeSince(timestamp) {
  // const seconds = Math.floor((Date.now() - timestamp) / 1000);
  // let interval = Math.floor(seconds / 31536000);

  const msPerSecond = 1000;
  const msPerMinute = 60 * msPerSecond;
  const msPerHour = msPerMinute * 60; // 3600000
  // const msPerDay = msPerHour * 24;
  // const msPerMonth = msPerDay * 30;
  // const msPerYear = msPerDay * 365;

  const elapsed = Date.now() - timestamp;
  console.log(elapsed);

  if (elapsed < msPerMinute) {
    return offlineTimeHoursFormatter.format(elapsed);
    // return offlineTimeSecondsFormatter.format(elapsed) + ' sec';
    return Math.floor(elapsed / msPerSecond) + ' sec';
  } else if (elapsed < msPerHour) {
    return offlineTimeMinutesFormatter.format(elapsed);
    const minutes = Math.floor(elapsed / msPerMinute);
    const seconds = Math.floor((elapsed - minutes * msPerMinute) / msPerSecond);
    return `${minutes} min ${seconds} sec`;
  } else {
    const hours = Math.floor(elapsed / msPerHour);
    const minutes = Math.floor((elapsed - hours * msPerHour) / msPerMinute);
    const seconds = Math.floor((elapsed - hours * msPerHour - minutes * msPerMinute) / msPerSecond);
    return `${hours} hours ${minutes} min ${seconds} sec`;
  }

  // interval = Math.floor(seconds / 3600);
  // const hours = Math.floor(seconds / 3600);
  // if (interval > 0) {
  //   const minutes = Math.floor((seconds - interval) / 60);
  //   return interval + ' hours' + minutes + ' min' + ();
  // }
  // interval = Math.floor(seconds / 60);
  // if (interval > 0) {
  //   return interval + ' min' + (seconds - interval) + ' sec';
  // }
  // return Math.floor(seconds) + ' sec';
}

class NetStatusNotificator extends React.Component {
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
      // offlineTime: timeSince(this.offlineFrom),
      offlineTime: offlineTimeHoursFormatter.format(offlineTimestamp),
    });
  };

  getStatusText() {
    const { online } = this.state;
    const { onlineText, offlineText } = this.props;
    return online ? onlineText : `${offlineText} ${this.state.offlineTime}`;
  }

  getBaseClass() {
    return 'NetStatusNotificator';
  }

  getStatusClass() {
    const { online } = this.state;
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
