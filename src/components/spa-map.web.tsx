import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';

export type MapCoordinates = {
  latitude: number;
  longitude: number;
};

export type NearbySpa = {
  id: string;
  name: string;
  address: string;
  distanceKm: number;
  coordinates: MapCoordinates;
};

type SpaMapProps = {
  location: MapCoordinates;
  spas: NearbySpa[];
  selectedSpaId: string | null;
  zoom: number;
  onSelectSpa: (id: string) => void;
};

function createSpaIcon(leaflet: typeof import('leaflet'), index: number, selected: boolean) {
  const size = selected ? 34 : 28;
  return leaflet.divIcon({
    className: '',
    html: `<div style="width:${size}px;height:${size}px;border-radius:50% 50% 50% 8px;transform:rotate(-45deg);background:${selected ? '#287D6B' : '#D98F45'};border:3px solid #fff;box-shadow:0 4px 12px rgba(20,38,34,.28)"><span style="display:block;transform:rotate(45deg);color:#fff;text-align:center;line-height:${size - 6}px;font:700 12px sans-serif">${index + 1}</span></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size - 2],
  });
}

export function SpaMap(_props: SpaMapProps) {
  const { location, spas, selectedSpaId, zoom, onSelectSpa } = _props;
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import('leaflet').Map | null>(null);
  const markersRef = useRef<Map<string, import('leaflet').Marker>>(new Map());

  useEffect(() => {
    let disposed = false;
    const markers = new Map<string, import('leaflet').Marker>();
    markersRef.current = markers;

    async function createMap() {
      const L = await import('leaflet');
      if (disposed || !containerRef.current || mapRef.current) return;

      const map = L.map(containerRef.current, {
        center: [location.latitude, location.longitude],
        zoom,
        zoomControl: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
        maxZoom: 19,
      }).addTo(map);
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      L.circleMarker([location.latitude, location.longitude], {
        radius: 8,
        color: '#FFFFFF',
        weight: 3,
        fillColor: '#287D6B',
        fillOpacity: 1,
      })
        .bindTooltip('Tu ubicación', { direction: 'top' })
        .addTo(map);

      const bounds = L.latLngBounds([[location.latitude, location.longitude]]);
      spas.forEach((spa, index) => {
        const marker = L.marker([spa.coordinates.latitude, spa.coordinates.longitude], {
          icon: createSpaIcon(L, index, false),
          title: spa.name,
        })
          .bindTooltip(spa.name, { direction: 'top', offset: [0, -24] })
          .on('click', () => onSelectSpa(spa.id))
          .addTo(map);

        markers.set(spa.id, marker);
        bounds.extend([spa.coordinates.latitude, spa.coordinates.longitude]);
      });

      mapRef.current = map;
      if (spas.length > 0) map.fitBounds(bounds, { padding: [48, 48], maxZoom: 14 });
    }

    createMap();
    return () => {
      disposed = true;
      const activeMap = mapRef.current;
      mapRef.current = null;
      markers.clear();
      activeMap?.remove();
    };
  }, [location, onSelectSpa, spas, zoom]);

  useEffect(() => {
    let disposed = false;

    async function updateSelection() {
      const L = await import('leaflet');
      if (disposed) return;

      spas.forEach((spa, index) => {
        const marker = markersRef.current.get(spa.id);
        const selected = spa.id === selectedSpaId;
        marker?.setIcon(createSpaIcon(L, index, selected));
        marker?.setZIndexOffset(selected ? 1000 : 0);
      });
    }

    updateSelection();
    return () => {
      disposed = true;
    };
  }, [selectedSpaId, spas]);

  return (
    <View style={styles.container}>
      <div
        ref={containerRef}
        style={{ width: '100%', height: '100%' }}
        aria-label="Mapa de lugares de bienestar"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 280,
  },
});