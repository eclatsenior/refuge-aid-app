import { CapacitorConfig } from '@capacitor/cli';

// Live reload (desarrollo) solo si se ejecuta con CAP_LIVE_RELOAD=true.
// Para builds de producción (Play Store / App Store) NO debe incluirse el bloque `server`.
const useLiveReload = process.env.CAP_LIVE_RELOAD === 'true';

const config: CapacitorConfig = {
  appId: 'com.eclatsenior.refugi',
  appName: 'Refugi',
  webDir: 'dist',
  ...(useLiveReload
    ? {
        server: {
          url: 'https://577d0e94-408d-4f2c-bc50-c0e9fa87b30e.lovableproject.com?forceHideBadge=true',
          cleartext: true,
        },
      }
    : {}),
  plugins: {
    LocalNotifications: {
      smallIcon: "ic_stat_icon_config_sample",
      iconColor: "#488AFF",
      sound: "beep.wav",
    },
    Haptics: {
      vibrateOnTap: true
    }
  },
  ios: {
    contentInset: 'automatic',
    backgroundColor: '#ffffff'
  },
  android: {
    backgroundColor: '#ffffff',
    allowMixedContent: false
  }
};

export default config;