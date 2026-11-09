import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Platform, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Fonts, Spacing } from '@/constants/theme';

const INK = '#243C35';
const CREAM = '#F5F1E8';
const PLUM = '#66536F';

export default function HomeScreen() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const isWide = width >= 900;
  const isCompact = !isWide && height < 900;
  const heroImageHeight = isWide ? 430 : Math.min(350, Math.max(290, height * 0.36));

  function openExplore() {
    router.push('/explore');
  }

  return (
    <ThemedView style={[styles.screen, { backgroundColor: CREAM }]}>
      <SafeAreaView
        edges={['top', 'left', 'right']}
        style={[
          styles.safeArea,
          { paddingBottom: safeBottomPadding() },
          isCompact && styles.safeAreaCompact,
          isWide && styles.safeAreaWide,
        ]}>
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, isCompact && styles.scrollContentCompact]}>
          <View style={[styles.hero, isWide && styles.heroWide, isCompact && styles.heroCompact]}>
            <View style={[styles.copyColumn, isWide && styles.copyColumnWide, isCompact && styles.copyColumnCompact]}>
              <View style={styles.eyebrowRow}>
                <View style={styles.eyebrowRule} />
                <ThemedText type="code" style={styles.eyebrow}>
                  BIENESTAR, A TU RITMO
                </ThemedText>
              </View>

              <ThemedText
                type="title"
                style={[styles.headline, { fontSize: isWide ? 48 : isCompact ? 34 : 36, lineHeight: isWide ? 54 : isCompact ? 38 : 42 }]}>
                Tu momento de{' '}
                <ThemedText
                  type="title"
                  style={[
                    styles.headlineItalic,
                    { fontSize: isWide ? 48 : isCompact ? 34 : 36, lineHeight: isWide ? 54 : isCompact ? 38 : 42 },
                  ]}>
                  calma
                </ThemedText>{' '}
                está cerca.
              </ThemedText>

              <View style={styles.actions}>
                <Pressable
                  accessibilityRole="button"
                  onPress={openExplore}
                  style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
                  <ThemedText type="smallBold" style={styles.primaryButtonText}>
                    Explorar cerca de mí
                  </ThemedText>
                  <ThemedText type="default" style={styles.buttonArrow}>→</ThemedText>
                </Pressable>
              </View>
            </View>

            <View style={[styles.visualColumn, isWide && styles.visualColumnWide]}>
              <Image
                source={require('@/assets/images/home-spa-composite-compact.png')}
                contentFit="contain"
                transition={250}
                accessibilityLabel="Masaje con aceite, decorado con una luna, un sol y una flor en tonos lila"
                style={[styles.heroCompositeImage, { height: heroImageHeight }]}
              />
              <View style={[styles.featureCards, isCompact && styles.featureCardsCompact]}>
                <View style={styles.featureCard}>
                  <SymbolView name={{ ios: 'sparkle', android: 'auto_awesome', web: 'auto_awesome' }} size={18} tintColor={PLUM} />
                  <View style={styles.featureCardCopy}>
                    <ThemedText type="smallBold" style={styles.tagTitle}>Un lugar para ti</ThemedText>
                    <ThemedText type="small" style={styles.tagCaption}>Encuentra tu balance</ThemedText>
                  </View>
                </View>
                <View style={styles.featureCard}>
                  <View style={styles.locationDot} />
                  <View style={styles.featureCardCopy}>
                    <ThemedText type="smallBold" style={styles.tagTitle}>Aquí, cerca de ti</ThemedText>
                    <ThemedText type="small" style={styles.tagCaption}>Explora tu zona</ThemedText>
                  </View>
                </View>
              </View>
              <View style={[styles.spacesPreview, isCompact && styles.spacesPreviewCompact]}>
                <View style={styles.avatarStack}>
                  {[
                    ['J', '#C28E76'],
                    ['M', '#859A8B'],
                    ['A', '#8C7B92'],
                    ['L', '#D1AA5A'],
                  ].map(([initial, color]) => (
                    <View key={initial} style={[styles.avatar, { backgroundColor: color }]}>
                      <ThemedText type="small" style={styles.avatarText}>{initial}</ThemedText>
                    </View>
                  ))}
                </View>
                <View style={styles.spacesCopy}>
                  <ThemedText type="small" style={styles.spacesText}>
                    <ThemedText type="small" style={styles.spacesCount}>+120 espacios</ThemedText> de bienestar
                  </ThemedText>
                  <ThemedText type="small" style={styles.spacesText}>para descubrir en tu ciudad</ThemedText>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

function safeBottomPadding() {
  return BottomTabInset + Spacing.five;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  safeArea: {
    flex: 1,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: Platform.OS === 'web' ? 96 : Spacing.five,
  },
  safeAreaCompact: { paddingTop: Spacing.two },
  safeAreaWide: { maxWidth: 1440, paddingHorizontal: 68 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', paddingVertical: Spacing.four },
  scrollContentCompact: { paddingVertical: Spacing.one },
  hero: { alignItems: 'center', gap: Spacing.four },
  heroCompact: { gap: Spacing.two },
  heroWide: { flexDirection: 'row', alignItems: 'center', gap: 64, minHeight: 620 },
  copyColumn: { width: '100%', maxWidth: 550, alignItems: 'center', gap: Spacing.three },
  copyColumnCompact: { gap: Spacing.two },
  copyColumnWide: { flex: 1, width: 'auto', maxWidth: 550, gap: Spacing.four },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, alignSelf: 'center' },
  eyebrowRule: { width: 19, height: 1, backgroundColor: '#6D8278' },
  eyebrow: { color: '#52665E', letterSpacing: 1.9, fontSize: 13, fontWeight: '700' },
  headline: {
    color: INK,
    fontFamily: Fonts.serif,
    fontWeight: '600',
    maxWidth: 590,
    textAlign: 'center',
    letterSpacing: -1.8,
  },
  headlineItalic: {
    color: INK,
    fontFamily: Fonts.serif,
    fontStyle: 'italic',
    fontWeight: '400',
    letterSpacing: -1.8,
  },
  actions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: Spacing.one },
  primaryButton: {
    minHeight: 52,
    minWidth: 205,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
    backgroundColor: PLUM,
    paddingHorizontal: Spacing.three,
  },
  primaryButtonText: { color: '#FFFFFF' },
  buttonArrow: { color: '#FFFFFF', fontSize: 22, lineHeight: 24 },
  pressed: { opacity: 0.76 },
  visualColumn: {
    width: '100%',
    maxWidth: 560,
    alignItems: 'center',
    marginTop: Spacing.one,
  },
  visualColumnWide: { flex: 1, width: 'auto', marginTop: 0 },
  heroCompositeImage: { width: '100%', opacity: 0.95 },
  tagTitle: { color: INK, fontSize: 13 },
  tagCaption: { color: '#64716A', fontSize: 11, marginTop: 2 },
  featureCards: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 10,
    marginTop: 18,
  },
  featureCardsCompact: { marginTop: 8 },
  featureCard: {
    flex: 1,
    minHeight: 66,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    backgroundColor: 'rgba(255, 255, 255, 0.64)',
    borderWidth: 1,
    borderColor: 'rgba(102, 83, 111, 0.10)',
  },
  featureCardCopy: { flex: 1 },
  locationDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: '#A37670' },
  spacesPreview: {
    width: '100%',
    maxWidth: 440,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 24,
    paddingHorizontal: 8,
  },
  spacesPreviewCompact: { marginTop: 14 },
  avatarStack: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: CREAM,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -5,
  },
  avatarText: { color: '#FFFFFF', fontSize: 10, fontWeight: '700' },
  spacesCopy: { gap: 2 },
  spacesText: { color: '#596A62', fontSize: 12 },
  spacesCount: { color: INK, fontSize: 12, fontWeight: '700' },
});
