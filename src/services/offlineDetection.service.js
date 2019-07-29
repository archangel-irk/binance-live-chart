// class OfflineDetector {}

class OfflineDetectionService {
  online = false;
  element = document.createElement('div');

  constructor() {
    this.checkOnline();
    window.addEventListener('online',  this.setOnlineStatus);
    window.addEventListener('offline', this.setOfflineStatus);
  }

  checkOnline() {
    this.online = navigator.onLine;
  }

  setOnlineStatus() {
    document.getElementById('status').innerText = 'Online';
  }

  setOfflineStatus() {
    document.getElementById('status').innerText = 'Offline';
  }

  update() {

  }

  render() {
    document.body.append(this.element);
  }
}

export const offlineDetectionService = new OfflineDetectionService();
