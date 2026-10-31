import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation, CommonActions } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button } from '../../components/Button';
import { fetchApprovedInstructorProfiles } from '../../lib/instructors';
import { fetchModelDirectory } from '../../lib/models';
import { describeLocationDenial, openLocationSettings, requestLocationFromGesture } from '../../lib/location';
import { colors, fonts, spacing } from '../../theme/theme';
import type { ConnectStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<ConnectStackParamList>;

interface MapPin {
  uid: string;
  name: string;
  kind: 'instructor' | 'student';
  lat: number;
  lng: number;
  subtitle: string;
}

// Leaflet + OpenStreetMap tiles — the "most basic free API, no keys needed"
// map stack. react-native-maps' default Android provider requires a Google
// Maps API key; a WebView running Leaflet against OSM's public tile server
// needs none, so this works out of the box for every install.
function buildMapHtml(myLat: number, myLng: number, pins: MapPin[]): string {
  const pinsJson = JSON.stringify(pins);
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    html, body, #map { height: 100%; margin: 0; padding: 0; background: #0b0b0c; }
    .lc-me-dot { width: 16px; height: 16px; border-radius: 8px; background: #3a8dff; border: 3px solid #fff; box-shadow: 0 0 0 4px rgba(58,141,255,0.35); }
    .lc-pin { width: 30px; height: 30px; border-radius: 15px 15px 15px 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; border: 2px solid #fff; box-shadow: 0 2px 6px rgba(0,0,0,0.4); }
    .lc-pin span { transform: rotate(45deg); font-size: 14px; }
    .lc-pin.instructor { background: #8a1f66; }
    .lc-pin.student { background: #c6a15b; }
    .leaflet-popup-content-wrapper { border-radius: 12px; }
    .lc-popup-title { font-weight: 700; font-size: 14px; margin-bottom: 2px; }
    .lc-popup-sub { font-size: 12px; color: #666; margin-bottom: 8px; }
    .lc-popup-btn { display: inline-block; background: #8a1f66; color: #fff; padding: 6px 12px; border-radius: 999px; font-size: 12px; text-decoration: none; margin-right: 6px; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    const map = L.map('map', { zoomControl: false }).setView([${myLat}, ${myLng}], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    L.marker([${myLat}, ${myLng}], {
      icon: L.divIcon({ className: '', html: '<div class="lc-me-dot"></div>', iconSize: [16, 16] }),
    }).addTo(map).bindPopup('You are here');

    const pins = ${pinsJson};
    pins.forEach((p) => {
      const icon = L.divIcon({
        className: '',
        html: '<div class="lc-pin ' + p.kind + '"><span>' + (p.kind === 'instructor' ? 'I' : 'S') + '</span></div>',
        iconSize: [30, 30],
        iconAnchor: [15, 30],
        popupAnchor: [0, -28],
      });
      const marker = L.marker([p.lat, p.lng], { icon }).addTo(map);
      const popupHtml =
        '<div class="lc-popup-title">' + p.name + '</div>' +
        '<div class="lc-popup-sub">' + p.subtitle + '</div>' +
        '<a class="lc-popup-btn" href="#" onclick="window.ReactNativeWebView.postMessage(JSON.stringify({action:\\'profile\\', uid:\\'' + p.uid + '\\', kind:\\'' + p.kind + '\\'})); return false;">View</a>' +
        '<a class="lc-popup-btn" href="#" onclick="window.ReactNativeWebView.postMessage(JSON.stringify({action:\\'message\\', uid:\\'' + p.uid + '\\', name:\\'' + p.name.replace(/'/g, "") + '\\'})); return false;">Message</a>';
      marker.bindPopup(popupHtml);
    });
  </script>
</body>
</html>`;
}

export default function NearbyMapScreen() {
  const navigation = useNavigation<Nav>();
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [canAskAgain, setCanAskAgain] = useState(true);
  const [myCoords, setMyCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [pins, setPins] = useState<MapPin[]>([]);

  async function loadNearby() {
    setLoading(true);
    setErrorMsg(null);
    // Navigating to this screen is itself the user's deliberate "show me
    // who's nearby" gesture, so requesting here (rather than only on a
    // second tap) is expected — unlike the silent-by-default check on the
    // Connect home tab, which must never auto-prompt. See lib/location.ts.
    const result = await requestLocationFromGesture();
    if (result.status !== 'granted') {
      if (result.status === 'denied') {
        setCanAskAgain(result.canAskAgain);
        setErrorMsg(describeLocationDenial(result.canAskAgain));
      } else {
        setErrorMsg(result.message);
      }
      setLoading(false);
      return;
    }

    setMyCoords({ lat: result.lat, lng: result.lng });
    try {
      const [instructors, models] = await Promise.all([
        fetchApprovedInstructorProfiles().catch(() => []),
        fetchModelDirectory().catch(() => []),
      ]);

      const instructorPins: MapPin[] = instructors
        .filter((i) => i.geo)
        .map((i) => ({ uid: i.id, name: i.full_name, kind: 'instructor' as const, lat: i.geo!.lat, lng: i.geo!.lng, subtitle: `Instructor · KSh ${i.price_per_session.toLocaleString()}/session` }));
      const studentPins: MapPin[] = models
        .filter((m) => m.geo)
        .map((m) => ({ uid: m.id, name: m.full_name, kind: 'student' as const, lat: m.geo!.lat, lng: m.geo!.lng, subtitle: 'Student' }));

      setPins([...instructorPins, ...studentPins]);
    } catch (e: any) {
      setErrorMsg(e?.message ?? 'Could not load nearby people right now.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNearby();
  }, []);

  const html = useMemo(() => (myCoords ? buildMapHtml(myCoords.lat, myCoords.lng, pins) : ''), [myCoords, pins]);

  function handleMessage(raw: string) {
    try {
      const msg = JSON.parse(raw);
      if (msg.action === 'profile') {
        if (msg.kind === 'instructor') {
          navigation.navigate('InstructorProfileDetail', { uid: msg.uid });
        } else {
          navigation.getParent()?.dispatch(
            CommonActions.navigate({ name: 'ModelsTab', params: { screen: 'ModelDetail', params: { modelId: msg.uid } } })
          );
        }
      } else if (msg.action === 'message') {
        navigation.getParent()?.dispatch(
          CommonActions.navigate({ name: 'DashboardTab', params: { screen: 'Chat', params: { otherUid: msg.uid, otherName: msg.name } } })
        );
      }
    } catch {
      // ignore malformed messages
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
        <Text style={styles.centerText}>Finding people near you…</Text>
      </View>
    );
  }

  if (errorMsg || !myCoords) {
    return (
      <View style={styles.center}>
        <Ionicons name="location-outline" size={32} color={colors.textMuted} />
        <Text style={styles.centerText}>{errorMsg ?? 'Location unavailable.'}</Text>
        <View style={styles.centerActions}>
          {Platform.OS !== 'web' && !canAskAgain ? (
            <Button label="Open Settings" onPress={openLocationSettings} fullWidth={false} />
          ) : (
            <Button label="Try Again" onPress={loadNearby} fullWidth={false} />
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <WebView
        source={{ html }}
        style={styles.webview}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled
        onMessage={(e) => handleMessage(e.nativeEvent.data)}
      />
      <View style={styles.legend}>
        <View style={styles.legendRow}>
          <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
          <Text style={styles.legendText}>Instructors</Text>
        </View>
        <View style={styles.legendRow}>
          <View style={[styles.legendDot, { backgroundColor: colors.gold }]} />
          <Text style={styles.legendText}>Students</Text>
        </View>
        <Text style={styles.legendCount}>{pins.length} nearby</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0b0b0c' },
  webview: { flex: 1, backgroundColor: '#0b0b0c' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: colors.bg, padding: spacing.xl },
  centerText: { fontFamily: fonts.body, fontSize: 14, color: colors.textMuted, textAlign: 'center' },
  centerActions: { marginTop: spacing.sm },
  legend: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    backgroundColor: 'rgba(11,11,12,0.85)',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 4,
  },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 9, height: 9, borderRadius: 4.5 },
  legendText: { fontFamily: fonts.bodyMedium, fontSize: 11.5, color: '#fff' },
  legendCount: { fontFamily: fonts.bodySemiBold, fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
});
