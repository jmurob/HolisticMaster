import { AppleMaps, GoogleMaps } from 'expo-maps';
import { Platform, StyleSheet } from 'react-native';

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

export function SpaMap({ location, spas, selectedSpaId, zoom, onSelectSpa }: SpaMapProps) {
  const cameraPosition = { coordinates: location, zoom };

  if (Platform.OS === 'ios') {
    return (
      <AppleMaps.View
        style={styles.map}
        cameraPosition={cameraPosition}
        markers={spas.map((spa) => ({
          id: spa.id,
          coordinates: spa.coordinates,
          title: spa.name,
          systemImage: 'sparkles',
          tintColor: spa.id === selectedSpaId ? '#0F766E' : '#D97706',
        }))}
        properties={{ isMyLocationEnabled: true, selectionEnabled: true }}
        uiSettings={{ compassEnabled: true, myLocationButtonEnabled: true }}
        onMarkerClick={(marker) => marker.id && onSelectSpa(marker.id)}
      />
    );
  }

  return (
    <GoogleMaps.View
      style={styles.map}
      cameraPosition={cameraPosition}
      markers={spas.map((spa) => ({
        id: spa.id,
        coordinates: spa.coordinates,
        title: spa.name,
        snippet: `${spa.distanceKm.toFixed(1)} km · ${spa.address}`,
        showCallout: spa.id === selectedSpaId,
      }))}
      properties={{ isMyLocationEnabled: true, selectionEnabled: true }}
      uiSettings={{ compassEnabled: true, myLocationButtonEnabled: true }}
      onMarkerClick={(marker) => marker.id && onSelectSpa(marker.id)}
    />
  );
}

const styles = StyleSheet.create({
  map: { flex: 1 },
});