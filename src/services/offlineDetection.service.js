import { EventEmitter } from '../utils/EventEmitter.js';


// class OfflineDetector {}

const BrowserEvents = {
  ONLINE: 'online',
  OFFLINE: 'offline',
};

const OfflineDetectionEvents = {
  ONLINE: 'online',
  OFFLINE: 'offline',
};

class OfflineDetectionService extends EventEmitter {
  online = false;

  constructor() {
    super();
    this.checkOnline();
    window.addEventListener(BrowserEvents.ONLINE,  this.handleOnlineStatus);
    window.addEventListener(BrowserEvents.OFFLINE, this.handleOfflineStatus);
  }

  checkOnline() {
    this.online = navigator.onLine;
  }

  handleOnlineStatus() {
    this.trigger(OfflineDetectionEvents.ONLINE);
  }

  handleOfflineStatus() {
    this.trigger(OfflineDetectionEvents.OFFLINE);
  }
}

const offlineDetectionService = new OfflineDetectionService();
export {
  OfflineDetectionEvents,
  offlineDetectionService,
};
