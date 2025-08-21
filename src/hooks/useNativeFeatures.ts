import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Device } from '@capacitor/device';
import { LocalNotifications } from '@capacitor/local-notifications';

export const useNativeFeatures = () => {
  const [isNative, setIsNative] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState<any>(null);

  useEffect(() => {
    const checkPlatform = async () => {
      setIsNative(Capacitor.isNativePlatform());
      
      if (Capacitor.isNativePlatform()) {
        const info = await Device.getInfo();
        setDeviceInfo(info);
        
        // Request notification permissions
        await LocalNotifications.requestPermissions();
      }
    };

    checkPlatform();

    // Handle app state changes
    if (Capacitor.isNativePlatform()) {
      App.addListener('appStateChange', ({ isActive }) => {
        console.log('App state changed. Is active?', isActive);
      });
    }

    return () => {
      if (Capacitor.isNativePlatform()) {
        App.removeAllListeners();
      }
    };
  }, []);

  const scheduleNotification = async (title: string, body: string, delayInMinutes: number = 0) => {
    if (!isNative) return;
    
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            title,
            body,
            id: Date.now(),
            schedule: delayInMinutes > 0 ? { at: new Date(Date.now() + delayInMinutes * 60 * 1000) } : undefined,
            sound: 'default',
            actionTypeId: 'refugi_checkin',
            extra: {
              type: 'checkin'
            }
          }
        ]
      });
    } catch (error) {
      console.error('Error scheduling notification:', error);
    }
  };

  const openExternalApp = async (url: string) => {
    if (isNative) {
      try {
        // Use native app opening
        window.open(url, '_system');
        return true;
      } catch (error) {
        console.error('Error opening external app:', error);
        return false;
      }
    } else {
      window.open(url, '_blank');
      return true;
    }
  };

  return {
    isNative,
    deviceInfo,
    scheduleNotification,
    openExternalApp
  };
};