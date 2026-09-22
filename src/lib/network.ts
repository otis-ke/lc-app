import { useEffect, useState } from 'react';
import * as Network from 'expo-network';

// Event-based connectivity via expo-network's addNetworkStateListener — no
// extra native setup needed (works in Expo Go), used to power the offline
// banner and the content.ts cache-fallback behavior.
export function useIsOnline(): boolean {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    let mounted = true;

    Network.getNetworkStateAsync()
      .then((state) => {
        if (mounted) setIsOnline(state.isConnected !== false && state.isInternetReachable !== false);
      })
      .catch(() => {});

    const sub = Network.addNetworkStateListener((state) => {
      setIsOnline(state.isConnected !== false && state.isInternetReachable !== false);
    });

    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);

  return isOnline;
}
