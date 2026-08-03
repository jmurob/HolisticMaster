import * as Location from 'expo-location';
import { SymbolView } from 'expo-symbols';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    useWindowDimensions,
    View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { SpaMap, type MapCoordinates, type NearbySpa } from '@/components/spa-map';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { distanceInKilometers } from '@/lib/map-utils';

const SEARCH_RADIUS_METERS = 15000;
const ACCENT = '#287D6B';
const ACCENT_SOFT = '#DCEDE7';
const WARM_ACCENT = '#D98F45';
const MIN_ZOOM = 9;
const MAX_ZOOM = 18;

type OverpassElement = {
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

async function findNearbySpas(origin: MapCoordinates) {
  const query = `[out:json][timeout:20];(
    nwr["leisure"="spa"](around:${SEARCH_RADIUS_METERS},${origin.latitude},${origin.longitude});
    nwr["amenity"="spa"](around:${SEARCH_RADIUS_METERS},${origin.latitude},${origin.longitude});
    nwr["healthcare"="spa"](around:${SEARCH_RADIUS_METERS},${origin.latitude},${origin.longitude});
    nwr["shop"="beauty"](around:${SEARCH_RADIUS_METERS},${origin.latitude},${origin.longitude});
    nwr["shop"="massage"](around:${SEARCH_RADIUS_METERS},${origin.latitude},${origin.longitude});
    nwr["tourism"="spa"](around:${SEARCH_RADIUS_METERS},${origin.latitude},${origin.longitude});
    nwr["shop"="wellness"](around:${SEARCH_RADIUS_METERS},${origin.latitude},${origin.longitude});
  );out center tags;`;
  const response = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `data=${encodeURIComponent(query)}`,
  });

  if (!response.ok) {
    throw new Error('No se pudo consultar OpenStreetMap.');
  }

  const data = (await response.json()) as { elements: OverpassElement[] };
  return data.elements
    .flatMap((element): NearbySpa[] => {
      const latitude = element.lat ?? element.center?.lat;
      const longitude = element.lon ?? element.center?.lon;
      if (latitude === undefined || longitude === undefined) return [];

      const coordinates = { latitude, longitude };
      return [
        {
          id: String(element.id),
          name: element.tags?.name ?? 'Spa sin nombre',
          coordinates,
          distanceKm: distanceInKilometers(origin, coordinates),
          address:
            [element.tags?.['addr:street'], element.tags?.['addr:housenumber']]
              .filter(Boolean)
              .join(' ') || 'Dirección no disponible',
        },
      ];
    })
    .sort((first, second) => first.distanceKm - second.distanceKm)
    .slice(0, 20);
}

export default function ExploreScreen() {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const safeAreaInsets = useSafeAreaInsets();
  const isWideWeb = Platform.OS === 'web' && width >= 900;
  const [location, setLocation] = useState<MapCoordinates | null>(null);
  const [spas, setSpas] = useState<NearbySpa[]>([]);
  const [selectedSpaId, setSelectedSpaId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(13);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [message, setMessage] = useState('Buscando tu ubicación...');
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadNearbySpas() {
      setStatus('loading');
      setMessage('Buscando tu ubicación...');

      try {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (permission.status !== 'granted') {
          throw new Error('Permite el acceso a tu ubicación para encontrar spas cercanos.');
        }

        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const coordinates = {
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
        };
        const nearbySpas = await findNearbySpas(coordinates);
        if (!active) return;

        setLocation(coordinates);
        setSpas(nearbySpas);
        setSelectedSpaId(nearbySpas[0]?.id ?? null);
        setMessage(
          nearbySpas.length > 0
            ? `${nearbySpas.length} lugares de bienestar encontrados en un radio de 15 km`
            : 'No encontramos lugares de bienestar registrados en un radio de 15 km.',
        );
        setStatus('ready');
      } catch (error) {
        if (!active) return;
        setMessage(error instanceof Error ? error.message : 'No fue posible cargar los spas.');
        setStatus('error');
      }
    }

    loadNearbySpas();
    return () => {
      active = false;
    };
  }, [refreshToken]);

  const selectedSpa = spas.find((spa) => spa.id === selectedSpaId) ?? null;

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView
        edges={['top', 'left', 'right']}
        style={[
          styles.safeArea,
          { paddingBottom: safeAreaInsets.bottom + BottomTabInset + Spacing.three },
        ]}>
        <View style={[styles.header, isWideWeb && styles.headerWide]}>
          <View style={styles.headerTopRow}>
            <View style={[styles.eyebrow, { backgroundColor: ACCENT_SOFT }]}>
              <SymbolView name="sparkles" size={13} tintColor={ACCENT} />
              <ThemedText type="code" style={styles.eyebrowText}>
                BIENESTAR CERCA
              </ThemedText>
            </View>
            <Pressable
              accessibilityLabel="Actualizar ubicación y spas"
              disabled={status === 'loading'}
              onPress={() => setRefreshToken((value) => value + 1)}
              style={({ pressed }) => [
                styles.iconButton,
                { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected },
                pressed && styles.pressed,
              ]}>
              {status === 'loading' ? (
                <ActivityIndicator color={theme.text} size="small" />
              ) : Platform.OS === 'web' ? (
                <ThemedText type="smallBold">Actualizar</ThemedText>
              ) : (
                <SymbolView name="location.fill" size={20} tintColor={theme.text} />
              )}
            </Pressable>
          </View>
          <View style={styles.heading}>
            <ThemedText
              type="title"
              style={[styles.pageTitle, isWideWeb && styles.pageTitleWide]}>
              Encuentra tu pausa
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.statusText}>
              {message}
            </ThemedText>
          </View>
        </View>

        <View style={[styles.explorerLayout, isWideWeb && styles.explorerLayoutWide]}>
          <View style={[styles.mapWrapper, isWideWeb && styles.mapWrapperWide]}>
            <View style={styles.mapBadge}>
              <View style={styles.liveDot} />
              <ThemedText type="smallBold" style={styles.mapBadgeText}>
                {spas.length > 0 ? `${spas.length} lugares en tu zona` : 'Explorando tu zona'}
              </ThemedText>
            </View>
            {location && Platform.OS !== 'web' && (
              <View style={styles.zoomControls}>
                <Pressable
                  accessibilityLabel="Acercar mapa"
                  onPress={() => setZoom((value) => Math.min(MAX_ZOOM, value + 1))}
                  style={({ pressed }) => [
                    styles.zoomButton,
                    { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected },
                    pressed && styles.pressed,
                  ]}>
                  <SymbolView name="plus" size={16} tintColor={theme.text} />
                </Pressable>
                <Pressable
                  accessibilityLabel="Alejar mapa"
                  onPress={() => setZoom((value) => Math.max(MIN_ZOOM, value - 1))}
                  style={({ pressed }) => [
                    styles.zoomButton,
                    { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected },
                    pressed && styles.pressed,
                  ]}>
                  <SymbolView name="minus" size={16} tintColor={theme.text} />
                </Pressable>
              </View>
            )}
            {location ? (
              <SpaMap
                key={refreshToken}
                location={location}
                spas={spas}
                selectedSpaId={selectedSpaId}
                zoom={zoom}
                onSelectSpa={setSelectedSpaId}
              />
            ) : (
              <View style={[styles.loadingMap, { backgroundColor: theme.backgroundElement }]}> 
                <ActivityIndicator color={theme.text} size="large" />
                <ThemedText type="small">{message}</ThemedText>
                {status === 'error' && (
                  <Pressable
                    onPress={() => setRefreshToken((value) => value + 1)}
                    style={[styles.retryButton, { backgroundColor: theme.text }]}> 
                    <ThemedText type="smallBold" style={{ color: theme.background }}>
                      Intentar de nuevo
                    </ThemedText>
                  </Pressable>
                )}
              </View>
            )}
          </View>

          {spas.length > 0 && (
            <View
              style={[
                styles.resultsSection,
                isWideWeb && styles.resultsSectionWide,
              ]}>
              <View style={styles.resultsHeader}>
                <View style={styles.resultsHeadingCopy}>
                  <ThemedText type="subtitle">Más cerca de ti</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    Selecciona un lugar para verlo en el mapa
                  </ThemedText>
                </View>
                <ThemedText type="code" style={styles.resultCount}>
                  {spas.length}
                </ThemedText>
              </View>
              <ScrollView
                horizontal={!isWideWeb}
                showsHorizontalScrollIndicator={false}
                showsVerticalScrollIndicator={false}
                style={isWideWeb && styles.resultsScrollWide}
                contentContainerStyle={[styles.results, isWideWeb && styles.resultsWide]}>
              {spas.map((spa, index) => {
                const selected = spa.id === selectedSpa?.id;
                return (
                  <Pressable
                    key={spa.id}
                    onPress={() => setSelectedSpaId(spa.id)}
                    style={[
                      styles.spaCard,
                      isWideWeb && styles.spaCardWide,
                      {
                        backgroundColor: selected
                          ? theme.backgroundSelected
                          : theme.backgroundElement,
                        borderColor: selected ? ACCENT : 'transparent',
                      },
                    ]}>
                    <View style={styles.cardTopRow}>
                      <View style={[styles.spaIcon, { backgroundColor: selected ? ACCENT : WARM_ACCENT }]}>
                        <ThemedText type="smallBold" style={styles.spaIndex}>
                          {index + 1}
                        </ThemedText>
                      </View>
                      <ThemedText type="smallBold" numberOfLines={1} style={styles.spaName}>
                        {spa.name}
                      </ThemedText>
                    </View>
                    <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                      {spa.address}
                    </ThemedText>
                    <View style={styles.distanceRow}>
                      <View style={styles.distanceDot} />
                      <ThemedText type="code" style={styles.distanceText}>
                        {spa.distanceKm.toFixed(1)} km de ti
                      </ThemedText>
                    </View>
                  </Pressable>
                );
              })}
              </ScrollView>
            </View>
          )}
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  safeArea: {
    flex: 1,
    paddingTop: Spacing.three,
    width: '100%',
    maxWidth: 1440,
    alignSelf: 'center',
  },
  header: {
    alignItems: 'flex-start',
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.four,
  },
  headerWide: { paddingTop: 96, paddingBottom: Spacing.five },
  headerTopRow: {
    width: '100%',
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  eyebrow: {
    minHeight: 28,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    borderRadius: 6,
    paddingHorizontal: Spacing.two,
  },
  eyebrowText: { color: ACCENT },
  heading: { alignItems: 'flex-start', gap: Spacing.one },
  pageTitle: { fontSize: 38, lineHeight: 44 },
  pageTitleWide: { fontSize: 52, lineHeight: 58 },
  statusText: { maxWidth: 520 },
  iconButton: {
    minWidth: 44,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
  },
  pressed: { opacity: 0.7 },
  explorerLayout: { flex: 1, gap: Spacing.three, paddingHorizontal: Spacing.three },
  explorerLayoutWide: { flexDirection: 'row', minHeight: 520, paddingHorizontal: Spacing.four },
  mapWrapper: {
    ...Platform.select({
      web: { flexGrow: 0, flexShrink: 0, height: 380 },
      default: { flex: 1, minHeight: 180 },
    }),
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(40, 125, 107, 0.28)',
    shadowColor: '#173D35',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 5,
  },
  mapWrapperWide: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    width: 'auto',
    height: 520,
  },
  mapBadge: {
    position: 'absolute',
    zIndex: 2,
    top: Spacing.three,
    left: Spacing.three,
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: 6,
    paddingHorizontal: Spacing.three,
    backgroundColor: 'rgba(20, 38, 34, 0.88)',
  },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#70D6B5' },
  mapBadgeText: { color: '#FFFFFF' },
  zoomControls: {
    position: 'absolute',
    left: Spacing.three,
    top: Spacing.three + 42,
    zIndex: 3,
    gap: Spacing.one,
  },
  zoomButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingMap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
  },
  retryButton: {
    minHeight: 44,
    borderRadius: 8,
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
  },
  resultsSection: { paddingTop: Spacing.three },
  resultsSectionWide: { width: 360, height: 520, paddingTop: 0, borderRadius: 8, overflow: 'hidden' },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.three,
  },
  resultsHeadingCopy: { flex: 1, gap: Spacing.one },
  resultCount: {
    color: '#FFFFFF',
    backgroundColor: ACCENT,
    minWidth: 34,
    height: 34,
    borderRadius: 6,
    textAlign: 'center',
    lineHeight: 34,
  },
  resultsScrollWide: { flex: 1 },
  results: { gap: Spacing.two, paddingHorizontal: Spacing.one, paddingBottom: Spacing.three },
  resultsWide: { paddingHorizontal: Spacing.two },
  spaCard: {
    width: 240,
    minHeight: 112,
    borderWidth: 1,
    borderRadius: 8,
    gap: Spacing.two,
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  spaCardWide: { width: '100%', minHeight: 94 },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  spaIcon: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spaName: { flex: 1 },
  spaIndex: { color: '#FFFFFF' },
  distanceRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  distanceDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: ACCENT },
  distanceText: { color: ACCENT },
});
