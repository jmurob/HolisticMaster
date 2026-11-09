import {
    TabList,
    TabListProps,
    Tabs,
    TabSlot,
    TabTrigger,
    TabTriggerSlotProps,
} from 'expo-router/ui';
import { forwardRef } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View, type PressableInstance } from 'react-native';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { MaxContentWidth, Spacing } from '@/constants/theme';

export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot style={{ height: '100%' }} />
      <TabList asChild>
        <CustomTabList>
          <TabTrigger name="home" href="/" asChild>
            <TabButton>Home</TabButton>
          </TabTrigger>
          <TabTrigger name="explore" href="/explore" asChild>
            <TabButton>Explore</TabButton>
          </TabTrigger>
          <TabTrigger name="settings" href="/settings" asChild>
            <TabButton>Ajustes</TabButton>
          </TabTrigger>
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

export const TabButton = forwardRef<PressableInstance, Omit<TabTriggerSlotProps, 'ref'>>(function TabButton(
  { children, isFocused, ...props },
  ref
) {
  return (
    <Pressable ref={ref} {...props} style={({ pressed }) => pressed && styles.pressed}>
      <ThemedView
        type={isFocused ? 'backgroundSelected' : 'backgroundElement'}
        style={styles.tabButtonView}>
        <ThemedText type="small" themeColor={isFocused ? 'text' : 'textSecondary'}>
          {children}
        </ThemedText>
      </ThemedView>
    </Pressable>
  );
});

export function CustomTabList(props: TabListProps) {
  const { width } = useWindowDimensions();
  const compact = width < 700;

  return (
    <View {...props} style={[styles.tabListContainer, compact && styles.tabListContainerCompact]}>
      <ThemedView
        type="backgroundElement"
        style={[styles.innerContainer, compact && styles.innerContainerCompact]}>
        {!compact && (
          <ThemedText type="smallBold" style={styles.brandText}>
            Holistic Master
          </ThemedText>
        )}

        {props.children}
      </ThemedView>
    </View>
  );
}

const styles = StyleSheet.create({
  tabListContainer: {
    position: 'absolute',
    width: '100%',
    padding: Spacing.three,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  tabListContainerCompact: { padding: Spacing.two },
  innerContainer: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.five,
    borderRadius: Spacing.five,
    flexDirection: 'row',
    alignItems: 'center',
    flexGrow: 1,
    gap: Spacing.two,
    maxWidth: MaxContentWidth,
  },
  innerContainerCompact: {
    flexGrow: 0,
    width: '100%',
    maxWidth: 420,
    justifyContent: 'center',
    paddingHorizontal: Spacing.two,
    gap: Spacing.one,
  },
  brandText: {
    marginRight: 'auto',
  },
  pressed: {
    opacity: 0.7,
  },
  tabButtonView: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
  },
});
