import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text, useTheme } from '@/design-system';
import { DATA_SOURCE_IDS, type DataSourceId } from '@/domain/shared/DataSource';
import { useDataSource } from '@/presentation/providers/DataSourceProvider';

const SOURCE_LABELS: Record<DataSourceId, string> = {
  github: 'GitHub',
  gitlab: 'GitLab',
};

export function DataSourceToggle() {
  const { colors, radius, spacing } = useTheme();
  const { source, setSource } = useDataSource();

  return (
    <View
      testID="data-source-toggle"
      accessibilityRole="tablist"
      style={[
        styles.track,
        { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md },
      ]}
    >
      {DATA_SOURCE_IDS.map((id) => {
        const selected = id === source;
        return (
          <Pressable
            key={id}
            testID={`data-source-option-${id}`}
            accessibilityRole="tab"
            accessibilityLabel={`Usar fonte ${SOURCE_LABELS[id]}`}
            accessibilityState={{ selected }}
            onPress={() => setSource(id)}
            style={{
              borderRadius: radius.sm,
              paddingHorizontal: spacing.sm,
              paddingVertical: spacing.xs,
              backgroundColor: selected ? colors.background : 'transparent',
            }}
          >
            <Text
              size="xs"
              weight={selected ? 'bold' : 'medium'}
              tone={selected ? undefined : 'muted'}
            >
              {SOURCE_LABELS[id]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    borderWidth: StyleSheet.hairlineWidth,
    padding: 2,
  },
});
