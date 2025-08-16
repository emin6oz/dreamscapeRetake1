// utils/notifications.js
// Modern PWA-ready NotificationManager with iOS fallback

export class NotificationManager {
  constructor() {
    this.permission = 'default';
    this.isIOS = this.detectIOS();
    this.isStandalone = this.checkStandaloneMode();
    this.checkPermission();
  }

  detectIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
           (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }

  checkStandaloneMode() {
    return window.matchMedia('(display-mode: standalone)').matches ||
           window.navigator.standalone === true;
  }

  checkPermission() {
    if ('Notification' in window) {
      this.permission = Notification.permission;
    }
    return this.permission;
  }

  async requestPermission() {
    if (!('Notification' in window)) return false;

    if (this.permission === 'granted') return true;

    if (this.permission === 'denied' && this.isIOS) {
      this.showIOSHelp();
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      if (permission === 'denied' && this.isIOS) this.showIOSHelp();
      return permission === 'granted';
    } catch (err) {
      console.error('Notification permission request failed', err);
      return false;
    }
  }

  showIOSHelp() {
    const helpMessage = this.isStandalone ?
      `To enable notifications on iOS:\n1. Go to Settings → Sleep Tracker → Notifications → Allow Notifications\n2. Restart the app` :
      `For best experience on iOS:\n1. Add app to home screen\n2. Open from home screen\n3. Allow notifications when prompted`;
    alert(helpMessage);
  }

  async showNotification(title, options = {}) {
    // Feature-detect Service Worker push
    if ('serviceWorker' in navigator && 'PushManager' in window && this.permission === 'granted') {
      try {
        const reg = await navigator.serviceWorker.ready;
        return reg.showNotification(title, options);
      } catch (err) {
        console.warn('ServiceWorker notification failed:', err);
      }
    }

    // Fallback to in-page notifications (iOS / unsupported)
    return this.showFallbackNotification(title, options.body);
  }

  showFallbackNotification(title, body = '') {
    const notification = document.createElement('div');
    notification.className = 'fallback-notification';
    notification.setAttribute('role', 'alert');
    notification.setAttribute('aria-live', 'assertive');
    notification.innerHTML = `
      <div class="notification-content">
        <div class="notification-icon">🌙</div>
        <div class="notification-text">
          <div class="notification-title">${title}</div>
          <div class="notification-body">${body}</div>
        </div>
        <button class="notification-close">×</button>
      </div>
    `;

    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => notification.remove());

    Object.assign(notification.style, {
      position: 'fixed',
      top: '20px',
      left: '20px',
      right: '20px',
      zIndex: 10000,
      background: 'linear-gradient(135deg, #1f2937, #374151)',
      color: 'white',
      borderRadius: '16px',
      padding: '16px',
      boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
      transform: 'translateY(-100px)',
      opacity: '0',
      transition: 'all 0.3s ease-out',
      border: '1px solid rgba(255,255,255,0.1)',
    });

    document.body.appendChild(notification);
    setTimeout(() => {
      notification.style.transform = 'translateY(0)';
      notification.style.opacity = '1';
    }, 10);
    setTimeout(() => {
      notification.style.transform = 'translateY(-100px)';
      notification.style.opacity = '0';
      setTimeout(() => notification.remove(), 300);
    }, 5000);

    return notification;
  }

  // Convenience methods
  showWakeUpNotification() {
    return this.showNotification('Good Morning!', {
      body: 'Time to wake up! Your sleep has been tracked.',
      tag: 'wake-up',
      requireInteraction: true,
      vibrate: this.isIOS ? [400] : [1000, 500, 1000],
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png'
    });
  }

  showBedtimeReminder(bedtime) {
    return this.showNotification('Bedtime Reminder', {
      body: `Time to prepare for bed! Bedtime: ${bedtime}`,
      tag: 'bedtime-reminder',
      vibrate: this.isIOS ? [200] : [200, 100, 200]
    });
  }
}

// Singleton
export const notificationManager = new NotificationManager();

export class VibrationManager {
  constructor() {
    this.isSupported = 'vibrate' in navigator;
    this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  }

  vibrate(pattern = 200) {
    if (!this.isSupported) return false;
    try {
      const p = this.isIOS ? (Array.isArray(pattern) ? pattern[0] : pattern) : pattern;
      navigator.vibrate(p);
      return true;
    } catch {
      return false;
    }
  }

  stop() {
    if (this.isSupported) navigator.vibrate(0);
  }

  wakeUpVibration() {
    if (this.isIOS) {
      this.vibrate(400);
      setTimeout(() => this.vibrate(400), 600);
      setTimeout(() => this.vibrate(400), 1200);
    } else {
      this.vibrate([400, 200, 400, 200, 400]);
    }
  }
}

export const vibrationManager = new VibrationManager();
