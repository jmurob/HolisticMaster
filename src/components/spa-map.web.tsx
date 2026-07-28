import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { buildOpenStreetMapEmbedUrl } from '@/lib/map-utils';

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

export function SpaMap(_props: SpaMapProps) {
  const { location, spas, selectedSpaId, zoom, onSelectSpa } = _props;
  const selectedSpa = spas.find((spa) => spa.id === selectedSpaId) ?? null;
  const focusCoordinates = selectedSpa?.coordinates ?? location;

  const embedUrl = useMemo(() => {
    return buildOpenStreetMapEmbedUrl({ center: focusCoordinates, zoom });
  }, [focusCoordinates, zoom]);

  return (
    <View style={styles.container}>
      <View style={styles.mapFrame}>
        <iframe
          src={embedUrl}
          style={styles.iframe}
          title="Mapa de spas"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </View>

      {spas.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickSelectList}>
          {spas.slice(0, 8).map((spa) => {
            const selected = spa.id === selectedSpaId;
            return (
              <Pressable
                key={spa.id}
                onPress={() => onSelectSpa(spa.id)}
                style={[styles.quickSelectItem, selected && styles.quickSelectItemSelected]}>
                <ThemedText type="smallBold" numberOfLines={1} style={styles.quickSelectText}>
                  {spa.name}
                </ThemedText>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      <ThemedText type="small" themeColor="textSecondary" style={styles.caption}>
        Vista web con OpenStreetMap. En móvil se usa el mapa nativo.
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: Spacing.two,
    padding: Spacing.three,
  },
  mapFrame: {
    flex: 1,
    minHeight: 220,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(40, 125, 107, 0.28)',
    backgroundColor: '#F3F7F6',
  },
  iframe: {
    width: '100%',
    height: '100%',
    border: '0',
  },
  quickSelectList: {
    gap: Spacing.two,
    paddingVertical: Spacing.one,
  },
  quickSelectItem: {
    maxWidth: 180,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(40, 125, 107, 0.3)',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    backgroundColor: '#FFFFFF',
  },
  quickSelectItemSelected: {
    borderColor: '#287D6B',
    backgroundColor: '#DCEDE7',
  },
  quickSelectText: { flexShrink: 1 },
  caption: { textAlign: 'center' },
});