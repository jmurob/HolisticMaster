import * as Location from 'expo-location';
import { SymbolView } from 'expo-symbols';
import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    TextInput,
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
const WARM_ACCENT = '#887493';
const MIN_ZOOM = 9;
const MAX_ZOOM = 18;

type OverpassElement = {
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

type PlaceSuggestion = {
  id: string;
  label: string;
  coordinates: MapCoordinates;
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
  const [locationLabel, setLocationLabel] = useState('');
  const [isMyLocation, setIsMyLocation] = useState(false);
  const [spas, setSpas] = useState<NearbySpa[]>([]);
  const [selectedSpaId, setSelectedSpaId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(13);
  const [status, setStatus] = useState<'locating' | 'loading' | 'ready' | 'location-error' | 'error'>('location-error');
  const [message, setMessage] = useState('Elige cómo quieres explorar: comparte tu ubicación o busca una ciudad.');
  const [refreshToken, setRefreshToken] = useState(0);
  const [cityQuery, setCityQuery] = useState('');
  const [cityResults, setCityResults] = useState<PlaceSuggestion[]>([]);
  const [isSearchingCity, setIsSearchingCity] = useState(false);
  const [citySearchError, setCitySearchError] = useState('');
  const locationRequestId = useRef(0);
  const lastCitySearchTime = useRef(0);

  useEffect(() => {
    if (refreshToken === 0) return;

    let active = true;
    const requestId = ++locationRequestId.current;

    async function loadNearbySpas() {
      setStatus('locating');
      setMessage('Buscando tu ubicación…');
      let foundLocation = false;
      try {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (permission.status !== 'granted') {
          throw new Error('location-unavailable');
        }

        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const coordinates = {
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
        };
        foundLocation = true;
        if (!active || requestId !== locationRequestId.current) return;
        setLocation(coordinates);
        setLocationLabel('Mi ubicación');
        setIsMyLocation(true);
        setSpas([]);
        setStatus('loading');
        setMessage('Buscando lugares de bienestar cerca de ti…');
        const nearbySpas = await findNearbySpas(coordinates);
        if (!active || requestId !== locationRequestId.current) return;

        setSpas(nearbySpas);
        setSelectedSpaId(nearbySpas[0]?.id ?? null);
        setMessage(
          nearbySpas.length > 0
            ? `${nearbySpas.length} lugares de bienestar encontrados en un radio de 15 km.`
            : 'No encontramos lugares de bienestar registrados en un radio de 15 km.',
        );
        setStatus('ready');
      } catch {
        if (!active || requestId !== locationRequestId.current) return;
        if (!foundLocation) {
          setMessage('No pudimos acceder al GPS. Puedes intentarlo de nuevo o buscar una ciudad.');
          setStatus('location-error');
        } else {
          setMessage('No pudimos cargar los lugares ahora. Revisa tu conexión e intenta actualizar.');
          setStatus('error');
        }
      }
    }

    loadNearbySpas();
    return () => {
      active = false;
      if (locationRequestId.current === requestId) locationRequestId.current += 1;
    };
  }, [refreshToken]);

  async function searchCities() {
    const query = cityQuery.trim();
    if (!query || isSearchingCity || Date.now() - lastCitySearchTime.current < 1000) return;

    lastCitySearchTime.current = Date.now();
    setIsSearchingCity(true);
    setCitySearchError('');
    setCityResults([]);
    try {
      const response = await fetch(
        `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5`,
      );
      if (!response.ok) throw new Error('search-failed');

      const data = (await response.json()) as {
        features: {
          geometry: { coordinates: [number, number] };
          properties: { name?: string; city?: string; state?: string; country?: string };
        }[];
      };
      const suggestions = data.features
        .map((feature, index) => {
          const properties = feature.properties;
          const label = [properties.name ?? properties.city, properties.state, properties.country]
            .filter((part, partIndex, parts) => part && parts.indexOf(part) === partIndex)
            .join(', ');
          const [longitude, latitude] = feature.geometry.coordinates;
          return { id: `${label}-${index}`, label, coordinates: { latitude, longitude } };
        })
        .filter((suggestion) => suggestion.label);

      if (suggestions.length === 0) {
        setCitySearchError('No encontramos esa zona. Prueba con ciudad y país.');
      } else {
        setCityResults(suggestions);
      }
    } catch {
      setCitySearchError('El buscador de lugares no respondió. Revisa tu conexión e inténtalo otra vez.');
    } finally {
      setIsSearchingCity(false);
    }
  }

  async function selectCity(suggestion: PlaceSuggestion) {
    locationRequestId.current += 1;
    setLocation(suggestion.coordinates);
    setLocationLabel(suggestion.label);
    setIsMyLocation(false);
    setCityResults([]);
    setSpas([]);
    setSelectedSpaId(null);
    setStatus('loading');
    setMessage(`Buscando lugares de bienestar cerca de ${suggestion.label}…`);
    try {
      const nearbySpas = await findNearbySpas(suggestion.coordinates);
      setSpas(nearbySpas);
      setSelectedSpaId(nearbySpas[0]?.id ?? null);
      setMessage(
        nearbySpas.length > 0
          ? `${nearbySpas.length} lugares de bienestar encontrados en un radio de 15 km.`
          : `No encontramos lugares de bienestar registrados cerca de ${suggestion.label}.`,
      );
      setStatus('ready');
    } catch {
      setMessage('No pudimos cargar los lugares ahora. Revisa tu conexión e intenta actualizar.');
      setStatus('error');
    }
  }

  function changeSearchArea() {
    locationRequestId.current += 1;
    setLocation(null);
    setLocationLabel('');
    setIsMyLocation(false);
    setSpas([]);
    setSelectedSpaId(null);
    setCitySearchError('');
    setStatus('location-error');
    setMessage('Elige cómo quieres explorar: comparte tu ubicación o busca una ciudad.');
  }

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
              <SymbolView
                name={{ ios: 'sparkles', android: 'auto_awesome', web: 'auto_awesome' }}
                size={13}
                tintColor={ACCENT}
              />
              <ThemedText type="code" style={styles.eyebrowText}>
                BIENESTAR CERCA
              </ThemedText>
            </View>
            <Pressable
              accessibilityLabel="Actualizar ubicación y spas"
              disabled={status === 'loading' || status === 'locating'}
              onPress={() => setRefreshToken((value) => value + 1)}
              style={({ pressed }) => [
                styles.iconButton,
                { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected },
                pressed && styles.pressed,
              ]}>
              {status === 'loading' || status === 'locating' ? (
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
          {location ? (
            <View style={[styles.mapWrapper, isWideWeb && styles.mapWrapperWide]}>
              <View style={styles.mapBadge}>
                <View style={styles.liveDot} />
                <ThemedText type="smallBold" numberOfLines={1} style={styles.mapBadgeText}>
                  {spas.length > 0 ? `${spas.length} lugares · ${locationLabel}` : locationLabel}
                </ThemedText>
              </View>
              <Pressable
                accessibilityLabel="Cambiar ciudad o zona de búsqueda"
                onPress={changeSearchArea}
                style={({ pressed }) => [styles.mapChangeButton, pressed && styles.pressed]}>
                <ThemedText type="smallBold" style={styles.mapChangeButtonText}>Cambiar zona</ThemedText>
              </Pressable>
              {Platform.OS !== 'web' && (
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
              <SpaMap
                key={refreshToken}
                location={location}
                spas={spas}
                selectedSpaId={selectedSpaId}
                zoom={zoom}
                showMyLocation={isMyLocation}
                onSelectSpa={setSelectedSpaId}
              />
            </View>
          ) : (
            <View
              style={[
                styles.locationPrompt,
                { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected },
              ]}>
              <View style={styles.locationPromptIcon}>
                <SymbolView
                  name={{ ios: 'location.fill', android: 'my_location', web: 'my_location' }}
                  size={24}
                  tintColor={ACCENT}
                />
              </View>
              <ThemedText type="subtitle" style={styles.locationPromptTitle}>
                Encuentra bienestar cerca de ti
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.locationPromptCopy}>
                Comparte tu ubicación para explorar opciones cercanas o busca cualquier ciudad.
              </ThemedText>
              <Pressable
                onPress={() => setRefreshToken((value) => value + 1)}
                disabled={status === 'locating'}
                style={({ pressed }) => [
                  styles.locationButton,
                  { backgroundColor: ACCENT },
                  pressed && styles.pressed,
                ]}>
                {status === 'locating' ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <ThemedText type="smallBold" style={styles.locationButtonText}>
                    Usar mi ubicación
                  </ThemedText>
                )}
              </Pressable>
              <View style={styles.dividerRow}>
                <View style={styles.divider} />
                <ThemedText type="code" themeColor="textSecondary">O BUSCA UNA ZONA</ThemedText>
                <View style={styles.divider} />
              </View>
              <View style={styles.citySearchRow}>
                <TextInput
                  accessibilityLabel="Ciudad o zona"
                  value={cityQuery}
                  onChangeText={setCityQuery}
                  onSubmitEditing={searchCities}
                  spellCheck={false}
                  autoCorrect={false}
                  placeholder="Ciudad, estado o país"
                  placeholderTextColor={theme.textSecondary}
                  returnKeyType="search"
                  style={[styles.cityInput, { color: theme.text, borderColor: theme.backgroundSelected }]}
                />
                <Pressable
                  accessibilityLabel="Buscar ciudad"
                  disabled={!cityQuery.trim() || isSearchingCity}
                  onPress={searchCities}
                  style={({ pressed }) => [
                    styles.citySearchButton,
                    { backgroundColor: theme.text },
                    pressed && styles.pressed,
                  ]}>
                  {isSearchingCity ? (
                    <ActivityIndicator color={theme.background} />
                  ) : (
                    <SymbolView
                      name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }}
                      size={20}
                      tintColor={theme.background}
                    />
                  )}
                </Pressable>
              </View>
              {!!citySearchError && (
                <ThemedText type="small" style={styles.searchError}>
                  {citySearchError}
                </ThemedText>
              )}
              {!!cityResults.length && (
                <View style={styles.cityResults}>
                  {cityResults.map((suggestion) => (
                    <Pressable
                      key={suggestion.id}
                      onPress={() => selectCity(suggestion)}
                      style={styles.cityResult}>
                      <SymbolView
                        name={{ ios: 'mappin', android: 'place', web: 'place' }}
                        size={16}
                        tintColor={ACCENT}
                      />
                      <ThemedText type="small" numberOfLines={2} style={styles.cityResultText}>
                        {suggestion.label}
                      </ThemedText>
                    </Pressable>
                  ))}
                </View>
              )}
              <ThemedText
                type="code"
                themeColor="textSecondary"
                style={styles.geocoderAttribution}>
                Búsqueda de lugares: Photon · datos de OpenStreetMap
              </ThemedText>
            </View>
          )}

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
    maxWidth: '72%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: 6,
    paddingHorizontal: Spacing.three,
    backgroundColor: 'rgba(20, 38, 34, 0.88)',
  },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#70D6B5' },
  mapBadgeText: { color: '#FFFFFF', flexShrink: 1 },
  mapChangeButton: {
    position: 'absolute',
    zIndex: 2,
    top: Spacing.three,
    right: Spacing.three,
    minHeight: 34,
    justifyContent: 'center',
    borderRadius: 6,
    paddingHorizontal: Spacing.three,
    backgroundColor: 'rgba(20, 38, 34, 0.88)',
  },
  mapChangeButtonText: { color: '#FFFFFF' },
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
  locationPrompt: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
    borderWidth: 1,
    borderRadius: 12,
    minHeight: 320,
  },
  locationPromptIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ACCENT_SOFT,
  },
  locationPromptTitle: { fontSize: 25, lineHeight: 32, textAlign: 'center' },
  locationPromptCopy: { maxWidth: 400, textAlign: 'center' },
  locationButton: {
    minHeight: 48,
    minWidth: 220,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
  },
  locationButtonText: { color: '#FFFFFF' },
  dividerRow: { width: '100%', maxWidth: 420, flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  divider: { flex: 1, height: 1, backgroundColor: 'rgba(120, 130, 125, 0.28)' },
  citySearchRow: { width: '100%', maxWidth: 420, flexDirection: 'row', gap: Spacing.two },
  cityInput: {
    flex: 1,
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: Spacing.three,
    fontSize: 16,
  },
  citySearchButton: {
    width: 48,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cityResults: { width: '100%', maxWidth: 420, gap: Spacing.one },
  cityResult: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: 6,
    backgroundColor: 'rgba(40, 125, 107, 0.08)',
  },
  cityResultText: { flex: 1 },
  searchError: { color: '#B42318', textAlign: 'center' },
  geocoderAttribution: { textAlign: 'center', fontSize: 10 },
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
