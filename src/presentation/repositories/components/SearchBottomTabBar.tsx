import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, Text as RNText } from 'react-native';

import { GlassView, useTheme } from '@/design-system';

interface SearchBottomTabBarProps {
  bottomInset: number;
  onDesignPress: () => void;
  onLayout?: (e: LayoutChangeEvent) => void;
}

const TAB_LABEL_FONT_SIZE = 11;
const TAB_ICON_LABEL_GAP = 3;

export function SearchBottomTabBar({
  bottomInset,
  onDesignPress,
  onLayout,
}: SearchBottomTabBarProps) {
  const { colors, spacing } = useTheme();

  const tabs = [
    {
      key: 'busca',
      label: 'Busca',
      icon: 'search-outline',
      iconActive: 'search',
      active: true,
      onPress: undefined,
    },
    {
      key: 'ds',
      label: 'Design',
      icon: 'color-palette-outline',
      iconActive: 'color-palette',
      active: false,
      onPress: onDesignPress,
    },
  ] as const;

  return (
    <GlassView
      style={[
        styles.container,
        {
          borderTopColor: colors.border,
          paddingTop: spacing.xs,
          paddingBottom: Math.max(bottomInset, spacing.sm),
        },
      ]}
      onLayout={onLayout}
    >
      {tabs.map((tab) => (
        <Pressable
          key={tab.key}
          onPress={tab.onPress}
          style={[styles.tab, { gap: TAB_ICON_LABEL_GAP, paddingVertical: spacing.xs }]}
        >
          <Ionicons
            name={tab.active ? tab.iconActive : tab.icon}
            size={24}
            color={tab.active ? colors.primary : colors.muted}
          />
          <RNText
            style={[
              styles.label,
              {
                color: tab.active ? colors.primary : colors.muted,
                fontWeight: tab.active ? '600' : '400',
              },
            ]}
          >
            {tab.label}
          </RNText>
        </Pressable>
      ))}
    </GlassView>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: TAB_LABEL_FONT_SIZE,
  },
});
