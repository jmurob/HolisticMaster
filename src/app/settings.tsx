import * as Location from 'expo-location';
import { useFocusEffect } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useCallback, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const ACCENT = '#287D6B';

type SettingRowProps = {
  icon: 'location.fill' | 'circle.lefthalf.filled' | 'scope' | 'map.fill';
  title: string;
  value: string;
  onPress?: () => void;
};

function SettingRow({ icon, title, value, onPress }: SettingRowProps) {
  const theme = useTheme();
  const content = (
    <>
      <View style={styles.settingIcon}>
        <SymbolView name={icon} size={18} tintColor={ACCENT} />
      </View>
      <View style={styles.settingCopy}>
        <ThemedText type="smallBold">{title}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {value}
        </ThemedText>
      </View>
      {onPress && <SymbolView name="chevron.right" size={14} tintColor={theme.textSecondary} />}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [styles.settingRow, pressed && styles.pressed]}>
        {content}
      </Pressable>
    );
  }

  return <View style={styles.settingRow}>{content}</View>;
}

export default function SettingsScreen() {
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const [permission, setPermission] = useState<Location.PermissionStatus | null>(null);

  const refreshPermission = useCallback(async () => {
    const response = await Location.getForegroundPermissionsAsync();
    setPermission(response.status);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshPermission();
    }, [refreshPermission]),
  );

  async function manageLocationPermission() {
    if (permission === Location.PermissionStatus.DENIED) {
      await Linking.openSettings();
      return;
    }

    const response = await Location.requestForegroundPermissionsAsync();
    setPermission(response.status);
  }

  const permissionLabel =
    permission === Location.PermissionStatus.GRANTED
      ? 'Permitida'
      : permission === Location.PermissionStatus.DENIED
        ? 'Denegada · toca para abrir Ajustes'
        : 'Toca para conceder acceso';

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <SymbolView name="gearshape.fill" size={24} tintColor="#FFFFFF" />
            </View>
            <ThemedText type="subtitle">Ajustes</ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.subtitle}>
              Controla cómo Holistic Master utiliza tu dispositivo.
            </ThemedText>
          </View>

          <View style={styles.section}>
            <ThemedText type="code" style={styles.sectionTitle}>
              EXPERIENCIA
            </ThemedText>
            <ThemedView type="backgroundElement" style={styles.settingsGroup}>
              <SettingRow
                icon="location.fill"
                title="Ubicación"
                value={permissionLabel}
                onPress={manageLocationPermission}
              />
              <View style={[styles.divider, { backgroundColor: theme.backgroundSelected }]} />
              <SettingRow
                icon="circle.lefthalf.filled"
                title="Apariencia"
                value={colorScheme === 'dark' ? 'Oscura · según el sistema' : 'Clara · según el sistema'}
              />
            </ThemedView>
          </View>

          <View style={styles.section}>
            <ThemedText type="code" style={styles.sectionTitle}>
              EXPLORACIÓN
            </ThemedText>
            <ThemedView type="backgroundElement" style={styles.settingsGroup}>
              <SettingRow icon="scope" title="Radio de búsqueda" value="8 kilómetros" />
              <View style={[styles.divider, { backgroundColor: theme.backgroundSelected }]} />
              <SettingRow icon="map.fill" title="Datos de lugares" value="OpenStreetMap" />
            </ThemedView>
          </View>

          <ThemedText type="small" themeColor="textSecondary" style={styles.footer}>
            Holistic Master 1.0.0
          </ThemedText>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  safeArea: { flex: 1 },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    gap: Spacing.five,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.five,
    paddingBottom: BottomTabInset + Spacing.six,
  },
  header: { alignItems: 'center', gap: Spacing.two },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ACCENT,
  },
  subtitle: { maxWidth: 320, textAlign: 'center' },
  section: { gap: Spacing.two },
  sectionTitle: { color: ACCENT, paddingHorizontal: Spacing.one },
  settingsGroup: { borderRadius: 8, overflow: 'hidden' },
  settingRow: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DCEDE7',
  },
  settingCopy: { flex: 1 },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: 64 },
  pressed: { opacity: 0.65 },
  footer: { textAlign: 'center' },
});