import { useMemo, useRef } from 'react';
import { View, type ViewStyle } from 'react-native';
import { WebView } from 'react-native-webview';
import { useEffect } from 'react';
import { palette } from '@/theme/tokens';

export interface LatLng {
  lat: number;
  lng: number;
}

interface LeafletMapProps {
  points: LatLng[];
  /** live mode: recenter on the latest point instead of fitting the whole route */
  follow?: boolean;
  style?: ViewStyle;
}

/**
 * Maps without an API key or billing: Leaflet + free CARTO dark OpenStreetMap
 * raster tiles, rendered in a WebView. Draws the route polyline, fits bounds
 * for a finished route, and recenters live when `follow` is set.
 */
export function LeafletMap({ points, follow = false, style }: LeafletMapProps) {
  const ref = useRef<WebView>(null);
  const initial = points[0] ?? { lat: 20, lng: 0 };

  const html = useMemo(
    () => buildHtml(initial.lat, initial.lng, points.length ? 15 : 2),
    // build once; live updates are injected imperatively below
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => {
    const coords = points.map((p) => [p.lat, p.lng]);
    ref.current?.injectJavaScript(`window.__update && window.__update(${JSON.stringify(coords)}, ${follow}); true;`);
  }, [points, follow]);

  return (
    <View style={[{ overflow: 'hidden', backgroundColor: palette.bg }, style]}>
      <WebView
        ref={ref}
        originWhitelist={['*']}
        source={{ html }}
        style={{ flex: 1, backgroundColor: palette.bg }}
        scrollEnabled={false}
        javaScriptEnabled
        domStorageEnabled
      />
    </View>
  );
}

function buildHtml(lat: number, lng: number, zoom: number): string {
  return `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<style>html,body,#map{height:100%;margin:0;padding:0;background:#0A0B0E}.leaflet-control-attribution{font-size:9px;background:rgba(10,11,14,0.5);color:#6a6f7a}</style>
</head><body><div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
  var map = L.map('map', { zoomControl: false, attributionControl: true }).setView([${lat}, ${lng}], ${zoom});
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 19, attribution: '© OpenStreetMap, © CARTO'
  }).addTo(map);
  var line = L.polyline([], { color: '${palette.primary}', weight: 5, lineJoin: 'round', lineCap: 'round' }).addTo(map);
  var dot = null;
  window.__update = function (coords, follow) {
    line.setLatLngs(coords);
    if (!coords.length) return;
    var last = coords[coords.length - 1];
    if (dot) { dot.setLatLng(last); } else { dot = L.circleMarker(last, { radius: 6, color: '#0A0B0E', weight: 2, fillColor: '${palette.primary}', fillOpacity: 1 }).addTo(map); }
    if (follow) { map.setView(last, Math.max(map.getZoom(), 16)); }
    else if (coords.length > 1) { map.fitBounds(line.getBounds(), { padding: [30, 30] }); }
    else { map.setView(last, 16); }
  };
</script></body></html>`;
}
