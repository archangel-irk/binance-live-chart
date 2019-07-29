import { EventEmitter } from '../utils/EventEmitter.js';


// class OfflineDetector {}

const BrowserEvents = {
  ONLINE: 'online',
  OFFLINE: 'offline',
};

const NetStatusEvent = {
  ONLINE: 'online',
  OFFLINE: 'offline',
};

const NetStatus = {
  ONLINE: 'online',
  OFFLINE: 'offline',
};

class NetStatusService extends EventEmitter {
  online = false;

  constructor() {
    super();
    this.online = navigator.onLine;
    window.addEventListener(BrowserEvents.ONLINE,  this.handleOnlineStatus);
    window.addEventListener(BrowserEvents.OFFLINE, this.handleOfflineStatus);
  }

  getStatus() {
    return this.online ? NetStatus.ONLINE : NetStatus.OFFLINE;
  }

  isOnline() {
    return this.online;
  }

  isOffline() {
    return !this.online;
  }

  handleOnlineStatus = () => {
    this.online = true;
    this.trigger(NetStatusEvent.ONLINE);
  };

  handleOfflineStatus = () => {
    this.online = false;
    this.trigger(NetStatusEvent.OFFLINE);
  };
}

const netStatusService = new NetStatusService();
export {
  NetStatusEvent,
  netStatusService,
};
