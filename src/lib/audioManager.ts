/**
 * Centralized audio management for emergency alerts
 */

export class AudioManager {
  private audio: HTMLAudioElement | null = null;
  private isEnabled: boolean = false;

  constructor() {
    this.isEnabled = localStorage.getItem('audio-alerts-enabled') === 'true';
  }

  /**
   * Initialize audio context (must be called after user interaction)
   */
  async initialize(): Promise<boolean> {
    try {
      // Create and play a silent audio to unlock autoplay
      const audio = new Audio('/emergency-alert.mp3');
      audio.volume = 0.01;
      await audio.play();
      await audio.pause();
      
      this.isEnabled = true;
      localStorage.setItem('audio-alerts-enabled', 'true');
      
      console.log('✅ Audio manager initialized successfully');
      return true;
    } catch (error) {
      console.warn('⚠️ Failed to initialize audio:', error);
      return false;
    }
  }

  /**
   * Play emergency alert sound
   */
  async playAlert(): Promise<boolean> {
    if (!this.isEnabled) {
      console.warn('⚠️ Audio alerts not enabled');
      return false;
    }

    try {
      const audio = new Audio('/emergency-alert.mp3');
      audio.volume = 0.7;
      
      await audio.play();
      console.log('✅ Emergency alert sound played');
      return true;
    } catch (error) {
      console.warn('⚠️ Failed to play alert sound:', error);
      return false;
    }
  }

  /**
   * Check if audio is enabled
   */
  isAudioEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * Disable audio alerts
   */
  disable(): void {
    this.isEnabled = false;
    localStorage.setItem('audio-alerts-enabled', 'false');
  }

  /**
   * Enable audio alerts
   */
  enable(): void {
    this.isEnabled = true;
    localStorage.setItem('audio-alerts-enabled', 'true');
  }
}

// Global instance
export const audioManager = new AudioManager();

/**
 * Request notification permissions
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.warn('⚠️ Notifications not supported');
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    console.log('📢 Notification permission:', permission);
    return permission === 'granted';
  } catch (error) {
    console.warn('⚠️ Failed to request notification permission:', error);
    return false;
  }
}

/**
 * Show browser notification with sound
 */
export function showNotification(title: string, body: string, icon?: string): void {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    console.warn('⚠️ Cannot show notification - permission not granted');
    return;
  }

  try {
    new Notification(title, {
      body,
      icon: icon || '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'emergency-alert',
      requireInteraction: true
    });
    console.log('✅ Notification shown');
  } catch (error) {
    console.warn('⚠️ Failed to show notification:', error);
  }
}
