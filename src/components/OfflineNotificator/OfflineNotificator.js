import React from 'react';

import './OfflineNotificator.css';

class OfflineNotificator extends React.Component {
  props = {
    onlineText: 'Online',
    offlineText: 'Offline',
  };

  state = {};

  render() {
    return (
      <div className="offline-notificator">
      </div>
    );
  }
}

export {
  OfflineNotificator,
};
