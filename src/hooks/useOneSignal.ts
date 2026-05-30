import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

declare global {
  interface Window {
    OneSignalDeferred?: ((OneSignal: OneSignalType) => void)[];
    OneSignal?: OneSignalType;
  }
}

interface OneSignalType {
  init: (config: object) => void;
  User: {
    PushSubscription: {
      id: string | null;
      optedIn: boolean;
      addEventListener: (event: string, cb: () => void) => void;
    };
  };
  Notifications: {
    requestPermission: () => Promise<void>;
    permissionNative: string;
  };
}

const ONESIGNAL_APP_ID = import.meta.env.VITE_ONESIGNAL_APP_ID as string | undefined;

export function useOneSignal() {
  const { user } = useAuth();

  useEffect(() => {
    if (!ONESIGNAL_APP_ID) return;

    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push((OneSignal) => {
      OneSignal.init({
        appId: ONESIGNAL_APP_ID,
        safari_web_id: '',
        notifyButton: { enable: false },
        allowLocalhostAsSecureOrigin: true,
      });
    });

    const script = document.getElementById('onesignal-sdk');
    if (!script) {
      const s = document.createElement('script');
      s.id = 'onesignal-sdk';
      s.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js';
      s.defer = true;
      document.head.appendChild(s);
    }
  }, []);

  async function requestPushPermission() {
    if (!ONESIGNAL_APP_ID || !user) return;
    try {
      const os = window.OneSignal;
      if (!os) return;
      await os.Notifications.requestPermission();
      const playerId = os.User.PushSubscription.id;
      if (playerId) {
        await supabase
          .from('profiles')
          .update({ onesignal_player_id: playerId })
          .eq('id', user.id);
      }
    } catch {
      // silently fail if notifications not supported
    }
  }

  return { requestPushPermission };
}
